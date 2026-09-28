import {DOLLS,SAVE_KEY} from './content.js';
import * as sim from './simulation.js';
import {createWorld} from './render/world.js';
import {createUI} from './ui.js';
import {createRoomViews} from './render/room-views.js';
import {DollhouseAudio} from './audio.js';

let stored=null;try{stored=localStorage.getItem(SAVE_KEY)}catch{}
let state=stored?sim.restore(stored):sim.createState();
if(!stored)state.settings.reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
// A saved unmute preference never overrides a fresh page's audio gesture boundary.
state.settings.muted=true;
let world=null,ui=null,manualPause=false,panelOpen=false,fatal=false,saveWarning=false;
const audio=new DollhouseAudio(),canvas=document.querySelector('#world'),host=document.querySelector('#ui');
// Reattach scene controls synchronously; a slow graphics frame must not hide the UI.
function refreshUI(){ui.refresh();roomViews.update()}
function syncPause(){state.paused=manualPause||panelOpen||document.hidden||fatal;audio.setPaused(state.paused)}
function save(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(state));return true}catch{if(!saveWarning&&ui){ui.toast(ui.t('savingFailed'));saveWarning=true;const note=host.querySelector('.saved-note span');if(note)note.textContent=ui.t('savingFailed')}return false}}
function notify(result,success){if(!result.ok){ui.toast(ui.t(result.reason));return false}if(success)ui.toast(ui.t(success));save();ui.tick();return true}
function showError(kind){fatal=true;syncPause();save();document.querySelector('#loading')?.remove();if(ui?.panel)ui.close();const error=document.createElement('section');error.className='error-screen';error.setAttribute('role','alert');const h=document.createElement('h2'),p=document.createElement('p'),b=document.createElement('button');h.textContent=ui.t(kind==='context'?'contextTitle':'webglTitle');p.textContent=ui.t(kind==='context'?'contextHelp':'webglHelp');b.textContent=ui.t('reload');b.addEventListener('click',()=>location.reload());error.append(h,p,b);host.append(error)}
async function dispatch(action,value){
 switch(action){
  case 'panel-state':panelOpen=Boolean(value);syncPause();world?.setEnabled(!panelOpen);break;
  case 'select':break;
  case 'care':{
   const result=sim.care(state,value.id,value.action);
   if(result.ok){ui.close();ui.toast(ui.t(value.action+'Success')+(result.reward?` +${result.reward} ${ui.t('reward')}`:''));audio.effect('care');save();ui.tick()}else ui.toast(ui.t(result.reason));break;
  }
  case 'objective':{
   const wish=DOLLS.find(d=>!state.wishes.includes(d.id));
   if(wish)dispatch('care',{id:wish.id,action:wish.wish});
   else if(!state.decor.length)ui.open('decorate');
   else if(state.journal.length<6)dispatch(sim.isNight(state)?'discover':'light');
   else ui.open('household');break;
  }
  case 'placement':world?.setPlacement(value);break;
  case 'placement-cancel':world?.setPlacement(null);break;
  case 'place':{
   const result=sim.place(state,value.item,value.room,value.slot);
   if(notify(result,'placed')){ui.clearPlacement();world?.setPlacement(null);audio.effect('place')}break;
  }
  case 'remove':notify(sim.remove(state,value),'packed');break;
  case 'move':if(notify(sim.moveDoll(state,value.id,value.room),'placed'))ui.close();break;
  case 'light':{
   if(ui.panel)ui.close();sim.changeLight(state);save();refreshUI();if(sim.isNight(state))ui.toast(ui.t('nightHint'));break;
  }
  case 'discover':{
   const result=sim.discover(state);if(result.ok){save();audio.effect('secret');ui.open('journal');ui.toast(ui.t('newSecret'))}else ui.toast(ui.t(result.reason));break;
  }
  case 'camera':world?.home();host.dataset.focusRoom='';roomViews.update();break;
  case 'focus-room':if(world?.focusRoom(value)){host.dataset.focusRoom=value;ui.tick();roomViews.update()}break;
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
   const settings={...state.settings};ui.close();state=sim.createState();state.settings=settings;manualPause=false;syncPause();dispatch('camera');world?.setPlacement(null);save();refreshUI();break;
  }
 }
}
ui=createUI(host,()=>state,dispatch);
const roomViews=createRoomViews(host,()=>state,id=>dispatch('focus-room',id));
try{world=createWorld(canvas,{onPick:data=>{
 if(data.doll)ui.open('household',data.doll);
 if(data.ghost)dispatch('discover');
 if(data.slot&&ui.placement)dispatch('place',{item:ui.placement,...data.slot});
},onError:showError});document.querySelector('#loading')?.remove();}catch(error){console.error('Dollhouse renderer could not start:',error);showError('webgl')}
let last=performance.now(),lastUI=0,lastSave=0,stopped=false;
function frame(now){if(stopped)return;const dt=Math.min(.1,Math.max(0,(now-last)/1000));last=now;
 if(!document.hidden&&!fatal){sim.step(state,dt);world?.render(state,dt,ui.selected);audio.tick(sim.isNight(state));if(now-lastUI>250){ui.tick();roomViews.update();lastUI=now}if(now-lastSave>8000){save();lastSave=now}}
 requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
document.addEventListener('visibilitychange',()=>{syncPause();last=performance.now();if(document.hidden)save()});
window.addEventListener('pagehide',()=>save());
window.addEventListener('keydown',event=>{
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
 window.dollhouse={state:()=>structuredClone(state),stats:()=>({calls:world?.renderer.info.render.calls,triangles:world?.renderer.info.render.triangles,geometries:world?.renderer.info.memory.geometries,textures:world?.renderer.info.memory.textures}),project:id=>world?.project(id),visual:()=>world?.visualStatus()};
}
