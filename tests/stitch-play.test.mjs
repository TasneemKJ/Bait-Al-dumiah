import test from 'node:test';
import assert from 'node:assert/strict';
import * as sim from '../src/simulation.js';
import * as content from '../src/content.js';
import {fillStitch,finishStitch} from './tea-test-helpers.mjs';
const active=s=>s.activities.active;
const move=(s,x,y,dt=.1,pressed=true)=>{assert.equal(sim.controlStitch(s,{x,y,pressed}).ok,true);sim.step(s,dt)};
const snap=s=>JSON.stringify(s);
const economy=s=>JSON.stringify({buttons:s.buttons,earned:s.earnedToday,mastery:s.activities.mastery,completed:s.activities.completed,lastReward:s.activities.lastReward,records:s.activities.stitchRecords,bonds:s.dolls.map(d=>d.bond),story:s.story});
const near=(a,b,e=1e-7)=>assert.ok(Math.abs(a-b)<=e,`${a} != ${b}`);
test('physical sewing initializes at the first contour point and gives no sequence answer',()=>{
 const s=sim.createState();assert.equal(sim.beginActivity(s,'stitch').ok,true);
 const a=active(s),p=content.STITCH_PATTERNS.find(p=>p.id==='leaf').sections[0][0];
 assert.equal(a.phase,'sew');assert.deepEqual(a.needle,{x:p[0],y:p[1]});assert.deepEqual(a.target,a.needle);assert.equal(a.capture,null);
 assert.deepEqual(sim.activityAnswer(s),[]);assert.equal(sim.activityInput(s,0).reason,'stitchPhysical');
 const before=snap(s);assert.equal(sim.startRecall(s).ok,false);assert.equal(sim.toggleActivityHint(s).ok,false);assert.equal(snap(s),before);
});
test('stationary press, teleport request, future edge and reverse travel cannot skip stitches',()=>{
 const s=sim.createState();sim.beginActivity(s,'stitch');let a=active(s);
 move(s,a.needle.x,a.needle.y,1);assert.equal(a.distance,0);assert.equal(a.travel,0);
 move(s,0,-.60,.1);assert.ok(Math.hypot(a.needle.x+.6,a.needle.y)<=.09000001);assert.ok(a.distance<=a.travel+1e-6);
 const t=sim.createState();sim.beginActivity(t,'stitch');move(t,-.75,.1,.1);assert.equal(active(t).distance,0);
 const u=sim.createState();sim.beginActivity(u,'stitch');move(u,.6,0,1);assert.ok(active(u).section===0);assert.ok(active(u).distance<.5);assert.equal(sim.finishStitch(u).ok,false);
});
test('every authored pattern is bounded, distinct and traces physically to a terminal result',()=>{
 assert.deepEqual(content.STITCH_PATTERNS.map(p=>p.id),['bear-seam','leaf','diamond','jasmine','heart']);
 for(const p of content.STITCH_PATTERNS){for(const section of p.sections)for(const [x,y] of section)assert.ok(Number.isFinite(x)&&Number.isFinite(y)&&Math.hypot(x,y)<=.800001)}
 for(const [level,mastery] of [0,2,5,9].entries()){
  const s=sim.createState();s.activities.mastery.stitch=mastery;sim.beginActivity(s,'stitch');const a=active(s);
  assert.equal(a.level,level);fillStitch(s);assert.equal(sim.stitchStatus(s).ready,true);
  near(a.travel,sim.stitchStatus(s).requiredLength,1e-6);
  const r=sim.finishStitch(s);assert.equal(r.ok,true);assert.equal(r.score,100);assert.equal(a.phase,'finished');assert.equal(s.activities.stitchRecords[level],100);
 }
});
test('status is a detached snapshot of completed and current stitched trail',()=>{
 const s=sim.createState();sim.beginActivity(s,'stitch');move(s,-.3,-.4,.2);
 const before=snap(s),st=sim.stitchStatus(s);assert.ok(st.acceptedTrail.length>=2);assert.equal(st.completedSections,0);assert.ok(st.nextGuidePoint);
 st.needle.x=99;st.sections[0][0][0]=99;st.acceptedTrail[0][0]=99;assert.equal(snap(s),before);
});
test('lifted repositioning grants no stitched motion and regrab ahead requires front crossing',()=>{
 const s=sim.createState();sim.beginActivity(s,'stitch');move(s,-.3,-.4,.15);sim.releaseStitch(s);const a=active(s),d=a.distance,travel=a.travel;
 move(s,-.3,-.4,.5,false);assert.equal(a.distance,d);assert.equal(a.travel,travel);move(s,0,-.6,.05,true);assert.equal(a.distance,d);assert.equal(a.capture,null);
 sim.releaseStitch(s);const front=sim.stitchStatus(s).acceptedTrail.at(-1);move(s,front[0],front[1],1,false);move(s,-.3,-.4,.1,true);assert.ok(a.distance>d);
});
test('release stops pursuit but subsequent explicit lifted control can move again',()=>{
 const s=sim.createState();sim.beginActivity(s,'stitch');move(s,-.3,-.4,.05);sim.releaseStitch(s);const n={...active(s).needle};sim.step(s,.2);assert.deepEqual(active(s).needle,n);
 move(s,.4,.4,.1,false);assert.ok(Math.hypot(active(s).needle.x-n.x,active(s).needle.y-n.y)>.08);assert.equal(active(s).capture,null);
});
test('off-corridor loose loop requires local repair and retains completed sections and waste',()=>{
 const s=sim.createState();sim.beginActivity(s,'stitch');const first=sim.stitchStatus(s).sections[0];
 for(const [x,y] of first.slice(1)){move(s,x,y,1);while(Math.hypot(active(s).needle.x-x,active(s).needle.y-y)>1e-8)sim.step(s,.1)}
 assert.equal(active(s).section,1);move(s,.1,-.9,.5);assert.equal(active(s).loose,true);
 const a=active(s),travel=a.travel,aligned=a.alignmentTravel;assert.equal(sim.unpickStitch(s).reason,'stitchHeld');sim.releaseStitch(s);
 assert.equal(sim.unpickStitch(s).ok,true);assert.equal(a.section,1);assert.equal(a.distance,0);assert.equal(a.loose,false);assert.equal(a.repairs,1);assert.equal(a.travel,travel);assert.equal(a.alignmentTravel,aligned);
 assert.equal(sim.unpickStitch(s).reason,'stitchNoRepair');fillStitch(s);const r=sim.finishStitch(s);assert.ok(r.score<100);
});
test('invalid, paused and finished controls preserve state; pause defensively cancels capture',()=>{
 const s=sim.createState();sim.beginActivity(s,'stitch');
 for(const input of [null,{},[],{x:NaN,y:0,pressed:true},{x:2,y:0,pressed:true},{x:0,y:0,pressed:1},{x:0,y:0,pressed:true,score:100}]){
  const before=snap(s);assert.equal(sim.controlStitch(s,input).reason,'invalid');assert.equal(snap(s),before);
 }
 move(s,-.3,-.4,.1);s.paused=true;const before=snap(s);assert.equal(sim.controlStitch(s,{x:0,y:0,pressed:true}).reason,'pausedActivity');assert.equal(snap(s),before);
 sim.step(s,.2);assert.equal(active(s).pressed,false);assert.equal(active(s).capture,null);assert.deepEqual(active(s).target,active(s).needle);
 assert.equal(sim.releaseStitch(s).ok,true);assert.equal(sim.finishStitch(s).reason,'pausedActivity');
});
test('valid near-corner and final offsets .01-.03 receive actual paid vertex coverage',()=>{
 for(const offset of [.01,.02,.03]){
  const s=sim.createState();sim.beginActivity(s,'stitch');const a=active(s),point=sim.stitchStatus(s).sections[0][1];
  move(s,point[0]+offset,point[1],1);assert.ok(a.distance>=.499999);assert.ok(a.travel>=.5);assert.ok(a.distance<=a.travel+1e-6);
  sim.releaseStitch(s);fillStitch(s);assert.equal(sim.stitchStatus(s).ready,true);
 }
});
test('jasmine acute turn and 30/120Hz cadence consume equivalent paid movement',()=>{
 const run=dt=>{const s=sim.createState();s.activities.mastery.stitch=5;sim.beginActivity(s,'stitch');fillStitch(s,dt);return active(s)};
 const a=run(1/30),b=run(1/120);assert.equal(a.section,5);assert.equal(b.section,5);near(a.travel,b.travel,1e-6);near(a.alignmentTravel,b.alignmentTravel,1e-6);
});
test('cancel inside vertex disk cannot stationary rearm but new valid forward movement can',()=>{
 const s=sim.createState();sim.beginActivity(s,'stitch');const a=active(s),p=sim.stitchStatus(s).sections[0][1];
 move(s,p[0]+.03,p[1],.54);assert.ok(a.capture,'capture should still be traveling');sim.releaseStitch(s);assert.equal(a.capture,null);
 move(s,a.needle.x,a.needle.y,.1);assert.equal(a.capture,null);const d=a.distance;
 move(s,p[0],p[1],.003);assert.ok(a.capture||a.distance>=.5-1e-8);assert.ok(a.distance>d);assert.ok(a.distance<=a.travel+1e-6);
});
test('last vertex freezes held needle and all waste until explicit release and finish',()=>{
 const s=sim.createState();sim.beginActivity(s,'stitch');fillStitch(s);const a=active(s);sim.controlStitch(s,{x:1,y:1,pressed:true});
 const before=JSON.stringify(a);sim.step(s,1);assert.equal(JSON.stringify(a),before);assert.equal(sim.finishStitch(s).reason,'stitchHeld');
 sim.releaseStitch(s);const economyBefore=economy(s),r=sim.finishStitch(s);assert.equal(r.ok,true);assert.notEqual(economy(s),economyBefore);
 const paid=economy(s);assert.equal(sim.finishStitch(s).reason,'stitchFinished');assert.equal(economy(s),paid);r.score=0;assert.equal(a.result.score,100);
});
test('shared earned daily cap, cooldown, practice and played-level personal best survive v1 reload',()=>{
 const s=sim.createState();sim.beginActivity(s,'stitch');const first=finishStitch(s);assert.equal(first.reward,7);sim.endActivity(s);
 const before=economy(s);sim.beginActivity(s,'stitch');const practice=finishStitch(s);assert.equal(practice.practice,true);sim.endActivity(s);assert.equal(economy(s),before);
 for(let i=0;i<21;i++)sim.step(s,1);sim.beginActivity(s,'stitch');const second=finishStitch(s);assert.equal(second.bonus,10);assert.equal(second.level,1);assert.equal(s.activities.stitchRecords[0],100);assert.equal(s.activities.stitchRecords[1],null);sim.endActivity(s);
 const restored=sim.restore(JSON.stringify(s));assert.deepEqual(restored.activities.stitchRecords,[100,null,null,null]);assert.equal(restored.activities.active,null);
 sim.beginActivity(restored,'stitch');assert.equal(finishStitch(restored).reward,0);assert.equal(restored.activities.mastery.stitch,2);
});
test('missing and malformed record saves default safely and discard active capture',()=>{
 for(const records of [undefined,null,{},[100.8,-4,999,'90']]){
  const s=sim.restore(JSON.stringify({version:1,activities:{stitchRecords:records,active:{id:'stitch',capture:{point:{x:Infinity}}}}}));
  assert.deepEqual(s.activities.stitchRecords,Array.isArray(records)?[100,0,100,null]:[null,null,null,null]);assert.equal(s.activities.active,null);assert.equal(s.version,1);assert.equal(content.SAVE_KEY,'bait-al-dumiah.v1');
 }
});
test('mending starts a short real seam, retains red thread and finishes without ritual economy',()=>{
 const s=sim.createState();sim.interactStory(s,'prop:mint-tin');const before=economy(s);
 const start=sim.interactStory(s,'prop:sewing-machine');assert.equal(start.startedActivity,'stitch');assert.equal(start.held,'red-thread');assert.equal(active(s).patternId,'bear-seam');assert.equal(sim.storyStatus(s).step,1);assert.equal(economy(s),before);
 const r=finishStitch(s);assert.equal(r.reward,0);assert.equal(r.storyResult.held,'mended-bear');assert.equal(sim.storyStatus(s).step,2);assert.equal(s.activities.mastery.stitch,0);assert.deepEqual(s.activities.stitchRecords,[null,null,null,null]);assert.equal(s.buttons,36);
});
test('mending exit/reload retains the item, guarded finish cannot advance a changed chapter',()=>{
 const s=sim.createState();sim.interactStory(s,'prop:mint-tin');sim.interactStory(s,'prop:sewing-machine');move(s,-.3,-.2,.1);sim.endActivity(s);assert.equal(sim.storyStatus(s).held,'red-thread');
 const r=sim.restore(JSON.stringify(s));assert.equal(sim.storyStatus(r).held,'red-thread');sim.interactStory(r,'prop:sewing-machine');fillStitch(r);r.story={chapter:1,step:2,lastAction:null,lastActionAt:0};const before=snap(r);assert.equal(sim.finishStitch(r).reason,'storyNotHere');assert.equal(snap(r),before);
});
test('lost song cylinder still uses the original one-step action, not the mending ritual',()=>{
 const s=sim.createState();s.story.chapter=1;s.story.step=2;const r=sim.interactStory(s,'prop:sewing-machine');assert.equal(r.held,'repaired-cylinder');assert.equal(r.startedActivity,undefined);assert.equal(active(s),null);
});

