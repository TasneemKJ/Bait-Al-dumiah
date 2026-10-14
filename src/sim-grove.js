// Daily errands and the courtyard lantern: small, capped, explicitly collected. Pure rules, no DOM.
import {ERRANDS,ERRANDS_PER_DAY,LANTERN_LEVELS,FIRST_DAY_ERRANDS,LANTERN_WONDERS,
  SEASONS,EVENTS} from './content-grove.js';
import {SECRETS,DOOR_STEPS} from './content.js';
// Events are transient notices, capped like every other house event.
const emit=(s,event)=>{if(s.events.length<24)s.events.push(event)};

export const errandDef=id=>ERRANDS.find(e=>e.id===id)??null;
const NEEDS={
 plant:s=>s.decor.some(d=>d.item==='plant'),lamp:s=>s.decor.some(d=>d.item==='lamp'),
 musicbox:s=>s.decor.some(d=>d.item==='musicbox'),mobile:s=>s.decor.some(d=>d.item==='mobile'),
 whisper:s=>s.journal.length<SECRETS.length,door:s=>s.door>=DOOR_STEPS.length,
};
export const errandPossible=(s,e)=>!e.needs||NEEDS[e.needs](s);
// A small deterministic shuffle by day: the same day always offers the same errands.
const mix=(day,i)=>((day*2654435761+i*40503)>>>0)%9973;
function errandsFor(s,day){
 if(day===1)return FIRST_DAY_ERRANDS;
 const pool=ERRANDS.filter(e=>!e.event&&errandPossible(s,e)).map((e,i)=>({e,k:mix(day,i)})).sort((a,b)=>a.k-b.k);
 return pool.slice(0,ERRANDS_PER_DAY).map(({e})=>e.id);
}
// The seasonal event running this month (from the device calendar the interface hands in), if any.
export const currentEvent=s=>EVENTS.find(e=>e.months.includes(s.grove.month))?.id??null;
const eventErrand=s=>ERRANDS.find(e=>e.event&&e.event===currentEvent(s))??null;
function addEventErrand(s){const e=eventErrand(s);
 if(e&&!s.grove.errands.some(x=>x.id===e.id))s.grove.errands.push({id:e.id,done:false,collected:false})}
export function rollErrands(s){
 s.grove.errands=errandsFor(s,s.day).map(id=>({id,done:false,collected:false}));s.grove.errandDay=s.day;
 addEventErrand(s);
}
// The interface tells the house what month it is; a running event joins today's errands at once.
export function setMonth(s,month){
 if(!Number.isInteger(month)||month<0||month>11||s.grove.month===month)return;s.grove.month=month;addEventErrand(s);
}
// A peek at tomorrow's first errand for the day's closing card (the house may still change by then).
export const tomorrowErrand=s=>errandsFor(s,s.day+1)[0]??null;
export const daySettled=s=>s.grove.errands.length>0&&s.grove.errands.every(e=>e.collected);
// Called by the house rules when something happens; a matching open errand is marked done (not paid).
export function noteErrand(s,on,arg=null){
 for(const item of s.grove.errands){const e=errandDef(item.id);
  if(item.done||!e||e.on!==on||(e.arg&&e.arg!==arg))continue;
  item.done=true;emit(s,{type:'errand',id:item.id})}
}
export const errandsDone=s=>s.grove.errands.filter(e=>e.done).length;
export const errandsReady=s=>s.grove.errands.filter(e=>e.done&&!e.collected).length;
export const ERRAND_EMBERS=1;
export const errandEmbers=id=>errandDef(id)?.embers??ERRAND_EMBERS;
// Collecting is the explicit action that pays: a finished errand becomes embers for the lantern.
export function collectErrand(s,id){
 const item=s.grove.errands.find(e=>e.id===id);
 if(!item)return {ok:false,reason:'invalid'};if(item.collected)return {ok:false,reason:'errandCollected'};
 if(!item.done)return {ok:false,reason:'errandNotDone'};
 const embers=errandEmbers(id);item.collected=true;s.grove.embers=Math.min(999,s.grove.embers+embers);
 if(daySettled(s))emit(s,{type:'day-settled'});
 return {ok:true,id,embers};
}
// The lantern only grows when the player tends it; every held ember goes in at once.
export const lanternLevel=s=>LANTERN_LEVELS.reduce((level,min,i)=>s.grove.warmth>=min?i:level,0);
export const nextLantern=s=>LANTERN_LEVELS.find(min=>min>s.grove.warmth)??null;
export function tendLantern(s){
 if(s.grove.embers<1)return {ok:false,reason:'noEmbers'};
 const before=lanternLevel(s),added=s.grove.embers;
 s.grove.warmth=Math.min(9999,s.grove.warmth+added);s.grove.embers=0;const level=lanternLevel(s);
 if(level>before)emit(s,{type:'lantern',level});noteErrand(s,'tend');
 return {ok:true,added,level,grew:level>before};
}
export const lanternWonders=s=>{const level=lanternLevel(s);
 return LANTERN_WONDERS.map((id,i)=>({id,level:i+1,reached:level>=i+1}))};
export const seasonFor=month=>SEASONS[Number.isInteger(month)&&month>=0&&month<12?month:0];
