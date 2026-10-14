// The Today sheet: the day's small errands (and, as the house grows, the lantern that they feed).
import {errandDef} from './simulation.js';
import {icon} from './icons.js';

function errandRow(item,t){
 const e=errandDef(item.id),state=item.done?'done':'open';
 return `<li class="errand ${state}" data-errand="${item.id}">${icon(e.icon)}<span>${t('errand-'+item.id)}</span><em
   >${item.done?icon('check')+t('errandDoneMark'):t('errandOpen')}</em></li>`;
}
export function todayMarkup(s,{t}){
 return `<h2 id="sheet-title">${t('today')}</h2><p class="sheet-intro">${t('todayIntro')}</p><ul
   class="errand-list">${s.grove.errands.map(item=>errandRow(item,t)).join('')}</ul>`;
}
