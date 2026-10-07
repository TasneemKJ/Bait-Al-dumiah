// Commands: Exporting, importing and resetting the save.
import * as sim from './simulation.js';
import {downloadSave,readSaveFile} from './save-transfer.js';

function exportSave(app){
 try{downloadSave(app.state);app.say(app.ui.t('saveExported'))}catch{app.say(app.ui.t('saveExportFailed'))}
}
// A new run (import or reset) replaces the app.state wholesale and returns the house to its idle view.
function replaceRun(app,next,settings){
 app.cancelWorkInput();app.world?.setTeaActive(false);app.world?.setStitchActive(false);
 app.world?.setChimeActive(false);app.notices.length=0;
 app.ui.close();app.ui.clearPlacement();app.ui.setActivityResult(null);
 next.settings={...settings};app.state=next;app.manualPause=false;app.syncPause();app.dispatch('camera');
 app.world?.setPlacement(null);app.save();app.refreshUI();
}
function importSave(app,file){
 readSaveFile(file,sim.readSave).then(result=>{
  if(!result){app.say(app.ui.t('saveImportFailed'));return}
  replaceRun(app,result.state,{...result.state.settings,muted:app.state.settings.muted});
  app.say(app.ui.t('saveImported'));
 }).catch(()=>app.say(app.ui.t('saveImportFailed')));
}
// Command table: one handler per action name. A handler returns early where the
// former switch used break.
export const saveCommands={
'save-export':app=>exportSave(app),
'save-import':(app,file)=>importSave(app,file),
'reset-yes':app=>replaceRun(app,sim.createState(),app.state.settings),
};
