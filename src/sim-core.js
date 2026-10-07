// Shared rule helpers: earning buttons, notices, milestones, bonds and the economic close of an activity.
import {clamp} from './sim-util.js';
import {bondLevel,currentStreak,fullRooms,coziness} from './sim-queries.js';
import {ROOMS,SECRETS,MILESTONES,DOOR_STEPS,VISITOR_GIFTS,ACTIVITIES,ACTIVITY_THRESHOLDS,
  STORY_CHAPTERS,ACTIVITY_DAILY_CAP,ACTIVITY_COOLDOWN} from './content.js';
export const earn=(s,amount)=>{s.buttons=Math.min(9999,s.buttons+amount);
s.earnedToday=Math.min(99999,s.earnedToday+amount)};
// Events are transient notices for the presentation layer; they are never restored from a save.
export const emit=(s,event)=>{if(s.events.length<24)s.events.push(event)};
export const milestoneMet={
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
 for(const m of MILESTONES)if(!s.achieved.includes(m.id)&&milestoneMet[m.id](s)){s.achieved.push(m.id);
 emit(s,{type:'milestone',id:m.id,reward:m.reward})}
}
export function growBond(s,d,amount){
 const before=bondLevel(d.bond);d.bond=clamp(d.bond+amount);const after=bondLevel(d.bond);
 for(let level=before+1;level<=after;level++){const reward=5*level;earn(s,reward);
 emit(s,{type:'bond',id:d.id,level,reward})}
}
export const activityDef=id=>ACTIVITIES.find(a=>a.id===id);
export const activityLevel=(s,id)=>activityDef(id)?ACTIVITY_THRESHOLDS.reduce((level,min,
  i)=>s.activities.mastery[id]>=min?i:level,0):0;
export const activityReward=(s,id)=>7+activityLevel(s,id)*2;
export function activityRewardReady(s,id){return Boolean(activityDef(id))&&
  s.activities.completed[id]<ACTIVITY_DAILY_CAP&&s.elapsed-s.activities.lastReward[id]>=ACTIVITY_COOLDOWN}
// Sequence and physical rituals share one economic boundary.
export function completeActivity(s,id){
 const a=activityDef(id),before=activityLevel(s,id),rewarded=activityRewardReady(s,id),base=activityReward(s,id);
 let reward=0,bonus=0;
 if(rewarded){
  s.activities.completed[id]++;s.activities.lastReward[id]=s.elapsed;
  s.activities.mastery[id]=Math.min(999,s.activities.mastery[id]+1);
  reward=base;bonus=activityLevel(s,id)>before?10*(before+1):0;earn(s,reward+bonus);
  const d=s.dolls.find(d=>d.id===a.resident);growBond(s,d,3);d.comfort=clamp(d.comfort+8);s.unease=clamp(s.unease-3);
 }
 checkMilestones(s);
 return {ok:true,complete:true,id,reward,bonus,level:activityLevel(s,id),practice:!rewarded};
}

// A single ordered progress record owns inventory, completed memories and rewards.
// No separate held/claimed flags can disagree after an interrupted mobile session.
export function storyStatus(s){
 const index=s.story.chapter,chapter=STORY_CHAPTERS[index]??null,step=chapter?s.story.step:0;
 const completed=STORY_CHAPTERS.slice(0,index).map(c=>c.id);
 const progress=STORY_CHAPTERS.slice(0,index).reduce((sum,c)=>sum+c.steps.length,0)+step;
 return {chapter,index,step,next:chapter?.steps[step]??null,held:chapter&&step>0?
   chapter.steps[step-1].gives:null,completed,finished:chapter===null,
   progress,totalSteps:STORY_CHAPTERS.reduce((sum,c)=>sum+c.steps.length,0)};
}
export function advanceStory(s,status){
 const {chapter,step,next}=status,chapterComplete=step===chapter.steps.length-1,reward=chapterComplete?chapter.reward:0;
 s.story.lastAction='prop:'+next.object;s.story.lastActionAt=s.elapsed;
 if(chapterComplete){s.story.chapter++;s.story.step=0;earn(s,reward)}else s.story.step++;
 return {ok:true,chapterComplete,reward,chapterId:chapter.id,step,message:`story-${chapter.id}-${step}-done`,
   effect:next.object,held:storyStatus(s).held};
}
