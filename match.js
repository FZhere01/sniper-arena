export const DEFAULT_MINUTES=15;
export function durationMinutes(value){if(value===undefined)return DEFAULT_MINUTES;const n=Number(value);return Number.isInteger(n)&&n>=1&&n<=60?n:null;}
export function isMatchOver(room,now=Date.now()){return !!room.ended||now>=room.endsAt;}
export function results(room){return [...room.players.values()].map(p=>({id:p.id,name:p.name,kills:p.kills,deaths:p.deaths,level:p.level})).sort((a,b)=>b.kills-a.kills||a.deaths-b.deaths||a.id-b.id);}
export function finishMatch(room,now=Date.now()){if(room.ended||now<room.endsAt)return false;room.ended=true;room.finalResults=results(room);return true;}
