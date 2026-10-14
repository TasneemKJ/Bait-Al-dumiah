// The Today sheet: the day's small errands (and, as the house grows, the lantern that they feed).
import {errandDef,ERRAND_EMBERS,lanternLevel,nextLantern} from './simulation.js';
import {icon} from './icons.js';

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
   >${progress}</small></div>${tend}</section>`;
}
export function todayMarkup(s,c){
 const {t,n}=c;
 return `<h2 id="sheet-title">${t('today')}</h2><p class="sheet-intro">${t('todayIntro')}</p>${lanternCard(s,c)}<p
   class="ember-count">${icon('spark')}<span>${t('embers')}</span><strong>${n(s.grove.embers)}</strong></p><ul
   class="errand-list">${s.grove.errands.map(item=>errandRow(item,c)).join('')}</ul>`;
}
