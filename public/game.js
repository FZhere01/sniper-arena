import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';

import { SKINS, createCharacter, animateCharacter } from './characters.js';

const $ = id => document.getElementById(id);
const mobile = matchMedia('(pointer:coarse)').matches || innerWidth<700;
const scene = new THREE.Scene();scene.background=new THREE.Color(0x83b9ed);scene.fog=new THREE.Fog(0x83b9ed,45,120);
const camera=new THREE.PerspectiveCamera(73,innerWidth/innerHeight,.1,180);
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.8));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;$('game').append(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xd9f5ff,0x3545aa,2.3));const sun=new THREE.DirectionalLight(0xd8efff,3.5);sun.position.set(13,25,12);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.bias=-.0004;sun.shadow.normalBias=.03;sun.shadow.camera.near=.1;sun.shadow.camera.far=90;sun.shadow.camera.left=-32;sun.shadow.camera.right=32;sun.shadow.camera.top=32;sun.shadow.camera.bottom=-32;scene.add(sun);
const floor=new THREE.Mesh(new THREE.PlaneGeometry(46,46),new THREE.MeshStandardMaterial({color:0xc2e6f4,roughness:.92,metalness:.08}));floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;scene.add(floor);
const grid=new THREE.GridHelper(46,46,0x65cdd7,0x345062);grid.position.y=.012;grid.material.opacity=.035;grid.material.transparent=true;scene.add(grid);
function box(x,y,z,w,h,d,color=0x405364,metal=.25){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color,metalness:metal,roughness:.67}));o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;scene.add(o);return o;}
for(let n=-23;n<=23;n+=46){box(n,2,0,.9,4,46,0x5597e0);box(0,2,n,46,4,.9,0x5597e0);}
const obstacles=[{x:-11,z:-9,w:7,d:5,h:4.2},{x:11,z:9,w:7,d:5,h:4.2},{x:-12,z:10,w:4,d:9,h:4.2},{x:12,z:-10,w:4,d:9,h:4.2},{x:0,z:0,w:7,d:7,h:5.5},{x:-1,z:-17,w:11,d:3,h:3.1},{x:1,z:17,w:11,d:3,h:3.1},{x:-19,z:0,w:3,d:9,h:3.1},{x:19,z:0,w:3,d:9,h:3.1}];
for(const [i,o] of obstacles.entries()){box(o.x,o.h/2,o.z,o.w,o.h,o.d,i%2?0x5090e3:0x80c4f4);const trim=box(o.x,o.h+.05,o.z,o.w+.12,.11,o.d+.12,0xbceaff);trim.material.emissive=new THREE.Color(0x163b78);}
const plaster=concreteTexture();
// Ice-block seams stay flush with the solid, server-authoritative cover.
for(const o of obstacles){
 for(const sign of [-1,1]){
  for(let x=-o.w/2+1.5;x<o.w/2;x+=1.5)box(o.x+x,o.h/2,o.z+sign*(o.d/2+.008),.028,o.h,.02,0x2768b5,.2);
  for(let y=1.4;y<o.h;y+=1.4)box(o.x,y,o.z+sign*(o.d/2+.012),o.w,.035,.024,0x2768b5,.2);
  for(let z=-o.d/2+1.5;z<o.d/2;z+=1.5)box(o.x+sign*(o.w/2+.008),o.h/2,o.z+z,.02,o.h,.028,0x2768b5,.2);
  for(let y=1.4;y<o.h;y+=1.4)box(o.x+sign*(o.w/2+.012),y,o.z,.024,.035,o.d,0x2768b5,.2);
 }
 box(o.x,o.h+.08,o.z,o.w+.12,.13,o.d+.12,0xd2f5ff,.1);
}
function concreteTexture(){const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d');ctx.fillStyle='#abd5ff';ctx.fillRect(0,0,256,256);let seed=17;for(let i=0;i<22000;i++){seed=(seed*16807)%2147483647;const x=seed%256;seed=(seed*16807)%2147483647;const y=seed%256;ctx.fillStyle=i%2?'#ffffff10':'#1849be12';ctx.fillRect(x,y,1+(i%3),1);}const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(2,2);t.colorSpace=THREE.SRGBColorSpace;return t;}
scene.traverse(o=>{if(o.isMesh&&o.geometry.type==='BoxGeometry'&&o.geometry.parameters.height>2){o.material.map=plaster;o.material.roughness=.36;o.material.metalness=.12;}});
// Distant architecture is outside the arena; all playable cover matches server colliders.
for(let i=0;i<24;i++){const a=i/24*Math.PI*2,r=64+(i%3)*8,h=7+(i%5)*3;box(Math.cos(a)*r,h/2,Math.sin(a)*r,7,h,9,0x91b7ed,.05);}
const weapon=new THREE.Group();camera.add(weapon);scene.add(camera);weapon.position.set(.24,-.28,-.55);
const gunMetal=new THREE.MeshStandardMaterial({color:0xf5faff,metalness:.8,roughness:.3});
const gunBody=new THREE.MeshStandardMaterial({color:0xe61c3d,metalness:.35,roughness:.62});
function gunBox(x,y,z,w,h,d,mat){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);weapon.add(m);return m;}
function gunTube(x,y,z,r,len,mat){const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,len,20),mat);m.rotation.x=Math.PI/2;m.position.set(x,y,z);weapon.add(m);return m;}
gunBox(0,0,-.2,.13,.13,.48,gunBody);gunBox(0,-.08,.1,.12,.21,.21,gunBody);gunBox(0,-.06,.28,.15,.16,.25,gunBody);
gunTube(0,.02,-.65,.026,.65,gunMetal);gunTube(0,.02,-.99,.042,.1,gunMetal);
gunBox(0,.12,-.24,.055,.12,.23,gunMetal);gunTube(0,.2,-.24,.065,.37,gunMetal);gunTube(0,.2,-.46,.09,.12,gunMetal);
const lens=new THREE.MeshStandardMaterial({color:0x2b9cac,metalness:.8,roughness:.1,emissive:0x062e3e});gunTube(0,.2,-.525,.076,.008,lens);
for(let i=0;i<8;i++)gunBox(0,.08,-.47+i*.04,.15,.025,.012,gunMetal);
gunBox(.11,.015,-.08,.17,.035,.035,gunMetal);gunBox(.19,-.02,-.08,.04,.1,.045,gunMetal);
const snowPositions=[];for(let i=0;i<600;i++)snowPositions.push(((i*17.31)%46)-23,((i*7.19)%16)+.2,((i*11.13)%46)-23);
const snowGeo=new THREE.BufferGeometry();snowGeo.setAttribute('position',new THREE.Float32BufferAttribute(snowPositions,3));
const snow=new THREE.Points(snowGeo,new THREE.PointsMaterial({color:0xeeffff,size:.065,transparent:true,opacity:.65}));scene.add(snow);
const flash=new THREE.Mesh(new THREE.SphereGeometry(.065,8,6),new THREE.MeshBasicMaterial({color:0xffc9ff}));flash.position.set(0,.02,-1.06);weapon.add(flash);flash.visible=false;
// VORTEX Mk II: fluted barrel, rail, cheek rest, trigger guard and adjustable bipod.
const blackSteel=new THREE.MeshStandardMaterial({color:0x192336,metalness:.85,roughness:.28});
const gloveMat=new THREE.MeshStandardMaterial({color:0x26334b,roughness:.8});
gunBox(0,.1,.25,.12,.065,.27,blackSteel);gunBox(0,-.13,.09,.055,.19,.08,gunBody).rotation.x=-.25;
gunBox(0,-.12,-.1,.13,.15,.16,blackSteel);gunBox(0,-.19,-.12,.1,.02,.13,gunMetal);
for(let i=0;i<5;i++)gunBox(0,.02,-.55-i*.055,.085,.075,.018,gunBody);
for(const side of [-1,1]){const bipod=gunBox(side*.065,-.12,-.62,.018,.26,.025,blackSteel);bipod.rotation.z=side*.28;gunBox(side*.045,-.015,-.81,.012,.014,.22,blackSteel);}
gunTube(0,.2,-.02,.084,.035,blackSteel);gunTube(0,.2,-.51,.098,.035,blackSteel);
const bolt=gunBox(.1,.04,-.04,.17,.028,.028,blackSteel);gunBox(.2,.02,-.04,.035,.07,.04,blackSteel);
const leftHand=gunBox(-.04,-.1,-.42,.17,.12,.18,gloveMat);leftHand.rotation.z=-.3;
const rightHand=gunBox(.04,-.16,.08,.14,.16,.13,gloveMat);rightHand.rotation.x=-.2;
const sleeve=gunBox(-.12,-.25,-.29,.19,.35,.2,blackSteel);sleeve.rotation.z=-.45;
let zoomLevel=4;
const zoomButton=document.createElement('button');zoomButton.id='zoomPower';zoomButton.textContent='4×';$('hud').append(zoomButton);
zoomButton.onclick=()=>{zoomLevel=zoomLevel===4?8:4;zoomButton.textContent=zoomLevel+'×';if(aiming)setAim(true);};
for(let i=0;i<34;i++){const x=((i*13.13)%43)-21.5,z=((i*19.7)%43)-21.5;if(obstacles.some(o=>Math.abs(x-o.x)<o.w/2+2&&Math.abs(z-o.z)<o.d/2+2))continue;const height=2+(i%4)*1.3;box(x,height/2,z,.28,height,.28,0x557789);const light=new THREE.Mesh(new THREE.BoxGeometry(.35,.1,.35),new THREE.MeshBasicMaterial({color:i%2?0xff5c7c:0x39ddf1}));light.position.set(x,height,z);scene.add(light);}
function label(name,team){const c=document.createElement('canvas');c.width=512;c.height=128;const ctx=c.getContext('2d');ctx.font='bold 48px Arial';ctx.textAlign='center';ctx.fillStyle=team===0?'#7fdcff':'#ff9aa4';ctx.fillText(name.slice(0,16),256,78);const tex=new THREE.CanvasTexture(c);const mesh=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthTest:true}));mesh.scale.set(3.2,.8,1);mesh.position.y=2.85;return mesh;}
function avatar(p){const group=createCharacter(p.skin);group.add(label(p.name,p.team));scene.add(group);return group;}
let selectedSkin='shadow';try{const saved=localStorage.getItem('sniperSkin');if(SKINS.some(s=>s.id===saved))selectedSkin=saved;}catch{}
const previewScene=new THREE.Scene();const previewCamera=new THREE.PerspectiveCamera(33,1,.1,30);previewCamera.position.set(3,2.3,-5.5);previewCamera.lookAt(0,1.25,0);
previewScene.add(new THREE.HemisphereLight(0xc3efff,0x313b68,3));const keyLight=new THREE.DirectionalLight(0xffffff,4);keyLight.position.set(3,6,-4);previewScene.add(keyLight);const rim=new THREE.DirectionalLight(0x5bd9ff,5);rim.position.set(-3,2,3);previewScene.add(rim);
const previewRenderer=new THREE.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});previewRenderer.setPixelRatio(Math.min(devicePixelRatio,1.5));previewRenderer.setSize(360,340);previewRenderer.toneMapping=THREE.ACESFilmicToneMapping;$('operatorPreview').append(previewRenderer.domElement);
const previewModels=new Map();const skinButtons=new Map();
for(const skin of SKINS){const model=createCharacter(skin.id);previewModels.set(skin.id,model);previewScene.add(model);model.rotation.y=-.2;previewRenderer.render(previewScene,previewCamera);const thumb=previewRenderer.domElement.toDataURL('image/png');previewScene.remove(model);const button=document.createElement('button');button.className='skinCard';button.type='button';button.setAttribute('aria-label',skin.name);button.innerHTML=`<img alt="${skin.name} 3D character" src="${thumb}"><span>${skin.name}</span>`;button.style.setProperty('--skin-color',skin.color);button.onclick=()=>chooseSkin(skin.id);$('skinGrid').append(button);skinButtons.set(skin.id,button);}
let previewModel=null;
function chooseSkin(id){selectedSkin=id;try{localStorage.setItem('sniperSkin',id);}catch{}if(previewModel)previewScene.remove(previewModel);previewModel=previewModels.get(id);previewScene.add(previewModel);const skin=SKINS.find(s=>s.id===id);$('skinName').textContent=skin.name;$('skinTag').textContent=skin.tag;for(const [key,button] of skinButtons){button.classList.toggle('selected',key===id);button.setAttribute('aria-pressed',String(key===id));}}
chooseSkin(selectedSkin);
const actors=new Map();let socket=null,me=null,room='',joined=false, yaw=0,pitch=0,aiming=false,respawnAt=0,alive=true,lastShot=0,toastUntil=0;
let local={x:0,z:0,yaw:0,pitch:0};const keys=new Set();const joy={x:0,y:0};let touchSprint=false;let lastLook=null;
const proto=location.protocol==='https:'?'wss:':'ws:';
const urlRoom=new URLSearchParams(location.search).get('room');if(urlRoom)$('roomInput').value=urlRoom.toUpperCase();
function message(o){if(socket?.readyState===WebSocket.OPEN)socket.send(JSON.stringify(o));}
function toast(text){$('toast').textContent=text;toastUntil=performance.now()+2500;}
function connect(){const n=$('name').value.trim()||'SNIPER';$('join').disabled=true;$('menuError').textContent='';socket=new WebSocket(`${proto}//${location.host}`);socket.onopen=()=>message({type:'join',name:n,skin:selectedSkin,code:$('roomInput').value.trim()});socket.onmessage=e=>{let m;try{m=JSON.parse(e.data);}catch{return;}handle(m);};socket.onclose=()=>{if(joined){toast('Connection lost. Rejoin the arena.');$('menu').style.display='grid';$('hud').hidden=true;joined=false;} $('join').disabled=false;};socket.onerror=()=>{$('menuError').textContent='Unable to connect. Please try again.';};}
$('join').onclick=connect;
$('copy').onclick=async()=>{const u=new URL(location.href);u.searchParams.set('room',room);try{await navigator.clipboard.writeText(u.toString());toast('INVITE LINK COPIED');}catch{prompt('Copy room invitation:',u.toString());}};
function handle(m){if(m.type==='error'){$('menuError').textContent=m.message;$('join').disabled=false;return;}
if(m.type==='welcome'){yaw=m.team===0?Math.PI/2:-Math.PI/2;me=m.id;room=m.code;joined=true;alive=true;$('menu').style.display='none';$('hud').hidden=false;$('roomCode').textContent=room;$('join').disabled=false;toast('ROOM READY · INVITE YOUR SQUAD');if(!mobile)renderer.domElement.requestPointerLock?.();}
if(m.type==='state'){const ids=new Set();for(const p of m.players){ids.add(p.id);if(p.id===me){const difference=Math.hypot(local.x-p.x,local.z-p.z);if(difference>2.0){local.x=p.x;local.z=p.z;}else{const cx=local.x+(p.x-local.x)*.1,cz=local.z+(p.z-local.z)*.1;if(!obstacles.some(o=>Math.abs(cx-o.x)<o.w/2+.52&&Math.abs(cz-o.z)<o.d/2+.52)){local.x=cx;local.z=cz;}}alive=p.alive;$('level').textContent=String(p.level).padStart(2,'0');$('kills').textContent=String(p.kills).padStart(2,'0');$('deaths').textContent=String(p.deaths).padStart(2,'0');$('teamName').textContent=p.team===0?'BLUE TEAM':'RED TEAM';$('teamName').style.color=p.team===0?'#7ecaff':'#ff93a2';if(!p.alive)respawnAt=Date.now()+p.respawn;}
let actor=actors.get(p.id);if(!actor){actor=avatar(p);actors.set(p.id,actor);}actor.userData.dest={x:p.x,z:p.z,yaw:p.yaw};actor.visible=p.alive&&p.id!==me;actor.userData.team=p.team;}
for(const [id,actor] of actors)if(!ids.has(id)){scene.remove(actor);actors.delete(id);}
const mine=m.players.find(p=>p.id===me);if(mine){$('playerList').innerHTML=m.players.map(p=>`<div class="${p.team===mine.team?'friend':'foe'}">${p.team===mine.team?'●':'◆'} ${escapeHTML(p.name)} · LV ${p.level}</div>`).join('');}}
if(m.type==='shot'){if(m.id!==me){const dx=Math.sin(m.yaw),dz=-Math.cos(m.yaw);tracer(m.x,m.z,dx,dz);}if(m.hitId===me)screenFlash();}
if(m.type==='kill'){if(m.victim===me){setAim(false);alive=false;respawnAt=Date.now()+3000;}if(m.killer===me)toast(`+1 LEVEL · ELIMINATED ${m.victimName}`);else toast(`${m.killerName} ⚡ ${m.victimName}`);}
if(m.type==='respawn'){local.x=m.x;local.z=m.z;alive=true;respawnAt=0;toast('RESPAWNED · GO!');}
if(m.type==='notice'&&joined)toast(m.message);
}
function escapeHTML(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function screenFlash(){document.body.style.filter='sepia(.2) saturate(1.9)';setTimeout(()=>document.body.style.filter='',180);}
function tracer(x,z,dx,dz){const pts=[new THREE.Vector3(x,1.5,z),new THREE.Vector3(x+dx*35,1.5,z+dz*35)];const geo=new THREE.BufferGeometry().setFromPoints(pts);const obj=new THREE.Line(geo,new THREE.LineBasicMaterial({color:0xffc168,transparent:true,opacity:1}));scene.add(obj);setTimeout(()=>{scene.remove(obj);geo.dispose();obj.material.dispose();},120);}
function shoot(){if(!joined||!alive)return;const now=Date.now();if(now-lastShot<1250)return;lastShot=now;message({type:'shoot',yaw,pitch});tracer(local.x,local.z,Math.sin(yaw),-Math.cos(yaw));$('reloadLabel').textContent='BOLT ACTION · RELOADING';setTimeout(()=>$('reloadLabel').textContent='READY TO FIRE',1250);}
function setAim(value){aiming=value;$('scope').classList.toggle('active',aiming);weapon.visible=!value;zoomButton.style.display=value?'block':'none';camera.fov=aiming?(zoomLevel===4?20:10):73;camera.updateProjectionMatrix();}
window.addEventListener('keydown',e=>{if(['INPUT','TEXTAREA'].includes(document.activeElement.tagName))return;keys.add(e.code);if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();});window.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',()=>{keys.clear();joyEnd();touchSprint=false;lastLook=null;setAim(false);});
window.addEventListener('mousemove',e=>{if(document.pointerLockElement!==renderer.domElement||!joined)return;yaw+=e.movementX*(aiming?.0008:.0022);pitch=Math.max(-.58,Math.min(.58,pitch-e.movementY*(aiming?.0007:.0019)));});
renderer.domElement.addEventListener('click',()=>{if(!joined||mobile)return;if(document.pointerLockElement!==renderer.domElement){renderer.domElement.requestPointerLock?.();return;}shoot();});
renderer.domElement.addEventListener('contextmenu',e=>e.preventDefault());window.addEventListener('mousedown',e=>{if(e.button===2&&joined)setAim(true);});window.addEventListener('mouseup',e=>{if(e.button===2)setAim(false);});
const joyEl=$('joystick'),nub=$('nub');function joyMove(e){const r=joyEl.getBoundingClientRect();const x=e.clientX-(r.left+r.width/2),y=e.clientY-(r.top+r.height/2),rmax=39;const scale=Math.min(1,rmax/(Math.hypot(x,y)||1));joy.x=x*scale/rmax;joy.y=y*scale/rmax;nub.style.transform=`translate(${joy.x*rmax}px,${joy.y*rmax}px)`;}
joyEl.addEventListener('pointerdown',e=>{joyEl.setPointerCapture(e.pointerId);joyMove(e);});joyEl.addEventListener('pointermove',e=>{if(joyEl.hasPointerCapture(e.pointerId))joyMove(e);});function joyEnd(){joy.x=joy.y=0;nub.style.transform='';}joyEl.addEventListener('pointerup',joyEnd);joyEl.addEventListener('pointercancel',joyEnd);
const look=$('touchLook');look.addEventListener('pointerdown',e=>{look.setPointerCapture(e.pointerId);lastLook={x:e.clientX,y:e.clientY};});look.addEventListener('pointermove',e=>{if(!lastLook)return;const dx=e.clientX-lastLook.x,dy=e.clientY-lastLook.y;yaw+=dx*(aiming?.0015:.004);pitch=Math.max(-.58,Math.min(.58,pitch-dy*(aiming?.0015:.003)));lastLook={x:e.clientX,y:e.clientY};});look.addEventListener('pointerup',()=>lastLook=null);look.addEventListener('pointercancel',()=>lastLook=null);
$('fireBtn').addEventListener('pointerdown',e=>{e.preventDefault();shoot();});$('aimBtn').addEventListener('pointerdown',e=>{e.preventDefault();setAim(!aiming);});$('runBtn').addEventListener('pointerdown',e=>{e.preventDefault();touchSprint=true;$('runBtn').style.background='#3bd6e777';});for(const e of ['pointerup','pointercancel','pointerleave'])$('runBtn').addEventListener(e,()=>{touchSprint=false;$('runBtn').style.background='';});
const clock=new THREE.Clock();let moveSend=0,shotDist=0;
function frame(){requestAnimationFrame(frame);const dt=Math.min(.05,clock.getDelta());snow.position.y=-(performance.now()*.0002)%5;flash.visible=Date.now()-lastShot<85;for(const actor of actors.values()){const d=actor.userData.dest;if(!d)continue;const moving=Math.hypot(d.x-actor.position.x,d.z-actor.position.z)>.03;animateCharacter(actor,performance.now()/1000,moving);actor.position.x+=(d.x-actor.position.x)*Math.min(1,dt*12);actor.position.z+=(d.z-actor.position.z)*Math.min(1,dt*12);actor.rotation.y+=(-d.yaw-actor.rotation.y)*Math.min(1,dt*12);}
if(joined){let f=0,s=0;if(keys.has('KeyW')||keys.has('ArrowUp'))f++;if(keys.has('KeyS')||keys.has('ArrowDown'))f--;if(keys.has('KeyA')||keys.has('ArrowLeft'))s--;if(keys.has('KeyD')||keys.has('ArrowRight'))s++;f+=-joy.y;s+=joy.x;const norm=Math.max(1,Math.hypot(f,s));f/=norm;s/=norm;const sprint=keys.has('ShiftLeft')||keys.has('ShiftRight')||touchSprint;const speed=sprint?9.3:6.1;const mx=Math.sin(yaw)*f+Math.cos(yaw)*s,mz=-Math.cos(yaw)*f+Math.sin(yaw)*s;
// Local prediction + server reconciliation.
if(alive){const nx=local.x+mx*speed*dt,nz=local.z+mz*speed*dt;if(Math.abs(nx)<22.35&&!obstacles.some(o=>Math.abs(nx-o.x)<o.w/2+.52&&Math.abs(local.z-o.z)<o.d/2+.52))local.x=nx;if(Math.abs(nz)<22.35&&!obstacles.some(o=>Math.abs(local.x-o.x)<o.w/2+.52&&Math.abs(nz-o.z)<o.d/2+.52))local.z=nz;}
moveSend+=dt;if(moveSend>=.05){moveSend=0;message({type:'move',mx,mz,sprint,yaw,pitch});}
// First-person eye stays inside the player's collision capsule, never behind a wall.
camera.position.set(local.x,1.65,local.z);
camera.rotation.order='YXZ';camera.rotation.set(pitch,-yaw,0,'YXZ');
weapon.visible=alive&&!aiming;weapon.position.y=-.28-Math.sin(performance.now()*.012)*Math.min(.012,Math.hypot(f,s)*.012);
bolt.position.z=-.04+Math.sin(Math.min(1,(Date.now()-lastShot)/1250)*Math.PI)*.12;weapon.position.z=-.55+Math.max(0,1-(Date.now()-lastShot)/180)*.12;

const dead=respawnAt>Date.now()&&!alive;$('death').hidden=!dead;if(dead){const secs=Math.max(1,Math.ceil((respawnAt-Date.now())/1000));$('countdown').textContent=secs;$('seconds').textContent=secs;}$('crosshair').style.opacity=dead?'0':'1';}
else{const t=performance.now()*.00007;camera.position.set(Math.cos(t)*29,17+Math.sin(t*1.7)*3,Math.sin(t)*29);camera.lookAt(0,1,0);weapon.visible=false;previewModel.rotation.y=Math.sin(t*6)*.55;animateCharacter(previewModel,performance.now()/1000);previewRenderer.render(previewScene,previewCamera);}
if(performance.now()>toastUntil)$('toast').textContent='';renderer.render(scene,camera);}
frame();window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
