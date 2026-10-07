import * as T from 'three';
import {INTERACTIVE_PROPS,ROOMS,SLOTS} from '../content.js';
import {storyStatus} from '../simulation.js';
import {softTexture} from './textiles.js';

// Simple invisible authored volumes survive static art batching; they never
// intercept input outside the canvas and never change the simulation.
export function createObjectInteractions(parent){
 const root=new T.Group();root.name='object-interactions';parent.add(root);
 const targets=new Map(),material=new T.MeshBasicMaterial({visible:false}),geometry=new T.BoxGeometry(1,1,1);
 const frame=new T.Group();frame.box=new T.Box3();frame.name='selected-object-frame';
 frame.visible=false;parent.add(frame);
 const medallion=new T.Mesh(new T.RingGeometry(.44,.48,48),
   new T.MeshBasicMaterial({color:0xe9c18b,transparent:true,opacity:.88,side:T.DoubleSide,
   depthWrite:false}));medallion.rotation.x=-Math.PI/2;frame.add(medallion);
 const glow=new T.Sprite(new T.SpriteMaterial({map:softTexture(),color:0xffdc9c,
   transparent:true,opacity:.65,depthWrite:false}));
 glow.name='object-clue-glint';glow.scale.set(.19,.19,1);parent.add(glow);
 let selected=null;
 function add(key,room,position,size){
  const r=ROOMS.find(r=>r.id===room);let target=targets.get(key);
  if(!target){target=new T.Mesh(geometry,material);target.name=key;
  target.userData.object=key;root.add(target);targets.set(key,target)}
  target.position.set(r.x+position[0],r.y+position[1],position[2]);
  target.scale.set(...size);target.userData.room=room;return target;
 }
 for(const p of INTERACTIVE_PROPS)add('prop:'+p.id,p.room,p.position,p.size);
 function clear(){selected=null;frame.visible=false}
 return {root,frame,get targets(){return [...targets.values()]},get selected(){return selected},clear,
  select(key){if(!targets.has(key))return false;selected=key;return true},
  update(state,hideGuides=false){
   const live=new Set(INTERACTIVE_PROPS.map(p=>'prop:'+p.id));
   for(const d of state.decor){const slot=SLOTS[d.slot],
     height=d.item==='rug'?.08:d.item==='mobile'?1.2:d.item==='lamp'?1.3:.85;
   live.add('decor:'+d.id);add('decor:'+d.id,d.room,[slot.x,.13+height/2,slot.z],[.9,height,.9])}
   for(const [key,target] of targets)if(!live.has(key)){target.removeFromParent();targets.delete(key)}
   if(selected&&!targets.has(selected))clear();
   if(selected){const t=targets.get(selected),half=t.scale.clone().multiplyScalar(.5);
   frame.box.min.copy(t.position).sub(half);
   frame.box.max.copy(t.position).add(half);frame.position.set(t.position.x,t.position.y-half.y+.012,t.position.z);
   medallion.scale.set(Math.max(.5,t.scale.x+.12),Math.max(.5,t.scale.z+.12),1);
   frame.visible=true;frame.updateMatrixWorld(true)}
   if(hideGuides)frame.visible=false;
   const next=storyStatus(state).next,target=next&&targets.get('prop:'+next.object);
   glow.visible=Boolean(target)&&!state.paused&&!hideGuides;
   if(target){glow.position.copy(target.position);glow.position.y+=target.scale.y/2+.13;
   glow.material.opacity=state.settings.reducedMotion?.65:.55+.14*Math.sin(state.elapsed*1.8)}
  },
  project(camera,width,height){root.updateWorldMatrix(true,true);
  return [...targets].map(([key,
    target])=>{const p=target.getWorldPosition(new T.Vector3()).project(camera);
  return {key,room:target.userData.room,x:(p.x+1)*width/2,y:(1-p.y)*height/2}})}
 };
}
