import {restorationReady} from './simulation.js';
import {translate,number} from './i18n.js';

const fill=(text,values)=>text.replace(/\{(\w+)\}/g,(_,key)=>values[key]??'');
export const percent=value=>Math.round(Math.max(0,value)*100);

// A read-only description of the same visible cups. Percentages support a
// keyboard player; no answer, score or ready flag is submitted by this UI.
export function teaView(state,tea,{inputMode='pointer',reason=null}={}){
 if(!tea)return null;
 const locale=state.settings.locale,t=key=>translate(locale,key),n=value=>number(locale,value);
 const keyboard=inputMode==='keyboard',served=tea.phase==='served',guest=tea.mode==='guest';
 const cups=tea.cups.map(c=>fill(t('teaCupState'),{cup:n(c.id+1),fill:n(percent(c.fill)),target:n(percent(c.target))})+(c.overfilled?' · '+t('teaCupOverfilled'):c.ready?' · '+t('teaCupReady'):''));
 const aimed=tea.cups.findIndex(c=>c.id===tea.aimedCup),overfilled=tea.cups.some(c=>c.overfilled);
 const prefix=served?(guest?'teaGuestServed':'teaServed'):tea.ready?'teaReady':overfilled?'teaEmpty':'teaPointer';
 let instructions=t(keyboard?(prefix==='teaPointer'?'teaKeyboardInstructions':prefix+'Keyboard'):prefix+'Instructions');
 const shortInstructions=keyboard&&prefix==='teaPointer'?t('teaKeyboardShort'):keyboard?instructions:t(prefix+'Short');
 let progress=fill(t('teaProgress'),{ready:n(tea.cups.filter(c=>c.ready).length),total:n(tea.cups.length)});
 let status=aimed>=0?cups[aimed]:t('teaAimBetween'),detail='';
 if(served){
  if(guest){progress='';status=t('story-guest-tea-2-done')}
  else{
   progress=fill(t('teaScore'),{score:n(tea.result?.score??0)});
   if(tea.best!==null)progress+=' · '+fill(t('teaBest'),{score:n(tea.best)});
   status=tea.result?.practice?t('practiceLabel'):t('activityReward')+' +'+n((tea.result?.reward??0)+(tea.result?.bonus??0))+' '+t('buttons');
   const next=['kitchen','parlor'].map(room=>({room,...restorationReady(state,room)})).filter(r=>!r.complete).sort((a,b)=>a.required-b.required)[0];
   detail=next?fill(t(next.ready?'teaRestoreReady':'teaRestoreGoal'),{room:t(next.room+'Short'),earned:n(state.activities.mastery.tea),needed:n(next.required),cost:n(next.cost)}):t('teaHomeRestored');
  }
 }
 if(reason)status=t(reason);
 return {title:t(guest?'story-guest-tea-title':'activity-tea'),instructions,shortInstructions,progress,status,detail,cups};
}
