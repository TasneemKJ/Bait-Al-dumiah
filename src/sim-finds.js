// Daily small surprises: a trinket hidden at one interactive prop. Pure rules, no DOM.
import {TRINKETS} from './content-grove.js';
import {INTERACTIVE_PROPS} from './content.js';
import {careDay} from './sim-care.js';

// Which prop glints today: fixed by the day actually spent in the house, so it cannot be rerolled.
export const trinketProp=s=>INTERACTIVE_PROPS[((careDay(s)*2654435761)>>>0)%INTERACTIVE_PROPS.length].id;
export const foundToday=s=>s.grove.findDay===careDay(s);
export const nextTrinket=s=>TRINKETS.find(id=>!s.grove.trinkets.includes(id))??null;
export const trinketHere=(s,propId)=>!foundToday(s)&&Boolean(nextTrinket(s))&&trinketProp(s)===propId;
export function findTrinket(s,propId){
 if(s.paused)return {ok:false,reason:'pausedActivity'};
 if(!trinketHere(s,propId))return {ok:false,reason:foundToday(s)?'foundToday':'nothingHere'};
 const trinket=nextTrinket(s);s.grove.trinkets.push(trinket);s.grove.findDay=careDay(s);
 return {ok:true,trinket,count:s.grove.trinkets.length};
}
