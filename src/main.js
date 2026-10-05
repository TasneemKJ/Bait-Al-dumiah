import {objectInfo,sceneObjectAction} from './object-ui.js';
import {createStoryUI} from './story-ui.js';
import {createTeaUI} from './tea-ui.js';
import {createStitchUI} from './stitch-ui.js';
import {createChimeUI} from './chime-ui.js';
import {createObjectControls} from './render/object-controls.js';
import {bindPlacementEscape} from './placement-keys.js';
import {DOLLS,SAVE_KEY,ACTIVITIES} from './content.js';
import * as sim from './simulation.js';
import {createWorld} from './render/world.js';
import {createUI} from './ui.js';
import {createResidentLabel} from './render/resident-label.js';
import {createRoomViews} from './render/room-views.js';
import {DollhouseAudio} from './audio.js';

let stored=null;try{stored=localStorage.getItem(SAVE_KEY)}catch{}
let state=stored?sim.restore(stored):sim.createState();
if(!stored)state.settings.reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
// A saved unmute preference never overrides a fresh page's audio gesture boundary.
state.settings.muted=true;
let world=null,ui=null,manualPause=false,panelOpen=false,fatal=false,saveWarning=false,objectControls=null,storyUI=null,teaUI=null,stitchUI=null,chimeUI=null,lastChimeTone=null,carrying=false;
const audio=new DollhouseAudio(),canvas=document.querySelector('#world'),host=document.querySelector('#ui');
const ACTIVITY_ROOM=Object.fromEntries(ACTIVITIES.map(a=>[a.id,a.room]));
const physicalActivity=()=>['tea','stitch','lullaby'].includes(state.activities.active?.id)?state.activities.active.id:null;
function cancelWorkInput(){teaUI?.cancel();stitchUI?.cancel();chimeUI?.cancel()}
// Inactive adapters restore their canvas attributes before the active owner
// updates them. A rapid tea/sewing transition must keep the correct shortcuts.
function updateWorkUI(dt=0){
 const active=physicalActivity(),adapters={tea:teaUI,stitch:stitchUI,lullaby:chimeUI};
 for(const [id,adapter] of Object.entries(adapters))if(id!==active)adapter?.update(0);
 if(active)adapters[active]?.update(dt);
 const chime=sim.chimeStatus(state);
 if(chime?.tone&&chime.tone!==lastChimeTone)audio.chime(chime.sounding);
 lastChimeTone=chime?.tone??null;
}
// Reattach scene controls synchronously; a slow graphics frame must not hide the UI.
function refreshUI(){ui.refresh();roomViews.update();objectControls?.update();storyUI?.update();updateWorkUI()}
function syncPause(){state.paused=manualPause||Boolean(panelOpen&&panelOpen!=='activities')||document.hidden||fatal;if(state.paused)cancelWorkInput();audio.setPaused(state.paused)}
function enterWork(id){
 if(!['tea','stitch','lullaby'].includes(id))return;
 if(id==='lullaby')audio.stopVoices();
 if(ui.panel)ui.close();ui.collapseTools();storyUI?.clear();objectControls?.collapse();world?.clearObjectSelection();
 host.dataset.focusRoom=ACTIVITY_ROOM[id];host.dataset.focusDoll='';
 world?.setTeaActive(id==='tea');world?.setStitchActive(id==='stitch');world?.setChimeActive(id==='lullaby');world?.setEnabled(!state.paused);
 updateWorkUI();roomViews.update();objectControls?.update();canvas.focus({preventScroll:true});save();
}
function leaveWork(){
 const id=physicalActivity();if(!id)return;
 const storyResult=state.activities.active?.result?.storyResult;
 cancelWorkInput();sim.endActivity(state);world?.setTeaActive(false);world?.setStitchActive(false);world?.setChimeActive(false);
 world?.setEnabled(!panelOpen&&!manualPause&&!fatal);updateWorkUI();
 host.dataset.focusRoom=ACTIVITY_ROOM[id];host.dataset.focusDoll='';storyUI?.clear();if(storyResult)storyUI?.respond(storyResult.message);
 roomViews.update();objectControls?.update();ui.tick();canvas.focus({preventScroll:true});save();
}
function save(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(state));return true}catch{if(!saveWarning&&ui){ui.toast(ui.t('savingFailed'));saveWarning=true;const note=host.querySelector('.saved-note span');if(note)note.textContent=ui.t('savingFailed')}return false}}
function notify(result,success){if(!result.ok){say(ui.t(result.reason));return false}if(success)say(ui.t(success));save();ui.tick();return true}
// Notices queue so a reward, a level-up and a milestone never overwrite one another.
const notices=[];let noticeAt=0;
function say(message){if(notices.length<8)notices.push(message);if(notices.length===1&&performance.now()>=noticeAt)showNotice(performance.now())}
function showNotice(now){if(!notices.length)return;ui.toast(notices.shift());noticeAt=now+2400}
function announce(event){
 const t=ui.t,n=ui.n;
 if(event.type==='milestone')say(`${t('milestoneReached')} ${t('ms-'+event.id+'Title')} · +${n(event.reward)} ${t('buttons')}`);
 if(event.type==='bond'){say(`${t('bondUp')} ${t(event.id)} · ${t('bond'+event.level)} · +${n(event.reward)} ${t('buttons')}`);audio.effect('secret')}
 if(event.type==='full-house')say(`${t('fullHouse')} +${n(event.reward)} ${t('buttons')} · ${t('streakLabel')}: ${n(event.streak)}`);
 if(event.type==='dawn')say(event.fresh?`${t('dawnRecap')} ${n(event.wishes)} / ${n(DOLLS.length)}`:t('dawnTooSoon'));
 if(event.type==='sewn')say(t('sewnHint'));
}
function showError(kind){fatal=true;syncPause();save();document.querySelector('#loading')?.remove();if(ui?.panel)ui.close();const error=document.createElement('section');error.className='error-screen';error.setAttribute('role','alert');const h=document.createElement('h2'),p=document.createElement('p'),b=document.createElement('button');h.textContent=ui.t(kind==='context'?'contextTitle':'webglTitle');p.textContent=ui.t(kind==='context'?'contextHelp':'webglHelp');b.textContent=ui.t('reload');b.addEventListener('click',()=>location.reload());error.append(h,p,b);host.append(error)}
async function dispatch(action,value){
 switch(action){
  case 'tools-state':if(value){storyUI?.clear();world?.clearObjectSelection();objectControls?.collapse()}break;
  case 'panel-state':
   // Dismissing a sequence also leaves it. Physical work remains in its scene
   // when the optional catalog closes during entry or a paused modal closes.
   if(panelOpen==='activities'&&value!=='activities'&&!physicalActivity())sim.endActivity(state);
   if(value)cancelWorkInput();panelOpen=value||false;syncPause();storyUI?.clear();world?.setEnabled(!panelOpen&&!manualPause&&!carrying&&!fatal);world?.clearObjectSelection();if(!value)ui.clearObject();objectControls?.update();updateWorkUI();if(value==='household'&&world){try{ui.setPortraits(world.getPortraits())}catch(error){console.warn('Resident portrait unavailable:',error)}}break;
  case 'select-object':{
   const o=objectInfo(state,value);if(!o||fatal||manualPause||panelOpen||ui.placement)break;
   ui.collapseTools();
   if(storyUI?.select(value)){world?.focusRoom(o.room,true);host.dataset.focusRoom=o.room;host.dataset.focusDoll='';world?.selectObject(value);roomViews.update();objectControls?.update()}break;
  }
  case 'activate-object':{
   if(fatal||manualPause||panelOpen||ui.placement)break;
   const action=sceneObjectAction(state,value);if(action&&!action.disabled)dispatch(action.action,action.value);break;
  }
  case 'inspect-object':{
   const o=objectInfo(state,value);if(!o||fatal||manualPause)break;
   ui.openObject(value);world?.focusRoom(o.room,true);host.dataset.focusRoom=o.room;host.dataset.focusDoll='';roomViews.update();break;
  }
  case 'deselect-object':storyUI?.clear(true);world?.clearObjectSelection();break;
  case 'story-hint':{
   const story=sim.storyStatus(state);if(story.finished||fatal||manualPause||physicalActivity())break;
   const o=objectInfo(state,'prop:'+story.next.object);if(o){if(ui.panel)ui.close();dispatch('focus-room',o.room)}break;
  }
  case 'story-interact':{
   if(fatal||manualPause)break;
   // Optional detail sheets are paused; close first so the same command boundary applies.
   if(ui.panel)ui.close();
   const result=sim.interactStory(state,value);
   if(result.ok){
    if(['tea','stitch','lullaby'].includes(result.startedActivity)){enterWork(result.startedActivity);break}
    const o=objectInfo(state,value);if(o){world?.focusRoom(o.room,true);host.dataset.focusRoom=o.room;host.dataset.focusDoll=''}
    // A successful handoff changes the destination. Reveal its clue instead of
    // leaving a now-invalid source action as the largest control on a phone.
    storyUI?.clear();world?.clearObjectSelection();
    storyUI?.respond(result.message,result.chapterComplete,result.reward);audio.effect(['mint-tin','moon-bed'].includes(result.effect)?result.effect:result.chapterComplete?'secret':result.effect==='music-cabinet'?'musicbox':'care');save();ui.tick();roomViews.update();objectControls?.update();
   }else storyUI?.respond(result.reason);break;
  }
  case 'carry-start':carrying=true;world?.setEnabled(false);break;
  case 'carry-end':carrying=false;world?.setEnabled(!panelOpen&&!manualPause&&!fatal);break;
  case 'drop-story-item':{
   if(fatal||manualPause||panelOpen||!sim.storyStatus(state).held)break;
   const key=world?.objectAt(value.x,value.y);if(key)dispatch('story-interact',key);else storyUI?.respond('storyDropMiss');break;
  }
  case 'play-story-keepsake':{
   if(fatal||manualPause)break;if(ui.panel)ui.close();
   const result=sim.playStoryKeepsake(state,value);
   if(result.ok){storyUI?.respond(result.message);audio.effect(result.effect==='moon-bed'?'moon-bed':result.effect==='music-cabinet'?'musicbox':'care');save()}else storyUI?.respond(result.reason);break;
  }
  case 'use-object':{
   const item=state.decor.find(d=>d.id===value),result=sim.useDecor(state,value);
   if(result.ok){if(ui.panel)ui.close();dispatch('focus-room',item.room);audio.effect(item.item==='musicbox'?'musicbox':item.item==='mobile'?'mobile':'care');storyUI?.respond('keepsake-'+(result.effect==='water'?'watered':result.effect==='light'?'lit':result.effect==='dim'?'dimmed':result.effect==='wind'?'wound':'rocked'));save();storyUI?.update()}else storyUI?.respond(result.reason);break;
  }
  case 'rotate-object':if(notify(sim.rotateDecor(state,value),'objectRotated'))ui.refresh();break;
  case 'move-object':ui.beginMove(value);break;
  case 'pack-object':if(notify(sim.remove(state,value),'packed')){ui.close();objectControls?.update()}break;
  case 'relocate-object':{if(notify(sim.moveDecor(state,value.id,value.room,value.slot),'objectMoved')){ui.clearPlacement();world?.setPlacement(null);dispatch('focus-room',value.room);save()}break}
  case 'recall-ready':if(sim.startRecall(state).ok)ui.setActivityResult(null);break;
  case 'activity-hint':if(sim.toggleActivityHint(state).ok)ui.setActivityResult(null);break;
  case 'begin-activity':{
   if(manualPause||fatal){say(ui.t('pausedActivity'));break}if(ui.panel)ui.close();
   const result=sim.beginActivity(state,value);if(result.ok){ui.setActivityResult(null);if(physicalActivity())enterWork(value);else{ui.open('activities');dispatch('focus-room',ACTIVITY_ROOM[value]);save()}}else say(ui.t(result.reason));break;
  }
  case 'tea-control':if(!fatal&&!panelOpen)sim.controlTea(state,value);break;
  case 'tea-release':sim.releaseTea(state);break;
  case 'tea-empty':{
   const result=sim.emptyTeaCup(state,value);teaUI?.respond(result.ok?null:result.reason);if(result.ok)audio.effect('care');teaUI?.update(0);break;
  }
  case 'tea-serve':{
   const result=sim.serveTea(state);teaUI?.respond(result.ok?null:result.reason);
   if(result.ok){audio.effect('place');save();ui.tick();storyUI?.update()}teaUI?.update(0);break;
  }
  case 'tea-replay':{
   if(state.paused||fatal||state.activities.active?.id!=='tea'||state.activities.active.phase!=='served')break;
   cancelWorkInput();sim.endActivity(state);updateWorkUI();if(sim.beginActivity(state,'tea').ok)enterWork('tea');break;
  }
  case 'tea-exit':if(state.activities.active?.id==='tea')leaveWork();break;
  case 'stitch-control':if(!fatal&&!panelOpen)sim.controlStitch(state,value);break;
  case 'stitch-release':sim.releaseStitch(state);break;
  case 'stitch-unpick':{
   const result=sim.unpickStitch(state);stitchUI?.respond(result.ok?null:result.reason);if(result.ok)audio.effect('care');updateWorkUI();break;
  }
  case 'stitch-finish':{
   const result=sim.finishStitch(state);stitchUI?.respond(result.ok?null:result.reason);
   if(result.ok){audio.effect('place');save();ui.tick();storyUI?.update()}updateWorkUI();break;
  }
  case 'stitch-replay':{
   if(state.paused||fatal||state.activities.active?.id!=='stitch'||state.activities.active.phase!=='finished')break;
   cancelWorkInput();sim.endActivity(state);updateWorkUI();if(sim.beginActivity(state,'stitch').ok)enterWork('stitch');break;
  }
  case 'stitch-exit':if(state.activities.active?.id==='stitch')leaveWork();break;
  case 'chime-grab':if(!fatal&&!panelOpen)sim.grabChime(state,value);break;
  case 'chime-pull':if(!fatal&&!panelOpen)sim.pullChime(state,value);break;
  case 'chime-cancel':sim.cancelChime(state);break;
  case 'chime-focus':world?.setChimeSelection(value);break;
  case 'chime-release':{
   const result=sim.releaseChime(state);if(result.complete){save();ui.tick()}updateWorkUI();break;
  }
  case 'chime-replay':{
   if(state.paused||fatal||state.activities.active?.id!=='lullaby')break;
   cancelWorkInput();
   if(state.activities.active.phase==='finished'){sim.endActivity(state);updateWorkUI();if(sim.beginActivity(state,'lullaby').ok)enterWork('lullaby')}
   else{sim.replayChimes(state);updateWorkUI()}
   break;
  }
  case 'chime-exit':if(state.activities.active?.id==='lullaby')leaveWork();break;
  case 'activity-input':{
   const result=sim.activityInput(state,value);if(result.ok){if(!result.mistake)audio.effect(result.complete?'place':'care');ui.setActivityResult(result);save();ui.tick()}else say(ui.t(result.reason));break;
  }
  case 'end-activity':if(physicalActivity())leaveWork();else{sim.endActivity(state);ui.setActivityResult(null);ui.close();save()}break;
  case 'restore-room':{
   const result=sim.restoreRoom(state,value);if(result.ok){ui.close();world?.focusRoom(value);host.dataset.focusRoom=value;host.dataset.focusDoll='';audio.effect('secret');say(ui.t('restoreSuccess'));save();refreshUI()}else say(ui.t(result.reason));break;
  }
  case 'select':break;
  case 'care':{
   const result=sim.care(state,value.id,value.action);
   if(result.ok){ui.close();say(ui.t(value.action+'Success')+(result.reward?` +${ui.n(result.reward)} ${ui.t('reward')}`:''));audio.effect('care');save();ui.tick()}else say(ui.t(result.reason));break;
  }
  case 'objective':{
   const next=ui.objective();
   // Land on the section the suggestion is about, not the top of a long sheet.
   if(next.action==='panel'){ui.open(next.value);if(next.focus)host.querySelector('#sheet '+next.focus)?.scrollIntoView({block:'center'})}else dispatch(next.action,next.value);break;
  }
  case 'claim':{
   const result=sim.claim(state,value);
   if(result.ok){say(ui.t('milestoneCollected')+` +${ui.n(result.reward)} ${ui.t('buttons')}`);audio.effect('place');save();ui.tick()}else say(ui.t(result.reason));break;
  }
  case 'mend-door':{
   const result=sim.mendDoor(state);
   if(result.ok){say(ui.t(sim.doorOpen(state)?'doorOpenedNote':'doorStepDone'));audio.effect('secret');save();ui.tick()}else say(result.needs?ui.t('needs_'+result.needs):ui.t(result.reason));break;
  }
  case 'gift':{
   const result=sim.leaveGift(state);
   if(result.ok){say(`${ui.t('giftReceived')} ${ui.t('gift-'+result.gift+'Title')}`);audio.effect('secret');save();ui.tick();if(!ui.panel)ui.open('journal')}else say(ui.t(result.reason));break;
  }
  case 'collect-basket':{
   const result=sim.collectBasket(state);
   if(result.ok){say(ui.t('basketCollected')+` +${ui.n(result.reward)}`);audio.effect('place');save();ui.tick()}else say(ui.t(result.reason));break;
  }
  case 'placement':world?.setPlacement(value);break;
  case 'placement-preview':world?.setPreview(value);break;
  case 'placement-cancel':world?.setPlacement(null);break;
  case 'place':{
   const result=sim.place(state,value.item,value.room,value.slot);
   if(notify(result,'placed')){ui.clearPlacement();world?.setPlacement(null);audio.effect('place');for(const id of result.loved)say(ui.t(id)+' · '+ui.t('lovedPlaced'))}break;
  }
  case 'remove':notify(sim.remove(state,value),'packed');break;
  case 'move':{const result=sim.moveDoll(state,value.id,value.room);if(notify(result,result.favorite?'favoriteMoved':'placed'))ui.close();break}
  case 'light':{
   if(ui.panel)ui.close();sim.changeLight(state);save();refreshUI();if(sim.isNight(state))say(ui.t('nightHint'));break;
  }
  case 'discover':{
   const result=sim.discover(state);if(result.ok){save();audio.effect('secret');ui.open('journal');say(ui.t('newSecret'))}else say(ui.t(result.reason)+(result.needed?` ${ui.t('shyNeed')} ${ui.n(result.needed)}%`:''));break;
  }
  case 'camera':storyUI?.clear();world?.clearObjectSelection();world?.home();host.dataset.focusRoom='';host.dataset.focusDoll='';roomViews.update();objectControls?.update();break;
  case 'focus-doll':if(state.dolls.some(d=>d.id===value)){ui.close();if(world?.focusDoll(value)){host.dataset.focusDoll=value;host.dataset.focusRoom='';roomViews.update()}}break;
  case 'focus-room':if(world?.focusRoom(value)){if(objectInfo(state,storyUI?.selected)?.room!==value){storyUI?.clear();world?.clearObjectSelection()}host.dataset.focusRoom=value;host.dataset.focusDoll='';ui.tick();roomViews.update();objectControls?.update()}break;
  case 'zoom-in':world?.zoom(1.2);break;
  case 'zoom-out':world?.zoom(1/1.2);break;
  case 'pause':cancelWorkInput();manualPause=!manualPause;storyUI?.clear();world?.clearObjectSelection();syncPause();world?.setEnabled(!panelOpen&&!manualPause);refreshUI();break;
  case 'sound':{
   if(state.settings.muted){if(await audio.enable()){state.settings.muted=false;audio.setPaused(state.paused)}else ui.toast(ui.t('audioUnavailable'))}else{state.settings.muted=true;audio.mute()}save();refreshUI();break;
  }
  case 'setting':{
   if(value.key==='locale'&&['en','ar'].includes(value.value))state.settings.locale=value.value;
   if(value.key==='quality'&&['auto','low','high'].includes(value.value))state.settings.quality=value.value;
   if(value.key==='motion')state.settings.reducedMotion=Boolean(value.value);
   save();refreshUI();break;
  }
  case 'reset-yes':{
   cancelWorkInput();world?.setTeaActive(false);world?.setStitchActive(false);world?.setChimeActive(false);notices.length=0;const settings={...state.settings};ui.close();ui.clearPlacement();ui.setActivityResult(null);state=sim.createState();state.settings=settings;manualPause=false;syncPause();dispatch('camera');world?.setPlacement(null);save();refreshUI();break;
  }
 }
}
ui=createUI(host,()=>state,dispatch);
const residentLabel=createResidentLabel(host);
const roomViews=createRoomViews(host,()=>state,id=>dispatch('focus-room',id));
try{world=createWorld(canvas,{onPick:data=>{
 if(data.object)dispatch(storyUI?.selected===data.object?'activate-object':'select-object',data.object);
 if(data.doll)ui.open('household',data.doll);
 if(data.ghost)dispatch('discover');
 if(data.slot&&ui.placement)dispatch(ui.moveId!==null?'relocate-object':'place',{id:ui.moveId,item:ui.placement,...data.slot});
},onError:showError});document.querySelector('#loading')?.remove();}catch(error){console.error('Dollhouse renderer could not start:',error);showError('webgl')}
objectControls=createObjectControls(host,()=>state,key=>dispatch('select-object',key));
storyUI=createStoryUI(host,()=>state,dispatch);
teaUI=createTeaUI(host,canvas,()=>state,dispatch,{pick:(x,y)=>world?.teaAt(x,y),aimAt:(x,y)=>world?.teaAimAt(x,y)});
stitchUI=createStitchUI(host,canvas,()=>state,dispatch,{pick:(x,y)=>world?.stitchAt(x,y),pointAt:(x,y)=>world?.stitchPointAt(x,y)});
chimeUI=createChimeUI(host,canvas,()=>state,dispatch,{pick:(x,y)=>world?.chimeAt(x,y),pullSpan:()=>world?.chimePullSpan()??0});
let last=performance.now(),lastUI=0,lastSave=0,stopped=false;
function frame(now){if(stopped)return;const dt=Math.min(.1,Math.max(0,(now-last)/1000));last=now;
 if(!document.hidden&&!fatal){updateWorkUI(dt);sim.step(state,dt);if(state.events.length)for(const event of state.events.splice(0))announce(event);if(notices.length&&now>=noticeAt&&!physicalActivity())showNotice(now);world?.render(state,dt,ui.selected);residentLabel.update(state,ui.selected,host.dataset.focusRoom||(host.dataset.focusDoll?state.dolls.find(d=>d.id===host.dataset.focusDoll)?.room:''),world?.project(ui.selected,.05),Boolean(ui.panel||ui.placement||state.paused||storyUI?.selected||physicalActivity()));if(physicalActivity()!=='lullaby')audio.tick(sim.isNight(state));if(now-lastUI>250){ui.tick();roomViews.update();objectControls.update();storyUI.update();lastUI=now}if(now-lastSave>8000){save();lastSave=now}}
 requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
document.addEventListener('visibilitychange',()=>{if(document.hidden){storyUI?.cancelDrag();cancelWorkInput()}syncPause();last=performance.now();if(document.hidden)save()});
window.addEventListener('pagehide',()=>{cancelWorkInput();save()});
bindPlacementEscape(window,()=>{if(!ui.placement)return false;ui.clearPlacement();world?.setPlacement(null);roomViews.update();return true});
window.addEventListener('keydown',event=>{
 if(event.defaultPrevented)return;
 if(physicalActivity())return;
 if(event.key==='Escape'&&!ui.panel&&!ui.placement&&(storyUI?.selected||carrying)){event.preventDefault();dispatch('deselect-object');return}
 if(event.target.closest('input,select,textarea,button,dialog'))return;
 if(event.key==='Escape'){if(ui.placement){ui.clearPlacement();world?.setPlacement(null)}else if(ui.panel)ui.close();return}
 if(panelOpen)return;
 if(event.code==='Space'){event.preventDefault();dispatch('pause')}
 if(event.key==='h'||event.key==='H'){event.preventDefault();dispatch('camera')}
 if(event.key==='+'||event.key==='='){event.preventDefault();dispatch('zoom-in')}
 if(event.key==='-'){event.preventDefault();dispatch('zoom-out')}
 if(event.key==='ArrowLeft'){event.preventDefault();world?.orbit(-.09)}
 if(event.key==='ArrowRight'){event.preventDefault();world?.orbit(.09)}
});
// Explicit opt-in diagnostics for reproducible browser verification, never enabled by default.
if(new URLSearchParams(location.search).get('debug')==='1'){
 window.dollhouse={state:()=>structuredClone(state),stats:()=>({calls:world?.renderer.info.render.calls,triangles:world?.renderer.info.render.triangles,geometries:world?.renderer.info.memory.geometries,textures:world?.renderer.info.memory.textures}),project:(id,height)=>world?.project(id,height),visual:()=>world?.visualStatus(),objects:()=>world?.objectPositions(),tea:()=>sim.teaStatus(state),teaObjects:()=>world?.teaPositions(),stitch:()=>sim.stitchStatus(state),stitchObjects:()=>world?.stitchPositions(),projectStitch:(x,y,height)=>world?.projectStitch(x,y,height),chimes:()=>sim.chimeStatus(state),chimeObjects:()=>world?.chimePositions(),chimePullSpan:()=>world?.chimePullSpan()};
}
