// Commands: Tea, sewing and chime rituals and the activity sheet.
import * as sim from './simulation.js';
import {ACTIVITY_ROOM} from './content.js';

// A ritual surface asks the simulation to replay; it never inspects the run's phase itself.
function replayWork(app,id){
 if(app.fatal)return;const result=sim.replayActivity(app.state,id);if(!result.ok)return;
 app.cancelWorkInput();if(result.restarted)app.enterWork(id);else app.updateWorkUI();
}
export const activitiesCommands={
'recall-ready':(app,value,origin)=>{if(sim.startRecall(app.state).ok)app.ui.setActivityResult(null);return;},
'activity-hint':(app,value,origin)=>{if(sim.toggleActivityHint(app.state).ok)app.ui.setActivityResult(null);return;},
'begin-activity':(app,value,origin)=>{
   if(app.manualPause||app.fatal){app.say(app.ui.t('pausedActivity'));return}if(app.ui.panel)app.ui.close();
   const result=sim.beginActivity(app.state,value);
   if(result.ok){app.ui.setActivityResult(null);if(app.physicalActivity())app.enterWork(value);
   else{app.ui.open('activities');app.dispatch('focus-room',ACTIVITY_ROOM[value]);
   app.save()}}else app.say(app.ui.t(result.reason));return;
  },
'tea-control':(app,value,origin)=>{if(!app.fatal&&!app.panelOpen)sim.controlTea(app.state,value);return;},
'tea-release':(app,value,origin)=>{sim.releaseTea(app.state);return;},
'tea-empty':(app,value,origin)=>{
   const result=sim.emptyTeaCup(app.state,value);app.teaUI?.respond(result.ok?null:result.reason);
   if(result.ok)app.audio.effect('care');app.teaUI?.update(0);return;
  },
'tea-serve':(app,value,origin)=>{
   const result=sim.serveTea(app.state);app.teaUI?.respond(result.ok?null:result.reason);
   if(result.ok){app.audio.effect('place');app.save();app.ui.tick();app.storyUI?.update()}app.teaUI?.update(0);return;
  },
'tea-replay':app=>replayWork(app,'tea'),
'tea-exit':app=>app.leaveWork('tea'),
'stitch-control':(app,value,origin)=>{if(!app.fatal&&!app.panelOpen)sim.controlStitch(app.state,value);return;},
'stitch-release':(app,value,origin)=>{sim.releaseStitch(app.state);return;},
'stitch-unpick':(app,value,origin)=>{
   const result=sim.unpickStitch(app.state);app.stitchUI?.respond(result.ok?null:result.reason);
   if(result.ok)app.audio.effect('care');app.updateWorkUI();return;
  },
'stitch-finish':(app,value,origin)=>{
   const result=sim.finishStitch(app.state);app.stitchUI?.respond(result.ok?null:result.reason);
   if(result.ok){app.audio.effect('place');app.save();app.ui.tick();app.storyUI?.update()}app.updateWorkUI();return;
  },
'stitch-replay':app=>replayWork(app,'stitch'),
'stitch-exit':app=>app.leaveWork('stitch'),
'chime-grab':(app,value,origin)=>{if(!app.fatal&&!app.panelOpen)sim.grabChime(app.state,value);return;},
'chime-pull':(app,value,origin)=>{if(!app.fatal&&!app.panelOpen)sim.pullChime(app.state,value);return;},
'chime-cancel':(app,value,origin)=>{sim.cancelChime(app.state);return;},
'chime-focus':(app,value,origin)=>{app.world?.setChimeSelection(value);return;},
'chime-release':(app,value,origin)=>{
   const result=sim.releaseChime(app.state);if(result.complete){app.save();app.ui.tick()}app.updateWorkUI();return;
  },
'chime-replay':app=>replayWork(app,'lullaby'),
'chime-exit':app=>app.leaveWork('lullaby'),
'activity-input':(app,value,origin)=>{
   const result=sim.activityInput(app.state,value);
   if(result.ok){if(!result.mistake)app.audio.effect(result.complete?'place':'care');
   app.ui.setActivityResult(result);app.save();app.ui.tick()}else app.say(app.ui.t(result.reason));return;
  },
'end-activity':(app,value,origin)=>{if(app.physicalActivity())app.leaveWork();
else{sim.endActivity(app.state);app.ui.setActivityResult(null);app.ui.close();app.save()}return;},
'restore-room':(app,value,origin)=>{
   const result=sim.restoreRoom(app.state,value);if(result.ok){app.ui.close();
   app.world?.focusRoom(value);app.host.dataset.focusRoom=value;app.host.dataset.focusDoll='';
   app.audio.effect('secret');app.say(app.ui.t('restoreSuccess'));app.save();
   app.refreshUI()}else app.say(app.ui.t(result.reason));return;
  },
};
