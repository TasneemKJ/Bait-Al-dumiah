// Keeps the DOM shell, the physical ritual surfaces and the pause state in step with the game state.
import * as sim from './simulation.js';
import {ACTIVITY_ROOM} from './content.js';

export function installView(app){
 const {session,audio,canvas,host}=app;
 const physicalActivity=()=>['tea','stitch','lullaby'].includes(app.state.activities.active?.id)?app.state.activities.active.id:null;
 function cancelWorkInput(){app.teaUI?.cancel();app.stitchUI?.cancel();app.chimeUI?.cancel()}
 // Inactive adapters restore their canvas attributes before the active owner
 // updates them. A rapid tea/sewing transition must keep the correct shortcuts.
 function updateWorkUI(dt=0){
  const active=physicalActivity(),adapters={tea:app.teaUI,stitch:app.stitchUI,lullaby:app.chimeUI};
  for(const [id,adapter] of Object.entries(adapters))if(id!==active)adapter?.update(0);
  if(active)adapters[active]?.update(dt);
  const chime=sim.chimeStatus(app.state);
  if(chime?.tone&&chime.tone!==app.lastChimeTone)audio.chime(chime.sounding);
  app.lastChimeTone=chime?.tone??null;
 }
 // Reattach scene controls synchronously; a slow graphics frame must not hide the UI.
 function refreshUI(){app.ui.refresh();app.roomViews.update();app.objectControls?.update();app.storyUI?.update();updateWorkUI();app.homeUI?.refresh()}
 function syncPause(){app.state.paused=!session.entered||app.manualPause||Boolean(app.panelOpen&&app.panelOpen!=='activities')||
   document.hidden||app.fatal;if(app.state.paused)cancelWorkInput();audio.setPaused(app.state.paused)}
 function enterWork(id){
  if(!['tea','stitch','lullaby'].includes(id))return;
  if(id==='lullaby')audio.stopVoices();
  if(app.ui.panel)app.ui.close();app.ui.collapseTools();app.storyUI?.clear();app.objectControls?.collapse();app.world?.clearObjectSelection();
  host.dataset.focusRoom=ACTIVITY_ROOM[id];host.dataset.focusDoll='';
  app.world?.setTeaActive(id==='tea');app.world?.setStitchActive(id==='stitch');
  app.world?.setChimeActive(id==='lullaby');app.world?.setEnabled(!app.state.paused);
  updateWorkUI();app.roomViews.update();app.objectControls?.update();canvas.focus({preventScroll:true});app.save();
 }
 function leaveWork(){
  const id=physicalActivity();if(!id)return;
  const storyResult=app.state.activities.active?.result?.storyResult;
  cancelWorkInput();sim.endActivity(app.state);app.world?.setTeaActive(false);app.world?.setStitchActive(false);app.world?.setChimeActive(false);
  app.world?.setEnabled(!app.panelOpen&&!app.manualPause&&!app.fatal);updateWorkUI();
  host.dataset.focusRoom=ACTIVITY_ROOM[id];host.dataset.focusDoll='';app.storyUI?.clear();if(storyResult)app.storyUI?.respond(storyResult.message);
  app.roomViews.update();app.objectControls?.update();app.ui.tick();canvas.focus({preventScroll:true});app.save();
 }
 Object.assign(app,{physicalActivity,cancelWorkInput,updateWorkUI,refreshUI,syncPause,enterWork,leaveWork});
}