test('near final endpoint offsets are paid to the exact vertex then freeze without extra waste',()=>{
 for(const offset of [.01,.02,.03]){
  const s=sim.createState();sim.beginActivity(s,'stitch');let guard=0;
  while(true){const st=sim.stitchStatus(s);if(st.section===2&&st.distance>.60)break;const p=st.nextGuidePoint;move(s,p.x,p.y,.01);assert.ok(++guard<2000)}
  const final=sim.stitchStatus(s).sections.at(-1).at(-1);move(s,final[0],final[1]+offset,1);
  assert.equal(active(s).section,3);near(active(s).needle.x,final[0]);near(active(s).needle.y,final[1]);const travel=active(s).travel;sim.step(s,1);assert.equal(active(s).travel,travel);
 }
});
test('off-axis disk entry and vertex arrival are cadence-equivalent with capped alignment',()=>{
 const run=dt=>{const s=sim.createState();sim.beginActivity(s,'stitch');const p=sim.stitchStatus(s).nextGuidePoint;sim.controlStitch(s,{x:p.x+.03,y:p.y,pressed:true});let time=.60;while(time>1e-10){const d=Math.min(dt,time);sim.step(s,d);time-=d}return active(s)};
 const a=run(1/30),b=run(1/120);near(a.distance,b.distance,2e-7);near(a.travel,b.travel,2e-7);near(a.alignmentTravel,b.alignmentTravel,2e-7);near(a.needle.x,b.needle.x,2e-7);near(a.needle.y,b.needle.y,2e-7);
});
test('every accepted arc is bounded by actual travel under adversarial future-edge targets',()=>{
 for(const target of [[.6,0],[.2,.35],[0,-.6],[-.6,0],[.03,-.57]]){
  const s=sim.createState();sim.beginActivity(s,'stitch');sim.controlStitch(s,{x:target[0],y:target[1],pressed:true});
  for(let i=0;i<100;i++){sim.step(s,.017);const st=sim.stitchStatus(s),covered=st.sections.slice(0,st.section).reduce((sum,sec)=>sum+sec.slice(1).reduce((n,p,j)=>n+Math.hypot(p[0]-sec[j][0],p[1]-sec[j][1]),0),0)+st.distance;assert.ok(covered<=st.travel+1e-6)}
 }
});
test('fresh controls reject wrong activity and premature commands without economy or state changes',()=>{
 const s=sim.createState();assert.equal(sim.stitchStatus(s),null);assert.equal(sim.controlStitch(s,{x:0,y:0,pressed:true}).reason,'stitchNotActive');sim.beginActivity(s,'stitch');const before=snap(s);assert.equal(sim.finishStitch(s).reason,'stitchNotReady');assert.equal(sim.unpickStitch(s).reason,'stitchNoRepair');assert.equal(snap(s),before);assert.equal(sim.beginActivity(s,'tea').reason,'activityBusy');
});

