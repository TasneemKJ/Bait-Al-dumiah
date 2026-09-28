import * as T from 'three';
import {createSculptedHead,createPortraitEye,createBrow,closePortraitEye,createPortraitMouth,createNose,createEar,bisqueMaterial,createNeckJoint} from './doll-face.js';
import {createTeaSteam,createComfortHearts,createSleepCrescent} from './resident-effects.js';
import {DOLLS,ROOMS} from '../content.js';
import {palette as P,box,cylinder,ring,line,mat,cup,batch} from './primitives.js';
import {craftMaterial,softTexture} from './textiles.js';
export function blinkOpen(time,index=0){
 if(!Number.isFinite(time))return 1;const phase=((time+(Number.isFinite(index)?index:0)*1.37)%4.8+4.8)%4.8;
 if(phase<4.48||phase>4.66)return 1;return Math.max(.1,1-.9*Math.sin((phase-4.48)/.18*Math.PI)**2);
}
const porcelainGeometry=new T.SphereGeometry(1,24,16),beadGeometry=new T.SphereGeometry(1,12,8);
function ball(p,x,y,z,rx,ry,rz,color){const mesh=new T.Mesh(Math.max(rx,ry,rz)<.07?beadGeometry:porcelainGeometry,typeof color==='number'?mat(color):color);mesh.position.set(x,y,z);mesh.scale.set(rx,ry,rz);mesh.castShadow=true;mesh.receiveShadow=true;p.add(mesh);return mesh}

