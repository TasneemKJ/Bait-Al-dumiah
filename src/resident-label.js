import {translate} from './i18n.js';

// Paper the player reads or drags. A resident's name tag never sits on top of it: on a phone the carried
// item and its note share the lower playfield with the residents, and a tag over the drag handle hides it.
const PAPER='.held-item,.scene-response,.object-ribbon,.objective';
const overlaps=(a,b)=>a.left<b.right&&b.left<a.right&&a.top<b.bottom&&b.top<a.bottom;

export function createResidentLabel(host){
 const node=document.createElement('span');node.className='resident-name';
 node.setAttribute('aria-hidden','true');node.style.pointerEvents='none';node.hidden=true;host.append(node);
 const coversPaper=()=>{const tag=node.getBoundingClientRect();
  return [...host.querySelectorAll(PAPER)].some(p=>p.getClientRects().length&&overlaps(tag,p.getBoundingClientRect()))};
 return {node,update(state,selected,focusedRoom,point,blocked){
  if(!node.isConnected)host.append(node);
  const resident=state.dolls.find(d=>d.id===selected);
  node.hidden=Boolean(blocked||!resident||resident.room!==focusedRoom||!point||
    !Number.isFinite(point.x)||!Number.isFinite(point.y)||point.x<75||
    point.x>innerWidth-75||point.y<190||point.y>innerHeight-190);
  if(node.hidden)return;
  const locale=state.settings.locale,label=translate(locale,selected);
  if(node.textContent!==label)node.textContent=label;
  node.dir=locale==='ar'?'rtl':'ltr';node.style.left=point.x+'px';node.style.top=(point.y+15)+'px';
  node.hidden=coversPaper();
 },dispose(){node.remove()}};
}
