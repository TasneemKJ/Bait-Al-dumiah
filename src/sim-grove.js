// Daily errands and the courtyard lantern: small, capped, explicitly collected. Pure rules, no DOM.
import {ERRANDS,ERRANDS_PER_DAY} from './content-grove.js';
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
export function rollErrands(s){
 const pool=ERRANDS.filter(e=>errandPossible(s,e)).map((e,i)=>({e,k:mix(s.day,i)})).sort((a,b)=>a.k-b.k);
 s.grove.errands=pool.slice(0,ERRANDS_PER_DAY).map(({e})=>({id:e.id,done:false,collected:false}));
 s.grove.errandDay=s.day;
}
// Called by the house rules when something happens; a matching open errand is marked done (not paid).
export function noteErrand(s,on,arg=null){
 for(const item of s.grove.errands){const e=errandDef(item.id);
  if(item.done||!e||e.on!==on||(e.arg&&e.arg!==arg))continue;
  item.done=true;emit(s,{type:'errand',id:item.id})}
}
export const errandsDone=s=>s.grove.errands.filter(e=>e.done).length;
export const errandsReady=s=>s.grove.errands.filter(e=>e.done&&!e.collected).length;
export const ERRAND_EMBERS=1;
// Collecting is the explicit action that pays: a finished errand becomes embers for the lantern.
export function collectErrand(s,id){
 const item=s.grove.errands.find(e=>e.id===id);
 if(!item)return {ok:false,reason:'invalid'};if(item.collected)return {ok:false,reason:'errandCollected'};
 if(!item.done)return {ok:false,reason:'errandNotDone'};
 item.collected=true;s.grove.embers=Math.min(999,s.grove.embers+ERRAND_EMBERS);
 return {ok:true,id,embers:ERRAND_EMBERS};
}
