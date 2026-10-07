import * as T from 'three';
import {ROOMS,SLOTS,CATALOG} from '../content.js';
import {makeFurniture} from './house.js';

// Never charge for a preview. Hidden originals own shared geometry and maps;
// only cloned tint materials are discarded when the preview is replaced.
export function createPlacementPreview(parent){
 const root=new T.Group(),library=new T.Group(),prototypes=new Map();
 root.name='decoration-preview';library.name='preview-art-library';root.visible=library.visible=false;parent.add(root,library);
 let shown=null;
 function clear(){const materials=new Set();
 root.traverse(o=>{if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m)});root.clear();materials.forEach(m=>m.dispose());shown=null;root.visible=false}
 return {root,update(pose,state){
  const entry=CATALOG.find(c=>c.id===pose?.item),room=ROOMS.find(r=>r.id===pose?.room),slot=Number.isInteger(pose?.slot)?SLOTS[pose.slot]:null;
  if(!entry||!room||!slot){if(shown)clear();return}
  if(shown!==entry.id){
   clear();if(!prototypes.has(entry.id)){const original=makeFurniture(entry.id);prototypes.set(entry.id,original);library.add(original)}
   const copy=prototypes.get(entry.id).clone(true),materials=new Map();
   copy.traverse(o=>{if(!o.material)return;const tint=m=>{if(!materials.has(m)){const c=m.clone();c.transparent=true;c.opacity=.44;c.depthWrite=false;
   materials.set(m,c)}return materials.get(m)};o.material=Array.isArray(o.material)?o.material.map(tint):tint(o.material);o.castShadow=o.receiveShadow=false});
   for(const child of [...copy.children])root.add(child);shown=entry.id;
  }
  const moving=state.decor.find(d=>d.id===pose.moveId);
  const valid=(moving?.item===entry.id||state.buttons>=entry.price)&&!state.decor.some(d=>d.id!==pose.moveId&&d.room===room.id&&d.slot===pose.slot);
  root.rotation.y=(moving?.rotation??0)*Math.PI/2;root.position.set(room.x+slot.x,room.y+.14,slot.z);root.visible=true;root.userData.valid=valid;
  root.traverse(o=>{if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])m.color?.set(valid?0xb9d5b0:0xd28b8b)});
 },clear};
}
