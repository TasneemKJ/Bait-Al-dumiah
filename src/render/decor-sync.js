import * as T from 'three';
import {ROOMS,SLOTS} from '../content.js';
import {makeFurniture} from './house.js';
import {poolOpacity} from './lamp-pool.js';

// Slot markers shown while placing or moving a keepsake: a visible ring and an
// invisible larger disk that takes the touch.
export function createSlotMarkers(root){
 const targets=[];
 const group=new T.Group();root.add(group);
 for(const room of ROOMS)for(let i=0;i<SLOTS.length;i++){
  const slot=SLOTS[i],material=new T.MeshBasicMaterial({color:0xd2a972,side:T.DoubleSide,transparent:true,opacity:.85,depthWrite:false});
  const mesh=new T.Mesh(new T.RingGeometry(.21,.25,24),material);mesh.rotation.x=-Math.PI/2;mesh.position.set(room.x+slot.x,room.y+.14,slot.z);mesh.userData.slot={room:room.id,slot:i};
  const disk=new T.Mesh(new T.CircleGeometry(.42,20),new T.MeshBasicMaterial({visible:false}));disk.rotation.x=-Math.PI/2;disk.position.copy(mesh.position);disk.userData.slot={room:room.id,slot:i};group.add(mesh,disk);targets.push(disk);
 }
 group.visible=false;
 const free=(state,hiddenId)=>o=>{o.visible=!state.decor.some(d=>d.id!==hiddenId&&d.room===o.userData.slot.room&&d.slot===o.userData.slot.slot)};
 return {
  targets,
  setActive(on){group.visible=Boolean(on)},
  // Only empty slots stay offered; the keepsake being moved frees its own slot.
  refresh(state,hiddenId){targets.forEach(free(state,hiddenId));group.children.forEach(free(state,hiddenId))},
 };
}

// Mirrors state.decor as furniture meshes: adds new pieces, animates used ones, disposes removed ones.
export function createDecorSync(root){
 const decor=new Map();
 return {
  items:decor,
  add(state){
   for(const d of state.decor)if(!decor.has(d.id)){const obj=makeFurniture(d.item),room=ROOMS.find(r=>r.id===d.room),slot=SLOTS[d.slot];obj.position.set(room.x+slot.x,room.y+.13,slot.z);if(d.item==='lamp'){const light=new T.PointLight(0xffc07a,0,3.4,2);light.name='owned-keepsake-light';light.position.set(0,1.05,0);light.castShadow=false;obj.add(light);obj.userData.ownedLight=light}root.add(obj);decor.set(d.id,obj)}
  },
  place(state,{reducedMotion,nightMix,hiddenId}){
   for(const d of state.decor){const obj=decor.get(d.id),room=ROOMS.find(r=>r.id===d.room),slot=SLOTS[d.slot],recent=state.elapsed-(d.lastUse??-10)<5,phase=Math.max(0,state.elapsed-(d.lastUse??-10));obj.position.set(room.x+slot.x,room.y+.13,slot.z);obj.scale.setScalar(d.item==='plant'&&d.tendedDay===state.day?1.08:1);obj.rotation.y=(d.rotation??0)*Math.PI/2+(d.item==='musicbox'&&recent?(reducedMotion ? .14 : phase*2.4):0);obj.rotation.z=d.item==='mobile'&&recent?(reducedMotion ? .06 : Math.sin(phase*5)*.12):0;if(obj.userData.ownedLight){obj.userData.ownedLight.intensity=d.active?(.25+nightMix*2.15):0;if(obj.userData.pool)obj.userData.pool.material.opacity=poolOpacity(d.active?.2+nightMix*.8:0)}obj.visible=d.id!==hiddenId}
  },
  prune(state){
   for(const [id,obj] of decor)if(!state.decor.some(d=>d.id===id)){obj.removeFromParent();obj.traverse(o=>{if(o.material?.map&&!o.material.userData.shared){o.material.map.dispose();o.material.dispose();o.geometry?.dispose()}});decor.delete(id)}
  },
 };
}
