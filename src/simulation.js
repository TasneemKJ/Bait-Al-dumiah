import {DOLLS,ROOMS,CATALOG,SLOTS,SECRETS,ACTIONS} from './content.js';
const clamp=(v,min=0,max=100)=>Math.max(min,Math.min(max,Number.isFinite(v)?v:min));
const integer=(v,min,max)=>Math.floor(clamp(v,min,max));
const has=(items,id)=>items.some(x=>x.id===id);
const fail=(reason)=>({ok:false,reason});
export function createState(){
 return {version:1,elapsed:0,clock:0,day:1,buttons:36,unease:12,cares:0,
  dolls:DOLLS.map(d=>({id:d.id,room:d.room,hunger:d.hunger,energy:d.energy,comfort:d.comfort,lastCare:-10,action:'idle',actionUntil:0,bond:0})),
  decor:[],nextId:1,wishes:[],journal:[],lastSecretDay:0,paused:false,
  settings:{locale:'en',muted:true,reducedMotion:false,quality:'auto'}};
}
export const isNight=s=>s.clock>=120;
export const hour=s=>(8+s.clock/10)%24;
export function coziness(s){return Math.round(clamp(28+s.decor.reduce((v,d)=>v+(CATALOG.find(i=>i.id===d.item)?.cozy??0),0)+s.dolls.reduce((v,d)=>v+d.comfort,0)/15))}
export function care(s,id,action){
 const d=s.dolls.find(x=>x.id===id), a=Object.hasOwn(ACTIONS,action)?ACTIONS[action]:null;
 if(!d||!a)return fail('invalid');
 if(s.elapsed-d.lastCare<3)return fail('busy');
 if(d[a.need]>92 && !(action==='soothe'&&s.unease>25))return fail('enough');
 if(s.buttons<a.cost)return fail('funds');
 s.buttons-=a.cost;d[a.need]=clamp(d[a.need]+a.amount);d.lastCare=s.elapsed;d.action=action;d.actionUntil=s.elapsed+4;
 if(action==='tea')d.energy=clamp(d.energy+4);
 if(action==='play')d.energy=clamp(d.energy-4);
 s.unease=clamp(s.unease-(action==='soothe'?14:5));d.bond=clamp(d.bond+4);s.cares++;
 const reward=DOLLS.find(x=>x.id===id).wish===action&&!s.wishes.includes(id)?8:0;
 if(reward){s.wishes.push(id);s.buttons=Math.min(9999,s.buttons+reward)}
 return {ok:true,reward,cost:a.cost};
}
export function step(s,dt){
 if(s.paused||!Number.isFinite(dt)||dt<=0)return;
 dt=Math.min(dt,1);s.elapsed+=dt;s.clock+=dt;
 if(s.clock>=240){s.clock-=240;s.day=Math.min(99999,s.day+1);s.wishes=[]}
 const comfortProtection=Math.min(.65,s.decor.length*.035);
 for(const d of s.dolls){d.hunger=clamp(d.hunger-dt*.13);d.energy=clamp(d.energy-dt*.095);d.comfort=clamp(d.comfort-dt*.085*(1-comfortProtection));if(s.elapsed>d.actionUntil)d.action='idle'}
 const target=isNight(s)?48-coziness(s)*.22:12;
 s.unease=clamp(s.unease+(target-s.unease)*dt*.008);
}
export function place(s,item,room,slot){
 const entry=CATALOG.find(x=>x.id===item);
 if(!entry||!has(ROOMS,room)||!Number.isInteger(slot)||slot<0||slot>=SLOTS.length)return fail('invalid');
 if(s.decor.some(d=>d.room===room&&d.slot===slot))return fail('occupied');
 if(s.buttons<entry.price)return fail('funds');
 s.buttons-=entry.price;s.decor.push({id:s.nextId++,item,room,slot});
 for(const d of s.dolls)if(d.room===room)d.comfort=clamp(d.comfort+entry.cozy);
 return {ok:true,cost:entry.price};
}
export function remove(s,id){const index=s.decor.findIndex(d=>d.id===id);if(index<0)return fail('invalid');const item=s.decor.splice(index,1)[0];const refund=CATALOG.find(i=>i.id===item.item).price;s.buttons=Math.min(9999,s.buttons+refund);return {ok:true,refund}}
export function moveDoll(s,id,room){const doll=s.dolls.find(d=>d.id===id);if(!doll||!has(ROOMS,room))return fail('invalid');doll.room=room;return {ok:true}}
export function changeLight(s){if(isNight(s)){s.clock=0;s.day=Math.min(99999,s.day+1);s.wishes=[]}else{s.clock=120}return {ok:true}}
export function discover(s){
 if(!isNight(s))return fail('daylight');
 if(s.lastSecretDay===s.day)return fail('tomorrow');
 const secret=SECRETS.find(x=>!s.journal.includes(x));if(!secret)return fail('complete');
 s.journal.push(secret);s.lastSecretDay=s.day;s.buttons=Math.min(9999,s.buttons+5);s.unease=clamp(s.unease+7);
 return {ok:true,secret,reward:5};
}
// Whitelist all persisted fields: no saved HTML/prose, renderer objects, or wall-clock catch-up.
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
 if(v.settings&&typeof v.settings==='object'){s.settings.locale=v.settings.locale==='ar'?'ar':'en';s.settings.muted=v.settings.muted!==false;s.settings.reducedMotion=v.settings.reducedMotion===true;s.settings.quality=['auto','low','high'].includes(v.settings.quality)?v.settings.quality:'auto'}
 return s;
}
