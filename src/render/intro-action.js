import {poseTea} from './film-action.js';
// The opening has its own presentation clock. Restore every touched transform on exit,
// including a paused exit, without changing canonical care actions or simulation time.
export function introAction(residents){
 const doll=residents.dolls.find(d=>d.id==='lina'),base=doll.body.position.clone(),teaPhase=doll.teaPhase,saved=[];
 doll.root.traverse(node=>saved.push({node,position:node.position.clone(),quaternion:node.quaternion.clone(),
  scale:node.scale.clone(),visible:node.visible,opacity:node.material?.opacity}));
 return {
  update(seconds,still){poseTea(doll,base,8+Math.max(0,seconds-8)*1.75,still);},
  restore(){doll.teaPhase=teaPhase;for(const entry of saved){
   const {node,position,quaternion,scale,visible,opacity}=entry;
   node.position.copy(position);node.quaternion.copy(quaternion);node.scale.copy(scale);node.visible=visible;
   if(opacity!==undefined)node.material.opacity=opacity;}},
 };
}
