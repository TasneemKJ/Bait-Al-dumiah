// Commands: Camera, panels, pause and tool state.
import * as sim from './simulation.js';
import {objectInfo} from './object-ui.js';

export const cameraCommands={
'tools-state':(app,value,origin)=>{if(value){app.storyUI?.clear();
app.world?.clearObjectSelection();app.objectControls?.collapse()}return;},
'panel-state':(app,value,origin)=>{
   // Dismissing a sequence also leaves it. Physical work remains in its scene
   // when the optional catalog closes during entry or a paused modal closes.
   if(app.panelOpen==='activities'&&value!=='activities'&&!app.physicalActivity())sim.endActivity(app.state);
   if(value)app.cancelWorkInput();app.panelOpen=value||false;app.syncPause();app.storyUI?.clear();
   app.world?.setEnabled(!app.panelOpen&&!app.manualPause&&!app.carrying&&!app.fatal);
   app.world?.clearObjectSelection();if(!value)app.ui.clearObject();app.objectControls?.update();app.updateWorkUI();
   if(value==='household'&&
     app.world){try{app.ui.setPortraits(app.world.getPortraits())}catch(error){
       console.warn('Resident portrait unavailable:',error)}}return;},
'camera':(app,value,origin)=>{app.storyUI?.clear();app.world?.clearObjectSelection();app.world?.home();
app.host.dataset.focusRoom='';app.host.dataset.focusDoll='';app.roomViews.update();
app.objectControls?.update();return;},
'focus-doll':(app,value,origin)=>{if(app.state.dolls.some(d=>d.id===value)){app.ui.close();
if(app.world?.focusDoll(value)){app.host.dataset.focusDoll=value;
app.host.dataset.focusRoom='';app.roomViews.update()}}return;},
'focus-room':(app,value,origin)=>{if(app.world?.focusRoom(value)){if(objectInfo(app.state,
  app.storyUI?.selected)?.room!==value){app.storyUI?.clear();
app.world?.clearObjectSelection()}app.host.dataset.focusRoom=value;app.host.dataset.focusDoll='';
app.ui.tick();app.roomViews.update();app.objectControls?.update()}return;},
'zoom-in':(app,value,origin)=>{app.world?.zoom(1.2);return;},
'zoom-out':(app,value,origin)=>{app.world?.zoom(1/1.2);return;},
'pause':(app,value,origin)=>{app.cancelWorkInput();app.manualPause=!app.manualPause;app.storyUI?.clear();
app.world?.clearObjectSelection();app.syncPause();
app.world?.setEnabled(!app.panelOpen&&!app.manualPause);app.refreshUI();return;},
};
