import {earn,emit,checkMilestones,growBond,activityDef,activityLevel,completeActivity} from './sim-core.js';
import {createTea,stepTea,releaseTea} from './sim-tea.js';
import {stitchActive,stitchSections,createStitch,releaseStitch} from './sim-stitch.js';
import {stepChimes,cancelChime,replayChimes} from './sim-chimes.js';
import {clamp,has,fail} from './sim-util.js';
import {isNight,wishFor,bondLevel,wishReward,currentStreak,inFavoriteRoom,isContent,
  secretCozyNeeded,coziness} from './sim-queries.js';
import {moveStitch} from './stitch-path.js';
import {ROOMS,DOLLS,CATALOG,SLOTS,SECRETS,ACTIONS,MILESTONES,SEW_SECONDS,DOOR_STEPS,GIFT_COST,
  VISITOR_GIFTS,ACTIVITIES,RESTORATION_COSTS,RESTORATION_MASTERY,WISH_REFRESH_SECONDS,
    SEW_DAILY,BASKET_MAX} from './content.js';
import {createState} from './sim-state.js';
export {createState};
export * from './sim-queries.js';
export {controlStitch,finishStitch,releaseStitch,stitchSectionProgress,stitchStatus,
  unpickStitch} from './sim-stitch.js';
export {cancelChime,chimeStatus,grabChime,pullChime,releaseChime,replayChimes} from './sim-chimes.js';
export {activityLevel,activityReward,activityRewardReady,checkMilestones,storyStatus} from './sim-core.js';
export {controlTea,emptyTeaCup,releaseTea,serveTea,teaStatus} from './sim-tea.js';
export {interactStory,playStoryKeepsake} from './sim-story.js';
export {SAVE_VERSION,migrate,readSave,restore} from './save-codec.js';
export const unclaimed=s=>MILESTONES.filter(m=>s.achieved.includes(m.id)&&!s.milestones.includes(m.id));
export function claim(s,id){
 const m=MILESTONES.find(x=>x.id===id);
 if(!m||!s.achieved.includes(id))return fail('invalid');
 if(s.milestones.includes(id))return fail('claimed');
 s.milestones.push(id);earn(s,m.reward);return {ok:true,reward:m.reward};
}
export function collectBasket(s){if(s.basket<1)return fail('emptyBasket');
const reward=s.basket;s.basket=0;earn(s,reward);return {ok:true,reward}}
export function care(s,id,action){
 const d=s.dolls.find(x=>x.id===id), a=Object.hasOwn(ACTIONS,action)?ACTIONS[action]:null;
 if(!d||!a)return fail('invalid');
 if(s.elapsed-d.lastCare<3)return fail('busy');
 const wished=wishFor(s,id)===action&&!s.wishes.includes(id);
 // A wished-for action is always welcome, even when the need is nearly full.
 if(!wished&&d[a.need]>92&&!(action==='soothe'&&s.unease>25))return fail('enough');
 if(s.buttons<a.cost)return fail('funds');
 s.buttons-=a.cost;d[a.need]=clamp(d[a.need]+a.amount);d.lastCare=s.elapsed;d.action=action;d.actionUntil=s.elapsed+4;
 if(action==='tea')d.energy=clamp(d.energy+4);
 if(action==='play')d.energy=clamp(d.energy-4);
 s.unease=clamp(s.unease-(action==='soothe'?14:5));s.cares=Math.min(1e9,s.cares+1);
 const reward=wished?wishReward(d):0;
 let bonus=0;
 if(reward){
  s.wishes.push(id);earn(s,reward);
  if(s.wishes.length===DOLLS.length){s.streak=s.lastFullDay===s.day-1?Math.min(999,
    s.streak+1):1;s.lastFullDay=s.day;bonus=4+2*Math.min(s.streak,5);
  earn(s,bonus);emit(s,{type:'full-house',streak:s.streak,reward:bonus})}
 }
 const brave=action==='soothe'&&isNight(s)?2:0;
 growBond(s,d,Math.round((4+(reward?4:0)+brave)*(inFavoriteRoom(d)?1.5:1)));
 checkMilestones(s);
 return {ok:true,reward,bonus,cost:a.cost};
}
// Wishes and the sewing cap refresh only after a day actually spent in the house, so hurrying
// dawn with the light control never farms rewards. Nothing is lost by hurrying either.
function newDay(s){
 const wishes=s.wishes.length,fresh=s.dayTime>=WISH_REFRESH_SECONDS;s.day=Math.min(99999,s.day+1);s.dayTime=0;
 if(fresh){s.wishes=[];s.sewnToday=0;for(const a of ACTIVITIES)s.activities.completed[a.id]=0}
 emit(s,{type:'dawn',day:s.day,wishes,fresh,earned:s.earnedToday,streak:currentStreak(s)});s.earnedToday=0;
}
export function step(s,dt){
 if(s.paused){if(s.activities.active?.id==='stitch')releaseStitch(s);cancelChime(s);
 return}if(!Number.isFinite(dt)||dt<=0)return;
 dt=Math.min(dt,1);s.elapsed+=dt;s.clock+=dt;s.dayTime=Math.min(1e6,s.dayTime+dt);
 stepTea(s,dt);stepChimes(s,dt);const stitching=stitchActive(s);
 if(stitching)moveStitch(stitching,stitchSections(stitching),dt);
 if(s.clock>=240){s.clock-=240;newDay(s)}
 // One gentle pointer the first time night falls, for a player who has not met the visitor yet.
 if(isNight(s)&&!s.hints.night){s.hints.night=true;emit(s,{type:'first-night'})}
 // Day one is front-loaded: after the opening burst, one calm line makes the quiet stretch feel intended.
 if(!s.hints.calm&&s.day===1&&s.clock>=90){s.hints.calm=true;if(s.clock<120&&s.cares>0)emit(s,{type:'calm'})}
 const comfortProtection=Math.min(.65,s.decor.length*.035);
 for(const d of s.dolls){
  d.hunger=clamp(d.hunger-dt*.13);d.energy=clamp(d.energy-dt*.095);
  d.comfort=clamp(d.comfort-dt*.085*(1-comfortProtection)*(inFavoriteRoom(d)?.6:1));
  if(s.elapsed>d.actionUntil)d.action='idle';
  // Content residents sew a few buttons into the basket each day; nothing is taken from unhappy ones.
  if(isContent(s,d)&&s.sewnToday<SEW_DAILY&&s.basket<BASKET_MAX){d.sew+=dt;if(d.sew>=SEW_SECONDS){d.sew=0;
  s.sewnToday++;s.basket++;if(s.basket===1)emit(s,{type:'sewn',id:d.id})}}
 }
 const target=isNight(s)?48-coziness(s)*.22:12;
 s.unease=clamp(s.unease+(target-s.unease)*dt*.008);
 checkMilestones(s);
}
export function place(s,item,room,slot){
 const entry=CATALOG.find(x=>x.id===item);
 if(!entry||!has(ROOMS,room)||!Number.isInteger(slot)||slot<0||slot>=SLOTS.length)return fail('invalid');
 if(s.decor.some(d=>d.room===room&&d.slot===slot))return fail('occupied');
 if(s.buttons<entry.price)return fail('funds');
 s.buttons-=entry.price;
 s.decor.push({id:s.nextId++,item,room,slot,rotation:0,originRoom:room,active:false,tendedDay:0,lastUse:-10});
 const loved=s.dolls.filter(d=>d.room===room&&DOLLS.find(x=>x.id===d.id).favItem===item).map(d=>d.id);
 checkMilestones(s);
 return {ok:true,cost:entry.price,loved};
}
// Furniture benefits come from what is placed, never a one-time comfort credit to refund.
export function remove(s,id){const index=s.decor.findIndex(d=>d.id===id);if(index<0)return fail('invalid');
const item=s.decor.splice(index,1)[0],entry=CATALOG.find(i=>i.id===item.item),refund=entry.price;
s.buttons=Math.min(9999,s.buttons+refund);return {ok:true,refund}}
export function moveDecor(s,id,room,slot){
 const item=s.decor.find(d=>d.id===id);
 if(!item||!has(ROOMS,room)||!Number.isInteger(slot)||!SLOTS[slot])return fail('invalid');
 if(s.decor.some(d=>d.id!==id&&d.room===room&&d.slot===slot))return fail('occupied');
 item.originRoom??=item.room;item.room=room;item.slot=slot;return {ok:true};
}
export function rotateDecor(s,id){const item=s.decor.find(d=>d.id===id);if(!item)return fail('invalid');
item.rotation=((item.rotation??0)+1)%4;return {ok:true}}
// A used keepsake reports what it is and where it stands, so the interface can answer without a lookup.
export function useDecor(s,id){
 const item=s.decor.find(d=>d.id===id);if(!item)return fail('invalid');
 if(!['plant','lamp','musicbox','mobile'].includes(item.item))return fail('notInteractive');
 const done=(effect,extra={})=>({ok:true,id,item:item.item,room:item.room,effect,...extra});
 if(item.item==='plant'){
  if(item.tendedDay===s.day)return fail('alreadyTended');
  item.tendedDay=s.day;item.lastUse=s.elapsed;return done('water');
 }
 item.tendedDay=s.day;item.lastUse=s.elapsed;
 if(item.item==='lamp'){item.active=!item.active;return done(item.active?'light':'dim',{active:item.active})}
 return done(item.item==='musicbox'?'wind':'rock');
}
export function moveDoll(s,id,room){const doll=s.dolls.find(d=>d.id===id);
if(!doll||!has(ROOMS,room))return fail('invalid');doll.room=room;return {ok:true,favorite:inFavoriteRoom(doll)}}
export function changeLight(s){if(isNight(s)){s.clock=0;newDay(s)}else{s.clock=120}return {ok:true}}
export function discover(s){
 if(!isNight(s))return fail('daylight');
 if(s.lastSecretDay===s.day)return fail('tomorrow');
 const secret=SECRETS.find(x=>!s.journal.includes(x));if(!secret)return fail('complete');
 const needed=secretCozyNeeded(s);if(coziness(s)<needed)return fail('shy',{needed});
 s.journal.push(secret);s.lastSecretDay=s.day;earn(s,5);s.unease=clamp(s.unease+7);
 checkMilestones(s);
 return {ok:true,secret,reward:5};
}
const doorNeeds={'sami-dear':s=>bondLevel(s.dolls.find(d=>d.id==='sami').bond)>=3,
  'all-whispers':s=>s.journal.length>=SECRETS.length};
