import {restorationReady,stitchSectionProgress} from './simulation.js';
import {translate,number} from './i18n.js';

const fill=(text,values)=>text.replace(/\{(\w+)\}/g,(_,key)=>values[key]??'');
export const coordinate=value=>Math.round(value*100);
export const point=value=>Number.isFinite(value?.x)&&Number.isFinite(value?.y);

// This describes accepted work and actual needle/guide positions. The only
// changing announcements are section, repair and finish transitions.
export function stitchView(state,stitch,{inputMode='pointer',reason=null}={}){
 if(!stitch)return null;
 const locale=state.settings.locale,t=key=>translate(locale,key),n=value=>number(locale,value);
 const keyboard=inputMode==='keyboard',finished=stitch.phase==='finished',mend=stitch.mode==='mend';
 const total=stitch.sections.length,covered=stitch.completedSections>=total;
 const {section,percent}=stitchSectionProgress(stitch);
 const prefix=finished?(mend?'stitchMendFinished':'stitchFinished'):covered?'stitchReady':stitch.loose?'stitchRepair':'stitchPointer';
 const instructions=t(keyboard?(prefix==='stitchPointer'?'stitchKeyboardInstructions':prefix+'Keyboard'):prefix+'Instructions');
 const shortInstructions=keyboard&&prefix==='stitchPointer'?t('stitchKeyboardShort'):keyboard?instructions:t(prefix+'Short');
 let progress=fill(t('stitchProgress'),{done:n(stitch.completedSections),total:n(total)});
 let status=stitch.loose?t('stitchLoose'):covered?t('stitchReadyStatus'):fill(t('stitchSectionProgress'),{section:n(section),percent:n(percent)}),detail='';
 const position=(key,value)=>fill(t(key),{x:n(coordinate(value.x)),y:n(coordinate(value.y))});
 let readout=position('stitchNeedlePosition',stitch.needle);
 if(stitch.nextGuidePoint)readout+=' '+position('stitchGuidePosition',stitch.nextGuidePoint);
 readout+=' '+t('stitchAxisInstructions');
 if(finished){
  if(mend){progress='';status=t('story-mended-friend-1-done')}
  else{
   progress=fill(t('stitchScore'),{score:n(stitch.result?.score??0)});
   if(stitch.best!==null)progress+=' · '+fill(t('stitchBest'),{score:n(stitch.best)});
   status=stitch.result?.practice?t('practiceLabel'):t('activityReward')+' +'+n((stitch.result?.reward??0)+(stitch.result?.bonus??0))+' '+t('buttons');
   const next=restorationReady(state,'studio');
   detail=next.complete?t('stitchHomeRestored'):fill(t(next.ready?'stitchRestoreReady':'stitchRestoreGoal'),{earned:n(state.activities.mastery.stitch),needed:n(next.required),cost:n(next.cost)});
  }
 }
 if(reason)status=t(reason);
 return {title:t(mend?'stitchMendTitle':'activity-stitch'),instructions,shortInstructions,progress,status,detail,readout};
}
