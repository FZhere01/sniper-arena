import { MODE, playerScale, playerRadius, targetInSight } from './public/rules.js';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { EventEmitter } from 'node:events';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 3000);
const TICK_MS = 50, RESPAWN_MS = 3000, SHOT_COOLDOWN_MS = 1250;
const MOVE_SPEED = 6.1, SPRINT_SPEED = 9.3;
const ARENA = 46, MAX_PLAYERS_ROOM = 12;
const obstacles = [
  { x: -11, z: -9, w: 7, d: 5, h: 4.2 },
  { x: 11, z: 9, w: 7, d: 5, h: 4.2 },
  { x: -12, z: 10, w: 4, d: 9, h: 4.2 },
  { x: 12, z: -10, w: 4, d: 9, h: 4.2 },
  { x: 0, z: 0, w: 7, d: 7, h: 5.5 },
  { x: -1, z: -17, w: 11, d: 3, h: 3.1 },
  { x: 1, z: 17, w: 11, d: 3, h: 3.1 },
  { x: -19, z: 0, w: 3, d: 9, h: 3.1 },
  { x: 19, z: 0, w: 3, d: 9, h: 3.1 }
];
export { obstacles };
const skinIds=new Set(['shadow','hazmat','red-jester','grin','clown','hockey','jester','paper','ape']);
const rooms = new Map();
const roomChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const sanitize = text => String(text || '').replace(/[^\p{L}\p{N} _-]/gu, '').trim().slice(0, 16) || 'SNIPER';
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const distance2 = (a, b) => (a.x - b.x)**2 + (a.z-b.z)**2;
function intersectsBox(x, z, radius = .52) {
  return obstacles.some(o => Math.abs(x-o.x) < o.w/2+radius && Math.abs(z-o.z) < o.d/2+radius);
}
function validPosition(x,z,radius=.52) { return Math.abs(x) < ARENA/2 - .45-radius && Math.abs(z) < ARENA/2 - .45-radius && !intersectsBox(x,z,radius); }
function spawn(room, kills=0) {
  for(let i=0;i<25;i++) {
    const x = (Math.random()-.5)*42;
    const z = (Math.random()-.5)*32;
    if (validPosition(x,z,playerRadius(kills)) && [...room.players.values()].every(p => !p.alive || distance2({x,z},p)>6)) return {x,z};
  }
  for(const x of [-20,20])for(const z of [-20,20])if(validPosition(x,z,playerRadius(kills)))return {x,z};
  return {x:-20,z:-20};
}
function generateCode() { let code; do { code = Array.from({length:5},()=>roomChars[Math.floor(Math.random()*roomChars.length)]).join(''); } while(rooms.has(code)); return code; }
function safeSend(ws, data) { if (ws.readyState === 1) ws.send(JSON.stringify(data)); }
function broadcast(room, data) { for (const p of room.players.values()) safeSend(p.ws,data); }
function publicPlayer(p, now) {return {id:p.id,name:p.name,skin:p.skin,scale:playerScale(p.kills),x:p.x,z:p.z,yaw:p.yaw,pitch:p.pitch,alive:p.alive,kills:p.kills,deaths:p.deaths,level:p.level,respawn:!p.alive?Math.max(0,p.respawnAt-now):0};}
function snapshot(room) {const now=Date.now(); return {type:'state',mode:MODE,time:now,players:[...room.players.values()].map(p=>publicPlayer(p,now))};}
// Horizontal ray vs axis-aligned obstacle. Treat obstacles as infinite-height for anti-wallhack line of sight.
function wallDistance(ox,oz,dx,dz,maxDist) {
  let best=maxDist;
  for(const o of obstacles) {
    let tmin=0,tmax=maxDist;
    for(const [pos,dir,min,max] of [[ox,dx,o.x-o.w/2,o.x+o.w/2],[oz,dz,o.z-o.d/2,o.z+o.d/2]]) {
      if(Math.abs(dir)<1e-7) {if(pos<min || pos>max){tmin=Infinity; break;}} 
      else {let t1=(min-pos)/dir,t2=(max-pos)/dir; if(t1>t2)[t1,t2]=[t2,t1]; tmin=Math.max(tmin,t1);tmax=Math.min(tmax,t2);}
    }
    if(tmax>=tmin && tmin>=0)best=Math.min(best,tmin);
  }
  return best;
}
function handleShoot(room, shooter) {
  const now=Date.now();
  if(!shooter.alive || now-shooter.lastShot < SHOT_COOLDOWN_MS) return;
  shooter.lastShot = now;
  const dx=Math.sin(shooter.yaw),dz=-Math.cos(shooter.yaw);
  let winner=null, hitT=120;
  const wallT=wallDistance(shooter.x,shooter.z,dx,dz,120);
  for(const target of room.players.values()) {
    const t=targetInSight(shooter,target,Math.min(wallT,hitT),now);
    if(t!==null){winner=target;hitT=t;}
  }
  broadcast(room,{type:'shot',id:shooter.id,x:shooter.x,z:shooter.z,yaw:shooter.yaw,pitch:shooter.pitch,kills:shooter.kills,hitId:winner?.id??null});
  if(!winner)return;
  winner.alive=false; winner.deaths++; winner.respawnAt=now+RESPAWN_MS;
  shooter.kills++; shooter.level++;
  broadcast(room,{type:'kill',killer:shooter.id,victim:winner.id,killerName:shooter.name,victimName:winner.name,killerLevel:shooter.level,respawnMs:RESPAWN_MS});
}
function handleMove(p, m) {
  if(!p.alive)return;
  const now=Date.now(); const elapsed=clamp((now-p.lastMove)/1000,0,.11);
  p.lastMove=now;
  const mx=clamp(Number(m.mx)||0,-1,1),mz=clamp(Number(m.mz)||0,-1,1);
  const n=Math.max(1,Math.hypot(mx,mz)),speed=m.sprint?SPRINT_SPEED:MOVE_SPEED;
  const x=p.x+mx/n*speed*elapsed,z=p.z+mz/n*speed*elapsed;
  if(validPosition(x,p.z,playerRadius(p.kills))) p.x=x;
  if(validPosition(p.x,z,playerRadius(p.kills))) p.z=z;
  if(Number.isFinite(m.yaw))p.yaw=clamp(m.yaw,-1e6,1e6);
  if(Number.isFinite(m.pitch))p.pitch=clamp(m.pitch,-1.15,1.15);
}
const staticTypes={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.svg':'image/svg+xml','.ico':'image/x-icon'};
const server=http.createServer((req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  if(pathname==='/health'){res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({ok:true,rooms:rooms.size}));return;}
  let file=pathname==='/vendor/three.module.js'?path.join(ROOT,'node_modules/three/build/three.module.js'):path.join(ROOT,'public',pathname==='/'?'index.html':pathname);
  if(!file.startsWith(path.join(ROOT,'public')+path.sep) && pathname!=='/' && pathname!=='/vendor/three.module.js') {res.writeHead(403);res.end();return;}
  fs.stat(file,(err,stat)=>{if(err || !stat.isFile()){res.writeHead(404);res.end('Not found');return;}
    res.writeHead(200,{'Content-Type':staticTypes[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache'});fs.createReadStream(file).pipe(res);
  });
});
// Lightweight RFC6455 text-only WebSocket handling; no external server dependency.
const wss = new EventEmitter();
server.on('upgrade',(req,socket,head)=>{
  if(req.headers.upgrade?.toLowerCase()!=='websocket'||!req.headers['sec-websocket-key']){socket.destroy();return;}
  const accept=createHash('sha1').update(req.headers['sec-websocket-key']+'258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
  socket.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: '+accept+'\r\n\r\n');
  const ws=new EventEmitter(); ws.readyState=1;
  ws.send=text=>{if(ws.readyState!==1)return;const data=Buffer.from(text);const size=data.length;let hdr;
    if(size<126){hdr=Buffer.from([0x81,size]);}else if(size<65536){hdr=Buffer.alloc(4);hdr[0]=0x81;hdr[1]=126;hdr.writeUInt16BE(size,2);}else{hdr=Buffer.alloc(10);hdr[0]=0x81;hdr[1]=127;hdr.writeBigUInt64BE(BigInt(size),2);}socket.write(Buffer.concat([hdr,data]));};
  let accum=Buffer.alloc(0), closed=false;
  const close=()=>{if(closed)return;closed=true;ws.readyState=3;ws.emit('close');};
  socket.on('data',data=>{
    accum=Buffer.concat([accum,data]);if(accum.length>32768){socket.destroy();return;}
    while(accum.length>=2){const opcode=accum[0]&15,masked=!!(accum[1]&128);let len=accum[1]&127,at=2;
      if(len===126){if(accum.length<4)break;len=accum.readUInt16BE(2);at=4;}
      if(len===127){if(accum.length<10)break;const big=accum.readBigUInt64BE(2);if(big>4096n){socket.destroy();return;}len=Number(big);at=10;}
      if(!masked){socket.destroy();return;}
      if(len>4096){socket.destroy();return;}
      if(accum.length<at+4+len)break;
      const mask=accum.subarray(at,at+4),payload=Buffer.from(accum.subarray(at+4,at+4+len));accum=accum.subarray(at+4+len);
      for(let i=0;i<len;i++)payload[i]^=mask[i%4];
      if(opcode===8){socket.end();return;}
      if(opcode===1)ws.emit('message',payload);
      if(opcode===9)socket.write(Buffer.from([0x8a,payload.length,...payload]));
    }
  });
  socket.on('error',close);socket.on('close',close);
  wss.emit('connection',ws);
  if(head.length)socket.emit('data',head);
});
let nextId=1;
wss.on('connection',ws=>{
  let room=null,player=null;
  ws.on('message',buffer=>{
    let m;try{m=JSON.parse(String(buffer));}catch{return;}
    if(!m || typeof m.type!=='string')return;
    if(m.type==='join' && !player){
      const requested=String(m.code||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,5);
      if(requested){room=rooms.get(requested);if(!room){safeSend(ws,{type:'error',message:'Room not found. Check the invitation code.'});return;}}
      else {room=[...rooms.values()].find(r=>r.players.size<MAX_PLAYERS_ROOM);if(!room){const code=generateCode();room={code,players:new Map()};rooms.set(code,room);}}
      if(room.players.size>=MAX_PLAYERS_ROOM){safeSend(ws,{type:'error',message:'Room is full.'});return;}
      const loc=spawn(room);
      player={id:nextId++,name:sanitize(m.name),skin:skinIds.has(m.skin)?m.skin:'shadow',...loc,yaw:Math.random()*Math.PI*2,pitch:0,alive:true,kills:0,deaths:0,level:1,respawnAt:0,protectedUntil:Date.now()+1500,lastShot:0,lastMove:Date.now(),ws};
      room.players.set(player.id,player);
      safeSend(ws,{type:'welcome',id:player.id,code:room.code,mode:MODE,x:player.x,z:player.z,yaw:player.yaw,obstacles,arena:ARENA});
      broadcast(room,{type:'notice',message:`${player.name} joined the arena`});
    } else if(player && m.type==='move')handleMove(player,m);
    else if(player && m.type==='shoot'){if(Number.isFinite(m.yaw))player.yaw=clamp(m.yaw,-1e6,1e6);if(Number.isFinite(m.pitch))player.pitch=clamp(m.pitch,-1.15,1.15);handleShoot(room,player);}
    else if(player && m.type==='ping')safeSend(ws,{type:'pong',time:m.time});
  });
  ws.on('close',()=>{if(!player||!room)return;room.players.delete(player.id);broadcast(room,{type:'notice',message:`${player.name} left the arena`});if(!room.players.size)rooms.delete(room.code);});
});
setInterval(()=>{
  const now=Date.now();
  for(const room of rooms.values()){
    for(const p of room.players.values())if(!p.alive && now>=p.respawnAt){Object.assign(p,spawn(room,p.kills));p.alive=true;p.protectedUntil=now+1500;p.lastMove=now;safeSend(p.ws,{type:'respawn',x:p.x,z:p.z});}
    broadcast(room,snapshot(room));
  }
},TICK_MS);
server.listen(PORT,'0.0.0.0',()=>console.log(`SNIPER ARENA http://localhost:${PORT}`));
