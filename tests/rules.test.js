import {test} from 'node:test';
import assert from 'node:assert/strict';
import {playerScale,playerRadius,eyeHeight,targetInSight} from '../public/rules.js';
test('kill progression shrinks visible body, collision and camera together',()=>{
 assert.equal(playerScale(0),1);
 assert.ok(playerScale(1)<playerScale(0));assert.ok(playerScale(2)<playerScale(1));
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
