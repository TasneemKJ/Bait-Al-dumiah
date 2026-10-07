import {DOLLS,ROOMS,CATALOG,SLOTS,SECRETS,ACTIONS,BOND_LEVELS,SECRET_COZY,MILESTONES,SEW_SECONDS,SEW_DAILY,BASKET_MAX,DOOR_STEPS,GIFT_COST,VISITOR_GIFTS,WISH_REFRESH_SECONDS,ACTIVITIES,ACTIVITY_THRESHOLDS,ACTIVITY_DAILY_CAP,ACTIVITY_COOLDOWN,RESTORATION_COSTS,RESTORATION_MASTERY,INTERACTIVE_PROPS,STORY_CHAPTERS,TEA_TABLE,STITCH_TABLE,STITCH_PATTERNS} from './content.js';
import {sectionLength,requiredLength,stitchEdge,stitchFront,acceptedTrail,moveStitch} from './stitch-path.js';
const clamp=(v,min=0,max=100)=>Math.max(min,Math.min(max,Number.isFinite(v)?v:min));
const integer=(v,min,max)=>Math.floor(clamp(v,min,max));
const has=(items,id)=>items.some(x=>x.id===id);
const fail=(reason,extra)=>({ok:false,reason,...extra});
const earn=(s,amount)=>{s.buttons=Math.min(9999,s.buttons+amount);s.earnedToday=Math.min(99999,s.earnedToday+amount)};
// Events are transient notices for the presentation layer; they are never restored from a save.
const emit=(s,event)=>{if(s.events.length<24)s.events.push(event)};
export function createState(){
 return {version:1,elapsed:0,clock:0,day:1,buttons:36,unease:12,cares:0,
  dolls:DOLLS.map(d=>({id:d.id,room:d.room,hunger:d.hunger,energy:d.energy,comfort:d.comfort,lastCare:-10,action:'idle',actionUntil:0,bond:0,sew:0})),
  decor:[],nextId:1,wishes:[],journal:[],lastSecretDay:0,paused:false,
  streak:0,lastFullDay:0,sewnToday:0,basket:0,earnedToday:0,achieved:[],milestones:[],events:[],door:0,gifts:[],lastGiftDay:0,dayTime:0,hints:{night:false,calm:false},
  activities:{mastery:Object.fromEntries(ACTIVITIES.map(a=>[a.id,0])),completed:Object.fromEntries(ACTIVITIES.map(a=>[a.id,0])),lastReward:Object.fromEntries(ACTIVITIES.map(a=>[a.id,-ACTIVITY_COOLDOWN])),teaRecords:[null,null,null,null],stitchRecords:[null,null,null,null],active:null},
  restoration:Object.fromEntries(ROOMS.map(r=>[r.id,0])),
  story:{chapter:0,step:0,lastAction:null,lastActionAt:-10},
  settings:{locale:'en',muted:true,reducedMotion:false,quality:'auto',largeText:false}};
}
export const isNight=s=>s.clock>=120;
export const hour=s=>(8+s.clock/10)%24;
// Day one keeps each resident's authored wish; later days rotate through their personal wish list.
export function wishFor(s,id){const i=DOLLS.findIndex(d=>d.id===id);if(i<0)return null;const pool=DOLLS[i].wishes,day=Math.max(1,s.day)-1;return pool[(day*(i+1)+Math.floor(day/pool.length))%pool.length]}
export const bondLevel=bond=>BOND_LEVELS.reduce((level,min,i)=>bond>=min?i:level,0);
export const nextBond=bond=>BOND_LEVELS.find(min=>min>bond)??null;
export const wishReward=d=>8+2*bondLevel(d.bond);
export const currentStreak=s=>s.lastFullDay>=s.day-1?s.streak:0;
export const fullRooms=s=>ROOMS.filter(r=>s.decor.filter(d=>d.room===r.id).length>=SLOTS.length).length;
export const inFavoriteRoom=d=>DOLLS.find(x=>x.id===d.id)?.favRoom===d.room;
export const delighted=(s,d)=>{const fav=DOLLS.find(x=>x.id===d.id)?.favItem;return s.decor.some(k=>k.room===d.room&&k.item===fav)};
export const contentThreshold=(s,d)=>delighted(s,d)?45:55;
export const isContent=(s,d)=>['hunger','energy','comfort'].every(k=>d[k]>=contentThreshold(s,d));
export const secretCozyNeeded=s=>SECRET_COZY[s.journal.length]??0;
export function coziness(s){return Math.round(clamp(28+s.decor.reduce((v,d)=>v+(CATALOG.find(i=>i.id===d.item)?.cozy??0),0)+s.dolls.reduce((v,d)=>v+d.comfort,0)/15+fullRooms(s)*4))}
const milestoneMet={
 'first-care':s=>s.cares>=1,
 'first-keepsake':s=>s.decor.length>=1,
 'full-house':s=>s.lastFullDay>0,
 'first-friend':s=>s.dolls.some(d=>bondLevel(d.bond)>=2),
 'every-room':s=>ROOMS.every(r=>s.decor.some(d=>d.room===r.id)),
 'room-complete':s=>fullRooms(s)>=1,
 'three-whispers':s=>s.journal.length>=3,
 'cozy-home':s=>coziness(s)>=70,
 'streak-3':s=>currentStreak(s)>=3,
 'family':s=>s.dolls.every(d=>bondLevel(d.bond)>=3),
 'all-whispers':s=>s.journal.length>=SECRETS.length,
 'door-open':s=>s.door>=DOOR_STEPS.length,
 'all-gifts':s=>s.gifts.length>=VISITOR_GIFTS.length,
};
// Reached milestones wait to be collected, so buttons only change on an explicit action.
export function checkMilestones(s){
 for(const m of MILESTONES)if(!s.achieved.includes(m.id)&&milestoneMet[m.id](s)){s.achieved.push(m.id);emit(s,{type:'milestone',id:m.id,reward:m.reward})}
}
export const unclaimed=s=>MILESTONES.filter(m=>s.achieved.includes(m.id)&&!s.milestones.includes(m.id));
export function claim(s,id){
 const m=MILESTONES.find(x=>x.id===id);
 if(!m||!s.achieved.includes(id))return fail('invalid');
 if(s.milestones.includes(id))return fail('claimed');
 s.milestones.push(id);earn(s,m.reward);return {ok:true,reward:m.reward};
}
export function collectBasket(s){if(s.basket<1)return fail('emptyBasket');const reward=s.basket;s.basket=0;earn(s,reward);return {ok:true,reward}}
function growBond(s,d,amount){
 const before=bondLevel(d.bond);d.bond=clamp(d.bond+amount);const after=bondLevel(d.bond);
 for(let level=before+1;level<=after;level++){const reward=5*level;earn(s,reward);emit(s,{type:'bond',id:d.id,level,reward})}
}
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
  if(s.wishes.length===DOLLS.length){s.streak=s.lastFullDay===s.day-1?Math.min(999,s.streak+1):1;s.lastFullDay=s.day;bonus=4+2*Math.min(s.streak,5);earn(s,bonus);emit(s,{type:'full-house',streak:s.streak,reward:bonus})}
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
 if(s.paused){if(s.activities.active?.id==='stitch')releaseStitch(s);cancelChime(s);return}if(!Number.isFinite(dt)||dt<=0)return;
 dt=Math.min(dt,1);s.elapsed+=dt;s.clock+=dt;s.dayTime=Math.min(1e6,s.dayTime+dt);
 stepTea(s,dt);stepChimes(s,dt);const stitching=stitchActive(s);if(stitching)moveStitch(stitching,stitchSections(stitching),dt);
 if(s.clock>=240){s.clock-=240;newDay(s)}
 // One gentle pointer the first time night falls, for a player who has not met the visitor yet.
 if(isNight(s)&&!s.hints.night){s.hints.night=true;emit(s,{type:'first-night'})}
 // Day one is front-loaded: after the opening burst, one calm line makes the quiet stretch feel intended.
 if(!s.hints.calm&&s.day===1&&s.clock>=90){s.hints.calm=true;if(s.clock<120&&s.cares>0)emit(s,{type:'calm'})}
 const comfortProtection=Math.min(.65,s.decor.length*.035);
 for(const d of s.dolls){
  d.hunger=clamp(d.hunger-dt*.13);d.energy=clamp(d.energy-dt*.095);d.comfort=clamp(d.comfort-dt*.085*(1-comfortProtection)*(inFavoriteRoom(d)?.6:1));if(s.elapsed>d.actionUntil)d.action='idle';
  // Content residents sew a few buttons into the basket each day; nothing is taken from unhappy ones.
  if(isContent(s,d)&&s.sewnToday<SEW_DAILY&&s.basket<BASKET_MAX){d.sew+=dt;if(d.sew>=SEW_SECONDS){d.sew=0;s.sewnToday++;s.basket++;if(s.basket===1)emit(s,{type:'sewn',id:d.id})}}
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
 s.buttons-=entry.price;s.decor.push({id:s.nextId++,item,room,slot,rotation:0,originRoom:room,active:false,tendedDay:0,lastUse:-10});
 for(const d of s.dolls)if(d.room===room)d.comfort=clamp(d.comfort+entry.cozy);
 const loved=s.dolls.filter(d=>d.room===room&&DOLLS.find(x=>x.id===d.id).favItem===item).map(d=>d.id);
 checkMilestones(s);
 return {ok:true,cost:entry.price,loved};
}
// Packing away returns the price and the comfort that placing gave, so a place/refund loop earns nothing.
export function remove(s,id){const index=s.decor.findIndex(d=>d.id===id);if(index<0)return fail('invalid');const item=s.decor.splice(index,1)[0],entry=CATALOG.find(i=>i.id===item.item),refund=entry.price;for(const d of s.dolls)if(d.room===(item.originRoom??item.room))d.comfort=clamp(d.comfort-entry.cozy);s.buttons=Math.min(9999,s.buttons+refund);return {ok:true,refund}}
export function moveDecor(s,id,room,slot){
 const item=s.decor.find(d=>d.id===id);
 if(!item||!has(ROOMS,room)||!Number.isInteger(slot)||!SLOTS[slot])return fail('invalid');
 if(s.decor.some(d=>d.id!==id&&d.room===room&&d.slot===slot))return fail('occupied');
 item.originRoom??=item.room;item.room=room;item.slot=slot;return {ok:true};
}
export function rotateDecor(s,id){const item=s.decor.find(d=>d.id===id);if(!item)return fail('invalid');item.rotation=((item.rotation??0)+1)%4;return {ok:true}}
export function useDecor(s,id){
 const item=s.decor.find(d=>d.id===id);if(!item)return fail('invalid');
 if(!['plant','lamp','musicbox','mobile'].includes(item.item))return fail('notInteractive');
 if(item.item==='plant'){
  if(item.tendedDay===s.day)return fail('alreadyTended');
  item.tendedDay=s.day;item.lastUse=s.elapsed;return {ok:true,id,effect:'water'};
 }
 item.tendedDay=s.day;item.lastUse=s.elapsed;
 if(item.item==='lamp'){item.active=!item.active;return {ok:true,id,effect:item.active?'light':'dim',active:item.active}}
 return {ok:true,id,effect:item.item==='musicbox'?'wind':'rock'};
}
export function moveDoll(s,id,room){const doll=s.dolls.find(d=>d.id===id);if(!doll||!has(ROOMS,room))return fail('invalid');doll.room=room;return {ok:true,favorite:inFavoriteRoom(doll)}}
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
const doorNeeds={'sami-dear':s=>bondLevel(s.dolls.find(d=>d.id==='sami').bond)>=3,'all-whispers':s=>s.journal.length>=SECRETS.length};
export const doorOpen=s=>s.door>=DOOR_STEPS.length;
export const nextDoorStep=s=>DOOR_STEPS[s.door]??null;
export const doorReady=(s,step=nextDoorStep(s))=>Boolean(step)&&(!step.needs||doorNeeds[step.needs](s));
export function mendDoor(s){
 const step=nextDoorStep(s);if(!step)return fail('doorDone');
 if(!doorReady(s,step))return fail('doorNeeds',{needs:step.needs});
 if(s.buttons<step.cost)return fail('funds');
 s.buttons-=step.cost;s.door++;s.unease=clamp(s.unease-6);checkMilestones(s);
 return {ok:true,step:step.id,cost:step.cost};
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
const activityDef=id=>ACTIVITIES.find(a=>a.id===id);
export const activityLevel=(s,id)=>activityDef(id)?ACTIVITY_THRESHOLDS.reduce((level,min,i)=>s.activities.mastery[id]>=min?i:level,0):0;
export const activityReward=(s,id)=>7+activityLevel(s,id)*2;
export function activityPattern(s,id){
 const a=activityDef(id);if(!a)return [];
 const level=activityLevel(s,id),seed=a.seed+s.activities.mastery[id]*3;
 return Array.from({length:Math.min(5,3+level)},(_,i)=>(seed+i*(a.seed+1)+Math.floor(i/2))%4);
}
export function activityRewardReady(s,id){return Boolean(activityDef(id))&&s.activities.completed[id]<ACTIVITY_DAILY_CAP&&s.elapsed-s.activities.lastReward[id]>=ACTIVITY_COOLDOWN}
export function beginActivity(s,id){
 if(s.paused)return fail('pausedActivity');if(!activityDef(id))return fail('invalid');
 if(s.activities.active)return fail('activityBusy');
 if(id==='tea'){s.activities.active=createTea(s,'ritual');return {ok:true}}
 if(id==='stitch'){s.activities.active=createStitch(s,'ritual');return {ok:true}}
 if(id==='lullaby'){s.activities.active={id,phase:'listen',pattern:activityPattern(s,id),cursor:0,listenTime:0,round:0,held:null,pull:0,mistakes:0,lastTone:null,lastPluck:-10,toneSerial:0,result:null};return {ok:true}}
 s.activities.active={id,cursor:0,pattern:activityPattern(s,id),phase:id==='stitch'?'study':'play',hint:false};return {ok:true};
}
export function endActivity(s){releaseTea(s);releaseStitch(s);cancelChime(s);s.activities.active=null;return {ok:true}}
export function startRecall(s){const a=s.activities.active;if(s.paused)return fail('pausedActivity');if(a?.id!=='stitch'||a.phase!=='study')return fail('invalid');a.phase='recall';return {ok:true}}
export function toggleActivityHint(s){const a=s.activities.active;if(s.paused)return fail('pausedActivity');if(a?.id!=='stitch'||a.phase!=='recall')return fail('invalid');a.hint=!a.hint;return {ok:true}}
export function activityAnswer(s){const a=s.activities.active;return a&&a.id!=='tea'&&a.id!=='stitch'? a.id==='lullaby'?[...a.pattern].reverse():[...a.pattern]:[]}
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
// Sequence and physical rituals share one economic boundary.
function completeActivity(s,id){
 const a=activityDef(id),before=activityLevel(s,id),rewarded=activityRewardReady(s,id),base=activityReward(s,id);
 let reward=0,bonus=0;
 if(rewarded){
  s.activities.completed[id]++;s.activities.lastReward[id]=s.elapsed;s.activities.mastery[id]=Math.min(999,s.activities.mastery[id]+1);
  reward=base;bonus=activityLevel(s,id)>before?10*(before+1):0;earn(s,reward+bonus);
  const d=s.dolls.find(d=>d.id===a.resident);growBond(s,d,3);d.comfort=clamp(d.comfort+8);s.unease=clamp(s.unease-3);
 }
 checkMilestones(s);
 return {ok:true,complete:true,id,reward,bonus,level:activityLevel(s,id),practice:!rewarded};
}
const TEA_TOLERANCE=.07;
const teaActive=s=>s.activities.active?.id==='tea'?s.activities.active:null;
const cupReady=c=>Math.abs(c.fill-c.target)<=TEA_TOLERANCE+1e-9;
const teaHit=a=>a.cups.find(c=>Math.abs(c.x-a.aim*TEA_TABLE.aimSpan)<=TEA_TABLE.cupRadius)??null;
const teaFlow=(s,a)=>a.phase==='pour'&&!s.paused&&a.pressed?Math.max(0,(a.tilt-.15)/.85)*.55:0;
function createTea(s,mode){
 const level=mode==='guest'?0:activityLevel(s,'tea'),xs=mode==='guest'?[0]:level<2?[-.23,.23]:[-.33,0,.33];
 return {id:'tea',phase:'pour',mode,level,cups:xs.map((x,id)=>({id,x,target:mode==='guest'?.70:.60+((level*3+s.day+s.activities.mastery.tea+id*4)%5)*.05,fill:0})),aim:0,tilt:0,pressed:false,spills:0,poured:0,result:null};
}
function stepTea(s,dt){
 const a=teaActive(s);if(!a)return;const volume=teaFlow(s,a)*dt;if(volume<=0)return;
 a.poured+=volume;const cup=teaHit(a);
 if(!cup){a.spills+=volume;return}
 const added=Math.min(volume,Math.max(0,1.2-cup.fill));cup.fill+=added;a.spills+=volume-added;
}
export function teaStatus(s){
 const a=teaActive(s);if(!a)return null;
 return {...a,result:a.result?structuredClone(a.result):null,flow:teaFlow(s,a),aimedCup:teaHit(a)?.id??null,best:a.mode==='ritual'?s.activities.teaRecords[a.level]:null,cups:a.cups.map(c=>({...c,ready:cupReady(c),overfilled:c.fill>c.target+TEA_TOLERANCE+1e-9})),ready:a.phase==='pour'&&!a.pressed&&a.cups.every(cupReady)};
}
function teaCommand(s){
 if(s.paused)return fail('pausedActivity');const a=teaActive(s);
 if(!a)return fail('teaNotActive');if(a.phase==='served')return fail('teaServed');return null;
}
export function controlTea(s,input){
 const blocked=teaCommand(s);if(blocked)return blocked;
 if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['aim','tilt','pressed'].includes(k))||!Number.isFinite(input.aim)||input.aim< -1||input.aim>1||!Number.isFinite(input.tilt)||input.tilt<0||input.tilt>1||typeof input.pressed!=='boolean')return fail('invalid');
 const a=teaActive(s);a.aim=input.aim;a.tilt=input.tilt;a.pressed=input.pressed;return {ok:true};
}
export function releaseTea(s){
 const a=teaActive(s);if(!a)return fail('teaNotActive');a.pressed=false;a.tilt=0;return {ok:true};
}
export function emptyTeaCup(s,id){
 const blocked=teaCommand(s);if(blocked)return blocked;const a=teaActive(s),cup=Number.isInteger(id)?a.cups.find(c=>c.id===id):null;
 if(!cup)return fail('invalid');if(a.pressed)return fail('teaHeld');if(cup.fill<=cup.target+TEA_TOLERANCE+1e-9)return fail('teaNotOverfilled');
 a.spills+=cup.fill;cup.fill=0;return {ok:true};
}
export function serveTea(s){
 const blocked=teaCommand(s);if(blocked)return blocked;const a=teaActive(s);
 if(a.pressed)return fail('teaHeld');if(!a.cups.every(cupReady))return fail('teaNotReady');
 if(a.mode==='guest'){const story=storyStatus(s);if(story.chapter?.id!=='guest-tea'||story.step!==2)return fail('storyNotHere')}
 const accuracy=a.cups.reduce((sum,c)=>sum+Math.max(0,1-Math.abs(c.fill-c.target)/TEA_TOLERANCE),0)/a.cups.length;
 const useful=a.cups.reduce((sum,c)=>sum+Math.min(c.fill,c.target),0),score=integer(Math.round(100*accuracy*Math.min(1,useful/a.poured)),0,100);
 let result;
 if(a.mode==='guest')result={ok:true,complete:true,id:'tea',mode:'guest',reward:0,bonus:0,level:a.level,practice:true,score,storyResult:advanceStory(s,storyStatus(s))};
 else{result={...completeActivity(s,'tea'),mode:'ritual',score};s.activities.teaRecords[a.level]=Math.max(s.activities.teaRecords[a.level]??0,score)}
 a.pressed=false;a.tilt=0;a.phase='served';a.result=result;return structuredClone(result);
}

