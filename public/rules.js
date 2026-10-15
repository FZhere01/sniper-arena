// Shared authoritative dimensions: visual size, eye height and collision agree.
export const MODE='FREE FOR ALL';
export const playerScale=kills=>Math.max(.5,Math.pow(.94,Math.max(0,Number(kills)||0)));
export const playerRadius=kills=>.52*playerScale(kills);
export const eyeHeight=kills=>1.65*playerScale(kills);
export function targetInSight(shooter,target,wallDistance,now=Date.now()){
 if(target.id===shooter.id||!target.alive||now<target.protectedUntil)return null;
 const dx=Math.sin(shooter.yaw),dz=-Math.cos(shooter.yaw),rx=target.x-shooter.x,rz=target.z-shooter.z;
 const distance=rx*dx+rz*dz,side=Math.abs(rx*dz-rz*dx),height=eyeHeight(shooter.kills)+Math.tan(shooter.pitch)*distance;
 return distance>.1&&distance<wallDistance&&side<.54*playerScale(target.kills)&&height>0&&height<2.45*playerScale(target.kills)?distance:null;
}
