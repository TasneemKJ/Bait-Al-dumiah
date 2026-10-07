// The command table: every action a control, key or touch can request, and the one place that runs it.
import * as sim from './simulation.js';
import {DOLLS,ACTIVITY_ROOM} from './content.js';
import {objectInfo,sceneObjectAction} from './object-ui.js';
import {downloadSave,readSaveFile} from './save-transfer.js';
import {returnGreeting,waveSchedule,waveRoom} from './return-greeting.js';

// Leaving Home: show the play shell, start sound and greet a returning player.
function showPlayShell(app){
 app.homeUI.hide();document.querySelector('#app').dataset.screen='play';app.host.hidden=false;app.host.inert=false;
 app.canvas.inert=false;app.canvas.removeAttribute('aria-hidden');app.canvas.setAttribute('tabindex','0');
 app.syncPause();app.world.syncViewport();app.world.setEnabled(!app.state.paused);app.refreshUI();app.playfieldLayout.measure();
}
function greetReturningPlayer(app){
 const greeting=returnGreeting(app.state);if(!greeting)return;
 app.say(app.ui.t(greeting.key).replace('{count}',app.ui.n(greeting.count)));
 if(!app.state.settings.reducedMotion)app.world?.welcomeBack(waveSchedule(DOLLS.length,app.state.elapsed));
 welcomeGlance(app);
}
function enterPlay(app){
 if(app.fatal||!app.world)return;
 if(!app.session.enter()){if(!app.session.entered&&app.session.entryIssue)app.homeUI.requireReload(app.session.entryIssue==='changed'?'homeEntryChanged':'homeEntryUnreadable');return}
 showPlayShell(app);
 if(!app.session.canContinue)app.dispatch('focus-room','kitchen');
 app.last=performance.now();app.lastSave=app.last;app.canvas.focus({preventScroll:true});
 let entrySaved=false;
 if(!app.state.settings.muted&&!app.audio.enabled)void app.audio.enable().then(ok=>{if(!ok)app.ui.toast((entrySaved?
   '':app.ui.t('savingFailed')+' ')+app.ui.t('audioUnavailable'));app.audio.setPaused(app.state.paused)});
 entrySaved=app.save();
 if(entrySaved){if(app.session.recovered)app.say(app.ui.t('saveRecovered'));else greetReturningPlayer(app)}
}
const storySound=r=>['mint-tin','moon-bed'].includes(r.effect)?r.effect:r.chapterComplete?'secret':r.effect==='music-cabinet'?'musicbox':'care';
function interactStory(app,key){
 if(app.fatal||app.manualPause)return;
 // Optional detail sheets are paused; close first so the same command boundary applies.
 if(app.ui.panel)app.ui.close();
 const result=sim.interactStory(app.state,key);
 if(!result.ok){app.storyUI?.respond(result.reason);return}
 if(['tea','stitch','lullaby'].includes(result.startedActivity)){app.enterWork(result.startedActivity);return}
 const o=objectInfo(app.state,key);if(o){app.world?.focusRoom(o.room,true);app.host.dataset.focusRoom=o.room;app.host.dataset.focusDoll=''}
 // A successful handoff changes the destination. Reveal its clue instead of
 // leaving a now-invalid source action as the largest control on a phone.
 app.storyUI?.clear();app.world?.clearObjectSelection();
 app.storyUI?.respond(result.message,result.chapterComplete,result.reward);app.audio.effect(storySound(result));
 app.save();app.ui.tick();app.roomViews.update();app.objectControls?.update();
}
function exportSave(app){
 try{downloadSave(app.state);app.say(app.ui.t('saveExported'))}catch{app.say(app.ui.t('saveExportFailed'))}
}
// A new run (import or reset) replaces the app.state wholesale and returns the house to its idle view.
function replaceRun(app,next,settings){
 app.cancelWorkInput();app.world?.setTeaActive(false);app.world?.setStitchActive(false);app.world?.setChimeActive(false);app.notices.length=0;
 app.ui.close();app.ui.clearPlacement();app.ui.setActivityResult(null);
 next.settings={...settings};app.state=next;app.manualPause=false;app.syncPause();app.dispatch('camera');app.world?.setPlacement(null);app.save();app.refreshUI();
}
function importSave(app,file){
 readSaveFile(file,sim.readSave).then(result=>{
  if(!result){app.say(app.ui.t('saveImportFailed'));return}
  replaceRun(app,result.state,{...result.state.settings,muted:app.state.settings.muted});app.say(app.ui.t('saveImported'));
 }).catch(()=>app.say(app.ui.t('saveImportFailed')));
}
// Command table: one handler per action name. A handler returns early where the
// former switch used break.
const handlers={
'home-play':app=>enterPlay(app),
'home-reload':(app,value,origin)=>{if(!app.session.entered&&app.session.entryIssue)location.reload();return;},
'home-language':(app,value,origin)=>{if(!app.session.entered&&['en','ar'].includes(value)){app.state.settings.locale=value;app.refreshUI();app.saveSettings()}return;},
'home-sound':async (app,value,origin)=>{if(!app.session.entered)await app.dispatch('sound');return;},
'tools-state':(app,value,origin)=>{if(value){app.storyUI?.clear();app.world?.clearObjectSelection();app.objectControls?.collapse()}return;},
'panel-state':(app,value,origin)=>{
   // Dismissing a sequence also leaves it. Physical work remains in its scene
   // when the optional catalog closes during entry or a paused modal closes.
   if(app.panelOpen==='activities'&&value!=='activities'&&!app.physicalActivity())sim.endActivity(app.state);
   if(value)app.cancelWorkInput();app.panelOpen=value||false;app.syncPause();app.storyUI?.clear();app.world?.setEnabled(!app.panelOpen&&!app.manualPause&&!app.carrying&&!app.fatal);
   app.world?.clearObjectSelection();if(!value)app.ui.clearObject();app.objectControls?.update();app.updateWorkUI();
   if(value==='household'&&app.world){try{app.ui.setPortraits(app.world.getPortraits())}catch(error){console.warn('Resident portrait unavailable:',error)}}return;},
'select-object':(app,value,origin)=>{
   const o=objectInfo(app.state,value);if(!o||app.fatal||app.manualPause||app.panelOpen||app.ui.placement)return;
   app.ui.collapseTools();
   // A scene touch selects where the player touched. Only discovery controls
   // request a new room view; selection must not relocate its second tap.
   if(origin!=='scene'){app.world?.focusRoom(o.room,true);app.host.dataset.focusRoom=o.room;app.host.dataset.focusDoll=''}
   if(app.storyUI?.select(value)){app.world?.selectObject(value);app.roomViews.update();app.objectControls?.update()}return;
  },
'activate-object':(app,value,origin)=>{
   if(app.fatal||app.manualPause||app.panelOpen||app.ui.placement)return;
   const action=sceneObjectAction(app.state,value);if(action&&!action.disabled)app.dispatch(action.action,action.value);return;
  },
'inspect-object':(app,value,origin)=>{
   const o=objectInfo(app.state,value);if(!o||app.fatal||app.manualPause)return;
   app.ui.openObject(value);app.world?.focusRoom(o.room,true);app.host.dataset.focusRoom=o.room;app.host.dataset.focusDoll='';app.roomViews.update();return;
  },
'deselect-object':(app,value,origin)=>{app.storyUI?.clear(true);app.world?.clearObjectSelection();return;},
'story-hint':(app,value,origin)=>{
   const story=sim.storyStatus(app.state);if(story.finished||app.fatal||app.manualPause||app.physicalActivity())return;
   const o=objectInfo(app.state,'prop:'+story.next.object);if(o){if(app.ui.panel)app.ui.close();app.dispatch('focus-room',o.room)}return;
  },
'story-interact':(app,value)=>interactStory(app,value),
'carry-start':(app,value,origin)=>{app.carrying=true;app.world?.setEnabled(false);return;},
'carry-end':(app,value,origin)=>{app.carrying=false;app.world?.setEnabled(!app.panelOpen&&!app.manualPause&&!app.fatal);return;},
'drop-story-item':(app,value,origin)=>{
   if(app.fatal||app.manualPause||app.panelOpen||!sim.storyStatus(app.state).held)return;
   const key=app.world?.objectAt(value.x,value.y);if(key)app.dispatch('story-interact',key);else app.storyUI?.respond('storyDropMiss');return;
  },
'play-story-keepsake':(app,value,origin)=>{
   if(app.fatal||app.manualPause)return;if(app.ui.panel)app.ui.close();
   const result=sim.playStoryKeepsake(app.state,value);
   if(result.ok){app.storyUI?.respond(result.message);
   app.audio.effect(result.effect==='moon-bed'?'moon-bed':result.effect==='music-cabinet'?'musicbox':'care');app.save()}else app.storyUI?.respond(result.reason);return;
  },
'use-object':(app,value,origin)=>{
   const item=app.state.decor.find(d=>d.id===value),result=sim.useDecor(app.state,value);
   if(result.ok){if(app.ui.panel)app.ui.close();app.dispatch('focus-room',item.room);
   app.audio.effect(item.item==='musicbox'?'musicbox':item.item==='mobile'?'mobile':'care');
   app.storyUI?.respond('keepsake-'+(result.effect==='water'?'watered':result.effect==='light'?'lit':result.effect==='dim'?'dimmed':result.effect==='wind'?
     'wound':'rocked'));app.save();app.storyUI?.update()}else app.storyUI?.respond(result.reason);return;
  },
'rotate-object':(app,value,origin)=>{if(app.notify(sim.rotateDecor(app.state,value),'objectRotated'))app.ui.refresh();return;},
'move-object':(app,value,origin)=>{app.ui.beginMove(value);return;},
'pack-object':(app,value,origin)=>{if(app.notify(sim.remove(app.state,value),'packed')){app.ui.close();app.objectControls?.update()}return;},
'relocate-object':(app,value,origin)=>{if(app.notify(sim.moveDecor(app.state,value.id,value.room,value.slot),'objectMoved')){app.ui.clearPlacement();
app.world?.setPlacement(null);app.dispatch('focus-room',value.room);app.save()}return},
'recall-ready':(app,value,origin)=>{if(sim.startRecall(app.state).ok)app.ui.setActivityResult(null);return;},
'activity-hint':(app,value,origin)=>{if(sim.toggleActivityHint(app.state).ok)app.ui.setActivityResult(null);return;},
'begin-activity':(app,value,origin)=>{
   if(app.manualPause||app.fatal){app.say(app.ui.t('pausedActivity'));return}if(app.ui.panel)app.ui.close();
   const result=sim.beginActivity(app.state,value);if(result.ok){app.ui.setActivityResult(null);if(app.physicalActivity())app.enterWork(value);
   else{app.ui.open('activities');app.dispatch('focus-room',ACTIVITY_ROOM[value]);app.save()}}else app.say(app.ui.t(result.reason));return;
  },
'tea-control':(app,value,origin)=>{if(!app.fatal&&!app.panelOpen)sim.controlTea(app.state,value);return;},
'tea-release':(app,value,origin)=>{sim.releaseTea(app.state);return;},
'tea-empty':(app,value,origin)=>{
   const result=sim.emptyTeaCup(app.state,value);app.teaUI?.respond(result.ok?null:result.reason);if(result.ok)app.audio.effect('care');app.teaUI?.update(0);return;
  },
'tea-serve':(app,value,origin)=>{
   const result=sim.serveTea(app.state);app.teaUI?.respond(result.ok?null:result.reason);
   if(result.ok){app.audio.effect('place');app.save();app.ui.tick();app.storyUI?.update()}app.teaUI?.update(0);return;
  },
'tea-replay':(app,value,origin)=>{
   if(app.state.paused||app.fatal||app.state.activities.active?.id!=='tea'||app.state.activities.active.phase!=='served')return;
   app.cancelWorkInput();sim.endActivity(app.state);app.updateWorkUI();if(sim.beginActivity(app.state,'tea').ok)app.enterWork('tea');return;
  },
'tea-exit':(app,value,origin)=>{if(app.state.activities.active?.id==='tea')app.leaveWork();return;},
'stitch-control':(app,value,origin)=>{if(!app.fatal&&!app.panelOpen)sim.controlStitch(app.state,value);return;},
'stitch-release':(app,value,origin)=>{sim.releaseStitch(app.state);return;},
'stitch-unpick':(app,value,origin)=>{
   const result=sim.unpickStitch(app.state);app.stitchUI?.respond(result.ok?null:result.reason);if(result.ok)app.audio.effect('care');app.updateWorkUI();return;
  },
'stitch-finish':(app,value,origin)=>{
   const result=sim.finishStitch(app.state);app.stitchUI?.respond(result.ok?null:result.reason);
   if(result.ok){app.audio.effect('place');app.save();app.ui.tick();app.storyUI?.update()}app.updateWorkUI();return;
  },
'stitch-replay':(app,value,origin)=>{
   if(app.state.paused||app.fatal||app.state.activities.active?.id!=='stitch'||app.state.activities.active.phase!=='finished')return;
   app.cancelWorkInput();sim.endActivity(app.state);app.updateWorkUI();if(sim.beginActivity(app.state,'stitch').ok)app.enterWork('stitch');return;
  },
'stitch-exit':(app,value,origin)=>{if(app.state.activities.active?.id==='stitch')app.leaveWork();return;},
'chime-grab':(app,value,origin)=>{if(!app.fatal&&!app.panelOpen)sim.grabChime(app.state,value);return;},
'chime-pull':(app,value,origin)=>{if(!app.fatal&&!app.panelOpen)sim.pullChime(app.state,value);return;},
'chime-cancel':(app,value,origin)=>{sim.cancelChime(app.state);return;},
'chime-focus':(app,value,origin)=>{app.world?.setChimeSelection(value);return;},
'chime-release':(app,value,origin)=>{
   const result=sim.releaseChime(app.state);if(result.complete){app.save();app.ui.tick()}app.updateWorkUI();return;
  },
'chime-replay':(app,value,origin)=>{
   if(app.state.paused||app.fatal||app.state.activities.active?.id!=='lullaby')return;
   app.cancelWorkInput();
   if(app.state.activities.active.phase==='finished'){sim.endActivity(app.state);app.updateWorkUI();if(sim.beginActivity(app.state,'lullaby').ok)app.enterWork('lullaby')}
   else{sim.replayChimes(app.state);app.updateWorkUI()}
   return;
  },
'chime-exit':(app,value,origin)=>{if(app.state.activities.active?.id==='lullaby')app.leaveWork();return;},
'activity-input':(app,value,origin)=>{
   const result=sim.activityInput(app.state,value);if(result.ok){if(!result.mistake)app.audio.effect(result.complete?'place':'care');
   app.ui.setActivityResult(result);app.save();app.ui.tick()}else app.say(app.ui.t(result.reason));return;
  },
'end-activity':(app,value,origin)=>{if(app.physicalActivity())app.leaveWork();else{sim.endActivity(app.state);app.ui.setActivityResult(null);app.ui.close();app.save()}return;},
'restore-room':(app,value,origin)=>{
   const result=sim.restoreRoom(app.state,value);if(result.ok){app.ui.close();app.world?.focusRoom(value);app.host.dataset.focusRoom=value;app.host.dataset.focusDoll='';
   app.audio.effect('secret');app.say(app.ui.t('restoreSuccess'));app.save();app.refreshUI()}else app.say(app.ui.t(result.reason));return;
  },
'select':(app,value,origin)=>{return;},
'care':(app,value,origin)=>{
   const result=sim.care(app.state,value.id,value.action);
   if(result.ok){app.ui.close();app.say(app.ui.t(value.action+'Success')+(result.reward?` +${app.ui.n(result.reward)} ${app.ui.t('reward')}`:''));app.audio.effect('care');
   app.save();app.ui.tick()}else app.say(app.ui.t(result.reason));return;
  },
'objective':(app,value,origin)=>{
   const next=app.ui.objective();
   // Land on the section the suggestion is about, not the top of a long sheet.
   if(next.action==='panel'){app.ui.open(next.value);
   if(next.focus)app.host.querySelector('#sheet '+next.focus)?.scrollIntoView({block:'center'})}else app.dispatch(next.action,next.value);return;
  },
'claim':(app,value,origin)=>{
   const result=sim.claim(app.state,value);
   if(result.ok){app.say(app.ui.t('milestoneCollected')+` +${app.ui.n(result.reward)} ${app.ui.t('buttons')}`);
   app.audio.effect('place');app.save();app.ui.tick()}else app.say(app.ui.t(result.reason));return;
  },
'mend-door':(app,value,origin)=>{
   const result=sim.mendDoor(app.state);
   if(result.ok){app.say(app.ui.t(sim.doorOpen(app.state)?'doorOpenedNote':'doorStepDone'));app.audio.effect('secret');app.save();
   app.ui.tick()}else app.say(result.needs?app.ui.t('needs_'+result.needs):app.ui.t(result.reason));return;
  },
'gift':(app,value,origin)=>{
   const result=sim.leaveGift(app.state);
   if(result.ok){app.say(`${app.ui.t('giftReceived')} ${app.ui.t('gift-'+result.gift+'Title')}`);app.audio.effect('secret');
   app.save();app.ui.tick();if(!app.ui.panel)app.ui.open('journal')}else app.say(app.ui.t(result.reason));return;
  },
'collect-basket':(app,value,origin)=>{
   const result=sim.collectBasket(app.state);
   if(result.ok){app.say(app.ui.t('basketCollected')+` +${app.ui.n(result.reward)}`);app.audio.effect('place');app.save();app.ui.tick()}else app.say(app.ui.t(result.reason));return;
  },
'placement':(app,value,origin)=>{app.world?.setPlacement(value);return;},
'placement-preview':(app,value,origin)=>{app.world?.setPreview(value);return;},
'placement-cancel':(app,value,origin)=>{app.world?.setPlacement(null);return;},
'place':(app,value,origin)=>{
   const result=sim.place(app.state,value.item,value.room,value.slot);
   if(app.notify(result,'placed')){app.ui.clearPlacement();app.world?.setPlacement(null);app.audio.effect('place');
   for(const id of result.loved)app.say(app.ui.t(id)+' · '+app.ui.t('lovedPlaced'))}return;
  },
'remove':(app,value,origin)=>{app.notify(sim.remove(app.state,value),'packed');return;},
'move':(app,value,origin)=>{const result=sim.moveDoll(app.state,value.id,value.room);if(app.notify(result,result.favorite?'favoriteMoved':'placed'))app.ui.close();return},
'light':(app,value,origin)=>{
   if(app.ui.panel)app.ui.close();sim.changeLight(app.state);app.save();app.refreshUI();if(sim.isNight(app.state))app.say(app.ui.t('nightHint'));return;
  },
'discover':(app,value,origin)=>{
   const result=sim.discover(app.state);if(result.ok){app.save();app.audio.effect('secret');app.ui.open('journal');
   app.say(app.ui.t('newSecret'))}else app.say(app.ui.t(result.reason)+(result.needed?` ${app.ui.t('shyNeed')} ${app.ui.n(result.needed)}%`:''));return;
  },
'camera':(app,value,origin)=>{app.storyUI?.clear();app.world?.clearObjectSelection();app.world?.home();
app.host.dataset.focusRoom='';app.host.dataset.focusDoll='';app.roomViews.update();app.objectControls?.update();return;},
'focus-doll':(app,value,origin)=>{if(app.state.dolls.some(d=>d.id===value)){app.ui.close();
if(app.world?.focusDoll(value)){app.host.dataset.focusDoll=value;app.host.dataset.focusRoom='';app.roomViews.update()}}return;},
'focus-room':(app,value,origin)=>{if(app.world?.focusRoom(value)){if(objectInfo(app.state,app.storyUI?.selected)?.room!==value){app.storyUI?.clear();
app.world?.clearObjectSelection()}app.host.dataset.focusRoom=value;app.host.dataset.focusDoll='';app.ui.tick();app.roomViews.update();app.objectControls?.update()}return;},
'zoom-in':(app,value,origin)=>{app.world?.zoom(1.2);return;},
'zoom-out':(app,value,origin)=>{app.world?.zoom(1/1.2);return;},
'pause':(app,value,origin)=>{app.cancelWorkInput();app.manualPause=!app.manualPause;app.storyUI?.clear();
app.world?.clearObjectSelection();app.syncPause();app.world?.setEnabled(!app.panelOpen&&!app.manualPause);app.refreshUI();return;},
'sound':async (app,value,origin)=>{
   let unavailable=false;if(app.state.settings.muted){if(await app.audio.enable()){app.state.settings.muted=false;
   app.audio.setPaused(app.state.paused)}else unavailable=true}else{app.state.settings.muted=true;app.audio.mute()}app.refreshUI();app.saveSettings();
   if(unavailable){if(app.session.entered)app.ui.toast(app.ui.t('audioUnavailable'));else app.homeUI?.notify(app.ui.t('audioUnavailable'))}return;
  },
'setting':(app,value,origin)=>{
   if(value.key==='locale'&&['en','ar'].includes(value.value))app.state.settings.locale=value.value;
   if(value.key==='quality'&&['auto','low','high'].includes(value.value))app.state.settings.quality=value.value;
   if(value.key==='motion')app.state.settings.reducedMotion=Boolean(value.value);
   if(value.key==='largeText')app.state.settings.largeText=Boolean(value.value);
   app.refreshUI();app.saveSettings();return;
  },
'save-export':app=>exportSave(app),
'save-import':(app,file)=>importSave(app,file),
'reset-yes':app=>replaceRun(app,sim.createState(),app.state.settings),
};
function runCommand(app,action,value,origin='control'){
 if(!app.session.entered&&!['home-play','home-reload','home-sound','home-language','sound'].includes(action))return;
 return handlers[action]?.(app,value,origin);
}
// While the residents wave, glance at the busiest room for a moment, then return,
// but only if the player has not touched anything and motion is allowed.
function welcomeGlance(app){
 if(app.state.settings.reducedMotion)return;const room=waveRoom(app.state);if(!room)return;
 let touched=false;const mark=()=>{touched=true};app.host.addEventListener('pointerdown',mark,{once:true,capture:true});app.host.addEventListener('keydown',mark,{once:true,capture:true});
 setTimeout(()=>{if(touched||app.ui.panel||app.state.paused)return;app.dispatch('focus-room',room);
  setTimeout(()=>{if(!touched&&app.host.dataset.focusRoom===room)app.dispatch('camera')},2600)},700);
}
export function installCommands(app){app.dispatch=(action,value,origin='control')=>runCommand(app,action,value,origin)}
