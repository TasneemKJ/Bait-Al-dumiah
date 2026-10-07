import {DOLLS,ROOMS,GIFT_COST} from './content.js';
import {isNight,coziness,wishFor,unclaimed,secretCozyNeeded,doorOpen,nextDoorStep,
  doorReady,restorationReady,canAfford,wishGranted,hasBasket,secretsLeft,giftReady} from './simulation.js';
import {storyObjective} from './story-ui.js';
import {wishKey,actionIcon} from './panels-ui.js';

// One suggested next step: wishes, first keepsake, rewards to collect, then the night's whisper.
export function nextStep(s,t,n,focusRoom){
 const wish=DOLLS.find(d=>!wishGranted(s,d.id));
 const story=storyObjective(s,t,focusRoom);if(story)return story;
 if(wish){const action=wishFor(s,wish.id);
 return {copy:t(wishKey(wish.id,action)),label:t(action),ico:actionIcon[action],
   action:'care',value:{id:wish.id,action}}}
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
 if(step&&doorReady(s,step)&&canAfford(s,step.cost))return {copy:t('objectiveDoor'),
   label:t('mend')+' · '+n(step.cost),ico:'home',action:'panel',value:'journal',focus:'.door-next'};
 if(secretsLeft(s)){
  if(isNight(s)&&s.lastSecretDay===s.day)return {copy:t('tomorrow'),label:t('dawn'),ico:'sun',action:'light'};
  if(isNight(s)&&coziness(s)<secretCozyNeeded(s))return {copy:t('objectiveShy'),
    label:t('decorate'),ico:'leaf',action:'panel',value:'decorate'};
  return {copy:t('objectiveNight'),label:t(isNight(s)?'investigate':'night'),
    ico:isNight(s)?'ghost':'moon',action:isNight(s)?'discover':'light'};
 }
 if(doorOpen(s)&&isNight(s)&&giftReady(s))return {copy:t('objectiveGift'),
   label:t('leaveGift')+' · '+n(GIFT_COST),ico:'ghost',action:'gift'};
 return {copy:t('objectiveReturn'),label:t('household'),ico:'souls',action:'panel',value:'household'};
}
