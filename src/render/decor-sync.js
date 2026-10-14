import * as T from 'three';
import {ROOMS,SLOTS} from '../content.js';
import {slotTaken} from '../simulation.js';
import {makeFurniture} from './house.js';
import {poolOpacity} from './lamp-pool.js';
import {softTexture} from './textiles.js';

// A keepsake landing in its slot: it drops in, squashes, overshoots a little and settles within .7 s,
// with a soft puff of dust. Reduced motion places it still. Pure, for tests.
export const POP_SECONDS=.7;
export function landingPop(age,still){
 if(still||!Number.isFinite(age)||age<0||age>=POP_SECONDS)return {drop:0,squash:1,dust:0};
 if(age<.16){const k=age/.16;return {drop:.28*(1-k*k),squash:1+.06*k,dust:0}}
 const k=(age-.16)/(POP_SECONDS-.16),wobble=Math.cos(k*Math.PI*2.5)*(1-k);
 return {drop:0,squash:1-.16*wobble,dust:Math.max(0,1-k)*(k<.08?k/.08:1)};
}

// Slot markers shown while placing or moving a keepsake: a visible ring and an
// invisible larger disk that takes the touch.
export function createSlotMarkers(root){
 const targets=[];
 const group=new T.Group();root.add(group);
 for(const room of ROOMS)for(let i=0;i<SLOTS.length;i++){
  const slot=SLOTS[i],material=new T.MeshBasicMaterial({color:0xd2a972,side:T.DoubleSide,
    transparent:true,opacity:.85,depthWrite:false});
  const mesh=new T.Mesh(new T.RingGeometry(.21,.25,24),material);mesh.rotation.x=-Math.PI/2;
  mesh.position.set(room.x+slot.x,room.y+.14,slot.z);mesh.userData.slot={room:room.id,slot:i};
  const disk=new T.Mesh(new T.CircleGeometry(.42,20),
    new T.MeshBasicMaterial({visible:false}));disk.rotation.x=-Math.PI/2;
  disk.position.copy(mesh.position);disk.userData.slot={room:room.id,slot:i};group.add(mesh,disk);targets.push(disk);
 }
 group.visible=false;
 const free=(state,hiddenId)=>o=>{o.visible=!slotTaken(state,o.userData.slot.room,o.userData.slot.slot,hiddenId)};
 return {
  targets,
  setActive(on){group.visible=Boolean(on)},
  // Only empty slots stay offered; the keepsake being moved frees its own slot.
  refresh(state,hiddenId){targets.forEach(free(state,hiddenId));group.children.forEach(free(state,hiddenId))},
 };
}

// Mirrors state.decor as furniture meshes: adds new pieces, animates used ones, disposes removed ones.
export function createDecorSync(root){
 const decor=new Map();let synced=false;
 const dust=new T.Sprite(new T.SpriteMaterial({map:softTexture(),color:0xe9dcc8,transparent:true,opacity:0,
   depthWrite:false}));dust.name='placement-dust';dust.visible=false;root.add(dust);let dustOwner=null;
 // A keepsake that arrives (or moves) after the first sync lands with a pop; saved ones simply stand there.
 const land=(obj,d,state)=>{obj.userData.landedAt=state.elapsed;obj.userData.spot=d.room+':'+d.slot;dustOwner=obj};
 return {
  items:decor,dust,
  add(state){
   for(const d of state.decor)if(!decor.has(d.id)){const obj=makeFurniture(d.item),
     room=ROOMS.find(r=>r.id===d.room),slot=SLOTS[d.slot];
   obj.position.set(room.x+slot.x,room.y+.13,slot.z);if(d.item==='lamp'){const light=new T.PointLight(0xffc07a,0,3.4,2);
   light.name='owned-keepsake-light';light.position.set(0,1.05,0);light.castShadow=false;obj.add(light);
   obj.userData.ownedLight=light}root.add(obj);decor.set(d.id,obj);obj.userData.spot=d.room+':'+d.slot;
   if(synced)land(obj,d,state)}
   synced=true;
  },
  place(state,{reducedMotion,nightMix,hiddenId}){
   for(const d of state.decor){const obj=decor.get(d.id),
     room=ROOMS.find(r=>r.id===d.room),slot=SLOTS[d.slot],recent=state.elapsed-(d.lastUse??-10)<5,
     phase=Math.max(0,state.elapsed-(d.lastUse??-10));obj.position.set(room.x+slot.x,room.y+.13,slot.z);
   if(obj.userData.spot!==d.room+':'+d.slot)land(obj,d,state);
   const pop=landingPop(state.elapsed-(obj.userData.landedAt??-9),reducedMotion||state.paused),
     base=d.item==='plant'&&d.tendedDay===state.day?1.08:1;
   obj.scale.set(base*(2-pop.squash),base*pop.squash,base*(2-pop.squash));obj.position.y+=pop.drop;
   if(obj===dustOwner){dust.visible=pop.dust>0;dust.material.opacity=.55*pop.dust;
    dust.scale.setScalar(.35+.5*(1-pop.dust));dust.position.set(obj.position.x,room.y+.22,obj.position.z+.05)}
   obj.rotation.y=(d.rotation??0)*Math.PI/2+(d.item==='musicbox'&&recent?(reducedMotion ? .14 : phase*2.4):0);
   obj.rotation.z=d.item==='mobile'&&recent?(reducedMotion ? .06 : Math.sin(phase*5)*.12):0;
   if(obj.userData.ownedLight){obj.userData.ownedLight.intensity=d.active?(.25+nightMix*2.15):0;
   if(obj.userData.pool)obj.userData.pool.material.opacity=poolOpacity(d.active?.2+nightMix*.8:0)}
   obj.visible=d.id!==hiddenId}
  },
  prune(state){
   for(const [id,obj] of decor)if(!state.decor.some(d=>d.id===id)){obj.removeFromParent();
   obj.traverse(o=>{if(o.material?.map&&!o.material.userData.shared){o.material.map.dispose();
   o.material.dispose();o.geometry?.dispose()}});decor.delete(id)}
  },
 };
}
