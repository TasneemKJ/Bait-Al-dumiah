// The physical sewing ritual: needle, thread, finish.
import {activityLevel,completeActivity,storyStatus,advanceStory} from './sim-core.js';
import {integer,fail} from './sim-util.js';
import {requiredLength,stitchEdge,acceptedTrail} from './stitch-path.js';
import {STITCH_PATTERNS} from './content.js';
export const stitchActive=s=>s.activities.active?.id==='stitch'?s.activities.active:null;
export const stitchSections=a=>STITCH_PATTERNS.find(p=>p.id===a.patternId).sections;
export function createStitch(s,mode){
 const level=mode==='mend'?0:activityLevel(s,'stitch'),patternId=mode==='mend'?
   'bear-seam':['leaf','diamond','jasmine','heart'][level];
 const p=STITCH_PATTERNS.find(p=>p.id===patternId).sections[0][0],needle={x:p[0],y:p[1]};
 return {id:'stitch',mode,phase:'sew',level,patternId,section:0,distance:0,needle,target:{...needle},
   pressed:false,loose:false,travel:0,alignmentTravel:0,repairs:0,capture:null,result:null};
}
export function stitchStatus(s){
 const a=stitchActive(s);if(!a)return null;const sections=stitchSections(a),e=stitchEdge(a,sections);
 return {...structuredClone(a),sections:structuredClone(sections),
   completedSections:Math.min(a.section,sections.length),acceptedTrail:acceptedTrail(a,
   sections),nextGuidePoint:e?{...e.end}:null,requiredLength:requiredLength(sections),
     best:a.mode==='ritual'?s.activities.stitchRecords[a.level]:null,
   ready:a.phase==='sew'&&a.section===sections.length&&!a.pressed&&!a.loose&&!a.capture};
}
// Where the needle is in the current section, for readouts: 1-based section and rounded percent.
export function stitchSectionProgress(stitch){
 const total=stitch.sections.length,covered=stitch.completedSections>=total;
 const length=stitch.sections[stitch.section]?.reduce((sum,p,i,points)=>i?
   sum+Math.hypot(p[0]-points[i-1][0],p[1]-points[i-1][1]):sum,0)??0;
 const fraction=length?Math.max(0,Math.min(1,stitch.distance/length)):0;
 return {section:Math.min(total,stitch.section+1),percent:covered?100:Math.round(fraction*100)};
}
export function stitchCommand(s){
 if(s.paused)return fail('pausedActivity');const a=stitchActive(s);
 if(!a)return fail('stitchNotActive');if(a.phase==='finished')return fail('stitchFinished');return null;
}
export function controlStitch(s,input){
 const blocked=stitchCommand(s);if(blocked)return blocked;
 if(!input||typeof input!=='object'||Array.isArray(input)||
   Object.keys(input).some(k=>!['x','y','pressed'].includes(k))||!Number.isFinite(input.x)||
   input.x< -1||input.x>1||!Number.isFinite(input.y)||input.y< -1||input.y>1||
     typeof input.pressed!=='boolean')return fail('invalid');
 const a=stitchActive(s);a.target={x:input.x,y:input.y};a.pressed=input.pressed;
 if(!input.pressed)a.capture=null;return {ok:true};
}
export function releaseStitch(s){
 const a=stitchActive(s);if(!a)return fail('stitchNotActive');a.pressed=false;
 a.capture=null;a.target={...a.needle};return {ok:true};
}
export function unpickStitch(s){
 const blocked=stitchCommand(s);if(blocked)return blocked;const a=stitchActive(s);
 if(a.pressed)return fail('stitchHeld');
 if(a.section>=stitchSections(a).length||(!a.loose&&a.distance<=0))return fail('stitchNoRepair');
 const p=stitchSections(a)[a.section][0];a.distance=0;a.loose=false;a.capture=null;a.needle={x:p[0],y:p[1]};
 a.target={...a.needle};a.repairs++;return {ok:true};
}
export function finishStitch(s){
 const blocked=stitchCommand(s);if(blocked)return blocked;const a=stitchActive(s),sections=stitchSections(a);
 if(a.pressed)return fail('stitchHeld');
 if(a.loose||a.capture||a.section!==sections.length)return fail('stitchNotReady');
 if(a.mode==='mend'){const story=storyStatus(s);
 if(story.chapter?.id!=='mended-friend'||story.step!==1)return fail('storyNotHere')}
 const score=integer(Math.round(100*(a.travel>0?a.alignmentTravel/a.travel:0)*Math.min(1,
   requiredLength(sections)/Math.max(a.travel,1e-9))),0,100);
 let result;
 if(a.mode==='mend')result={ok:true,complete:true,id:'stitch',mode:'mend',reward:0,bonus:0,level:a.level,
   practice:true,score,storyResult:advanceStory(s,storyStatus(s))};
 else{result={...completeActivity(s,'stitch'),mode:'ritual',score};
 s.activities.stitchRecords[a.level]=Math.max(s.activities.stitchRecords[a.level]??0,score)}
 a.phase='finished';a.capture=null;a.pressed=false;a.target={...a.needle};
 a.result=structuredClone(result);return structuredClone(result);
}

