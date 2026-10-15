import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';

function onceMessage(ws, match, timeout=3000) {
  return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{ws.removeEventListener('message',fn);reject(new Error('Timed out'));},timeout);function fn(event){const msg=JSON.parse(event.data);if(match(msg)){clearTimeout(timer);ws.removeEventListener('message',fn);resolve(msg);}}ws.addEventListener('message',fn);});
}
function opened(url) {return new Promise((resolve,reject)=>{const ws=new WebSocket(url);ws.addEventListener('open',()=>resolve(ws),{once:true});ws.addEventListener('error',reject,{once:true});});}
test('online rooms support two real websocket clients with opposite teams',async()=>{
 const port=35373;const proc=spawn(process.execPath,['server.js'],{cwd:new URL('..',import.meta.url).pathname,env:{...process.env,PORT:String(port)},stdio:'ignore'});
 let a,b;
 try{
   let ready=false;for(let i=0;i<30;i++){try{const res=await fetch(`http://127.0.0.1:${port}/health`);if(res.ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,100));}
   assert.ok(ready,'server should be healthy');
   a=await opened(`ws://127.0.0.1:${port}`);const m1=onceMessage(a,m=>m.type==='welcome');a.send(JSON.stringify({type:'join',name:'PlayerOne'}));const first=await m1;
   b=await opened(`ws://127.0.0.1:${port}`);const m2=onceMessage(b,m=>m.type==='welcome');b.send(JSON.stringify({type:'join',name:'PlayerTwo',code:first.code}));const second=await m2;
   assert.equal(first.code,second.code);assert.notEqual(first.team,second.team);
   const snapshot=await onceMessage(a,m=>m.type==='state'&&m.players.length===2);
   assert.equal(snapshot.players.length,2);assert.equal(snapshot.players[0].level,1);
 }finally{a?.close();b?.close();proc.kill();}
});
