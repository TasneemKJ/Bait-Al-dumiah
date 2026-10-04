import {STORY_ITEMS,INTERACTIVE_PROPS} from './content.js';
import {storyStatus} from './simulation.js';
import {objectInfo,sceneObjectAction} from './object-ui.js';
import {translate,number} from './i18n.js';
import {icon} from './icons.js';
import {createCarryGesture} from './carry-gesture.js';

export function storyObjective(s,t){
 const status=storyStatus(s);if(status.finished)return null;
 const prop=INTERACTIVE_PROPS.find(p=>p.id===status.next.object);
 return {copy:t(`story-${status.chapter.id}-${status.step}-clue`),label:t('storyFindRoom').replace('{room}',t(prop.room+'Short')),ico:status.chapter.icon,action:'story-hint',value:prop.room};
}
export function storyMemoriesMarkup(s,t){
 const status=storyStatus(s);if(!status.completed.length)return '';
 return `<section class="story-memories"><h3 class="section-heading">${t('storyMemories')}</h3>${status.completed.map(id=>`<article><span aria-hidden="true">✦</span><div><h4>${t('story-'+id+'-title')}</h4><p>${t('story-'+id+'-memory')}</p></div></article>`).join('')}</section>`;
}

// A held item and a small scene ribbon. Neither pauses nor obscures the room.
// Physical input uses the same simulation command as keyboard activation.
export function createStoryUI(host,getState,dispatch){
 const root=document.createElement('section');root.className='story-playfield';
 const ghost=document.createElement('div');ghost.className='carry-ghost';ghost.hidden=true;ghost.setAttribute('aria-hidden','true');
 const gesture=createCarryGesture();let selected=null,signature='',feedback=null,previousFocus=null,dragPointer=null,dragToken=null,skipClick=false;
 const t=key=>translate(getState().settings.locale,key);
 const current=()=>objectInfo(getState(),selected);
 function cancelDrag(){
  gesture.cancel();ghost.hidden=true;root.classList.remove('carrying');
  const token=dragToken,pointer=dragPointer;dragPointer=null;dragToken=null;
  if(token&&pointer!==null){try{token.releasePointerCapture(pointer)}catch{}}
  if(pointer!==null)dispatch('carry-end');
 }
 function update(){
  if(!root.isConnected)host.append(root);if(!ghost.isConnected)host.append(ghost);
  const s=getState(),status=storyStatus(s),hidden=Boolean(host.querySelector('dialog[open],.error-screen'))||s.paused||['tea','stitch'].includes(s.activities.active?.id)||host.querySelector('.placement')?.hidden===false;
  root.hidden=hidden;if(hidden)cancelDrag();
  if(selected&&!current())selected=null;
  host.dataset.objectSelected=selected??'';
  const action=sceneObjectAction(s,selected),object=current(),held=STORY_ITEMS.find(i=>i.id===status.held);
  const next=JSON.stringify([s.settings.locale,selected,status.index,status.step,held?.id,action?.disabled,object?.active,object?.rotation,object?.tendedDay,feedback]);
  if(signature===next)return;
  // A state change cannot leave a stale item image being dragged after use/reset.
  if(dragPointer!==null)cancelDrag();
  const focused=root.contains(document.activeElement)?document.activeElement.dataset.sceneAction:null;
  signature=next;
  const label=action?t(action.label).replace('{item}',t('held-'+action.item)):'';
  const response=feedback?`<p class="scene-response ${feedback.complete?'chapter-finished':''}" role="status">${feedback.complete?icon('check'):''}<span>${t(feedback.message)}</span>${feedback.reward?`<small>+${number(s.settings.locale,feedback.reward)} ${icon('button')}</small>`:''}</p>`:'';
  root.innerHTML=`${held?`<button type="button" class="held-item" data-scene-action="held" data-held-item="${held.id}" aria-label="${t('held-'+held.id)}. ${t('storyDragHint')}" title="${t('storyDragHint')}"><span class="held-art">${icon(held.icon)}</span><span><small>${t('storyInHand')}</small><strong>${t('held-'+held.id)}</strong><em>${t('storyDragShort')}</em></span></button>`:''}
   ${object?`<div class="object-ribbon" aria-label="${t('selectedObject')}"><span class="ribbon-emblem" aria-hidden="true">${icon(object.icon)}</span><div class="ribbon-copy"><small>${t(object.room+'Short')}</small><h2>${t(object.title)}</h2><p>${t('storyTouchAgain').replace('{action}',label)}</p></div><button type="button" class="scene-primary" data-scene-action="activate" ${action?.disabled?'disabled':''}>${icon(action?.icon??'spark')}<span>${label}</span></button><button type="button" class="icon-button scene-inspect" data-scene-action="inspect" aria-label="${t('storyInspect')}">${icon('plus')}</button><button type="button" class="icon-button" data-scene-action="close" aria-label="${t('close')}">${icon('close')}</button></div>`:''}
   ${response}`;
  if(focused)root.querySelector(`[data-scene-action="${focused}"]`)?.focus({preventScroll:true});
 }
 root.addEventListener('click',e=>{
  const button=e.target.closest('[data-scene-action]');if(!button||button.disabled)return;
  e.stopPropagation();
  if(button.dataset.sceneAction==='held'){if(skipClick){skipClick=false;return}dispatch('story-hint');return}
  if(button.dataset.sceneAction==='activate')dispatch('activate-object',selected);
  if(button.dataset.sceneAction==='inspect')dispatch('inspect-object',selected);
  if(button.dataset.sceneAction==='close')dispatch('deselect-object');
 });
 root.addEventListener('pointerdown',e=>{
  const token=e.target.closest('.held-item');if(!token||root.hidden||!gesture.down(e))return;
  dragPointer=e.pointerId;dragToken=token;token.setPointerCapture(e.pointerId);skipClick=false;dispatch('carry-start');
  ghost.innerHTML=token.querySelector('.held-art').innerHTML;e.stopPropagation();
 });
 root.addEventListener('pointermove',e=>{
  if(!gesture.move(e))return;ghost.hidden=false;root.classList.add('carrying');
  ghost.style.left=e.clientX+'px';ghost.style.top=e.clientY+'px';e.preventDefault();
 });
 root.addEventListener('pointerup',e=>{
  if(e.pointerId!==dragPointer)return;
  const point=gesture.up(e);skipClick=Boolean(point);cancelDrag();
  if(point){e.preventDefault();dispatch('drop-story-item',point)}
 });
 root.addEventListener('pointercancel',cancelDrag);
 root.addEventListener('lostpointercapture',e=>{if(e.pointerId===dragPointer)cancelDrag()});
 update();
 return {
  get selected(){return selected},
  select(key){if(!objectInfo(getState(),key))return false;if(key!==selected)previousFocus=document.activeElement;selected=key;feedback=null;update();if(previousFocus?.matches('[data-object]'))root.querySelector('[data-scene-action="activate"]')?.focus({preventScroll:true});return true},
  clear(restoreFocus=false){cancelDrag();selected=null;feedback=null;update();if(restoreFocus){const origin=previousFocus?.matches('[data-object]')?host.querySelector('[data-object-toggle]'):previousFocus;if(origin?.isConnected&&origin.getClientRects().length)origin.focus({preventScroll:true});else document.querySelector('#world')?.focus({preventScroll:true})}},
  respond(message,complete=false,reward=0){feedback={message,complete,reward};update()},
  update,cancelDrag,
  dispose(){cancelDrag();root.remove();ghost.remove()},
 };
}
