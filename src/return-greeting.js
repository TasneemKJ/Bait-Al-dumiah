import {unclaimed} from './simulation.js';
import {DOLLS} from './content.js';
// A returning player hears what is waiting for them, in priority order, in one short line.
// First visits (no care yet) get nothing: the opening clue already teaches the first step.
// Residents wave one after another when a returning player opens the house.
export function waveSchedule(count,now,delay=.9,gap=.5){return Array.from({length:count},(_,i)=>now+delay+i*gap)}
// The room to glance at while the residents wave: the busiest one, first resident wins ties.
export function waveRoom(s){
 if(!s||!Array.isArray(s.dolls)||!s.dolls.length)return null;
 const counts=new Map();for(const d of s.dolls)counts.set(d.room,(counts.get(d.room)||0)+1);
 let best=null;for(const d of s.dolls)if(best===null||counts.get(d.room)>counts.get(best))best=d.room;return best;
}
export function returnGreeting(s){
 if(!s||!(s.cares>0))return null;
 if(s.basket>0)return {key:'returnBasket',count:s.basket};
 const ready=unclaimed(s).length;if(ready>0)return {key:'returnMilestone',count:ready};
 const wishes=DOLLS.length-s.wishes.length;if(wishes>0)return {key:'returnWishes',count:wishes};
 return {key:'returnCalm',count:0};
}
