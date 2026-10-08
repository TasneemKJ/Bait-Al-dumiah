// Commands: Exporting, importing and resetting the save.
import * as sim from './simulation.js';
import {downloadSave,readSaveFile} from './save-transfer.js';

// File reads may finish out of order. Identity belongs to this app instance,
// and is transient; it must never enter the saved house.
const importRequests=new WeakMap();

function exportSave(app){
 try{downloadSave(app.state);app.say(app.ui.t('saveExported'))}catch{app.say(app.ui.t('saveExportFailed'))}
}
// A new run (import or reset) replaces the app.state wholesale and returns the house to its idle view.
function replaceRun(app,next,settings){
 next.settings={...settings};
 // Keep the running house and its controls untouched if the canonical write
 // fails or another tab has replaced the save while a file was being read.
 if(!app.save(next))return false;
 app.cancelWorkInput();app.world?.setTeaActive(false);app.world?.setStitchActive(false);
 app.world?.setChimeActive(false);app.notices.length=0;
 app.ui.close();app.ui.clearPlacement();app.ui.setActivityResult(null);
 app.state=next;app.manualPause=false;app.syncPause();app.dispatch('camera');
 app.world?.setPlacement(null);app.refreshUI();return true;
}
function importSave(app,file){
 const request={};importRequests.set(app,request);
 return readSaveFile(file,sim.readSave).then(result=>{
  if(importRequests.get(app)!==request)return;
  if(!result){app.say(app.ui.t('saveImportFailed'));return}
  if(replaceRun(app,result.state,{...result.state.settings,muted:app.state.settings.muted}))
   app.say(app.ui.t('saveImported'));
 }).catch(()=>{if(importRequests.get(app)===request)app.say(app.ui.t('saveImportFailed'))});
}
// Command table: one handler per action name. A handler returns early where the
// former switch used break.
export const saveCommands={
'save-export':app=>exportSave(app),
'save-import':(app,file)=>importSave(app,file),
'reset-yes':app=>{importRequests.delete(app);return replaceRun(app,sim.createState(),app.state.settings)},
};
