// The first week's little arc, counted in the player's own visit days (distinct calendar dates the
// house was opened), never in hurried in-game dawns: the fifth visit's night it rains and the three
// little hearts keep together in the liwan; jasmine thread is hung in the liwan night by night; on the
// seventh visit it is Noor's day, and at nightfall she is given a keepsake. The date comes from the
// caller as 'YYYY-MM-DD'; the simulation never reads a clock.
import {emit} from './sim-core.js';
import {isNight} from './sim-queries.js';

export const ARC=Object.freeze({rain:5,day:7,soul:'noor',room:'parlor',keepsake:'jasmine-ribbon'});
const DATE=/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
export const freshArc=()=>({visits:0,last:'',rain:false,keepsake:false});
// One count per new, later date. A device clock set back counts nothing.
export function markVisit(s,date){
 if(typeof date!=='string'||!DATE.test(date)||(s.arc.last&&date<=s.arc.last))return false;
 s.arc.last=date;s.arc.visits=Math.min(999,s.arc.visits+1);return true;
}
export const raining=s=>s.arc?.visits===ARC.rain&&isNight(s);
// Where the three keep together tonight (the render's place only; each doll's own room is unchanged).
export const gatherRoom=s=>raining(s)?ARC.room:null;
// Strands of jasmine thread in the liwan: one on the fifth visit, two on the sixth, all three on Noor's day.
export const garlands=s=>Math.max(0,Math.min(3,(s.arc?.visits??0)-ARC.rain+1));
export const anniversary=s=>(s.arc?.visits??0)>=ARC.day;
export function stepArc(s){
 if(!s.arc)return;
 if(raining(s)&&!s.arc.rain){s.arc.rain=true;emit(s,{type:'rain'})}
 if(anniversary(s)&&isNight(s)&&!s.arc.keepsake){s.arc.keepsake=true;emit(s,{type:'anniversary',id:ARC.soul})}
}
// The line a returning player hears on an arc visit, ahead of the ordinary greetings.
export function arcGreeting(s){
 const v=s?.arc?.visits;
 if(v===ARC.rain)return 'arcRainComing';
 if(v===ARC.rain+1)return 'arcThreadHung';
 if(v===ARC.day&&!s.arc.keepsake)return 'arcNoorDay';
 return null;
}
export function restoreArc(v){
 const a=freshArc();if(!v||typeof v!=='object'||Array.isArray(v))return a;
 a.visits=Number.isInteger(v.visits)?Math.max(0,Math.min(999,v.visits)):0;
 a.last=typeof v.last==='string'&&DATE.test(v.last)?v.last:'';
 a.rain=v.rain===true;a.keepsake=v.keepsake===true;return a;
}
