// Daily errands and the courtyard lantern: small, capped, explicitly collected. Pure rules, no DOM.
import {ERRANDS,ERRANDS_PER_DAY,LANTERN_LEVELS,FIRST_DAY_ERRANDS,LANTERN_WONDERS,
  SEASONS,EVENTS,MAIL,MAIL_GIFT,BIRTHDAYS} from './content-grove.js';
import {SECRETS,DOOR_STEPS,ROOMS} from './content.js';
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
 const pool=ERRANDS.filter(e=>!e.event&&!e.birthday&&errandPossible(s,e)).map((e,i)=>({e,k:mix(day,i)}))
   .sort((a,b)=>a.k-b.k);
 return pool.slice(0,ERRANDS_PER_DAY).map(({e})=>e.id);
}
// The seasonal event running this month (from the device calendar the interface hands in), if any.
export const currentEvent=s=>EVENTS.find(e=>e.months.includes(s.grove.month))?.id??null;
// Whose birthday it is by the device calendar, if anyone's.
export const birthdayToday=s=>Object.keys(BIRTHDAYS).find(id=>BIRTHDAYS[id][0]===s.grove.month&&
  BIRTHDAYS[id][1]===s.grove.date)??null;
const calendarErrands=s=>ERRANDS.filter(e=>e.event&&e.event===currentEvent(s)||
  e.birthday&&e.birthday===birthdayToday(s));
function addEventErrand(s){for(const e of calendarErrands(s))
 if(!s.grove.errands.some(x=>x.id===e.id))s.grove.errands.push({id:e.id,done:false,collected:false})}
export function rollErrands(s){
 s.grove.errands=errandsFor(s,s.day).map(id=>({id,done:false,collected:false}));s.grove.errandDay=s.day;
 addEventErrand(s);rollVisit(s);rollMail(s);
}
// The interface tells the house what month it is; a running event joins today's errands at once.
export function setMonth(s,month,date=s.grove.date){
 if(!Number.isInteger(month)||month<0||month>11)return;if(!Number.isInteger(date)||date<1||date>31)date=0;
 if(s.grove.month===month&&s.grove.date===date)return;s.grove.month=month;s.grove.date=date;addEventErrand(s);
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
// Weather by day: about one fresh day in four brings soft rain, never on the first day or in summer.
export function rainyDay(s){
 const day=s.grove.errandDay;if(day<=1||[5,6,7].includes(s.grove.month))return false;
 return mix(day,7)%4===0;
}
// A spontaneous wish on every other day spent in the house: one resident asks to spend it in another room.
export function rollVisit(s){
 const day=s.grove.errandDay;s.grove.visit=null;if(day<=1||day%2)return;
 const d=s.dolls[mix(day,3)%s.dolls.length],rooms=ROOMS.filter(r=>r.id!==d.room);
 s.grove.visit={id:d.id,room:rooms[mix(day,5)%rooms.length].id,day,done:false};
}
export const VISIT_REWARD=6;
// Moving the resident there answers it once: a little thanks, closeness and comfort.
export function answerVisit(s,id,room){
 const v=s.grove.visit;if(!v||v.done||v.day!==s.grove.errandDay||v.id!==id||v.room!==room)return null;
 v.done=true;const d=s.dolls.find(x=>x.id===id);d.comfort=Math.min(100,d.comfort+8);
 s.buttons=Math.min(9999,s.buttons+VISIT_REWARD);s.earnedToday=Math.min(99999,s.earnedToday+VISIT_REWARD);
 emit(s,{type:'visit-thanks',id,room});return {reward:VISIT_REWARD};
}
// A letter waits under the door each fresh day (not the first); reading it is the explicit act that pays
// the few buttons folded inside.
export function rollMail(s){
 const day=s.grove.errandDay;s.grove.mail=day>1?{id:MAIL[(day-2)%MAIL.length],day,read:false}:null;
}
export const mailWaiting=s=>Boolean(s.grove.mail&&!s.grove.mail.read&&s.grove.mail.day===s.grove.errandDay);
export function readMail(s){
 if(!mailWaiting(s))return {ok:false,reason:'noMail'};
 s.grove.mail.read=true;s.buttons=Math.min(9999,s.buttons+MAIL_GIFT);
 s.earnedToday=Math.min(99999,s.earnedToday+MAIL_GIFT);
 return {ok:true,id:s.grove.mail.id,reward:MAIL_GIFT};
}
