// Commands: Hidden-house story objects, carried items and keepsakes.
import * as sim from './simulation.js';
import {objectInfo,sceneObjectAction} from './object-ui.js';

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
export const storyCommands={
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
   app.ui.openObject(value);app.world?.focusRoom(o.room,true);app.host.dataset.focusRoom=o.room;
   app.host.dataset.focusDoll='';app.roomViews.update();return;
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
   app.audio.effect(result.effect==='moon-bed'?'moon-bed':result.effect==='music-cabinet'?
     'musicbox':'care');app.save()}else app.storyUI?.respond(result.reason);return;
  },
'use-object':(app,value,origin)=>{
   const item=app.state.decor.find(d=>d.id===value),result=sim.useDecor(app.state,value);
   if(result.ok){if(app.ui.panel)app.ui.close();app.dispatch('focus-room',item.room);
   app.audio.effect(item.item==='musicbox'?'musicbox':item.item==='mobile'?'mobile':'care');
   app.storyUI?.respond('keepsake-'+(result.effect==='water'?'watered':result.effect==='light'?
     'lit':result.effect==='dim'?'dimmed':result.effect==='wind'?
     'wound':'rocked'));app.save();app.storyUI?.update()}else app.storyUI?.respond(result.reason);return;
  },
'rotate-object':(app,value,origin)=>{if(app.notify(sim.rotateDecor(app.state,value),'objectRotated'))app.ui.refresh();return;},
'move-object':(app,value,origin)=>{app.ui.beginMove(value);return;},
'pack-object':(app,value,origin)=>{if(app.notify(sim.remove(app.state,value),'packed')){app.ui.close();app.objectControls?.update()}return;},
'relocate-object':(app,value,origin)=>{if(app.notify(sim.moveDecor(app.state,value.id,value.room,value.slot),'objectMoved')){app.ui.clearPlacement();
app.world?.setPlacement(null);app.dispatch('focus-room',value.room);app.save()}return},
};
