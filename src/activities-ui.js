import {ACTIVITIES,ROOMS,ACTIVITY_THRESHOLDS,ACTIVITY_COOLDOWN,ACTIVITY_DAILY_CAP} from './content.js';
import {activityLevel,activityRewardReady,restorationReady} from './simulation.js';
import {icon} from './icons.js';

function rewardNote(s,a,t,n){const ready=activityRewardReady(s,a.id),capped=s.activities.completed[a.id]>=ACTIVITY_DAILY_CAP;return ready?'+'+n(7+activityLevel(s,a.id)*2)+' '+t('buttons'):capped?t('activityCap'):t('activityCooldown').replace('{x}',n(Math.max(0,Math.ceil(ACTIVITY_COOLDOWN-(s.elapsed-s.activities.lastReward[a.id])))))}
export function updateActivityStatus(host,s,t,n){
 for(const a of ACTIVITIES){
  const note=host.querySelector(`[data-activity-note="${a.id}"]`),start=host.querySelector(`.ritual-card [data-id="${a.id}"]`),ready=activityRewardReady(s,a.id);
  if(note)note.textContent=rewardNote(s,a,t,n);
  if(start){start.classList.toggle('primary',ready);start.querySelector('span').textContent=t(ready?'activityStart':'practiceLabel')}
 }
 const earning=host.querySelector('.ritual-earning'),id=s.activities.active?.id;
 if(earning&&id)earning.textContent=activityRewardReady(s,id)?'+'+n(7+activityLevel(s,id)*2)+' '+t('buttons'):t('practiceLabel');
}

export function activityMarkup(s,t,n,button,result){
 const active=s.activities.active;
 // Physical tea and sewing own their actual work surfaces. Neither opens a
 // sequence grid or a result sheet, even when started from this catalog.
 if(active?.id==='tea'||active?.id==='stitch')return '';
 if(active){
  const a=ACTIVITIES.find(a=>a.id===active.id),study=active.phase==='study',concealed=a.id==='stitch'&&!study&&!active.hint,reverse=a.id==='lullaby';
  return `<section class="ritual-play"><p class="eyebrow">${t(a.resident)} · ${t(a.room)}</p><h2 id="sheet-title">${t('activity-'+a.id)}</h2><p class="sheet-intro">${t('activity-'+a.id+'Intro')}</p>
   <div class="ritual-pattern" role="group" aria-label="${t('patternLabel')}">${active.pattern.map((choice,i)=>`<div class="pattern-step ${(!reverse?i<active.cursor:i>=active.pattern.length-active.cursor)?'done':(!reverse?i===active.cursor:i===active.pattern.length-1-active.cursor)?'current':''}" ${(!reverse?i===active.cursor:i===active.pattern.length-1-active.cursor)?'aria-current="step"':''}><small>${n(reverse?active.pattern.length-i:i+1)}</small>${icon(concealed?'moon':a.choices[choice])}<span>${concealed?t('hiddenThread'):t('choice-'+a.id+'-'+choice)}</span></div>`).join('')}</div>
   <p class="ritual-instructions">${t('activityRule-'+a.id)}</p><p class="ritual-feedback" role="status">${result?.mistake?t('activityMistake'):t('activityNext')+' '+n(active.cursor+1)+' / '+n(active.pattern.length)}</p>
   ${study?button('recall-ready',t('recallReady'),'play','class="primary wide"'):a.id==='stitch'?button('activity-hint',t(active.hint?'hideHint':'showHint'),'spark','class="wide"'):''}
   <div class="ritual-choices" role="group" aria-label="${t('choicesLabel')}">${a.choices.map((ico,i)=>button('activity-input',t('choice-'+a.id+'-'+i),ico,`data-choice="${i}" class="ritual-choice" ${study?'disabled':''}`)).join('')}</div>
   <p class="ritual-earning">${activityRewardReady(s,a.id)?icon('button')+' +'+n(7+activityLevel(s,a.id)*2)+' '+t('buttons'):t('practiceLabel')}</p>
   ${button('end-activity',t('activityExit'),'arrow','class="text-button"')}</section>`;
 }
 const outcome=result?.complete?`<div class="ritual-result" role="status">${icon('check')}<h3>${t('activityFinished')}</h3><p>${result.practice?t('activityPractice'):t('activityReward')+' +'+n(result.reward+result.bonus)+' '+t('buttons')}</p>${button('begin-activity',t('activityAgain'),'play',`data-id="${result.id}" class="primary"`)}</div>`:'';
 return `<h2 id="sheet-title">${t('activities')}</h2><p class="sheet-intro">${t('activitiesIntro')}</p>${outcome}
  <div class="ritual-catalog">${ACTIVITIES.map(a=>{
   const points=s.activities.mastery[a.id],level=activityLevel(s,a.id),next=ACTIVITY_THRESHOLDS[level+1],ready=activityRewardReady(s,a.id);
   const note=rewardNote(s,a,t,n);
   return `<article class="ritual-card"><div class="ritual-title">${icon(a.icon)}<div><h3>${t('activity-'+a.id)}</h3><small>${t(a.resident)} · ${t(a.room)}</small></div><span class="ritual-level">${n(level+1)}</span></div><p>${t('activity-'+a.id+'Intro')}</p><div class="ritual-mastery"><label>${t('masteryLabel')} <strong>${n(points)}${next?' / '+n(next):''}</strong></label><meter min="0" max="${next??Math.max(9,points)}" value="${points}" aria-label="${t('masteryLabel')} · ${t('activity-'+a.id)}"></meter></div><p class="ritual-reward-note" data-activity-note="${a.id}">${note}</p>${button('begin-activity',t(ready?'activityStart':'practiceLabel'),a.icon,`data-id="${a.id}" class="${ready?'primary':''}"`)}</article>`;
  }).join('')}</div>
  <h3 class="section-heading" id="restoration-title">${t('restoreTitle')} <small>${n(Object.values(s.restoration).reduce((a,b)=>a+b,0))}/${n(12)}</small></h3><p class="sheet-intro">${t('restoreIntro')}</p>
  <div class="restoration-catalog">${ROOMS.map(r=>{const next=restorationReady(s,r.id);return `<article class="restoration-card"><div class="ritual-title">${icon('home')}<h3>${t(r.id)}</h3><small>${n(next.tier)}/3</small></div><ol class="restoration-stages">${[1,2,3].map(i=>`<li class="${i<=next.tier?'done':''}">${icon(i<=next.tier?'check':'spark')}<span>${t('restore-'+r.id+'-'+i)}</span></li>`).join('')}</ol>${next.complete?`<p class="restoration-complete">${t('restorationDone')}</p>`:`<p>${t('activity-'+next.activity)} · ${t('masteryLabel')} ${n(s.activities.mastery[next.activity])}/${n(next.required)}</p>${button('restore-room',t('restoreAction')+' · '+n(next.cost)+' '+t('buttons'),'home',`data-id="${r.id}" class="primary" ${next.ready&&s.buttons>=next.cost?'':'disabled'}`)}`}</article>`}).join('')}</div>`;
}
