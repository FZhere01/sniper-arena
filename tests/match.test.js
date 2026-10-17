import {test} from 'node:test';
import assert from 'node:assert/strict';
import {durationMinutes,isMatchOver,finishMatch} from '../match.js';
test('duration defaults to 15 minutes and validates creator selections',()=>{
 assert.equal(durationMinutes(),15);assert.equal(durationMinutes(1),1);assert.equal(durationMinutes('60'),60);for(const v of [0,-5,61,1.5,'wrong',null,''])assert.equal(durationMinutes(v),null);
});
test('server deadline ends the match once and freezes final ranking',()=>{
 const players=new Map([[1,{id:1,name:'A',kills:4,deaths:2}],[2,{id:2,name:'B',kills:4,deaths:1}],[3,{id:3,name:'C',kills:2,deaths:0}]]);
 const room={players,endsAt:1000,ended:false};assert.equal(isMatchOver(room,999),false);assert.equal(finishMatch(room,999),false);assert.equal(isMatchOver(room,1000),true);assert.equal(finishMatch(room,1000),true);assert.deepEqual(room.finalResults.map(p=>p.id),[2,1,3]);players.get(3).kills=100;assert.equal(finishMatch(room,1100),false);assert.equal(room.finalResults[2].kills,2);assert.equal(isMatchOver(room,900),true);
});
