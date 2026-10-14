// Relationship care beyond needs: daily hugs (and the comfort that follows). Pure rules, no DOM.
import {clamp} from './sim-util.js';
import {growBond} from './sim-core.js';
import {noteErrand} from './sim-grove.js';

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