function skirt(parent,color){
 const shape=[];for(let i=0;i<14;i++){const t=i/13;shape.push(new T.Vector2(.115+.19*Math.pow(1-t,1.7),.32+t*.43))}
 const g=new T.LatheGeometry(shape,48),a=g.attributes.position;
 for(let i=0;i<a.count;i++){const x=a.getX(i),z=a.getZ(i),y=a.getY(i),wave=1+Math.sin(Math.atan2(z,x)*12)*.045*(.78-y)/.46;a.setXYZ(i,x*wave,y,z*wave*.86)}g.computeVertexNormals();
 const mesh=new T.Mesh(g,craftMaterial(color));mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);
 for(let i=0;i<24;i++){const ang=i*Math.PI/12;ball(parent,Math.cos(ang)*.299,.335,Math.sin(ang)*.256,.031,.024,.024,P.cream)}
}
function ribbon(parent,x,y,z,color){for(const sign of [-1,1]){const loop=ball(parent,x+sign*.06,y,z,.075,.04,.028,color);loop.rotation.z=sign*.28}ball(parent,x,y,z+.013,.028,.028,.024,color)}
function makeDoll(def){
 const root=new T.Group(),body=new T.Group();root.add(body);
 const skin=bisqueMaterial();
 const fabric=craftMaterial(def.color),hair=mat(def.hair,{roughness:.42});
 const legs=[];
 for(const sign of [-1,1]){
  const leg=new T.Group();leg.name='articulated-leg';leg.position.set(sign*.12,.40,0);body.add(leg);legs.push(leg);
  cylinder(leg,0,-.19,0,.060,.29,P.cream);ring(leg,0,-.13,0,.061,.009,def.color,true);
  ball(leg,0,-.323,.07,.095,.065,.147,def.id==='noor'?0xb5bdb0:0x684b59);box(leg,0,-.298,.083,.18,.020,.065,P.cream,true);
  if(def.id==='sami')ball(leg,0,0,0,.12,.19,.11,0x82718d);batch(leg);
 }
 if(def.id!=='sami')skirt(body,def.color);
 ball(body,0,.70,0,.17,.20,.125,fabric);
 if(def.id==='sami'){
  box(body,0,.60,.105,.245,.28,.065,craftMaterial(0x82718d),true);
  for(const x of [-.10,.10]){box(body,x,.74,.105,.036,.24,.045,0x82718d,true);ball(body,x,.82,.133,.02,.02,.012,P.gold)}
  box(body,0,.62,.146,.11,.095,.01,0xaa97af,true);
 }else{
  const apron=ball(body,0,.56,.171,.142,.20,.022,craftMaterial(0xf2dac9));apron.rotation.x=.18;
  ribbon(body,0,.77,.139,def.id==='lina'?0xb47787:0xd7be89);
 }
 // A scalloped collar and tiny seams make the residents feel sewn, not conical.
 for(let i=0;i<7;i++){const a=i*Math.PI/6;ball(body,Math.cos(a)*.108,.817-Math.sin(a)*.021,Math.sin(a)*.095,.034,.016,.029,P.cream)}
 cylinder(body,0,.845,0,.057,.10,skin);createNeckJoint(body);
 const arms=[];
 for(const sign of [-1,1]){
  const arm=new T.Group();arm.position.set(sign*.19,.73,0);body.add(arm);
  ball(arm,0,-.055,0,.073,.105,.075,fabric);ball(arm,0,-.174,.01,.045,.087,.045,skin);
  ring(arm,0,-.155,.012,.047,.012,P.cream,true);ball(arm,0,-.26,.016,.052,.061,.048,skin);
  arm.rotation.z=sign*.19;arms.push(arm);
 }
 const head=new T.Group();head.position.set(0,1.095,.008);body.add(head);
 ball(head,0,.015,-.014,.305,.311,.269,hair);
 const faceHull=createSculptedHead(head,skin,def.id);
 const ears=[-1,1].map(sign=>createEar(head,sign,skin));
 // Swept fringe with smaller curls keeps the face open and the silhouette soft.
 for(let i=0;i<7;i++){const x=-.245+i*.081;const curl=ball(head,x,.178+Math.cos(i*.48)*.025,.145,.074,.092,.093,hair);curl.rotation.z=(i-3)*-.16}
 if(def.id==='lina')for(const sign of [-1,1]){for(let j=0;j<3;j++)ball(head,sign*(.29+j*.015),.06-j*.105,-.035,.085,.075,.087,hair);ribbon(head,sign*.30,.125,.08,0xc58294)}
 if(def.id==='noor'){ball(head,.23,.25,-.11,.121,.12,.112,hair);for(let i=0;i<5;i++){const a=.3+i*.25;ball(head,Math.sin(a)*.25,.272-Math.sin(a)*.025,.147,.025,.022,.025,0xe5c998)}}
 const eyes=[],brows=[];
 for(const sign of [-1,1]){
  const eye=createPortraitEye(head,sign,def.id);eyes.push(eye);
  brows.push(createBrow(head,sign,def.hair));
 }
 const nose=createNose(head,skin);
 const mouth=createPortraitMouth(head);
 if(def.id==='sami'){for(const sign of [-1,1])ring(head,sign*.105,.007,.296,.071,.008,P.gold);line(head,[-.034,.010,.295],[.034,.010,.295],.007,P.gold)}
 const tea=new T.Group();tea.position.set(0,-.29,.075);tea.scale.setScalar(.85);cup(tea,0,0,0,0xf1d9b5);arms[1].add(tea);tea.visible=false;const steam=createTeaSteam(tea);
 const hit=new T.Mesh(new T.CapsuleGeometry(.38,.74,3,8),new T.MeshBasicMaterial({visible:false}));hit.position.y=.72;hit.userData.doll=def.id;root.add(hit);
 const halo=new T.Mesh(new T.RingGeometry(.37,.40,48),new T.MeshBasicMaterial({color:0xe5b471,transparent:true,opacity:.8,side:T.DoubleSide,depthWrite:false}));halo.rotation.x=-Math.PI/2;halo.position.y=.035;root.add(halo);
 const shadow=new T.Mesh(new T.PlaneGeometry(.90,.66),new T.MeshBasicMaterial({map:softTexture(),color:0x453041,transparent:true,opacity:.35,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.y=.012;root.add(shadow);
 const comfortHearts=createComfortHearts(root),sleepCrescent=createSleepCrescent(root);
 const sparkles=new T.Group();sparkles.position.y=1.65;root.add(sparkles);
 for(let i=0;i<3;i++){const s=new T.Mesh(new T.OctahedronGeometry(.037),mat(0xf0cc8b,{emissive:0xf0cc8b,emissiveIntensity:.5}));s.position.set((i-1)*.18,Math.sin(i)*.13,0);sparkles.add(s)}
 const staticBody=new T.Group();for(const o of [...body.children])if(o.isMesh)staticBody.add(o);body.add(staticBody);batch(staticBody);batch(head);
 return {root,body,head,faceHull,brows,mouth,nose,ears,arms,legs,eyes,hit,halo,tea,steam,comfortHearts,sleepCrescent,sparkles,room:null,id:def.id};
}
export function createDolls(parent){
 const dolls=DOLLS.map((def,i)=>{const v=makeDoll(def);parent.add(v.root);const r=ROOMS.find(x=>x.id===def.room);v.root.position.set(r.x+.85,r.y+.12,.88);return v});
 return {dolls,targets:dolls.map(v=>v.hit),update(state,dt,selected,viewerYaw=0){
  dolls.forEach(v=>{v.halo.visible=selected===v.id});if(state.paused)return;
  const motion=!state.settings.reducedMotion&&!state.paused,t=state.elapsed;
  dolls.forEach((v,i)=>{
   const d=state.dolls.find(x=>x.id===v.id),r=ROOMS.find(x=>x.id===d.room),mates=state.dolls.filter(x=>x.room===d.room),order=mates.indexOf(d);
   const base=mates.length>1?(order-(mates.length-1)/2)*.90:(i===1?1.35:.80);
   if(v.room!==d.room){v.root.position.set(r.x+base,r.y+.12,.88);v.room=d.room}
   const walk=motion&&d.action==='idle'?Math.sin(t*.13+i*2)*.26:0;
   const previousX=v.root.position.x;
   v.root.position.x=state.settings.reducedMotion?r.x+base:T.MathUtils.damp(v.root.position.x,r.x+base+walk,3,dt);
   if(!state.paused){const speed=Math.abs(v.root.position.x-previousX)/Math.max(dt,.001);v.legs.forEach((leg,j)=>{leg.rotation.x=motion&&d.action==='idle'?Math.sin(t*3.2+i+j*Math.PI)*Math.min(.16,speed*2.5):0})}
   v.halo.visible=selected===d.id;v.tea.visible=d.action==='tea';v.steam.update(t,d.action==='tea',!motion);v.comfortHearts.update(t,d.action==='soothe',!motion);v.sleepCrescent.update(t,d.action==='rest',!motion);v.sparkles.visible=d.action==='play';
   v.sparkles.rotation.y=motion?t*.7:0;
   v.body.position.y=motion?(d.action==='play'?Math.abs(Math.sin(t*4.6))*.065:Math.sin(t*1.7+i)*.009):0;
   v.body.rotation.z=motion&&d.action==='play'?Math.sin(t*3.6)*.05:0;
   v.head.rotation.z=d.action==='rest'?.16:motion?Math.sin(t*.6+i)*.04:0;v.head.rotation.y=motion?T.MathUtils.damp(v.head.rotation.y,selected===d.id?T.MathUtils.clamp(Number.isFinite(viewerYaw)?viewerYaw:0,-.35,.35):Math.sin(t*.36+i)*.08,5,dt):0;v.head.rotation.x=d.action==='rest'?.23:0;
   const openness=d.action==='rest'?.12:motion?blinkOpen(t,i):1;
   v.eyes.forEach(e=>closePortraitEye(e,openness));
   v.arms.forEach((a,j)=>{const sign=j===0?-1:1;a.rotation.z=sign*(d.action==='play'?.55+(motion?Math.sin(t*4)*.18:0):d.action==='soothe'?.50:d.action==='rest'?.46:.19);a.rotation.x=d.action==='tea'&&j===1?-1.2:d.action==='rest'?(j===0?-.88:-.68):0});
   // The hand carries the cup; wrist pitching must not spill its surface or tilt steam sideways.
   v.tea.quaternion.copy(v.arms[1].quaternion).invert();
  });
 },position(id){return dolls.find(v=>v.id===id)?.root.position.clone()}};
}
export function createGhost(parent){
 const root=new T.Group();parent.add(root);
 const material=new T.MeshStandardMaterial({color:0xf1e8e7,roughness:.64,transparent:true,opacity:.94,emissive:0xa39dc1,emissiveIntensity:.24,side:T.DoubleSide});
 const profile=[new T.Vector2(0,.79),new T.Vector2(.12,.77),new T.Vector2(.22,.67),new T.Vector2(.26,.51),new T.Vector2(.27,.28),new T.Vector2(.33,.07),new T.Vector2(.37,0)];
 const geo=new T.LatheGeometry(profile,48),pos=geo.attributes.position;
 for(let i=0;i<pos.count;i++){const x=pos.getX(i),z=pos.getZ(i),y=pos.getY(i),a=Math.atan2(z,x);pos.setY(i,y+(1-y/.79)*Math.sin(a*7)*.038)}geo.computeVertexNormals();
 root.add(new T.Mesh(geo,material));
 for(const sign of [-1,1]){ball(root,sign*.093,.49,.247,.035,.055,.018,P.ink);ball(root,sign*.15,.414,.232,.038,.019,.01,0xcca5b9);ball(root,sign*.091-.009,.51,.267,.009,.012,.004,P.cream)}
 const mouth=ball(root,0,.37,.277,.020,.028,.010,0x9a7e97);
 const smile=new T.Mesh(new T.TorusGeometry(.033,.004,4,16,Math.PI*.78),mat(0x9a7e97));smile.name='visitor-smile';smile.position.set(.015,.368,.284);smile.rotation.z=Math.PI*1.1;smile.visible=false;root.add(smile);
 const halo=new T.Sprite(new T.SpriteMaterial({map:softTexture(),color:0xb8b1f2,opacity:.16,transparent:true,depthWrite:false,blending:T.AdditiveBlending}));halo.scale.set(1.45,1.65,1);halo.position.y=.36;root.add(halo);
 const hit=new T.Mesh(new T.SphereGeometry(.58,8,6),new T.MeshBasicMaterial({visible:false}));hit.position.y=.35;hit.userData.ghost=true;root.add(hit);
 root.position.set(3.15,5.38,2.15);root.visible=false;
 let greetedAt=-Infinity,known=0;
 return {root,hit,update(t,night,reduced,discoveries=0){
  const count=Number.isFinite(discoveries)?Math.max(0,discoveries):0;if(count>known)greetedAt=t;known=count;const greeted=count>0;root.userData.greeted=greeted;smile.visible=greeted;mouth.visible=!greeted;
  halo.material.color.set(greeted?0xedd4b3:0xb8b1f2);root.visible=night;
  const nod=!reduced&&t-greetedAt<2?Math.sin(Math.max(0,t-greetedAt)/2*Math.PI)*.06:0;
  root.position.y=5.38+(reduced?0:Math.sin(t*1.25)*.10)-nod;root.rotation.z=reduced?0:Math.sin(t*.7)*.045;root.rotation.y=reduced?0:Math.sin(t*.45)*.14;
 }};
}
