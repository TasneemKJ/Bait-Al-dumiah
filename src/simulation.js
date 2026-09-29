import {DOLLS,ROOMS,CATALOG,SLOTS,SECRETS,ACTIONS,BOND_LEVELS,SECRET_COZY,MILESTONES,SEW_SECONDS,SEW_DAILY,BASKET_MAX} from './content.js';
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
  streak:0,lastFullDay:0,sewnToday:0,basket:0,earnedToday:0,achieved:[],milestones:[],events:[],
  settings:{locale:'en',muted:true,reducedMotion:false,quality:'auto'}};
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
function newDay(s){
 const wishes=s.wishes.length;s.day=Math.min(99999,s.day+1);s.wishes=[];s.sewnToday=0;
 emit(s,{type:'dawn',day:s.day,wishes,earned:s.earnedToday,streak:currentStreak(s)});s.earnedToday=0;
}
export function step(s,dt){
 if(s.paused||!Number.isFinite(dt)||dt<=0)return;
 dt=Math.min(dt,1);s.elapsed+=dt;s.clock+=dt;
 if(s.clock>=240){s.clock-=240;newDay(s)}
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
 s.buttons-=entry.price;s.decor.push({id:s.nextId++,item,room,slot});
 for(const d of s.dolls)if(d.room===room)d.comfort=clamp(d.comfort+entry.cozy);
 const loved=s.dolls.filter(d=>d.room===room&&DOLLS.find(x=>x.id===d.id).favItem===item).map(d=>d.id);
 checkMilestones(s);
 return {ok:true,cost:entry.price,loved};
}
// Packing away returns the price and the comfort that placing gave, so a place/refund loop earns nothing.
export function remove(s,id){const index=s.decor.findIndex(d=>d.id===id);if(index<0)return fail('invalid');const item=s.decor.splice(index,1)[0],entry=CATALOG.find(i=>i.id===item.item),refund=entry.price;for(const d of s.dolls)if(d.room===item.room)d.comfort=clamp(d.comfort-entry.cozy);s.buttons=Math.min(9999,s.buttons+refund);return {ok:true,refund}}
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
// Whitelist all persisted fields: no saved HTML/prose, renderer objects, or wall-clock catch-up.
// Fields added after the first release default safely, so earlier version-1 saves keep loading.
export function restore(raw){
 const s=createState();let v;
 try{v=JSON.parse(raw)}catch{return s}
 if(!v||v.version!==1||Array.isArray(v))return s;
 s.elapsed=clamp(v.elapsed,0,1e9);s.clock=clamp(v.clock,0,239.999);s.day=integer(v.day,1,99999);s.buttons=integer(v.buttons,0,9999);s.unease=clamp(v.unease);s.cares=integer(v.cares,0,1e9);
 if(Array.isArray(v.dolls))for(const d of s.dolls){const a=v.dolls.find(x=>x&&x.id===d.id);if(!a)continue;for(const k of ['hunger','energy','comfort','bond'])if(Number.isFinite(a[k]))d[k]=clamp(a[k]);if(has(ROOMS,a.room))d.room=a.room;d.lastCare=-10;d.action='idle';d.actionUntil=0}
 const occupied=new Set();
 if(Array.isArray(v.decor))for(const d of v.decor.slice(0,100)){if(!d||!has(CATALOG,d.item)||!has(ROOMS,d.room)||!Number.isInteger(d.slot)||d.slot<0||d.slot>=SLOTS.length)continue;const key=`${d.room}:${d.slot}`;if(occupied.has(key))continue;occupied.add(key);s.decor.push({id:s.nextId++,item:d.item,room:d.room,slot:d.slot})}
 s.wishes=Array.isArray(v.wishes)?DOLLS.filter(d=>v.wishes.includes(d.id)).map(d=>d.id):[];
 s.journal=Array.isArray(v.journal)?SECRETS.filter(id=>v.journal.includes(id)):[];
 s.lastSecretDay=integer(v.lastSecretDay,0,s.day);
 s.lastFullDay=integer(v.lastFullDay,0,s.day);s.streak=s.lastFullDay?integer(v.streak,1,999):0;
 s.sewnToday=integer(v.sewnToday,0,SEW_DAILY);s.earnedToday=integer(v.earnedToday,0,99999);
 s.basket=integer(v.basket,0,BASKET_MAX);
 const ids=list=>Array.isArray(list)?MILESTONES.filter(m=>list.includes(m.id)).map(m=>m.id):[];
 s.milestones=ids(v.milestones);s.achieved=ids([...ids(v.achieved),...s.milestones]);
 if(v.settings&&typeof v.settings==='object'){s.settings.locale=v.settings.locale==='ar'?'ar':'en';s.settings.muted=v.settings.muted!==false;s.settings.reducedMotion=v.settings.reducedMotion===true;s.settings.quality=['auto','low','high'].includes(v.settings.quality)?v.settings.quality:'auto'}
 return s;
}