const stitchActive=s=>s.activities.active?.id==='stitch'?s.activities.active:null;
const stitchSections=a=>STITCH_PATTERNS.find(p=>p.id===a.patternId).sections;
function createStitch(s,mode){
 const level=mode==='mend'?0:activityLevel(s,'stitch'),patternId=mode==='mend'?'bear-seam':['leaf','diamond','jasmine','heart'][level];
 const p=STITCH_PATTERNS.find(p=>p.id===patternId).sections[0][0],needle={x:p[0],y:p[1]};
 return {id:'stitch',mode,phase:'sew',level,patternId,section:0,distance:0,needle,target:{...needle},pressed:false,loose:false,travel:0,alignmentTravel:0,repairs:0,capture:null,result:null};
}
export function stitchStatus(s){
 const a=stitchActive(s);if(!a)return null;const sections=stitchSections(a),e=stitchEdge(a,sections);
 return {...structuredClone(a),sections:structuredClone(sections),completedSections:Math.min(a.section,sections.length),acceptedTrail:acceptedTrail(a,sections),nextGuidePoint:e?{...e.end}:null,requiredLength:requiredLength(sections),best:a.mode==='ritual'?s.activities.stitchRecords[a.level]:null,ready:a.phase==='sew'&&a.section===sections.length&&!a.pressed&&!a.loose&&!a.capture};
}
function stitchCommand(s){
 if(s.paused)return fail('pausedActivity');const a=stitchActive(s);
 if(!a)return fail('stitchNotActive');if(a.phase==='finished')return fail('stitchFinished');return null;
}
export function controlStitch(s,input){
 const blocked=stitchCommand(s);if(blocked)return blocked;
 if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['x','y','pressed'].includes(k))||!Number.isFinite(input.x)||input.x< -1||input.x>1||!Number.isFinite(input.y)||input.y< -1||input.y>1||typeof input.pressed!=='boolean')return fail('invalid');
 const a=stitchActive(s);a.target={x:input.x,y:input.y};a.pressed=input.pressed;
 if(!input.pressed)a.capture=null;return {ok:true};
}
export function releaseStitch(s){
 const a=stitchActive(s);if(!a)return fail('stitchNotActive');a.pressed=false;a.capture=null;a.target={...a.needle};return {ok:true};
}
export function unpickStitch(s){
 const blocked=stitchCommand(s);if(blocked)return blocked;const a=stitchActive(s);
 if(a.pressed)return fail('stitchHeld');if(a.section>=stitchSections(a).length||(!a.loose&&a.distance<=0))return fail('stitchNoRepair');
 const p=stitchSections(a)[a.section][0];a.distance=0;a.loose=false;a.capture=null;a.needle={x:p[0],y:p[1]};a.target={...a.needle};a.repairs++;return {ok:true};
}
export function finishStitch(s){
 const blocked=stitchCommand(s);if(blocked)return blocked;const a=stitchActive(s),sections=stitchSections(a);
 if(a.pressed)return fail('stitchHeld');if(a.loose||a.capture||a.section!==sections.length)return fail('stitchNotReady');
 if(a.mode==='mend'){const story=storyStatus(s);if(story.chapter?.id!=='mended-friend'||story.step!==1)return fail('storyNotHere')}
 const score=integer(Math.round(100*(a.travel>0?a.alignmentTravel/a.travel:0)*Math.min(1,requiredLength(sections)/Math.max(a.travel,1e-9))),0,100);
 let result;
 if(a.mode==='mend')result={ok:true,complete:true,id:'stitch',mode:'mend',reward:0,bonus:0,level:a.level,practice:true,score,storyResult:advanceStory(s,storyStatus(s))};
 else{result={...completeActivity(s,'stitch'),mode:'ritual',score};s.activities.stitchRecords[a.level]=Math.max(s.activities.stitchRecords[a.level]??0,score)}
 a.phase='finished';a.capture=null;a.pressed=false;a.target={...a.needle};a.result=structuredClone(result);return structuredClone(result);
}

