import {test} from 'node:test';
import assert from 'node:assert/strict';
import {JUMP_MS,jumpOffset,playerScale,playerRadius,eyeHeight,targetInSight} from '../public/rules.js';
test('kill progression shrinks visible body, collision and camera together',()=>{
 assert.equal(playerScale(0),1);
 assert.equal(playerScale(1),.8);assert.ok(Math.abs(playerScale(2)-.64)<1e-12);assert.ok(Math.abs(playerScale(3)-.512)<1e-12);assert.equal(playerScale(4),.5);
 assert.equal(playerRadius(5)/.52,playerScale(5));assert.equal(eyeHeight(5)/1.65,playerScale(5));
 assert.equal(playerScale(1000),.5);
});
test('FFA hits any other player and respects shrinking hitboxes, cover and spawn protection',()=>{
 const shooter={id:1,x:0,z:0,yaw:0,pitch:0,kills:0,team:0};
 const target={id:2,x:0,z:-10,kills:0,alive:true,protectedUntil:0,team:0};
 assert.equal(targetInSight(shooter,target,100,1000),10,'same legacy team still takes damage');
 assert.equal(targetInSight(shooter,{...target,id:1},100,1000),null);
 assert.equal(targetInSight(shooter,target,5,1000),null,'cover blocks the shot');
 assert.equal(targetInSight(shooter,{...target,protectedUntil:2000},100,1000),null);
 assert.equal(targetInSight(shooter,{...target,kills:30},100,1000),null,'full height shot passes above small player');
 const pitch=Math.atan((eyeHeight(30)-eyeHeight(0))/10);
 assert.equal(targetInSight({...shooter,pitch},{...target,kills:30},100,1000),10);
 assert.equal(targetInSight({...shooter,kills:30},{...target,kills:30},100,1000),10,'short player shoots from short eye height');
});

test('jump follows a grounded parabola and scales with the player',()=>{
 const p={kills:0,jumpAt:1000};assert.equal(jumpOffset(p,1000),0);assert.equal(jumpOffset(p,1000+JUMP_MS/2),1.15);assert.equal(jumpOffset(p,1000+JUMP_MS),0);assert.equal(jumpOffset(p,1000+JUMP_MS+50),0);assert.equal(jumpOffset({...p,kills:100},1000+JUMP_MS/2),.575);
 const shooter={id:1,x:0,z:0,kills:0,yaw:0,pitch:0,jumpAt:1000};const target={id:2,x:0,z:-10,kills:0,alive:true,protectedUntil:0};
 assert.equal(targetInSight(shooter,target,100,1380),null,'airborne firing origin is above standing target');
 assert.equal(targetInSight({...shooter,jumpAt:0,pitch:Math.atan((.2-1.65)/10)},{...target,jumpAt:1000},100,1380),null,'shot below airborne player misses');
});
