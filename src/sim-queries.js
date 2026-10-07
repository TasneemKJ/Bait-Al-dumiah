import {DOLLS,ROOMS,CATALOG,SLOTS,SECRETS,BOND_LEVELS,SECRET_COZY,SEW_DAILY,BASKET_MAX,GIFT_COST} from './content.js';
import {clamp} from './sim-util.js';

// Read-only questions about a house: time, bonds, wishes, comfort and the rules the interface asks about.
export const isNight=s=>s.clock>=120;
export const hour=s=>(8+s.clock/10)%24;
// Day one keeps each resident's authored wish; later days rotate through their personal wish list.
export function wishFor(s,id){const i=DOLLS.findIndex(d=>d.id===id);if(i<0)return null;
const pool=DOLLS[i].wishes,day=Math.max(1,s.day)-1;
return pool[(day*(i+1)+Math.floor(day/pool.length))%pool.length]}
export const bondLevel=bond=>BOND_LEVELS.reduce((level,min,i)=>bond>=min?i:level,0);
export const nextBond=bond=>BOND_LEVELS.find(min=>min>bond)??null;
export const wishReward=d=>8+2*bondLevel(d.bond);
export const currentStreak=s=>s.lastFullDay>=s.day-1?s.streak:0;
export const fullRooms=s=>ROOMS.filter(r=>s.decor.filter(d=>d.room===r.id).length>=SLOTS.length).length;
export const inFavoriteRoom=d=>DOLLS.find(x=>x.id===d.id)?.favRoom===d.room;
export const delighted=(s,d)=>{const fav=DOLLS.find(x=>x.id===d.id)?.favItem;
return s.decor.some(k=>k.room===d.room&&k.item===fav)};
export const contentThreshold=(s,d)=>delighted(s,d)?45:55;
export const isContent=(s,d)=>['hunger','energy','comfort'].every(k=>d[k]>=contentThreshold(s,d));
// Rules the interface asks about, answered here so no panel re-derives them.
export const canAfford=(s,cost)=>s.buttons>=cost;
export const wishGranted=(s,id)=>s.wishes.includes(id);
export const hasBasket=s=>s.basket>0;
export const basketFull=s=>s.basket>=BASKET_MAX;
export const sewingDone=s=>s.sewnToday>=SEW_DAILY;
export const secretsLeft=s=>s.journal.length<SECRETS.length;
export const visitorWaiting=s=>isNight(s)&&s.lastSecretDay!==s.day&&secretsLeft(s);
export const giftReady=s=>s.lastGiftDay!==s.day&&canAfford(s,GIFT_COST);
export const isNewestGift=(s,id)=>s.lastGiftDay===s.day&&id===s.gifts[s.gifts.length-1];
export const slotTaken=(s,room,slot,ignoreId=null)=>s.decor.some(d=>d.id!==ignoreId&&d.room===room&&d.slot===slot);
// Which line of care copy a content resident gets: a full basket, finished sewing, or plain contentment.
export const restingNote=s=>basketFull(s)?'basketFull':sewingDone(s)?'sewnDoneNote':'contentNote';
export const secretCozyNeeded=s=>SECRET_COZY[s.journal.length]??0;
export function coziness(s){return Math.round(clamp(28+s.decor.reduce((v,
  d)=>v+(CATALOG.find(i=>i.id===d.item)?.cozy??0),0)+s.dolls.reduce((v,d)=>v+d.comfort,0)/15+fullRooms(s)*4))}
