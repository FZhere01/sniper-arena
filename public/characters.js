import * as T from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';
export const SKINS=[{id:'shadow',name:'SHADOW',tag:'Silent professional',color:'#65718c'},{id:'hazmat',name:'HAZMAT',tag:'Containment specialist',color:'#e6db30'},{id:'red-jester',name:'RED JESTER',tag:'Chaos in crimson',color:'#ff3255'},{id:'grin',name:'GRIN',tag:'Never trust the smile',color:'#d63152'},{id:'clown',name:'WILD CARD',tag:'The last laugh',color:'#9cd42d'},{id:'hockey',name:'PHANTOM',tag:'Cold precision',color:'#d5e7ee'},{id:'jester',name:'JESTER',tag:'A dangerous sense of humor',color:'#96c6e4'},{id:'paper',name:'PAPER GHOST',tag:'Identity classified',color:'#d0ac74'},{id:'ape',name:'KINGPIN',tag:'Heavy business',color:'#9a6445'}];
const materialCache=new Map();
function mat(c,metal=.08){const key=c+':'+metal;if(!materialCache.has(key))materialCache.set(key,new T.MeshStandardMaterial({color:c,roughness:.62,metalness:metal}));return materialCache.get(key);}
export function createCharacter(id='shadow'){
 const root=new T.Group();root.userData.skin=id;const haz=id==='hazmat',red=id==='red-jester',ape=id==='ape';
 const suit=haz?0xd9d629:red?0xb61436:0x263044,skin=ape?0x9b694a:0xf0ac7a;
 function mesh(geo,c,x,y,z,group=root,metal=.08){const o=new T.Mesh(geo,mat(c,metal));o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;group.add(o);return o;}
 const box=(x,y,z,w,h,d,c,g=root)=>mesh(new T.BoxGeometry(w,h,d),c,x,y,z,g);
 const ball=(x,y,z,rx,ry,rz,c,g=root)=>{const o=mesh(new T.SphereGeometry(1,16,12),c,x,y,z,g);o.scale.set(rx,ry,rz);return o;};
 function tube(x,y,z,r,h,c,g=root){const m=mesh(new T.CylinderGeometry(r,r,h,16),c,x,y,z,g);m.rotation.x=Math.PI/2;return m;}
 // Oversized head, short tactical body and individually articulated limbs.
 ball(0,1.02,0,.48,.55,.3,suit);box(0,.88,.02,.65,.2,.46,0x19202d);
 box(0,1.07,.31,.65,.55,.15,suit);box(0,.81,-.25,.8,.13,.12,0x0d1420);
 for(const x of [-.19,.19]){box(x,1.13,-.34,.2,.25,.08,0x3b485d);box(x,.84,-.34,.17,.1,.05,0xa3aab2);}
 const strap=box(0,1.17,-.39,.1,.81,.05,0x101520);strap.rotation.z=-.6;
 const legs=[],arms=[];
 for(const sign of [-1,1]){const leg=new T.Group();leg.position.set(sign*.25,.7,0);root.add(leg);box(0,-.24,0,.25,.49,.29,suit,leg);box(0,-.51,-.08,.31,.16,.46,0x111925,leg);legs.push(leg);
 const arm=new T.Group();arm.position.set(sign*.5,1.35,0);root.add(arm);arm.rotation.z=sign*.2;box(0,-.2,0,.24,.43,.3,suit,arm);ball(0,-.44,-.04,.14,.15,.14,haz?0x20252d:skin,arm);arms.push(arm);}
 const head=new T.Group();head.position.y=1.85;root.add(head);ball(0,0,0,.54,.55,.43,id==='shadow'||id==='grin'?0x141a29:skin,head);
 const hb=(x,y,z,w,h,d,c)=>box(x,y,z,w,h,d,c,head),hs=(x,y,z,rx,ry,rz,c)=>ball(x,y,z,rx,ry,rz,c,head);
 function eyes(y=.04,z=-.41){for(const x of [-.19,.19]){hs(x,y,z,.065,.085,.025,0x171823);const brow=hb(x,y+.14,z,.18,.06,.04,0x362530);brow.rotation.z=x<0?-.2:.2;}}
 function grin(y=-.22,z=-.45){hs(0,y,z,.39,.16,.055,0xe3193d);hs(0,y+.02,z-.045,.3,.09,.025,0xf9f3dc);for(let x=-.2;x<=.2;x+=.1)hb(x,y+.015,z-.073,.012,.13,.007,0x807777);}
 function hair(c=0x292535){for(let i=0;i<7;i++){const m=mesh(new T.ConeGeometry(.13,.34,5),c,-.42+i*.14,.5,-.02,head);m.rotation.z=(i-3)*-.18;}}
 if(id==='shadow'||id==='grin'){hs(0,.07,-.36,.43,.24,.1,skin);eyes(.09,-.457);if(id==='shadow'){hs(0,-.24,-.37,.48,.25,.12,0x0e1522);hb(0,-.12,-.49,.65,.08,.03,0x20283b);}else{grin();hs(0,-.06,-.5,.13,.08,.07,0xc91b3b);}}
 if(haz){hb(0,.04,-.36,.95,.8,.15,0x243447);hb(0,.1,-.46,.78,.59,.04,0x8de2e6);hs(0,.11,-.5,.35,.25,.02,skin);eyes(.16,-.53);hs(0,-.24,-.52,.37,.24,.14,0x17212b);for(const x of [-.23,.23]){tube(x,-.25,-.65,.14,.1,0x626e79,head);tube(x,-.25,-.71,.09,.02,0x29333f,head);for(let i=-1;i<=1;i++)hb(x+i*.04,-.25,-.73,.015,.14,.01,0xa0a9af);}hair(0x402b26);}
 if(id==='red-jester'||id==='jester'){hair();hb(0,.33,-.28,1.08,.33,.51,0xb6d9e7);for(const x of [-.32,0,.32])tube(x,.34,-.55,.072,.04,0x303a47,head);eyes(-.02,-.43);grin(-.28);hs(0,-.14,-.49,.17,.11,.12,0xe62b35);}
 if(id==='clown'){hs(0,0,-.22,.55,.58,.3,0xe1edf1);for(const sign of [-1,1]){const h=mesh(new T.ConeGeometry(.21,.46,5),0x80b62b,sign*.58,.28,0,head);h.rotation.z=-sign*.9;}for(const x of [-.21,.21]){hs(x,.02,-.51,.1,.14,.025,0x171f31);const b=hb(x,.29,-.45,.2,.09,.05,0xd9213a);b.rotation.z=x<0?-.4:.4;}grin(-.32,-.49);hs(0,-.16,-.58,.13,.13,.12,0xe2223e);}
 if(id==='hockey'){hs(0,0,-.23,.55,.62,.29,0xdce5ef);for(const x of [-.23,.23]){const e=hs(x,.09,-.505,.16,.105,.025,0x111722);e.rotation.z=x<0?-.2:.2;}for(const [x,y] of [[0,.42],[-.22,.4],[.22,.4],[0,.28],[-.12,-.17],[.12,-.17],[-.15,-.32],[.15,-.32],[0,-.45]])hs(x,y,-.52,.027,.035,.012,0x283346);hb(.5,.16,-.1,.1,.16,.24,0x8f9eb6);}
 if(id==='paper'){hb(0,.02,0,1.03,1.16,.83,0xc7a171);hb(-.48,.02,0,.04,1.12,.8,0x96704c);const fold=hb(.14,.61,0,.72,.08,.83,0xe0bb8e);fold.rotation.z=.12;for(const x of [-.21,.21]){hs(x,-.04,-.43,.13,.18,.012,0x503930);hs(x,-.04,-.445,.06,.09,.012,0x171a24);}hb(.29,.06,-.43,.02,.6,.015,0xb28b60);}
 if(ape){hs(0,.08,.02,.64,.63,.47,0x563326);for(const sign of [-1,1]){hs(sign*.59,.03,0,.2,.28,.18,skin);hs(sign*.6,.03,-.13,.11,.17,.04,0x69412e);}hs(0,-.21,-.38,.45,.3,.21,0xc6966a);hs(0,-.04,-.48,.23,.13,.1,0x94633f);for(const x of [-.24,.24]){hs(x,.16,-.41,.19,.1,.05,0x1f1127);const brow=hb(x,.32,-.4,.42,.15,.09,skin);brow.rotation.z=x<0?-.2:.2;}for(let i=0;i<6;i++){const h=mesh(new T.ConeGeometry(.2,.44,5),0x563326,-.4+i*.16,.58,0,head);h.rotation.z=-.4;}const cigar=tube(.25,-.29,-.68,.045,.32,0x80563b,head);tube(.25,-.29,-.85,.045,.025,0xff8039,head);}
 // Compact long rifle, visually consistent across all skins.
 box(.45,1.14,-.54,.12,.14,.62,0x202938);tube(.45,1.2,-1.02,.025,.55,0x101723);tube(.45,1.35,-.5,.055,.28,0x0f1725);box(.45,.99,-.45,.09,.24,.16,0x111827);
 root.userData.legs=legs;root.userData.arms=arms;root.userData.head=head;return root;
}
export function animateCharacter(model,time,moving=false){const v=moving?Math.sin(time*11)*.45:Math.sin(time*2)*.025;model.userData.legs?.forEach((o,i)=>o.rotation.x=v*(i?1:-1));model.userData.arms?.forEach((o,i)=>o.rotation.x=v*(i?-1:1)*.5);model.userData.head.rotation.z=Math.sin(time*1.5)*.018;}