export function restorationReady(s,room){
 const r=ROOMS.find(r=>r.id===room);if(!r)return null;const tier=s.restoration[room];
 const id=room==='parlor'?'tea':ACTIVITIES.find(a=>a.room===room)?.id;
 return {tier,activity:id,required:RESTORATION_MASTERY[tier]??0,cost:RESTORATION_COSTS[tier]??0,complete:tier>=3,ready:tier<3&&s.activities.mastery[id]>=RESTORATION_MASTERY[tier]};
}
export function restoreRoom(s,room){
 const next=restorationReady(s,room);if(!next)return fail('invalid');if(next.complete)return fail('restorationDone');
 if(!next.ready)return fail('restorationLocked');if(s.buttons<next.cost)return fail('funds');
 s.buttons-=next.cost;s.restoration[room]++;return {ok:true,room,tier:s.restoration[room],cost:next.cost};
}
// A single ordered progress record owns inventory, completed memories and rewards.
// No separate held/claimed flags can disagree after an interrupted mobile session.
export function storyStatus(s){
 const index=s.story.chapter,chapter=STORY_CHAPTERS[index]??null,step=chapter?s.story.step:0;
 const completed=STORY_CHAPTERS.slice(0,index).map(c=>c.id);
 const progress=STORY_CHAPTERS.slice(0,index).reduce((sum,c)=>sum+c.steps.length,0)+step;
 return {chapter,index,step,next:chapter?.steps[step]??null,held:chapter&&step>0?chapter.steps[step-1].gives:null,completed,finished:chapter===null,progress,totalSteps:STORY_CHAPTERS.reduce((sum,c)=>sum+c.steps.length,0)};
}
export function interactStory(s,key){
 if(s.paused)return fail('pausedActivity');
 if(typeof key!=='string'||!INTERACTIVE_PROPS.some(p=>'prop:'+p.id===key))return fail('invalid');
 if(s.activities.active)return fail('activityBusy');
 const status=storyStatus(s);if(status.finished)return fail('storyFinished');
 if(key!=='prop:'+status.next.object)return fail('storyNotHere');
 if(status.chapter.id==='mended-friend'&&status.step===1){s.activities.active=createStitch(s,'mend');return {ok:true,startedActivity:'stitch',mode:'mend',held:status.held}}
 if(status.chapter.id==='guest-tea'&&status.step===2){s.activities.active=createTea(s,'guest');return {ok:true,startedActivity:'tea',mode:'guest',held:status.held}}
 return advanceStory(s,status);
}
function advanceStory(s,status){
 const {chapter,step,next}=status,chapterComplete=step===chapter.steps.length-1,reward=chapterComplete?chapter.reward:0;
 s.story.lastAction='prop:'+next.object;s.story.lastActionAt=s.elapsed;
 if(chapterComplete){s.story.chapter++;s.story.step=0;earn(s,reward)}else s.story.step++;
 return {ok:true,chapterComplete,reward,chapterId:chapter.id,step,message:`story-${chapter.id}-${step}-done`,effect:next.object,held:storyStatus(s).held};
}
// Earned tableaux remain toys; replay records a visual cue, never progression.
export function playStoryKeepsake(s,key){
 if(s.paused)return fail('pausedActivity');
 const chapters={'prop:moon-bed':'mended-friend','prop:music-cabinet':'lost-song','prop:doorstep':'guest-tea'};
 if(typeof key!=='string'||!Object.hasOwn(chapters,key))return fail('invalid');
 if(!storyStatus(s).completed.includes(chapters[key]))return fail('storyNotReady');
 s.story.lastAction=key;s.story.lastActionAt=s.elapsed;
 const effect=key.slice(5);return {ok:true,effect,message:'story-replay-'+effect};
}
// Whitelist all persisted fields: no saved HTML/prose, renderer objects, or wall-clock catch-up.
// Fields added after the first release default safely, so earlier version-1 saves keep loading.
// Save schema. Version 1 is the only released format (key bait-al-dumiah.v1).
// A future format adds MIGRATIONS[n] (n -> n+1) and bumps SAVE_VERSION; restore()
// then upgrades older saves step by step. Unknown or newer versions are refused.
export const SAVE_VERSION=1;
const MIGRATIONS={};
export function migrate(v,migrations=MIGRATIONS,target=SAVE_VERSION){
 if(!v||typeof v!=='object'||Array.isArray(v)||!Number.isInteger(v.version)||v.version<1||v.version>target)return null;
 let out=v;
 while(out.version<target){const step=migrations[out.version];if(typeof step!=='function')return null;const next=step(structuredClone(out));if(!next||typeof next!=='object'||next.version!==out.version+1)return null;out=next}
 return out;
}
// Parses and validates a save. ok is false when text was present but unreadable,
// so the caller can keep a backup instead of silently overwriting it.
export function readSave(raw){
 if(raw==null||raw==='')return {ok:true,empty:true,state:createState()};
 let v;try{v=JSON.parse(raw)}catch{return {ok:false,reason:'corrupt',state:createState()}}
 const current=migrate(v);if(!current)return {ok:false,reason:v&&typeof v==='object'&&Number.isInteger(v.version)&&v.version>SAVE_VERSION?'newer':'corrupt',state:createState()};
 return {ok:true,state:restoreValid(current)};
}
export function restore(raw){return readSave(raw).state}
function restoreValid(v){
 const s=createState();
 s.elapsed=clamp(v.elapsed,0,1e9);s.clock=clamp(v.clock,0,239.999);s.day=integer(v.day,1,99999);s.buttons=integer(v.buttons,0,9999);s.unease=clamp(v.unease);s.cares=integer(v.cares,0,1e9);
 if(Array.isArray(v.dolls))for(const d of s.dolls){const a=v.dolls.find(x=>x&&x.id===d.id);if(!a)continue;for(const k of ['hunger','energy','comfort','bond'])if(Number.isFinite(a[k]))d[k]=clamp(a[k]);if(has(ROOMS,a.room))d.room=a.room;d.lastCare=-10;d.action='idle';d.actionUntil=0}
 const occupied=new Set();
 if(Array.isArray(v.decor))for(const d of v.decor.slice(0,100)){if(!d||!has(CATALOG,d.item)||!has(ROOMS,d.room)||!Number.isInteger(d.slot)||d.slot<0||d.slot>=SLOTS.length)continue;const key=`${d.room}:${d.slot}`;if(occupied.has(key))continue;occupied.add(key);s.decor.push({id:s.nextId++,item:d.item,room:d.room,slot:d.slot,rotation:Number.isInteger(d.rotation)&&d.rotation>=0&&d.rotation<4?d.rotation:0,originRoom:has(ROOMS,d.originRoom)?d.originRoom:d.room,active:d.active===true,tendedDay:integer(d.tendedDay,0,s.day),lastUse:Number.isFinite(d.lastUse)?clamp(d.lastUse,-10,s.elapsed):-10})}
 s.wishes=Array.isArray(v.wishes)?DOLLS.filter(d=>v.wishes.includes(d.id)).map(d=>d.id):[];
 s.journal=Array.isArray(v.journal)?SECRETS.filter(id=>v.journal.includes(id)):[];
 s.lastSecretDay=integer(v.lastSecretDay,0,s.day);
 s.lastFullDay=integer(v.lastFullDay,0,s.day);s.streak=s.lastFullDay?integer(v.streak,1,999):0;
 s.sewnToday=integer(v.sewnToday,0,SEW_DAILY);s.earnedToday=integer(v.earnedToday,0,99999);
 s.basket=integer(v.basket,0,BASKET_MAX);
 s.dayTime=clamp(v.dayTime,0,1e6);s.door=integer(v.door,0,DOOR_STEPS.length);s.gifts=Array.isArray(v.gifts)?VISITOR_GIFTS.filter(g=>v.gifts.includes(g)):[];s.lastGiftDay=integer(v.lastGiftDay,0,s.day);
 for(const a of ACTIVITIES){s.activities.mastery[a.id]=integer(v.activities?.mastery?.[a.id],0,999);s.activities.completed[a.id]=integer(v.activities?.completed?.[a.id],0,ACTIVITY_DAILY_CAP);s.activities.lastReward[a.id]=Number.isFinite(v.activities?.lastReward?.[a.id])?clamp(v.activities.lastReward[a.id],-ACTIVITY_COOLDOWN,s.elapsed):-ACTIVITY_COOLDOWN}
 if(Array.isArray(v.activities?.teaRecords))s.activities.teaRecords=s.activities.teaRecords.map((_,i)=>Number.isFinite(v.activities.teaRecords[i])?integer(v.activities.teaRecords[i],0,100):null);
 if(Array.isArray(v.activities?.stitchRecords))s.activities.stitchRecords=s.activities.stitchRecords.map((_,i)=>Number.isFinite(v.activities.stitchRecords[i])?integer(v.activities.stitchRecords[i],0,100):null);
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
 if(v.settings&&typeof v.settings==='object'){s.settings.locale=v.settings.locale==='ar'?'ar':'en';s.settings.muted=v.settings.muted!==false;s.settings.reducedMotion=v.settings.reducedMotion===true;s.settings.largeText=v.settings.largeText===true;s.settings.quality=['auto','low','high'].includes(v.settings.quality)?v.settings.quality:'auto'}
 return s;
}

