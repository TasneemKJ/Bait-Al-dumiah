import {DOLLS,ROOMS,CATALOG,SLOTS,SECRETS,MILESTONES,SEW_DAILY,BASKET_MAX,DOOR_STEPS,VISITOR_GIFTS,ACTIVITIES,
  ACTIVITY_DAILY_CAP,ACTIVITY_COOLDOWN,INTERACTIVE_PROPS,STORY_CHAPTERS} from './content.js';
import {createState} from './sim-state.js';
import {clamp,integer,has} from './sim-util.js';

// Reading, validating and migrating saves. restoreValid whitelists and clamps every field.
export const SAVE_VERSION=1;
const MIGRATIONS={};
export function migrate(v,migrations=MIGRATIONS,target=SAVE_VERSION){
 if(!v||typeof v!=='object'||Array.isArray(v)||!Number.isInteger(v.version)||v.version<1||v.version>target)return null;
 let out=v;
 while(out.version<target){const step=migrations[out.version];if(typeof step!=='function')return null;const next=step(structuredClone(out));
 if(!next||typeof next!=='object'||next.version!==out.version+1)return null;out=next}
 return out;
}
// Parses and validates a save. ok is false when text was present but unreadable,
// so the caller can keep a backup instead of silently overwriting it.
export function readSave(raw){
 if(raw==null||raw==='')return {ok:true,empty:true,state:createState()};
 let v;try{v=JSON.parse(raw)}catch{return {ok:false,reason:'corrupt',state:createState()}}
 const current=migrate(v);
 if(!current)return {ok:false,reason:v&&typeof v==='object'&&Number.isInteger(v.version)&&
   v.version>SAVE_VERSION?'newer':'corrupt',state:createState()};
 return {ok:true,state:restoreValid(current)};
}
export function restore(raw){return readSave(raw).state}
function restoreValid(v){
 const s=createState();
 s.elapsed=clamp(v.elapsed,0,1e9);s.clock=clamp(v.clock,0,239.999);s.day=integer(v.day,1,99999);
 s.buttons=integer(v.buttons,0,9999);s.unease=clamp(v.unease);s.cares=integer(v.cares,0,1e9);
 if(Array.isArray(v.dolls))for(const d of s.dolls){const a=v.dolls.find(x=>x&&x.id===d.id);if(!a)continue;
 for(const k of ['hunger','energy','comfort','bond'])if(Number.isFinite(a[k]))d[k]=clamp(a[k]);
 if(has(ROOMS,a.room))d.room=a.room;d.lastCare=-10;d.action='idle';d.actionUntil=0}
 const occupied=new Set();
 if(Array.isArray(v.decor))for(const d of v.decor.slice(0,100)){if(!d||!has(CATALOG,d.item)||!has(ROOMS,d.room)||!Number.isInteger(d.slot)||d.slot<0||
   d.slot>=SLOTS.length)continue;const key=`${d.room}:${d.slot}`;if(occupied.has(key))continue;occupied.add(key);
 s.decor.push({id:s.nextId++,item:d.item,room:d.room,slot:d.slot,rotation:Number.isInteger(d.rotation)&&d.rotation>=0&&d.rotation<4?d.rotation:0,
   originRoom:has(ROOMS,d.originRoom)?d.originRoom:d.room,active:d.active===true,
     tendedDay:integer(d.tendedDay,0,s.day),lastUse:Number.isFinite(d.lastUse)?clamp(d.lastUse,-10,s.elapsed):-10})}
 s.wishes=Array.isArray(v.wishes)?DOLLS.filter(d=>v.wishes.includes(d.id)).map(d=>d.id):[];
 s.journal=Array.isArray(v.journal)?SECRETS.filter(id=>v.journal.includes(id)):[];
 s.lastSecretDay=integer(v.lastSecretDay,0,s.day);
 s.lastFullDay=integer(v.lastFullDay,0,s.day);s.streak=s.lastFullDay?integer(v.streak,1,999):0;
 s.sewnToday=integer(v.sewnToday,0,SEW_DAILY);s.earnedToday=integer(v.earnedToday,0,99999);
 s.basket=integer(v.basket,0,BASKET_MAX);
 s.dayTime=clamp(v.dayTime,0,1e6);s.door=integer(v.door,0,DOOR_STEPS.length);
 s.gifts=Array.isArray(v.gifts)?VISITOR_GIFTS.filter(g=>v.gifts.includes(g)):[];s.lastGiftDay=integer(v.lastGiftDay,0,s.day);
 for(const a of ACTIVITIES){s.activities.mastery[a.id]=integer(v.activities?.mastery?.[a.id],0,999);
 s.activities.completed[a.id]=integer(v.activities?.completed?.[a.id],0,ACTIVITY_DAILY_CAP);
 s.activities.lastReward[a.id]=Number.isFinite(v.activities?.lastReward?.[a.id])?
   clamp(v.activities.lastReward[a.id],-ACTIVITY_COOLDOWN,s.elapsed):-ACTIVITY_COOLDOWN}
 if(Array.isArray(v.activities?.teaRecords))s.activities.teaRecords=s.activities.teaRecords.map((_,
   i)=>Number.isFinite(v.activities.teaRecords[i])?integer(v.activities.teaRecords[i],0,100):null);
 if(Array.isArray(v.activities?.stitchRecords))s.activities.stitchRecords=s.activities.stitchRecords.map((_,
   i)=>Number.isFinite(v.activities.stitchRecords[i])?integer(v.activities.stitchRecords[i],0,100):null);
 for(const r of ROOMS)s.restoration[r.id]=integer(v.restoration?.[r.id],0,3);
 if(v.story&&typeof v.story==='object'&&!Array.isArray(v.story)){
  s.story.chapter=integer(v.story.chapter,0,STORY_CHAPTERS.length);
  const chapter=STORY_CHAPTERS[s.story.chapter];s.story.step=chapter?integer(v.story.step,0,chapter.steps.length-1):0;
  s.story.lastAction=INTERACTIVE_PROPS.some(p=>'prop:'+p.id===v.story.lastAction)?v.story.lastAction:null;
  s.story.lastActionAt=Number.isFinite(v.story.lastActionAt)?clamp(v.story.lastActionAt,-10,s.elapsed):-10;
 }
 const ids=list=>Array.isArray(list)?MILESTONES.filter(m=>list.includes(m.id)).map(m=>m.id):[];
 s.milestones=ids(v.milestones);s.achieved=ids([...ids(v.achieved),...s.milestones]);
 // Veterans have already met the night: no first-night hint for a save with history.
 s.hints={night:v.hints?.night===true||s.day>1||s.journal.length>0,calm:v.hints?.calm===true||s.day>1||s.clock>=90};
 if(v.settings&&typeof v.settings==='object'){s.settings.locale=v.settings.locale==='ar'?'ar':'en';s.settings.muted=v.settings.muted!==false;
 s.settings.reducedMotion=v.settings.reducedMotion===true;s.settings.largeText=v.settings.largeText===true;
 s.settings.quality=['auto','low','high'].includes(v.settings.quality)?v.settings.quality:'auto'}
 return s;
}
