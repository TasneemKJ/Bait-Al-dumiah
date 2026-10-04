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
let world=null,ui=null,manualPause=false,panelOpen=false,fatal=false,saveWarning=false;
const audio=new DollhouseAudio(),canvas=document.querySelector('#world'),host=document.querySelector('#ui');
const ACTIVITY_ROOM=Object.fromEntries(ACTIVITIES.map(a=>[a.id,a.room]));
// Reattach scene controls synchronously; a slow graphics frame must not hide the UI.
function refreshUI(){ui.refresh();roomViews.update()}
function syncPause(){state.paused=manualPause||Boolean(panelOpen&&panelOpen!=='activities')||document.hidden||fatal;audio.setPaused(state.paused)}
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
  case 'panel-state':panelOpen=value||false;syncPause();world?.setEnabled(!panelOpen);if(value==='household'&&world){try{ui.setPortraits(world.getPortraits())}catch(error){console.warn('Resident portrait unavailable:',error)}}break;
  case 'begin-activity':{
   if(manualPause||fatal){say(ui.t('pausedActivity'));break}if(ui.panel)ui.close();
   const result=sim.beginActivity(state,value);if(result.ok){ui.setActivityResult(null);ui.open('activities');world?.focusRoom(ACTIVITY_ROOM[value]);save()}else say(ui.t(result.reason));break;
  }
  case 'activity-input':{
   const result=sim.activityInput(state,value);if(result.ok){if(!result.mistake)audio.effect(result.complete?'place':'care');ui.setActivityResult(result);save();ui.tick()}else say(ui.t(result.reason));break;
  }
  case 'end-activity':state.activities.active=null;ui.setActivityResult(null);ui.close();save();break;
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
  case 'camera':world?.home();host.dataset.focusRoom='';host.dataset.focusDoll='';roomViews.update();break;
  case 'focus-doll':if(state.dolls.some(d=>d.id===value)){ui.close();if(world?.focusDoll(value)){host.dataset.focusDoll=value;host.dataset.focusRoom='';roomViews.update()}}break;
  case 'focus-room':if(world?.focusRoom(value)){host.dataset.focusRoom=value;host.dataset.focusDoll='';ui.tick();roomViews.update()}break;
  case 'zoom-in':world?.zoom(1.2);break;
  case 'zoom-out':world?.zoom(1/1.2);break;
  case 'pause':manualPause=!manualPause;syncPause();refreshUI();break;
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
   notices.length=0;const settings={...state.settings};ui.close();state=sim.createState();state.settings=settings;manualPause=false;syncPause();dispatch('camera');world?.setPlacement(null);save();refreshUI();break;
  }
 }
}
ui=createUI(host,()=>state,dispatch);
const residentLabel=createResidentLabel(host);
const roomViews=createRoomViews(host,()=>state,id=>dispatch('focus-room',id));
try{world=createWorld(canvas,{onPick:data=>{
 if(data.doll)ui.open('household',data.doll);
 if(data.ghost)dispatch('discover');
 if(data.slot&&ui.placement)dispatch('place',{item:ui.placement,...data.slot});
},onError:showError});document.querySelector('#loading')?.remove();}catch(error){console.error('Dollhouse renderer could not start:',error);showError('webgl')}
let last=performance.now(),lastUI=0,lastSave=0,stopped=false;
function frame(now){if(stopped)return;const dt=Math.min(.1,Math.max(0,(now-last)/1000));last=now;
 if(!document.hidden&&!fatal){sim.step(state,dt);if(state.events.length)for(const event of state.events.splice(0))announce(event);if(notices.length&&now>=noticeAt)showNotice(now);world?.render(state,dt,ui.selected);residentLabel.update(state,ui.selected,host.dataset.focusRoom||(host.dataset.focusDoll?state.dolls.find(d=>d.id===host.dataset.focusDoll)?.room:''),world?.project(ui.selected,.05),Boolean(ui.panel||ui.placement||state.paused));audio.tick(sim.isNight(state));if(now-lastUI>250){ui.tick();roomViews.update();lastUI=now}if(now-lastSave>8000){save();lastSave=now}}
 requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
document.addEventListener('visibilitychange',()=>{syncPause();last=performance.now();if(document.hidden)save()});
window.addEventListener('pagehide',()=>save());
bindPlacementEscape(window,()=>{if(!ui.placement)return false;ui.clearPlacement();world?.setPlacement(null);roomViews.update();return true});
window.addEventListener('keydown',event=>{
 if(event.defaultPrevented)return;
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
 window.dollhouse={state:()=>structuredClone(state),stats:()=>({calls:world?.renderer.info.render.calls,triangles:world?.renderer.info.render.triangles,geometries:world?.renderer.info.memory.geometries,textures:world?.renderer.info.memory.textures}),project:(id,height)=>world?.project(id,height),visual:()=>world?.visualStatus()};
}
