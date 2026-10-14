// Relationship care beyond needs: daily hugs (and the comfort that follows). Pure rules, no DOM.
import {clamp} from './sim-util.js';
import {growBond} from './sim-core.js';
import {DISHES,TASTES,TASTE_EFFECT,ARCS} from './content-grove.js';
import {bondLevel} from './sim-queries.js';
import {noteErrand,lanternLevel} from './sim-grove.js';

// Daily things count by the last day actually spent in the house (when errands last refreshed),
// so hurrying dawn with the light control never resets them.
export const careDay=s=>s.grove.errandDay;
export const huggedToday=(s,id)=>s.grove.hugs[id]===careDay(s);
export const HUG_COMFORT=12,HUG_BOND=3;
export function hug(s,id){
 const d=s.dolls.find(x=>x.id===id);if(!d)return {ok:false,reason:'invalid'};
 if(s.paused)return {ok:false,reason:'pausedActivity'};
 if(huggedToday(s,id))return {ok:false,reason:'huggedToday'};
 s.grove.hugs[id]=careDay(s);d.comfort=clamp(d.comfort+HUG_COMFORT);s.unease=clamp(s.unease-2);
 d.action='hug';d.lastCare=s.elapsed;d.actionUntil=s.elapsed+3;growBond(s,d,HUG_BOND);noteErrand(s,'hug',id);
 return {ok:true,id};
}
// One comfort dish a day for everyone at once; each resident's reaction is learned for the notebook.
export const cookedToday=s=>s.grove.dishDay===careDay(s);
export function cook(s,dishId){
 const dish=DISHES.find(d=>d.id===dishId);if(!dish)return {ok:false,reason:'invalid'};
 if(s.paused)return {ok:false,reason:'pausedActivity'};
 if(cookedToday(s))return {ok:false,reason:'cookedToday'};if(s.buttons<dish.cost)return {ok:false,reason:'funds'};
 s.buttons-=dish.cost;s.grove.dishDay=careDay(s);s.grove.dish=dish.id;s.grove.dishAt=s.elapsed;
 const reactions=s.dolls.map(d=>{const taste=TASTES[d.id]?.[dish.id]??'like',fx=TASTE_EFFECT[taste];
  d.hunger=clamp(d.hunger+fx.hunger);d.comfort=clamp(d.comfort+fx.comfort);if(fx.bond)growBond(s,d,fx.bond);
  (s.grove.tastes[d.id]??={})[dish.id]=taste;return {id:d.id,taste}});
 s.unease=clamp(s.unease-3);noteErrand(s,'cook',dish.id);
 return {ok:true,dish:dish.id,cost:dish.cost,reactions};
}
// Each request names something already true in the house; the player tells the resident it is done.
const placed=(s,item,room)=>s.decor.some(d=>d.item===item&&d.room===room);
const REQUEST_MET={
 'lina-maamoul':s=>Boolean(s.grove.tastes.lina?.maamoul),'lina-musicbox':s=>placed(s,'musicbox','parlor'),
 'lina-cups':s=>s.activities.mastery.tea>=3,'noor-mobile':s=>placed(s,'mobile','bedroom'),
 'noor-chimes':s=>s.activities.mastery.lullaby>=2,'noor-lantern':s=>lanternLevel(s)>=3,
 'sami-bear':s=>placed(s,'bear','kitchen'),'sami-sewing':s=>s.activities.mastery.stitch>=2,'sami-door':s=>s.door>=3,
};
export const ARC_REWARD=step=>10+5*step;
// Residents whose three requests are done: each has tied a ribbon and left a letter.
export const arcComplete=(s,id)=>Boolean(ARCS[id])&&s.grove.arcs[id]>=ARCS[id].length;
export const letters=s=>Object.keys(ARCS).filter(id=>arcComplete(s,id));
export function arcStatus(s,id){
 const arc=ARCS[id];if(!arc)return null;const step=integerStep(s.grove.arcs[id],arc.length),next=arc[step]??null;
 const d=s.dolls.find(x=>x.id===id),heard=Boolean(next)&&bondLevel(d.bond)>=next.bond;
 return {step,total:arc.length,next,heard,met:heard&&REQUEST_MET[next.id](s),done:arc.slice(0,step).map(r=>r.id),
   finished:step>=arc.length};
}
const integerStep=(v,max)=>Number.isInteger(v)?Math.max(0,Math.min(max,v)):0;
export function fulfilRequest(s,id){
 const status=arcStatus(s,id);if(!status)return {ok:false,reason:'invalid'};
 if(status.finished)return {ok:false,reason:'arcFinished'};if(!status.heard)return {ok:false,reason:'requestUnheard'};
 if(!status.met)return {ok:false,reason:'requestNotMet'};
 const reward=ARC_REWARD(status.step),d=s.dolls.find(x=>x.id===id);s.grove.arcs[id]=status.step+1;
 s.buttons=Math.min(9999,s.buttons+reward);s.earnedToday=Math.min(99999,s.earnedToday+reward);growBond(s,d,5);
 const finished=status.step+1>=status.total;if(finished)s.events.length<24&&s.events.push({type:'arc-complete',id});
 return {ok:true,id,request:status.next.id,reward,finished};
}