export const doorOpen=s=>s.door>=DOOR_STEPS.length;
export const nextDoorStep=s=>DOOR_STEPS[s.door]??null;
export const doorReady=(s,step=nextDoorStep(s))=>Boolean(step)&&(!step.needs||doorNeeds[step.needs](s));
export function mendDoor(s){
 const step=nextDoorStep(s);if(!step)return fail('doorDone');
 if(!doorReady(s,step))return fail('doorNeeds',{needs:step.needs});
 if(s.buttons<step.cost)return fail('funds');
 s.buttons-=step.cost;s.door++;s.unease=clamp(s.unease-6);checkMilestones(s);
 return {ok:true,step:step.id,cost:step.cost,opened:doorOpen(s)};
}
// Gifts cycle through the visitor's keepsakes in order, one a night, once the door is open.
export function leaveGift(s){
 if(!doorOpen(s))return fail('doorClosed');
 if(!isNight(s))return fail('daylight');
 if(s.lastGiftDay===s.day)return fail('giftTomorrow');
 if(s.buttons<GIFT_COST)return fail('funds');
 const gift=VISITOR_GIFTS.find(g=>!s.gifts.includes(g))??VISITOR_GIFTS[s.day%VISITOR_GIFTS.length];
 s.buttons-=GIFT_COST;s.lastGiftDay=s.day;if(!s.gifts.includes(gift))s.gifts.push(gift);s.unease=clamp(s.unease-10);
 for(const d of s.dolls)d.comfort=clamp(d.comfort+6);
 checkMilestones(s);
 return {ok:true,gift,cost:GIFT_COST};
}
export function activityPattern(s,id){
 const a=activityDef(id);if(!a)return [];
 const level=activityLevel(s,id),seed=a.seed+s.activities.mastery[id]*3;
 return Array.from({length:Math.min(5,3+level)},(_,i)=>(seed+i*(a.seed+1)+Math.floor(i/2))%4);
}
export function beginActivity(s,id){
 if(s.paused)return fail('pausedActivity');if(!activityDef(id))return fail('invalid');
 if(s.activities.active)return fail('activityBusy');
 if(id==='tea'){s.activities.active=createTea(s,'ritual');return {ok:true}}
 if(id==='stitch'){s.activities.active=createStitch(s,'ritual');return {ok:true}}
 if(id==='lullaby'){s.activities.active={id,phase:'listen',pattern:activityPattern(s,id),
   cursor:0,listenTime:0,round:0,held:null,pull:0,mistakes:0,
   lastTone:null,lastPluck:-10,toneSerial:0,result:null};return {ok:true}}
 s.activities.active={id,cursor:0,pattern:activityPattern(s,id),phase:id==='stitch'?
   'study':'play',hint:false};return {ok:true};
}
// Ending a run hands back any story beat it completed, so callers never read the finished run.
export function endActivity(s){
 const storyResult=s.activities.active?.result?.storyResult??null;
 releaseTea(s);releaseStitch(s);cancelChime(s);s.activities.active=null;return {ok:true,storyResult};
}
// Replay a physical ritual from its own surface: a finished run restarts; a lullaby still being played
// replays its phrase for free instead.
const REPLAY_PHASE={tea:'served',stitch:'finished',lullaby:'finished'};
export function replayActivity(s,id){
 const active=s.activities.active;if(s.paused)return fail('pausedActivity');
 if(!REPLAY_PHASE[id]||active?.id!==id)return fail('invalid');
 if(active.phase!==REPLAY_PHASE[id]){
  if(id!=='lullaby')return fail('invalid');
  const phrase=replayChimes(s);return phrase.ok?{ok:true,restarted:false}:phrase;
 }
 endActivity(s);const begun=beginActivity(s,id);return begun.ok?{ok:true,restarted:true}:begun;
}
export function startRecall(s){const a=s.activities.active;if(s.paused)return fail('pausedActivity');
if(a?.id!=='stitch'||a.phase!=='study')return fail('invalid');a.phase='recall';return {ok:true}}
export function toggleActivityHint(s){const a=s.activities.active;if(s.paused)return fail('pausedActivity');
if(a?.id!=='stitch'||a.phase!=='recall')return fail('invalid');a.hint=!a.hint;return {ok:true}}
export function activityAnswer(s){const a=s.activities.active;
return a&&a.id!=='tea'&&a.id!=='stitch'? a.id==='lullaby'?[...a.pattern].reverse():[...a.pattern]:[]}
export function activityInput(s,choice){
 const active=s.activities.active;if(s.paused)return fail('pausedActivity');
 if(active?.id==='tea')return fail('teaPhysical');
 if(active?.id==='stitch')return fail('stitchPhysical');
 if(active?.id==='lullaby')return fail('chimePhysical');
 if(!active||!Number.isInteger(choice)||choice<0||choice>3)return fail('invalid');
 if(active.phase==='study')return fail('studyFirst');
 if(activityAnswer(s)[active.cursor]!==choice){active.cursor=0;return {ok:true,mistake:true,complete:false}}
 active.cursor++;
 if(active.cursor<active.pattern.length)return {ok:true,complete:false};
 const id=active.id;s.activities.active=null;return completeActivity(s,id);
}
export function restorationReady(s,room){
 const r=ROOMS.find(r=>r.id===room);if(!r)return null;const tier=s.restoration[room];
 const id=room==='parlor'?'tea':ACTIVITIES.find(a=>a.room===room)?.id;
 return {tier,activity:id,required:RESTORATION_MASTERY[tier]??0,cost:RESTORATION_COSTS[tier]??0,
   complete:tier>=3,ready:tier<3&&s.activities.mastery[id]>=RESTORATION_MASTERY[tier]};
}
export function restoreRoom(s,room){
 const next=restorationReady(s,room);if(!next)return fail('invalid');if(next.complete)return fail('restorationDone');
 if(!next.ready)return fail('restorationLocked');if(s.buttons<next.cost)return fail('funds');
 s.buttons-=next.cost;s.restoration[room]++;return {ok:true,room,tier:s.restoration[room],cost:next.cost};
}
