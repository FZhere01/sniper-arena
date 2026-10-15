import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';

function onceMessage(ws, match, timeout=3000) {
  return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{ws.removeEventListener('message',fn);reject(new Error('Timed out'));},timeout);function fn(event){const msg=JSON.parse(event.data);if(match(msg)){clearTimeout(timer);ws.removeEventListener('message',fn);resolve(msg);}}ws.addEventListener('message',fn);});
}
function opened(url) {return new Promise((resolve,reject)=>{const ws=new WebSocket(url);ws.addEventListener('open',()=>resolve(ws),{once:true});ws.addEventListener('error',reject,{once:true});});}
test('explicit room creation and joining share operators and enforce solid cover',async()=>{
 const port=35373;const proc=spawn(process.execPath,['server.js'],{cwd:new URL('..',import.meta.url).pathname,env:{...process.env,PORT:String(port)},stdio:'ignore'});
 let a,b;
 try{
   let ready=false;for(let i=0;i<30;i++){try{const res=await fetch(`http://127.0.0.1:${port}/health`);if(res.ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,100));}
   assert.ok(ready,'server should be healthy');
   a=await opened(`ws://127.0.0.1:${port}`);const m1=onceMessage(a,m=>m.type==='welcome');a.send(JSON.stringify({type:'create',name:'PlayerOne',skin:'hazmat'}));const first=await m1;
   b=await opened(`ws://127.0.0.1:${port}`);const m2=onceMessage(b,m=>m.type==='welcome');b.send(JSON.stringify({type:'join',name:'PlayerTwo',skin:'not-a-skin',code:first.code.toLowerCase()}));const second=await m2;
   assert.equal(first.code,second.code);assert.equal(first.mode,'FREE FOR ALL');assert.equal(second.mode,'FREE FOR ALL');
   const snapshot=await onceMessage(a,m=>m.type==='state'&&m.players.length===2);
   assert.equal(snapshot.players.length,2);assert.equal(snapshot.players[0].level,1);
   assert.equal(snapshot.players.find(p=>p.id===first.id).skin,'hazmat');
   assert.equal(snapshot.players.find(p=>p.id===second.id).skin,'shadow');
   const jumpEvent=onceMessage(a,m=>m.type==='jump'&&m.id===first.id);a.send(JSON.stringify({type:'jump'}));const started=await jumpEvent;
   a.send(JSON.stringify({type:'jump'}));const airborne=await onceMessage(a,m=>m.type==='state'&&m.players.find(p=>p.id===first.id)?.y>0);
   assert.equal(airborne.players.find(p=>p.id===first.id).jumpAt,started.jumpAt,'jump cannot restart while airborne');
   await new Promise(r=>setTimeout(r,850));const grounded=await onceMessage(a,m=>m.type==='state');assert.equal(grounded.players.find(p=>p.id===first.id).y,0,'player lands on server');
   // Push a real player toward cover, then toward the arena boundary.
   const solids=first.obstacles;
   for(let i=0;i<80;i++){
     const statePromise=onceMessage(a,m=>m.type==='state');
     const player=snapshot.players.find(p=>p.id===first.id);
     const dx=i<40?-Math.sign(player.x):1,dz=i<40?-Math.sign(player.z):1;
     a.send(JSON.stringify({type:'move',mx:dx,mz:dz,sprint:true,yaw:0,pitch:0}));
     const state=await statePromise;
     const current=state.players.find(p=>p.id===first.id);
     assert.ok(Math.abs(current.x)<22.4&&Math.abs(current.z)<22.4,'player stays inside perimeter');
     assert.ok(!solids.some(o=>Math.abs(current.x-o.x)<o.w/2+.519&&Math.abs(current.z-o.z)<o.d/2+.519),'player never enters solid cover');
     snapshot.players=state.players;
   }
 }finally{a?.close();b?.close();proc.kill();}
});
test('create always isolates rooms; join requires an existing code',async()=>{
 const port=35374,proc=spawn(process.execPath,['server.js'],{cwd:new URL('..',import.meta.url).pathname,env:{...process.env,PORT:String(port)},stdio:'ignore'});const sockets=[];
 const sendWait=(w,request,type)=>{const p=onceMessage(w,m=>m.type===type);w.send(JSON.stringify(request));return p;};
 try{
  let ready=false;for(let i=0;i<30;i++){try{if((await fetch(`http://127.0.0.1:${port}/health`)).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,100));}assert.ok(ready);
  const a=await opened(`ws://127.0.0.1:${port}`);sockets.push(a);const first=await sendWait(a,{type:'create',code:'AAAAA',name:'Host'},'welcome');assert.match(first.code,/^[A-Z0-9]{5}$/);
  const b=await opened(`ws://127.0.0.1:${port}`);sockets.push(b);const second=await sendWait(b,{type:'create',name:'OtherHost'},'welcome');assert.notEqual(first.code,second.code);
  const c=await opened(`ws://127.0.0.1:${port}`);sockets.push(c);await sendWait(c,{type:'join',name:'Friend'},'error');await sendWait(c,{type:'join',code:'00000',name:'Friend'},'error');
  assert.equal((await (await fetch(`http://127.0.0.1:${port}/health`)).json()).rooms,2,'invalid joins do not create rooms');
  const joined=await sendWait(c,{type:'join',code:first.code.toLowerCase(),name:'Friend'},'welcome');assert.equal(joined.code,first.code);
  const state=await onceMessage(a,m=>m.type==='state'&&m.players.length===2);assert.ok(state.players.some(p=>p.name==='Friend'));assert.ok(!state.players.some(p=>p.name==='OtherHost'));
 }finally{for(const s of sockets)s.close();proc.kill();}
});
