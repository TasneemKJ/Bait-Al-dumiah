// The physical tea ritual: pour, aim, serve.
import {activityLevel,completeActivity,storyStatus,advanceStory} from './sim-core.js';
import {integer,fail} from './sim-util.js';
import {TEA_TABLE} from './content.js';
export const TEA_TOLERANCE=.07;
export const teaActive=s=>s.activities.active?.id==='tea'?s.activities.active:null;
export const cupReady=c=>Math.abs(c.fill-c.target)<=TEA_TOLERANCE+1e-9;
export const teaHit=a=>a.cups.find(c=>Math.abs(c.x-a.aim*TEA_TABLE.aimSpan)<=TEA_TABLE.cupRadius)??null;
export const teaFlow=(s,a)=>a.phase==='pour'&&!s.paused&&a.pressed?Math.max(0,(a.tilt-.15)/.85)*.55:0;
export function createTea(s,mode){
 const level=mode==='guest'?0:activityLevel(s,'tea'),xs=mode==='guest'?[0]:level<2?[-.23,.23]:[-.33,0,.33];
 return {id:'tea',phase:'pour',mode,level,cups:xs.map((x,id)=>({id,x,
   target:mode==='guest'?.70:.60+((level*3+s.day+s.activities.mastery.tea+id*4)%5)*.05,fill:0})),aim:0,tilt:0,
     pressed:false,spills:0,poured:0,result:null};
}
export function stepTea(s,dt){
 const a=teaActive(s);if(!a)return;const volume=teaFlow(s,a)*dt;if(volume<=0)return;
 a.poured+=volume;const cup=teaHit(a);
 if(!cup){a.spills+=volume;return}
 const added=Math.min(volume,Math.max(0,1.2-cup.fill));cup.fill+=added;a.spills+=volume-added;
}
export function teaStatus(s){
 const a=teaActive(s);if(!a)return null;
 return {...a,result:a.result?structuredClone(a.result):null,flow:teaFlow(s,a),
   aimedCup:teaHit(a)?.id??null,best:a.mode==='ritual'?
   s.activities.teaRecords[a.level]:null,cups:a.cups.map(c=>({...c,ready:cupReady(c),
     overfilled:c.fill>c.target+TEA_TOLERANCE+1e-9})),ready:a.phase==='pour'&&!a.pressed&&a.cups.every(cupReady)};
}
export function teaCommand(s){
 if(s.paused)return fail('pausedActivity');const a=teaActive(s);
 if(!a)return fail('teaNotActive');if(a.phase==='served')return fail('teaServed');return null;
}
export function controlTea(s,input){
 const blocked=teaCommand(s);if(blocked)return blocked;
 if(!input||typeof input!=='object'||Array.isArray(input)||
   Object.keys(input).some(k=>!['aim','tilt','pressed'].includes(k))||
   !Number.isFinite(input.aim)||input.aim< -1||input.aim>1||!Number.isFinite(input.tilt)||input.tilt<0||
     input.tilt>1||typeof input.pressed!=='boolean')return fail('invalid');
 const a=teaActive(s);a.aim=input.aim;a.tilt=input.tilt;a.pressed=input.pressed;return {ok:true};
}
export function releaseTea(s){
 const a=teaActive(s);if(!a)return fail('teaNotActive');a.pressed=false;a.tilt=0;return {ok:true};
}
export function emptyTeaCup(s,id){
 const blocked=teaCommand(s);if(blocked)return blocked;
 const a=teaActive(s),cup=Number.isInteger(id)?a.cups.find(c=>c.id===id):null;
 if(!cup)return fail('invalid');if(a.pressed)return fail('teaHeld');
 if(cup.fill<=cup.target+TEA_TOLERANCE+1e-9)return fail('teaNotOverfilled');
 a.spills+=cup.fill;cup.fill=0;return {ok:true};
}
export function serveTea(s){
 const blocked=teaCommand(s);if(blocked)return blocked;const a=teaActive(s);
 if(a.pressed)return fail('teaHeld');if(!a.cups.every(cupReady))return fail('teaNotReady');
 if(a.mode==='guest'){const story=storyStatus(s);
 if(story.chapter?.id!=='guest-tea'||story.step!==2)return fail('storyNotHere')}
 const accuracy=a.cups.reduce((sum,c)=>sum+Math.max(0,1-Math.abs(c.fill-c.target)/TEA_TOLERANCE),0)/a.cups.length;
 const useful=a.cups.reduce((sum,c)=>sum+Math.min(c.fill,c.target),0),
   score=integer(Math.round(100*accuracy*Math.min(1,useful/a.poured)),0,100);
 let result;
 if(a.mode==='guest')result={ok:true,complete:true,id:'tea',mode:'guest',reward:0,bonus:0,level:a.level,
   practice:true,score,storyResult:advanceStory(s,storyStatus(s))};
 else{result={...completeActivity(s,'tea'),mode:'ritual',score};
 s.activities.teaRecords[a.level]=Math.max(s.activities.teaRecords[a.level]??0,score)}
 a.pressed=false;a.tilt=0;a.phase='served';a.result=result;return structuredClone(result);
}

