import {restorationReady} from './simulation.js';
import {translate,number} from './i18n.js';
import {icon} from './icons.js';

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

// Builds the tea work surface beside #ui and returns it with the elements the surface updates.
export function mountTeaSurface(host){
 const root=document.createElement('section');root.className='tea-playfield';root.hidden=true;
 root.setAttribute('aria-labelledby','tea-work-title');
 root.innerHTML=`<header class="tea-heading"><h2 id="tea-work-title"></h2><p class="tea-progress"></p></header>
  <div class="tea-work-strip" role="region"><div class="tea-work-copy"><p id="tea-work-instructions"><span class="tea-cue-full"></span><span
    class="tea-cue-short" aria-hidden="true"></span></p><p id="tea-work-status"></p><p class="tea-work-detail"></p></div><button type="button"
    class="tea-exit" data-tea-action="exit">${icon('arrow')}<span></span></button></div>
  <div id="tea-cup-readout" class="sr-only" role="group"></div><p id="tea-work-announcement" class="sr-only" role="status" aria-live="polite" aria-atomic="true"></p>`;
 // #ui is rebuilt for sound, pause and locale changes. Keep this input surface
 // beside it so a refresh cannot remove a captured pointer or the Exit button.
 const mount=host.parentElement??host;mount.append(root);
 const parts={title:root.querySelector('#tea-work-title'),progress:root.querySelector('.tea-progress'),full:root.querySelector('.tea-cue-full'),
   short:root.querySelector('.tea-cue-short'),status:root.querySelector('#tea-work-status'),detail:root.querySelector('.tea-work-detail'),
   strip:root.querySelector('.tea-work-strip'),exit:root.querySelector('[data-tea-action="exit"]'),
     cups:root.querySelector('#tea-cup-readout'),announcement:root.querySelector('#tea-work-announcement')};
 return {root,parts};
}
