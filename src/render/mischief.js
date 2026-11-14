import * as T from 'three';
import {ROOMS,MISCHIEF_ITEMS,MISCHIEF_SPOTS} from '../content.js';
import {missing,goneItem,quietDoll} from '../simulation.js';
import {softTexture} from './textiles.js';
import {buildItem,keepingPlaces,hatbox,footprints,bake,STANDS} from './mischief-art.js';

// The midnight visitor in the house (src/sim-mischief.js). Every borrowed thing lives at its keeping place;
// when one is missing, its place shows the thing's ghost, a soft lavender glow (the visitor's own colour,
// so it is never mistaken for the gold wish ring or the story glint) and small footprints walking away,
// and its owner keeps glancing at the empty place. Hiding places are invisible touch volumes; a wrong
// one breathes out dust (or a cold breath when the thing is in this room); the right one lifts the thing
// out and carries it home. Everything here is drawn from saved state, so a reload shows the same house.
const LAVENDER=0xa98bd6,PUFF=0x806a56,COLD=0xbfcaf0,GOLD=0xffd79a;
const roomAt=id=>ROOMS.find(r=>r.id===id);
const local=(room,[x,y,z])=>{const r=roomAt(room);return new T.Vector3(r.x+x,r.y+y,z)};
// Where each room's small footprints begin (room-local x, z): clear of furniture, walking toward the front.
const TRAILS={kitchen:[1.05,-.62],studio:[.74,-.30],bedroom:[.72,-.30]};
const ease=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;

function sprite(parent,color,opacity,additive=false){
 const s=new T.Sprite(new T.SpriteMaterial({map:softTexture(),color,transparent:true,opacity,depthWrite:false,
   blending:additive?T.AdditiveBlending:T.NormalBlending}));s.visible=false;parent.add(s);return s;
}
// The thing's ghost: the visitor's own pale, glowing porcelain (src/render/dolls.js createGhost), a little larger
// than life, lingering where the thing should be. Found, it melts into the real one; lost, it drifts up and away.
const GHOST=new T.MeshStandardMaterial({color:0xf4edf7,emissive:0x9d88c9,emissiveIntensity:.6,roughness:.55,
  transparent:true,opacity:.66,depthWrite:false});
function ghostOf(item){
 const g=item.clone(true);g.traverse(o=>{if(o.isMesh)o.material=GHOST});g.name='visitor-borrowed-ghost';return g;
}
// One keeping place's live parts: the thing, its ghost, a soft lavender glow and the footprints.
function place(root,def){
 const home=local(def.room,def.home),stand=STANDS.has(def.id),item=buildItem(def.id);
 item.scale.setScalar(1.3);item.position.copy(home);root.add(item);
 const ghost=ghostOf(item);ghost.scale.setScalar(2.1);root.add(ghost);
 const glow=sprite(root,LAVENDER,.8);glow.position.copy(home);glow.position.z+=stand?.06:-.03;
 glow.scale.setScalar(stand?1.2:1.5);
 // A small moonlit core over the ghost, so the place reads across the whole house by day and by night.
 const core=sprite(root,0xf3e8ff,.9,true);core.position.copy(glow.position);core.scale.setScalar(.42);
 const steps=footprints(root),floor=roomAt(def.room);
 const [tx,tz]=TRAILS[def.room];steps.position.set(floor.x+tx,floor.y+.128,tz);
 ghost.visible=false;steps.visible=false;return {def,home,item,ghost,glow,core,steps,goneAt:null};
}
function createPuffs(root){
 // Drawn over the furniture it leaves and in a darker sepia, so it reads on cream plaster and on the jars
 // (iOS QA: pale and depth-tested, it hid inside the nook). Hidden Folks answers every wrong tap visibly too.
 const pool=Array.from({length:7},()=>{const s=sprite(root,PUFF,0);
  s.material.depthTest=false;s.renderOrder=20;return s});let born=-1,at=new T.Vector3(),kind='dust';
 return {
  start(point,near,now){at=point.clone();born=now;kind=near?'cold':'dust';
   pool.forEach(s=>{s.material.color.setHex(near?COLD:PUFF);s.visible=true})},
  update(now,still){const t=born<0?1:(now-born)/1.05;
   pool.forEach((s,i)=>{if(t>=1){s.visible=false;return}const a=i/pool.length*Math.PI*2,spread=still?.08:.08+.28*t;
    s.position.set(at.x+Math.cos(a)*spread,at.y+Math.sin(a)*spread*.6+(kind==='cold'?.1*t:0),at.z+.12);
    s.scale.setScalar((still?.42:.32+.3*t)*(i%2?1:.8));s.material.opacity=(1-t)*(kind==='cold'?.9:.85)})},
  get kind(){return kind},get active(){return born>=0},
 };
}
function createTargets(root){
 const material=new T.MeshBasicMaterial({visible:false}),geometry=new T.BoxGeometry(1,1,1);
 return MISCHIEF_SPOTS.filter(p=>!p.prop).map(p=>{const m=new T.Mesh(geometry,material);m.name='nook:'+p.id;
  m.position.copy(local(p.room,p.at));m.scale.set(...p.size);m.userData={nook:p.id,room:p.room};root.add(m);return m});
}
const spotPoint=(id,props)=>{const p=MISCHIEF_SPOTS.find(s=>s.id===id);if(!p)return null;
 if(p.prop){const at=props?.(p.prop);return at?at.clone():local(p.room,[0,.9,-.4])}return local(p.room,p.at)};