test('lifted needle can cross the accepted front then resume without an exact stationary landing',()=>{
 const s=sim.createState();sim.beginActivity(s,'stitch');move(s,-.3,-.4,.15);sim.releaseStitch(s);const a=active(s),distance=a.distance;
 move(s,-.3,-.4,1,false);move(s,0,-.6,.1);assert.equal(a.distance,distance);assert.equal(a.capture,null);sim.releaseStitch(s);
 move(s,-.6,0,1,false);const travel=a.travel;move(s,-.3,-.4,.4,true);assert.ok(a.distance>distance);assert.ok(a.distance-distance<=a.travel-travel+1e-6);assert.equal(a.loose,false);
});
test('paused capture is canceled without advancing the needle or accepted arc',()=>{
 const s=sim.createState();sim.beginActivity(s,'stitch');const p=sim.stitchStatus(s).nextGuidePoint;move(s,p.x+.03,p.y,.54);const a=active(s);assert.ok(a.capture);const needle={...a.needle},distance=a.distance,travel=a.travel;
 s.paused=true;sim.step(s,.5);assert.equal(a.capture,null);assert.equal(a.pressed,false);assert.deepEqual(a.needle,needle);assert.deepEqual(a.target,needle);assert.equal(a.distance,distance);assert.equal(a.travel,travel);
 s.paused=false;move(s,needle.x,needle.y,.1);assert.equal(a.capture,null);assert.equal(a.distance,distance);
});
