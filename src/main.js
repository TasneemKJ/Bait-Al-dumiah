import {createHomeSession} from './home-session.js';
import {createHomeUI} from './home-ui.js';
import {objectInfo,sceneObjectAction} from './object-ui.js';
import {createStoryUI} from './story-ui.js';
import {createPlayfieldLayout} from './playfield-layout.js';
import {createTeaUI} from './tea-ui.js';
import {createStitchUI} from './stitch-ui.js';
import {createChimeUI} from './chime-ui.js';
import {createObjectControls} from './object-controls.js';
import {bindPlacementEscape} from './placement-keys.js';
import {DOLLS,ACTIVITIES} from './content.js';
import * as sim from './simulation.js';
import {createWorld} from './render/world.js';
import {createUI} from './ui.js';
import {createResidentLabel} from './resident-label.js';
import {createRoomViews} from './room-views.js';
import {DollhouseAudio} from './audio.js';
import {downloadSave,readSaveFile} from './save-transfer.js';
import {returnGreeting,waveSchedule,waveRoom} from './return-greeting.js';

let storage;try{storage=localStorage}catch{}
const session=createHomeSession({storage,reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches});
let state=session.state;
let world=null,ui=null,homeUI=null,manualPause=false,panelOpen=false,fatal=false,saveWarning=false,objectControls=null,storyUI=null,teaUI=null,stitchUI=null,chimeUI=null,lastChimeTone=null,carrying=false;
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
function refreshUI(){ui.refresh();roomViews.update();objectControls?.update();storyUI?.update();updateWorkUI();homeUI?.refresh()}
function syncPause(){state.paused=!session.entered||manualPause||Boolean(panelOpen&&panelOpen!=='activities')||document.hidden||fatal;if(state.paused)cancelWorkInput();audio.setPaused(state.paused)}
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
function save(){if(!session.entered)return false;if(session.save(state))return true;if(!saveWarning&&ui){ui.toast(ui.t('savingFailed'));saveWarning=true;const note=host.querySelector('.saved-note span');if(note)note.textContent=ui.t('savingFailed')}return false}
function saveSettings(){const saved=session.savePreferences(state.settings);if(session.entered)save();else if(!saved)homeUI?.notify(ui.t('savingFailed'))}
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
function showError(kind){fatal=true;syncPause();save();homeUI?.hide();document.querySelector('#loading')?.remove();if(ui?.panel)ui.close();const error=document.createElement('section');error.className='error-screen';error.setAttribute('role','alert');const h=document.createElement('h2'),p=document.createElement('p'),b=document.createElement('button');h.textContent=ui.t(kind==='context'?'contextTitle':'webglTitle');p.textContent=ui.t(kind==='context'?'contextHelp':'webglHelp');b.textContent=ui.t('reload');b.addEventListener('click',()=>location.reload());error.append(h,p,b);document.querySelector('#app').append(error)}
// Leaving Home: show the play shell, start sound and greet a returning player.
function showPlayShell(){
 homeUI.hide();document.querySelector('#app').dataset.screen='play';host.hidden=false;host.inert=false;canvas.inert=false;canvas.removeAttribute('aria-hidden');canvas.setAttribute('tabindex','0');
 syncPause();world.syncViewport();world.setEnabled(!state.paused);refreshUI();playfieldLayout.measure();
}
function greetReturningPlayer(){
 const greeting=returnGreeting(state);if(!greeting)return;
 say(ui.t(greeting.key).replace('{count}',ui.n(greeting.count)));
 if(!state.settings.reducedMotion)world?.welcomeBack(waveSchedule(DOLLS.length,state.elapsed));
 welcomeGlance();
}
function enterPlay(){
 if(fatal||!world)return;
 if(!session.enter()){if(!session.entered&&session.entryIssue)homeUI.requireReload(session.entryIssue==='changed'?'homeEntryChanged':'homeEntryUnreadable');return}
 showPlayShell();
 if(!session.canContinue)dispatch('focus-room','kitchen');
 last=performance.now();lastSave=last;canvas.focus({preventScroll:true});
 let entrySaved=false;
 if(!state.settings.muted&&!audio.enabled)void audio.enable().then(ok=>{if(!ok)ui.toast((entrySaved?'':ui.t('savingFailed')+' ')+ui.t('audioUnavailable'));audio.setPaused(state.paused)});
 entrySaved=save();
 if(entrySaved){if(session.recovered)say(ui.t('saveRecovered'));else greetReturningPlayer()}
}
const storySound=r=>['mint-tin','moon-bed'].includes(r.effect)?r.effect:r.chapterComplete?'secret':r.effect==='music-cabinet'?'musicbox':'care';
function interactStory(key){
 if(fatal||manualPause)return;
 // Optional detail sheets are paused; close first so the same command boundary applies.
 if(ui.panel)ui.close();
 const result=sim.interactStory(state,key);
 if(!result.ok){storyUI?.respond(result.reason);return}
 if(['tea','stitch','lullaby'].includes(result.startedActivity)){enterWork(result.startedActivity);return}
 const o=objectInfo(state,key);if(o){world?.focusRoom(o.room,true);host.dataset.focusRoom=o.room;host.dataset.focusDoll=''}
 // A successful handoff changes the destination. Reveal its clue instead of
 // leaving a now-invalid source action as the largest control on a phone.
 storyUI?.clear();world?.clearObjectSelection();
 storyUI?.respond(result.message,result.chapterComplete,result.reward);audio.effect(storySound(result));
 save();ui.tick();roomViews.update();objectControls?.update();
}
function exportSave(){
 try{downloadSave(state);say(ui.t('saveExported'))}catch{say(ui.t('saveExportFailed'))}
}
// A new run (import or reset) replaces the state wholesale and returns the house to its idle view.
function replaceRun(next,settings){
 cancelWorkInput();world?.setTeaActive(false);world?.setStitchActive(false);world?.setChimeActive(false);notices.length=0;
 ui.close();ui.clearPlacement();ui.setActivityResult(null);
 next.settings={...settings};state=next;manualPause=false;syncPause();dispatch('camera');world?.setPlacement(null);save();refreshUI();
}
function importSave(file){
 readSaveFile(file,sim.readSave).then(result=>{
  if(!result){say(ui.t('saveImportFailed'));return}
  replaceRun(result.state,{...result.state.settings,muted:state.settings.muted});say(ui.t('saveImported'));
 }).catch(()=>say(ui.t('saveImportFailed')));
}
// Command table: one handler per action name. A handler returns early where the
// former switch used break.
const handlers={
'home-play':enterPlay,
'home-reload':(value,origin)=>{if(!session.entered&&session.entryIssue)location.reload();return;},
'home-language':(value,origin)=>{if(!session.entered&&['en','ar'].includes(value)){state.settings.locale=value;refreshUI();saveSettings()}return;},
'home-sound':async (value,origin)=>{if(!session.entered)await dispatch('sound');return;},
'tools-state':(value,origin)=>{if(value){storyUI?.clear();world?.clearObjectSelection();objectControls?.collapse()}return;},
'panel-state':(value,origin)=>{
   // Dismissing a sequence also leaves it. Physical work remains in its scene
   // when the optional catalog closes during entry or a paused modal closes.
   if(panelOpen==='activities'&&value!=='activities'&&!physicalActivity())sim.endActivity(state);
   if(value)cancelWorkInput();panelOpen=value||false;syncPause();storyUI?.clear();world?.setEnabled(!panelOpen&&!manualPause&&!carrying&&!fatal);world?.clearObjectSelection();if(!value)ui.clearObject();objectControls?.update();updateWorkUI();if(value==='household'&&world){try{ui.setPortraits(world.getPortraits())}catch(error){console.warn('Resident portrait unavailable:',error)}}return;},
'select-object':(value,origin)=>{
   const o=objectInfo(state,value);if(!o||fatal||manualPause||panelOpen||ui.placement)return;
   ui.collapseTools();
   // A scene touch selects where the player touched. Only discovery controls
   // request a new room view; selection must not relocate its second tap.
   if(origin!=='scene'){world?.focusRoom(o.room,true);host.dataset.focusRoom=o.room;host.dataset.focusDoll=''}
   if(storyUI?.select(value)){world?.selectObject(value);roomViews.update();objectControls?.update()}return;
  },
'activate-object':(value,origin)=>{
   if(fatal||manualPause||panelOpen||ui.placement)return;
   const action=sceneObjectAction(state,value);if(action&&!action.disabled)dispatch(action.action,action.value);return;
  },
'inspect-object':(value,origin)=>{
   const o=objectInfo(state,value);if(!o||fatal||manualPause)return;
   ui.openObject(value);world?.focusRoom(o.room,true);host.dataset.focusRoom=o.room;host.dataset.focusDoll='';roomViews.update();return;
  },
'deselect-object':(value,origin)=>{storyUI?.clear(true);world?.clearObjectSelection();return;},
'story-hint':(value,origin)=>{
   const story=sim.storyStatus(state);if(story.finished||fatal||manualPause||physicalActivity())return;
   const o=objectInfo(state,'prop:'+story.next.object);if(o){if(ui.panel)ui.close();dispatch('focus-room',o.room)}return;
  },
'story-interact':(value)=>interactStory(value),
'carry-start':(value,origin)=>{carrying=true;world?.setEnabled(false);return;},
'carry-end':(value,origin)=>{carrying=false;world?.setEnabled(!panelOpen&&!manualPause&&!fatal);return;},
'drop-story-item':(value,origin)=>{
   if(fatal||manualPause||panelOpen||!sim.storyStatus(state).held)return;
   const key=world?.objectAt(value.x,value.y);if(key)dispatch('story-interact',key);else storyUI?.respond('storyDropMiss');return;
  },
'play-story-keepsake':(value,origin)=>{
   if(fatal||manualPause)return;if(ui.panel)ui.close();
   const result=sim.playStoryKeepsake(state,value);
   if(result.ok){storyUI?.respond(result.message);audio.effect(result.effect==='moon-bed'?'moon-bed':result.effect==='music-cabinet'?'musicbox':'care');save()}else storyUI?.respond(result.reason);return;
  },
'use-object':(value,origin)=>{
   const item=state.decor.find(d=>d.id===value),result=sim.useDecor(state,value);
   if(result.ok){if(ui.panel)ui.close();dispatch('focus-room',item.room);audio.effect(item.item==='musicbox'?'musicbox':item.item==='mobile'?'mobile':'care');storyUI?.respond('keepsake-'+(result.effect==='water'?'watered':result.effect==='light'?'lit':result.effect==='dim'?'dimmed':result.effect==='wind'?'wound':'rocked'));save();storyUI?.update()}else storyUI?.respond(result.reason);return;
  },
'rotate-object':(value,origin)=>{if(notify(sim.rotateDecor(state,value),'objectRotated'))ui.refresh();return;},
'move-object':(value,origin)=>{ui.beginMove(value);return;},
'pack-object':(value,origin)=>{if(notify(sim.remove(state,value),'packed')){ui.close();objectControls?.update()}return;},
'relocate-object':(value,origin)=>{if(notify(sim.moveDecor(state,value.id,value.room,value.slot),'objectMoved')){ui.clearPlacement();world?.setPlacement(null);dispatch('focus-room',value.room);save()}return},
'recall-ready':(value,origin)=>{if(sim.startRecall(state).ok)ui.setActivityResult(null);return;},
'activity-hint':(value,origin)=>{if(sim.toggleActivityHint(state).ok)ui.setActivityResult(null);return;},
'begin-activity':(value,origin)=>{
   if(manualPause||fatal){say(ui.t('pausedActivity'));return}if(ui.panel)ui.close();
   const result=sim.beginActivity(state,value);if(result.ok){ui.setActivityResult(null);if(physicalActivity())enterWork(value);else{ui.open('activities');dispatch('focus-room',ACTIVITY_ROOM[value]);save()}}else say(ui.t(result.reason));return;
  },
'tea-control':(value,origin)=>{if(!fatal&&!panelOpen)sim.controlTea(state,value);return;},
'tea-release':(value,origin)=>{sim.releaseTea(state);return;},
'tea-empty':(value,origin)=>{
   const result=sim.emptyTeaCup(state,value);teaUI?.respond(result.ok?null:result.reason);if(result.ok)audio.effect('care');teaUI?.update(0);return;
  },
'tea-serve':(value,origin)=>{
   const result=sim.serveTea(state);teaUI?.respond(result.ok?null:result.reason);
   if(result.ok){audio.effect('place');save();ui.tick();storyUI?.update()}teaUI?.update(0);return;
  },
'tea-replay':(value,origin)=>{
   if(state.paused||fatal||state.activities.active?.id!=='tea'||state.activities.active.phase!=='served')return;
   cancelWorkInput();sim.endActivity(state);updateWorkUI();if(sim.beginActivity(state,'tea').ok)enterWork('tea');return;
  },
'tea-exit':(value,origin)=>{if(state.activities.active?.id==='tea')leaveWork();return;},
'stitch-control':(value,origin)=>{if(!fatal&&!panelOpen)sim.controlStitch(state,value);return;},
'stitch-release':(value,origin)=>{sim.releaseStitch(state);return;},
'stitch-unpick':(value,origin)=>{
   const result=sim.unpickStitch(state);stitchUI?.respond(result.ok?null:result.reason);if(result.ok)audio.effect('care');updateWorkUI();return;
  },
'stitch-finish':(value,origin)=>{
   const result=sim.finishStitch(state);stitchUI?.respond(result.ok?null:result.reason);
   if(result.ok){audio.effect('place');save();ui.tick();storyUI?.update()}updateWorkUI();return;
  },
'stitch-replay':(value,origin)=>{
   if(state.paused||fatal||state.activities.active?.id!=='stitch'||state.activities.active.phase!=='finished')return;
   cancelWorkInput();sim.endActivity(state);updateWorkUI();if(sim.beginActivity(state,'stitch').ok)enterWork('stitch');return;
  },
'stitch-exit':(value,origin)=>{if(state.activities.active?.id==='stitch')leaveWork();return;},
'chime-grab':(value,origin)=>{if(!fatal&&!panelOpen)sim.grabChime(state,value);return;},
'chime-pull':(value,origin)=>{if(!fatal&&!panelOpen)sim.pullChime(state,value);return;},
'chime-cancel':(value,origin)=>{sim.cancelChime(state);return;},
'chime-focus':(value,origin)=>{world?.setChimeSelection(value);return;},
'chime-release':(value,origin)=>{
   const result=sim.releaseChime(state);if(result.complete){save();ui.tick()}updateWorkUI();return;
  },
'chime-replay':(value,origin)=>{
   if(state.paused||fatal||state.activities.active?.id!=='lullaby')return;
   cancelWorkInput();
   if(state.activities.active.phase==='finished'){sim.endActivity(state);updateWorkUI();if(sim.beginActivity(state,'lullaby').ok)enterWork('lullaby')}
   else{sim.replayChimes(state);updateWorkUI()}
   return;
  },
'chime-exit':(value,origin)=>{if(state.activities.active?.id==='lullaby')leaveWork();return;},
'activity-input':(value,origin)=>{
   const result=sim.activityInput(state,value);if(result.ok){if(!result.mistake)audio.effect(result.complete?'place':'care');ui.setActivityResult(result);save();ui.tick()}else say(ui.t(result.reason));return;
  },
'end-activity':(value,origin)=>{if(physicalActivity())leaveWork();else{sim.endActivity(state);ui.setActivityResult(null);ui.close();save()}return;},
'restore-room':(value,origin)=>{
   const result=sim.restoreRoom(state,value);if(result.ok){ui.close();world?.focusRoom(value);host.dataset.focusRoom=value;host.dataset.focusDoll='';audio.effect('secret');say(ui.t('restoreSuccess'));save();refreshUI()}else say(ui.t(result.reason));return;
  },
'select':(value,origin)=>{return;},
'care':(value,origin)=>{
   const result=sim.care(state,value.id,value.action);
   if(result.ok){ui.close();say(ui.t(value.action+'Success')+(result.reward?` +${ui.n(result.reward)} ${ui.t('reward')}`:''));audio.effect('care');save();ui.tick()}else say(ui.t(result.reason));return;
  },
'objective':(value,origin)=>{
   const next=ui.objective();
   // Land on the section the suggestion is about, not the top of a long sheet.
   if(next.action==='panel'){ui.open(next.value);if(next.focus)host.querySelector('#sheet '+next.focus)?.scrollIntoView({block:'center'})}else dispatch(next.action,next.value);return;
  },
'claim':(value,origin)=>{
   const result=sim.claim(state,value);
   if(result.ok){say(ui.t('milestoneCollected')+` +${ui.n(result.reward)} ${ui.t('buttons')}`);audio.effect('place');save();ui.tick()}else say(ui.t(result.reason));return;
  },
'mend-door':(value,origin)=>{
   const result=sim.mendDoor(state);
   if(result.ok){say(ui.t(sim.doorOpen(state)?'doorOpenedNote':'doorStepDone'));audio.effect('secret');save();ui.tick()}else say(result.needs?ui.t('needs_'+result.needs):ui.t(result.reason));return;
  },
'gift':(value,origin)=>{
   const result=sim.leaveGift(state);
   if(result.ok){say(`${ui.t('giftReceived')} ${ui.t('gift-'+result.gift+'Title')}`);audio.effect('secret');save();ui.tick();if(!ui.panel)ui.open('journal')}else say(ui.t(result.reason));return;
  },
'collect-basket':(value,origin)=>{
   const result=sim.collectBasket(state);
   if(result.ok){say(ui.t('basketCollected')+` +${ui.n(result.reward)}`);audio.effect('place');save();ui.tick()}else say(ui.t(result.reason));return;
  },
'placement':(value,origin)=>{world?.setPlacement(value);return;},
'placement-preview':(value,origin)=>{world?.setPreview(value);return;},
'placement-cancel':(value,origin)=>{world?.setPlacement(null);return;},
'place':(value,origin)=>{
   const result=sim.place(state,value.item,value.room,value.slot);
   if(notify(result,'placed')){ui.clearPlacement();world?.setPlacement(null);audio.effect('place');for(const id of result.loved)say(ui.t(id)+' · '+ui.t('lovedPlaced'))}return;
  },
'remove':(value,origin)=>{notify(sim.remove(state,value),'packed');return;},
'move':(value,origin)=>{const result=sim.moveDoll(state,value.id,value.room);if(notify(result,result.favorite?'favoriteMoved':'placed'))ui.close();return},
'light':(value,origin)=>{
   if(ui.panel)ui.close();sim.changeLight(state);save();refreshUI();if(sim.isNight(state))say(ui.t('nightHint'));return;
  },
'discover':(value,origin)=>{
   const result=sim.discover(state);if(result.ok){save();audio.effect('secret');ui.open('journal');say(ui.t('newSecret'))}else say(ui.t(result.reason)+(result.needed?` ${ui.t('shyNeed')} ${ui.n(result.needed)}%`:''));return;
  },
'camera':(value,origin)=>{storyUI?.clear();world?.clearObjectSelection();world?.home();host.dataset.focusRoom='';host.dataset.focusDoll='';roomViews.update();objectControls?.update();return;},
'focus-doll':(value,origin)=>{if(state.dolls.some(d=>d.id===value)){ui.close();if(world?.focusDoll(value)){host.dataset.focusDoll=value;host.dataset.focusRoom='';roomViews.update()}}return;},
'focus-room':(value,origin)=>{if(world?.focusRoom(value)){if(objectInfo(state,storyUI?.selected)?.room!==value){storyUI?.clear();world?.clearObjectSelection()}host.dataset.focusRoom=value;host.dataset.focusDoll='';ui.tick();roomViews.update();objectControls?.update()}return;},
'zoom-in':(value,origin)=>{world?.zoom(1.2);return;},
'zoom-out':(value,origin)=>{world?.zoom(1/1.2);return;},
'pause':(value,origin)=>{cancelWorkInput();manualPause=!manualPause;storyUI?.clear();world?.clearObjectSelection();syncPause();world?.setEnabled(!panelOpen&&!manualPause);refreshUI();return;},
'sound':async (value,origin)=>{
   let unavailable=false;if(state.settings.muted){if(await audio.enable()){state.settings.muted=false;audio.setPaused(state.paused)}else unavailable=true}else{state.settings.muted=true;audio.mute()}refreshUI();saveSettings();if(unavailable){if(session.entered)ui.toast(ui.t('audioUnavailable'));else homeUI?.notify(ui.t('audioUnavailable'))}return;
  },
'setting':(value,origin)=>{
   if(value.key==='locale'&&['en','ar'].includes(value.value))state.settings.locale=value.value;
   if(value.key==='quality'&&['auto','low','high'].includes(value.value))state.settings.quality=value.value;
   if(value.key==='motion')state.settings.reducedMotion=Boolean(value.value);
   if(value.key==='largeText')state.settings.largeText=Boolean(value.value);
   refreshUI();saveSettings();return;
  },
'save-export':()=>exportSave(),
'save-import':file=>importSave(file),
'reset-yes':()=>replaceRun(sim.createState(),state.settings),
};
async function dispatch(action,value,origin='control'){
 if(!session.entered&&!['home-play','home-reload','home-sound','home-language','sound'].includes(action))return;
 return handlers[action]?.(value,origin);
}
// While the residents wave, glance at the busiest room for a moment, then return,
// but only if the player has not touched anything and motion is allowed.
function welcomeGlance(){
 if(state.settings.reducedMotion)return;const room=waveRoom(state);if(!room)return;
 let touched=false;const mark=()=>{touched=true};host.addEventListener('pointerdown',mark,{once:true,capture:true});host.addEventListener('keydown',mark,{once:true,capture:true});
 setTimeout(()=>{if(touched||ui.panel||state.paused)return;dispatch('focus-room',room);
  setTimeout(()=>{if(!touched&&host.dataset.focusRoom===room)dispatch('camera')},2600)},700);
}
ui=createUI(host,()=>state,dispatch);
homeUI=createHomeUI(document.querySelector('#home'),()=>state,dispatch,{canContinue:session.canContinue,loadStatus:session.loadStatus});syncPause();
const residentLabel=createResidentLabel(host);
const roomViews=createRoomViews(host,()=>state,id=>dispatch('focus-room',id));
try{world=createWorld(canvas,{onPick:data=>{
 if(!session.entered)return;
 if(data.object)dispatch(storyUI?.selected===data.object?'activate-object':'select-object',data.object,'scene');
 if(data.doll)ui.open('household',data.doll);
 if(data.ghost)dispatch('discover');
 if(data.slot&&ui.placement)dispatch(ui.moveId!==null?'relocate-object':'place',{id:ui.moveId,item:ui.placement,...data.slot});
},onError:showError});world.setEnabled(false);homeUI.ready();document.querySelector('#loading')?.remove();}catch(error){console.error('Dollhouse renderer could not start:',error);showError('webgl')}
objectControls=createObjectControls(host,()=>state,key=>dispatch('select-object',key));
storyUI=createStoryUI(host,()=>state,dispatch,key=>world?.objectPositions().find(point=>point.key===key));
teaUI=createTeaUI(host,canvas,()=>state,dispatch,{pick:(x,y)=>world?.teaAt(x,y),aimAt:(x,y)=>world?.teaAimAt(x,y)});
stitchUI=createStitchUI(host,canvas,()=>state,dispatch,{pick:(x,y)=>world?.stitchAt(x,y),pointAt:(x,y)=>world?.stitchPointAt(x,y)});
chimeUI=createChimeUI(host,canvas,()=>state,dispatch,{pick:(x,y)=>world?.chimeAt(x,y),pullSpan:()=>world?.chimePullSpan()??0});
const playfieldLayout=createPlayfieldLayout(host,(value,viewport)=>{if(session.entered){world?.setPresentation(value,viewport);storyUI?.layout()}},()=>{if(world?.syncViewport()&&session.entered)storyUI?.cancelDrag();if(session.entered)storyUI?.layout()});
let last=performance.now(),lastUI=0,lastSave=0,stopped=false;
function frame(now){if(stopped)return;const dt=Math.min(.1,Math.max(0,(now-last)/1000));last=now;
 if(!document.hidden&&!fatal&&!session.entered&&homeUI?.previewVisible){world?.render(state,0,null)}
 if(!document.hidden&&!fatal&&session.entered){updateWorkUI(dt);session.advance(state,dt);if(state.events.length)for(const event of state.events.splice(0))announce(event);if(notices.length&&now>=noticeAt&&!physicalActivity())showNotice(now);world?.render(state,dt,ui.selected);residentLabel.update(state,ui.selected,host.dataset.focusRoom||(host.dataset.focusDoll?state.dolls.find(d=>d.id===host.dataset.focusDoll)?.room:''),world?.project(ui.selected,.05),Boolean(ui.panel||ui.placement||state.paused||storyUI?.selected||physicalActivity()));if(physicalActivity()!=='lullaby')audio.tick(sim.isNight(state));if(now-lastUI>250){ui.tick();roomViews.update();objectControls.update();storyUI.update();lastUI=now}if(now-lastSave>8000){save();lastSave=now}}
 requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
document.addEventListener('visibilitychange',()=>{if(document.hidden){storyUI?.cancelDrag();cancelWorkInput()}syncPause();last=performance.now();if(document.hidden)save()});
window.addEventListener('pagehide',()=>{cancelWorkInput();save()});
bindPlacementEscape(window,()=>{if(!ui.placement)return false;ui.clearPlacement();world?.setPlacement(null);roomViews.update();return true});
window.addEventListener('keydown',event=>{
 if(!session.entered||event.defaultPrevented)return;
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
