import {DOLLS,ROOMS,GIFT_COST} from './content.js';
import {isNight,coziness,wishFor,unclaimed,secretCozyNeeded,doorOpen,nextDoorStep,
  doorReady,restorationReady,canAfford,wishGranted,hasBasket,secretsLeft,giftReady,keepsakeWish,
  storyStatus} from './simulation.js';
import {storyObjective} from './story-ui.js';
import {wishKey,actionIcon} from './panels-ui.js';
import {appStore} from './app-store.js';
import {fifthRoomOpen,doorCost} from './access.js';

export const keepsakeWishLine=(t,w)=>`${t('keepsakeWish').replace('{doll}',t(w.doll))} ${t(w.item)} · ${t(w.room)}`;
function wishStep(s,t,wish){const action=wishFor(s,wish.id);
 return {copy:t(wishKey(wish.id,action)),label:t(action),ico:actionIcon[action],
  action:'care',value:{id:wish.id,action}}}
// One suggested next step: wishes, first keepsake, rewards to collect, then the night's whisper.
export function nextStep(s,t,n,focusRoom,access=appStore.access()){
 const wish=DOLLS.find(d=>!wishGranted(s,d.id));
 // A new house starts with the wish the intro just named (Lina's tea): one tap pays, then the story leads.
 if(!s.cares&&wish?.id==='lina')return wishStep(s,t,wish);
 const story=storyObjective(s,t,focusRoom);if(story)return story;
 if(wish)return wishStep(s,t,wish);
 if(!s.decor.length)return {copy:t('objectiveDecorate'),label:t('decorate'),ico:'leaf',action:'panel',value:'decorate'};
 const readyRoom=ROOMS.find(r=>{const next=restorationReady(s,r.id);return next.ready&&canAfford(s,next.cost)});
 if(readyRoom)return {copy:t('restorationObjective'),label:t('restoreAction'),ico:'home',action:'panel',
   value:'activities',focus:'#restoration-title'};
 if(Object.values(s.activities.mastery).every(v=>v===0))return {copy:t('activityObjective'),
   label:t('activities'),ico:'play',action:'panel',value:'activities'};
 if(unclaimed(s).length)return {copy:t('objectiveMilestone'),label:t('collect'),
   ico:'book',action:'panel',value:'journal',focus:'.milestone.ready'};
 if(hasBasket(s))return {copy:t('objectiveBasket'),label:t('collect')+' +'+n(s.basket),
   ico:'button',action:'collect-basket'};
 const step=nextDoorStep(s);
 // A door this copy has not opened is never the next step: it is offered only where it stands.
 const cost=step&&doorCost(step,access);
 if(step&&fifthRoomOpen(s,access)&&doorReady(s,step)&&canAfford(s,cost))return {copy:t('objectiveDoor'),
   label:cost?t('mend')+' · '+n(cost):t('mend'),ico:'home',action:'panel',value:'journal',focus:'.door-next'};
 const keepsake=!isNight(s)&&keepsakeWish(s);
 if(keepsake&&canAfford(s,keepsake.price))return {copy:keepsakeWishLine(t,keepsake),label:t('decorate'),ico:'leaf',
   action:'panel',value:'decorate'};
 if(secretsLeft(s)){
  if(isNight(s)&&s.lastSecretDay===s.day)return {copy:t('tomorrow'),label:t('dawn'),ico:'sun',action:'light'};
  if(isNight(s)&&coziness(s)<secretCozyNeeded(s))return {copy:t('objectiveShy'),
    label:t('decorate'),ico:'leaf',action:'panel',value:'decorate'};
  return {copy:t('objectiveNight'),label:t(isNight(s)?'investigate':'night'),
    ico:isNight(s)?'ghost':'moon',action:isNight(s)?'discover':'light'};
 }
 if(doorOpen(s)&&fifthRoomOpen(s,access)&&isNight(s)&&giftReady(s))return {copy:t('objectiveGift'),
   label:t('leaveGift')+' · '+n(GIFT_COST),ico:'ghost',action:'gift'};
 // Honest ending: every whisper heard and every corner furnished is the whole of this house's story.
 const complete=!secretsLeft(s)&&!storyStatus(s).chapter&&!keepsakeWish(s)&&s.keepsakeWishDay!==s.day;
 return {copy:t(complete?'objectiveComplete':'objectiveReturn'),label:t('household'),ico:'souls',action:'panel',
   value:'household'};
}
