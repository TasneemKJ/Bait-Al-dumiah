// The Today sheet: the day's small errands (and, as the house grows, the lantern that they feed).
import {lanternWonders,errandDef,errandsReady,tomorrowErrand,daySettled,ERRAND_EMBERS,lanternLevel,
  nextLantern} from './simulation.js';
import {icon} from './icons.js';

// Colour returns to the house as the lantern grows: a soft saturation lift, none at all at the top level.
export const houseColour=level=>{const l=Math.max(0,Math.min(5,Number.isFinite(level)?level:0));
 return Math.round((.88+.024*l)*1000)/1000};
export function syncHouseColour(root,s){
 const value=houseColour(lanternLevel(s)),text=value>=1?'none':`saturate(${value})`;
 if(root.style.getPropertyValue('--house-colour')!==text)root.style.setProperty('--house-colour',text);
}
// Today has news when an errand waits to be collected or embers wait for the lantern.
export const todayNews=s=>errandsReady(s)>0||s.grove.embers>0;
// The clue's hand-off to Today: collect first, then tend.
export function todayStep(s,t){
 if(errandsReady(s))return {copy:t('objectiveErrand'),label:t('collect'),ico:'lamp',action:'panel',value:'today'};
 if(s.grove.embers>0)return {copy:t('objectiveTend'),label:t('tend'),ico:'lamp',action:'panel',value:'today'};
 return null;
}
function errandRow(item,{t,n,button}){
 const e=errandDef(item.id),state=item.done?'done':'open';
 const end=item.collected?`<em>${icon('check')}${t('collected')}</em>`:item.done?button('collect-errand',
   t('collect')+' · '+icon('spark')+n(ERRAND_EMBERS),null,`data-id="${item.id}" class="primary"`):
   `<em>${t('errandOpen')}</em>`;
 return `<li class="errand ${item.collected?'collected':state}" data-errand="${item.id}">${icon(e.icon)}<span
   >${t('errand-'+item.id)}</span>${end}</li>`;
}
function lanternCard(s,{t,n,button}){
 const level=lanternLevel(s),next=nextLantern(s),warmth=s.grove.warmth;
 const progress=next===null?t('lanternFull'):`${t('lanternWarmth')} ${n(warmth)} / ${n(next)}`;
 const tend=button('tend-lantern',t('tend')+' · '+icon('spark')+n(s.grove.embers),null,
   `class="primary" ${s.grove.embers?'':'disabled'}`);
 return `<section class="lantern-card" data-level="${level}"><span class="lantern-art"
   aria-hidden="true"><i></i></span><div><strong>${t('lanternTitle')}</strong><small>${t('lantern'+level)}</small><meter
   min="0" max="${next??warmth}" value="${warmth}" aria-label="${t('lanternWarmth')}"></meter><small
   >${progress}</small></div>${tend}</section><ol class="lantern-wonders" aria-label="${t('wondersLabel')}">${
   lanternWonders(s).map(w=>`<li class="${w.reached?'reached':''}">${icon(w.reached?'check':'spark')}<span
   >${t('wonder-'+w.id)}</span></li>`).join('')}</ol>`;
}
// The day's close: once every errand is collected, the sheet settles the day and peeks at tomorrow.
function settledCard(s,t){
 if(!daySettled(s))return '';const next=tomorrowErrand(s);
 return `<section class="day-settled"><span aria-hidden="true">☾</span><div><strong>${t('daySettledTitle')}</strong><p
   >${t('daySettledText')}</p>${next?`<small>${t('tomorrowPeek')} ${t('errand-'+next)}</small>`:''}</div></section>`;
}
export function todayMarkup(s,c){
 const {t,n}=c;
 return `<h2 id="sheet-title">${t('today')}</h2><p class="sheet-intro">${t('todayIntro')}</p>${lanternCard(s,c)}<p
   class="ember-count">${icon('spark')}<span>${t('embers')}</span><strong>${n(s.grove.embers)}</strong></p><ul
   class="errand-list">${s.grove.errands.map(item=>errandRow(item,c)).join('')}</ul>${settledCard(s,t)}`;
}
