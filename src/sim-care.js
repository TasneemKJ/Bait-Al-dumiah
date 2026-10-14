// Relationship care beyond needs: daily hugs (and the comfort that follows). Pure rules, no DOM.
import {clamp} from './sim-util.js';
import {growBond} from './sim-core.js';
import {noteErrand} from './sim-grove.js';
import {DISHES,TASTES,TASTE_EFFECT} from './content-grove.js';

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
 s.buttons-=dish.cost;s.grove.dishDay=careDay(s);
 const reactions=s.dolls.map(d=>{const taste=TASTES[d.id]?.[dish.id]??'like',fx=TASTE_EFFECT[taste];
  d.hunger=clamp(d.hunger+fx.hunger);d.comfort=clamp(d.comfort+fx.comfort);if(fx.bond)growBond(s,d,fx.bond);
  (s.grove.tastes[d.id]??={})[dish.id]=taste;return {id:d.id,taste}});
 s.unease=clamp(s.unease-3);noteErrand(s,'cook',dish.id);
 return {ok:true,dish:dish.id,cost:dish.cost,reactions};
}
