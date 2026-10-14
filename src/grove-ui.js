// The Today sheet: the day's small errands (and, as the house grows, the lantern that they feed).
import {letters,ARC_REWARD,arcStatus,cookedToday,lanternWonders,errandDef,errandsReady,tomorrowErrand,daySettled,
  errandEmbers,currentEvent,rainyDay,lanternLevel,nextLantern,foundToday,nextTrinket,
  trinketProp,wallPaint} from './simulation.js';
import {icon} from './icons.js';
import {DISHES,TRINKETS,WALL_PAINTS} from './content-grove.js';
import {curioArt} from './curio-art.js';
import {INTERACTIVE_PROPS,ROOMS} from './content.js';

// Colour returns to the house as the lantern grows: a soft saturation lift, none at all at the top level.
export const houseColour=level=>{const l=Math.max(0,Math.min(5,Number.isFinite(level)?level:0));
 return Math.round((.88+.024*l)*1000)/1000};
export function syncHouseColour(root,s){
 const value=houseColour(lanternLevel(s)),text=value>=1?'none':`saturate(${value})`;
 if(root.style.getPropertyValue('--house-colour')!==text)root.style.setProperty('--house-colour',text);
}
// Closeness as a row of hearts: one filled heart per level, four in all, readable without colour.
export function heartsMarkup(level,t){
 const l=Math.max(0,Math.min(4,Number.isInteger(level)?level:0));
 return `<span class="hearts" role="img" aria-label="${t('heartsLabel').replace('{level}',t('bond'+l))}">${[1,2,3,4]
   .map(i=>`<i class="${i<=l?'full':''}">${icon('heart')}</i>`).join('')}</span>`;
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
   t('collect')+' · '+icon('spark')+n(errandEmbers(item.id)),null,`data-id="${item.id}" class="primary"`):
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
// Comfort food: one dish a day for the whole house, cooked from the Today sheet.
function kitchenMarkup(s,{t,n}){
 const done=cookedToday(s);
 return `<h3 class="section-heading">${t('kitchenComfort')}</h3><p class="sheet-intro">${t(done?
   'cookedTodayNote':'kitchenIntro')}</p><div class="dish-grid">${DISHES.map(d=>`<button type="button"
   data-action="cook" data-id="${d.id}" class="dish" ${done||s.buttons<d.cost?'disabled':''}><strong
   >${t('dish-'+d.id)}</strong><small>${t('dish-'+d.id+'Text')}</small><em>${icon('button')}${n(d.cost)}</em></button>`)
   .join('')}</div>`;
}
// A resident's personal requests: the one they are asking now, and those already done for them.
export function requestsMarkup(s,id,{t,n,button}){
 const a=arcStatus(s,id);if(!a)return '';
 const done=a.done.map(r=>`<li class="done">${icon('check')}<span>${t('request-'+r)}</span></li>`).join('');
 const tell=()=>button('fulfil-request',t('requestTell').replace('{name}',t(id))+' · +'+n(ARC_REWARD(a.step)),null,
   `class="primary" data-id="${id}"`);
 const now=a.finished?'':!a.heard?`<li class="locked">${icon('moon')}<span>${t('requestLocked')} · ${
   t('bond'+a.next.bond)}</span></li>`:`<li class="open">${icon('spark')}<span>${t('request-'+a.next.id)}</span>${
   a.met?tell():`<small>${t('requestNotMet')}</small>`}</li>`;
 return `<h3 class="section-heading">${t('requestsTitle')} <small>${n(a.step)}/${n(a.total)}</small></h3><ul
   class="request-list">${done}${now}</ul>`;
}
// The curio cabinet: every small thing found in the house, with the empty shelves still to fill.
export function curioMarkup(s,t,n){
 const cell=id=>s.grove.trinkets.includes(id)?
   `<div class="curio">${curioArt(id)}<small>${t('trinket-'+id)}</small></div>`:
   `<div class="curio empty"><span aria-hidden="true">?</span><small>${t('curioEmpty')}</small></div>`;
 const count=`${n(s.grove.trinkets.length)}/${n(TRINKETS.length)}`;
 return `<h3 class="section-heading">${t('curioTitle')} <small>${count}</small></h3><p
   class="sheet-intro">${t('curioIntro')}</p><div class="curio-grid">${TRINKETS.map(cell).join('')}</div>`;
}
// Wall paints: four papers per room as swatches; the chosen one is pressed.
export function paintMarkup(s,t){
 return `<h3 class="section-heading">${t('wallPaint')}</h3><p class="sheet-intro">${t('wallPaintIntro')}</p><div
   class="paint-rows">${ROOMS.map(r=>`<div class="paint-row"><span>${t(r.id)}</span><div class="swatches" role="group"
   aria-label="${t('wallPaint')} · ${t(r.id)}">${WALL_PAINTS[r.id].map((c,i)=>`<button type="button" class="swatch"
   data-action="paint-wall" data-room="${r.id}" data-paint="${i}" style="--paint:${c}" aria-pressed="${wallPaint(s,
   r.id)===i}" aria-label="${t('paint'+i)}"></button>`).join('')}</div></div>`).join('')}</div>`;
}
// Letters left by residents whose requests are all done, kept in the journal.
export function lettersMarkup(s,t){
 const list=letters(s);if(!list.length)return '';
 return `<h3 class="section-heading">${t('lettersTitle')}</h3><div class="letters">${list.map(id=>`<article
   class="letter"><span class="ribbon" aria-hidden="true"></span><h4>${t('letterFrom').replace('{name}',t(id))}</h4><p
   >${t('letter-'+id)}</p></article>`).join('')}</div>`;
}
// The taste notebook: what each resident has shown they love, like or would rather not eat.
export function tasteNotebook(s,id,t){
 const known=s.grove.tastes[id]??{},mark={love:'heart',like:'check',meh:'minus'};
 return `<h3 class="section-heading">${t('tastesTitle')}</h3><ul class="taste-list">${DISHES.map(d=>{
  const taste=known[d.id],glyph=taste?icon(mark[taste]):'<b aria-hidden="true">?</b>';
  return `<li class="${taste??'unknown'}">${glyph}<span
   >${t('dish-'+d.id)}</span><small>${t('taste-'+(taste??'unknown'))}</small></li>`}).join('')}</ul>`;
}
// A seasonal event from the player's own calendar, with its extra errand in the list below.
function findNote(s,t){
 if(foundToday(s)||!nextTrinket(s))return '';const prop=INTERACTIVE_PROPS.find(p=>p.id===trinketProp(s));
 return `<p class="weather-note find-note"><b aria-hidden="true">✦</b><span>${t('trinketHint').replace('{room}',
   t(prop.room+'In'))}</span></p>`;
}
function visitNote(s,t){
 const v=s.grove.visit;if(!v||v.day!==s.grove.errandDay)return '';
 return `<p class="weather-note visit-note${v.done?' done':''}">${icon(v.done?'check':'home')}<span>${t(v.done?
   'visitDone':'visitAsk').replace('{name}',t(v.id)).replace('{room}',t(v.room+'In'))}</span></p>`;
}
function eventCard(s,t){
 const rain=rainyDay(s)?`<p class="weather-note"><b aria-hidden="true">☂</b><span>${t('rainToday')}</span></p>`:'';
 const event=currentEvent(s);if(!event)return rain+findNote(s,t)+visitNote(s,t);
 return `<section class="event-card" data-event="${event}"><strong>${t('event-'+event)}</strong><p
   >${t('event-'+event+'Text')}</p></section>${rain}${findNote(s,t)}${visitNote(s,t)}`;
}
export function todayMarkup(s,c){
 const {t,n}=c;
 return `<h2 id="sheet-title">${t('today')}</h2><p class="sheet-intro">${t('todayIntro')}</p>${eventCard(s,t)}${
   lanternCard(s,c)}<p
   class="ember-count">${icon('spark')}<span>${t('embers')}</span><strong>${n(s.grove.embers)}</strong></p><ul
   class="errand-list">${s.grove.errands.map(item=>errandRow(item,c)).join('')}</ul>${settledCard(s,t)}${
   kitchenMarkup(s,c)}`;
}
