import * as T from 'three';
import {INTERACTIVE_PROPS,ROOMS,SLOTS} from '../content.js';
import {storyStatus} from '../simulation.js';
import {softTexture} from './textiles.js';

// Simple invisible authored volumes survive static art batching; they never
// intercept input outside the canvas and never change the simulation.
function makeRing(inner,outer,color,opacity,parent,name){
 const m=new T.Mesh(new T.RingGeometry(inner,outer,36),new T.MeshBasicMaterial({color,transparent:true,
   opacity,side:T.DoubleSide,depthWrite:false}));
 m.rotation.x=-Math.PI/2;if(name)m.name=name;parent.add(m);return m;
}
export function createObjectInteractions(parent){
 const root=new T.Group();root.name='object-interactions';parent.add(root);
 const targets=new Map(),material=new T.MeshBasicMaterial({visible:false}),geometry=new T.BoxGeometry(1,1,1);
 const frame=new T.Group();frame.box=new T.Box3();frame.name='selected-object-frame';
 frame.visible=false;parent.add(frame);
 const medallion=makeRing(.44,.48,0xe9c18b,.88,frame);
 const glow=new T.Sprite(new T.SpriteMaterial({map:softTexture(),color:0xffe494,
   transparent:true,opacity:.8,depthWrite:false}));
 glow.name='object-clue-glint';glow.scale.set(.48,.48,1);parent.add(glow);
 const nextRing=makeRing(.34,.41,0xf3b85e,.75,parent,'object-clue-ring');nextRing.visible=false;
 const burst=makeRing(.22,.31,0xffe494,0,parent,'object-select-burst');burst.visible=false;
 let selected=null,burstAt=0,lastElapsed=0;
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
  select(key){if(!targets.has(key))return false;selected=key;burstAt=lastElapsed;
  const t=targets.get(key);burst.position.set(t.position.x,t.position.y-t.scale.y/2+.025,t.position.z);return true},
  update(state,hideGuides=false){
   lastElapsed=state.elapsed||0;
   const live=new Set(INTERACTIVE_PROPS.map(p=>'prop:'+p.id));
   for(const d of state.decor){const slot=SLOTS[d.slot],
     height=d.item==='rug'?.08:d.item==='mobile'?1.2:d.item==='lamp'?1.3:.85;
   live.add('decor:'+d.id);add('decor:'+d.id,d.room,[slot.x,.13+height/2,slot.z],[.9,height,.9])}
   for(const [key,target] of targets)if(!live.has(key)){target.removeFromParent();targets.delete(key)}
   if(selected&&!targets.has(selected))clear();
   if(selected){const t=targets.get(selected),half=t.scale.clone().multiplyScalar(.5),
     pulse=state.settings.reducedMotion?1:1+.04*Math.sin(lastElapsed*3.2);
   frame.box.min.copy(t.position).sub(half);
   frame.box.max.copy(t.position).add(half);frame.position.set(t.position.x,t.position.y-half.y+.012,t.position.z);
   medallion.scale.set(Math.max(.5,t.scale.x+.12)*pulse,Math.max(.5,t.scale.z+.12)*pulse,1);
   frame.visible=true;frame.updateMatrixWorld(true)}
   if(hideGuides)frame.visible=false;
   const age=lastElapsed-burstAt;
   const showBurst=burstAt>0&&age>=0&&age<.55&&!state.settings.reducedMotion&&!hideGuides;
   burst.visible=showBurst;
   if(showBurst){const p=age/.55;burst.scale.setScalar(.8+p*1.6);burst.material.opacity=.72*(1-p)}
   const next=storyStatus(state).next,target=next&&targets.get('prop:'+next.object);
   const showCue=Boolean(target)&&!state.paused&&!hideGuides;
   glow.visible=showCue;nextRing.visible=showCue&&selected!==('prop:'+next?.object);
   if(target){const wave=state.settings.reducedMotion?1:.5+.5*Math.sin(state.elapsed*2.4);
   glow.position.copy(target.position);glow.position.y+=target.scale.y/2+.18+wave*.06;
   glow.scale.setScalar(.44+.12*wave);glow.material.opacity=.62+.26*wave;
   nextRing.position.set(target.position.x,target.position.y-target.scale.y/2+.02,target.position.z);
   nextRing.scale.setScalar(Math.max(.55,target.scale.x+.14+wave*.1));
   nextRing.material.opacity=.42+.32*wave}
  },
  project(camera,width,height){root.updateWorldMatrix(true,true);
  return [...targets].map(([key,
    target])=>{const p=target.getWorldPosition(new T.Vector3()).project(camera);
  return {key,room:target.userData.room,x:(p.x+1)*width/2,y:(1-p.y)*height/2}})}
 };
}