export function createMischief(parent){
 const root=new T.Group();root.name='midnight-visitor';root.userData.noBatch=true;parent.add(root);
 const still=new T.Group();still.name='keeping-places';root.add(still);
 const add=room=>{const g=new T.Group();g.name='keeping-place-'+room;still.add(g);
  const r=roomAt(room);g.position.set(r.x,r.y,0);return g};
 keepingPlaces(add);hatbox(add);bake(still);
 const places=MISCHIEF_ITEMS.map(def=>place(root,def)),targets=createTargets(root),puffs=createPuffs(root);
 const glint=sprite(root,LAVENDER,.7,true),homeGlow=sprite(root,GOLD,0,true);
 let flight=null,clock=0,propPoint=null;
 function sign(p,state,now,still){
  const m=missing(state),taken=m?.item===p.def.id,gone=goneItem(state)===p.def.id,flying=flight?.place===p;
  if(gone&&p.goneAt===null)p.goneAt=now;if(!gone)p.goneAt=null;
  const leaving=gone&&!still&&now-p.goneAt<3.5,k=leaving?(now-p.goneAt)/3.5:0;
  p.item.visible=!(taken||gone)||flying;p.ghost.visible=(taken&&!flying)||leaving;
  p.glow.visible=taken&&!flying;p.steps.visible=p.core.visible=p.glow.visible;
  if(!flying&&!(taken||gone))p.item.position.copy(p.home);
  if(p.ghost.visible){const bob=still?0:Math.sin(now*1.3)*.025;p.ghost.position.copy(p.home);
   p.ghost.position.y+=bob+k*.9;p.ghost.rotation.z=still?0:Math.sin(now*.9)*.12;
   GHOST.opacity=leaving?.66*(1-k):.66}
  if(p.glow.visible){p.glow.material.opacity=still?.85:.72+.2*Math.sin(now*1.6);
   p.core.material.opacity=still?.8:.6+.3*Math.sin(now*1.6+.6)}
 }
 function fly(now,still){
  const f=flight;if(!f)return;const t=still?1:Math.min(1,(now-f.born)/1.7),item=f.place.item;
  if(t<.3){const k=ease(t/.3);item.position.copy(f.from).setY(f.from.y+.45*k);item.rotation.y=k*Math.PI*2}
  else{const k=ease((t-.3)/.7);item.position.lerpVectors(f.lift,f.place.home,k);
   item.position.y+=Math.sin(k*Math.PI)*.35;
   item.rotation.y=(1-k)*Math.PI*2}
  homeGlow.visible=true;homeGlow.position.copy(f.place.home);homeGlow.position.z+=.05;
  homeGlow.scale.setScalar(.5+.25*Math.sin(Math.min(1,t)*Math.PI));
  const age=now-f.born;homeGlow.material.opacity=age<1.4?.6*Math.min(1,age):.6*Math.max(0,1-(age-1.4)/1.4);
  if(t>=1){item.position.copy(f.place.home);item.rotation.y=0}
  if(now-f.born>2.8||still&&now-f.born>1.4){flight=null;homeGlow.visible=false}
 }
 return {root,targets,
  setPropPoint(fn){propPoint=fn},
  // The world point of a keeping place, a hiding place, or (for the caption) nothing.
  point(kind,id){if(kind==='home'){const p=places.find(x=>x.def.id===id);return p?p.home.clone():null}
   return spotPoint(id,propPoint)},
  found(itemId,spotId){const p=places.find(x=>x.def.id===itemId);if(!p)return;
   const from=spotPoint(spotId,propPoint)??p.home;flight={place:p,from,lift:from.clone().setY(from.y+.45),born:clock}},
  // The breath leaves the place's open front: from its centre it hid inside the furniture and never showed.
  puff(spotId,near){const at=spotPoint(spotId,propPoint),size=MISCHIEF_SPOTS.find(p=>p.id===spotId)?.size;
   if(!at)return;if(size)at.z+=size[2]/2;puffs.start(at,near,clock)},
  get flying(){return Boolean(flight)},get puffing(){return puffs.active},
  update(state,dt,{residents,hidden=false}={}){
   const still=state.settings.reducedMotion;if(!state.paused)clock+=Math.min(dt,.1);
   root.visible=!hidden;const now=clock;
   for(const p of places)sign(p,state,now,still);fly(now,still);puffs.update(now,still);
   const m=missing(state),at=m?.glint?spotPoint(m.spot,propPoint):null;glint.visible=Boolean(at)&&!hidden;
   if(at){glint.position.copy(at);glint.position.y+=.32;glint.scale.setScalar(.22);
    glint.material.opacity=still?.65:.45+.25*Math.sin(now*2.2)}
   if(residents)lookFor(residents,state,m,places,now,still,dt);
  },
 };
}
// The owner keeps glancing at the empty place; a doll whose thing was not found in time bows her head.
// She also walks over and stands beside it, which reads from across the whole house.
function lookFor(residents,state,m,places,now,still,dt){
 for(const v of residents.dolls){const d=state.dolls.find(x=>x.id===v.id),seeking=m?.doll===v.id&&v.room===m.home;
  if(!seeking)v.seekX=undefined;if(!d||d.action!=='idle')continue;
  if(seeking){const home=places.find(p=>p.def.id===m.item).home,centre=roomAt(m.home).x,
    goal=home.x+(home.x>centre?-.42:.42);
   v.seekX=still||v.seekX===undefined&&state.paused?goal:T.MathUtils.damp(v.seekX??v.root.position.x,goal,1.1,dt);
   v.root.position.x=v.seekX;const side=Math.sign(home.x-v.root.position.x)||1;
   v.head.rotation.y=side*.42+(still?0:Math.sin(now*.8)*.18);v.head.rotation.x=STANDS.has(m.item)?.12:-.10}
  else if(quietDoll(state,v.id)){v.head.rotation.x=.24;v.head.rotation.z=.07}
 }
}