// Moon chimes: the same validated pull/release commands serve pointer and keys.
// Listening, cancellation and weak taps never enter the economic boundary.
const chimeActive=s=>s.activities.active?.id==='lullaby'?s.activities.active:null;
const CHIME_LEAD=.35,CHIME_BEAT=.8,CHIME_RING=.52,CHIME_MIN_PULL=.22;
function stepChimes(s,dt){
 const a=chimeActive(s);if(!a||a.phase!=='listen')return;
 a.listenTime+=dt;
 if(a.listenTime>=CHIME_LEAD+a.pattern.length*CHIME_BEAT){a.phase='echo';a.cursor=0}
}
export function chimeStatus(s){
 const a=chimeActive(s);if(!a)return null;
 const index=Math.floor((a.listenTime-CHIME_LEAD)/CHIME_BEAT);
 const demo=a.phase==='listen'&&index>=0&&index<a.pattern.length&&(a.listenTime-CHIME_LEAD)%CHIME_BEAT<CHIME_RING;
 const recent=a.lastTone!==null&&s.elapsed-a.lastPluck<CHIME_RING;
 const sounding=demo?a.pattern[index]:recent?a.lastTone:null;
 return {...a,pattern:[...a.pattern],result:a.result?structuredClone(a.result):null,
  sounding,tone:demo?`${a.round}:demo:${index}`:recent?`pluck:${a.toneSerial}`:null,
  demoIndex:demo?index:null,minPull:CHIME_MIN_PULL};
}
function chimeBlocked(s,phase='echo'){
 if(s.paused)return fail('pausedActivity');const a=chimeActive(s);
 if(!a)return fail('chimeNotActive');if(a.phase!==phase)return fail(a.phase==='finished'?'chimeFinished':'chimeListening');return null;
}
export function grabChime(s,id){
 const blocked=chimeBlocked(s);if(blocked)return blocked;
 if(!Number.isInteger(id)||id<0||id>3)return fail('invalid');
 const a=chimeActive(s);if(a.held!==null)return fail('chimeHeld');
 a.held=id;a.pull=0;return {ok:true};
}
export function pullChime(s,pull){
 const blocked=chimeBlocked(s);if(blocked)return blocked;
 if(!Number.isFinite(pull)||pull<0||pull>1)return fail('invalid');
 const a=chimeActive(s);if(a.held===null)return fail('chimeNotHeld');
 a.pull=pull;return {ok:true};
}
export function cancelChime(s){
 const a=chimeActive(s);if(!a)return fail('chimeNotActive');a.held=null;a.pull=0;return {ok:true};
}
export function releaseChime(s){
 if(s.paused){cancelChime(s);return fail('pausedActivity')}
 const blocked=chimeBlocked(s);if(blocked)return blocked;
 const a=chimeActive(s);if(a.held===null)return fail('chimeNotHeld');
 const id=a.held,pull=a.pull;cancelChime(s);
 if(pull<CHIME_MIN_PULL)return {ok:true,silent:true};
 a.lastTone=id;a.lastPluck=s.elapsed;a.toneSerial++;
 if(id!==a.pattern[a.pattern.length-1-a.cursor]){
  a.cursor=0;a.mistakes++;a.phase='listen';a.listenTime=-.55;a.round++;
  return {ok:true,mistake:true,complete:false};
 }
 a.cursor++;
 if(a.cursor<a.pattern.length)return {ok:true,complete:false};
 a.phase='finished';a.result={...completeActivity(s,'lullaby'),mistakes:a.mistakes};
 return {...a.result};
}
export function replayChimes(s){
 if(s.paused)return fail('pausedActivity');const a=chimeActive(s);
 if(!a)return fail('chimeNotActive');if(a.phase==='finished')return fail('chimeFinished');
 cancelChime(s);a.phase='listen';a.listenTime=0;a.cursor=0;a.round++;a.lastTone=null;
 return {ok:true};
}
