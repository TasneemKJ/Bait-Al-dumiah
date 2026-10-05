import test from 'node:test';
import assert from 'node:assert/strict';
import * as sim from '../src/simulation.js';
import * as content from '../src/content.js';
import {fillTea,finishTea,storyAction} from './tea-test-helpers.mjs';
const raw=s=>JSON.stringify(s);
const wait=(s,n=21)=>{for(let i=0;i<n;i++)sim.step(s,1)};
const guest=s=>{for(const id of ['mint-tin','sewing-machine','moon-bed','parlor-sofa','music-cabinet','sewing-machine','music-cabinet','wash-basin','jasmine-window'])assert.equal(storyAction(s,id).ok,true)};

test('tea starts as a physical table with visible targets and no integer solution',()=>{
 const s=sim.createState();assert.equal(sim.beginActivity(s,'tea').ok,true);
 assert.equal(s.activities.active.phase,'pour');assert.equal(s.activities.active.mode,'ritual');
 assert.deepEqual(s.activities.teaRecords,[null,null,null,null]);
 const status=sim.teaStatus(s);assert.equal(status.cups.length,2);assert.deepEqual(status.cups.map(c=>c.x),[-.23,.23]);
 assert.ok(status.cups.every(c=>c.target>=.60&&c.target<=.80&&c.fill===0&&!c.ready));
 assert.equal(status.ready,false);assert.equal(status.flow,0);assert.equal(status.aimedCup,null);
 assert.deepEqual(sim.activityAnswer(s),[]);const before=raw(s);
 assert.equal(sim.activityInput(s,0).reason,'teaPhysical');assert.equal(raw(s),before);
 assert.equal(content.TEA_TABLE.aimSpan,.45);assert.equal(content.TEA_TABLE.cupRadius,.112);
});

test('real flow lands inside a cup opening, misses gaps and stops on release',()=>{
 const s=sim.createState();sim.beginActivity(s,'tea');
 sim.controlTea(s,{aim:-.23/.45,tilt:1,pressed:true});sim.step(s,.5);
 assert.ok(Math.abs(s.activities.active.cups[0].fill-.275)<1e-9);assert.equal(s.activities.active.cups[1].fill,0);assert.equal(sim.teaStatus(s).aimedCup,0);
 sim.controlTea(s,{aim:0,tilt:1,pressed:true});sim.step(s,.5);
 assert.ok(Math.abs(s.activities.active.spills-.275)<1e-9);assert.ok(Math.abs(s.activities.active.poured-.55)<1e-9);
 sim.releaseTea(s);const fills=s.activities.active.cups.map(c=>c.fill),poured=s.activities.active.poured;sim.step(s,1);
 assert.deepEqual(s.activities.active.cups.map(c=>c.fill),fills);assert.equal(s.activities.active.poured,poured);assert.equal(sim.teaStatus(s).flow,0);
});

test('flow requires ownership and tilt above the threshold; duration remains simulation-owned',()=>{
 const s=sim.createState();sim.beginActivity(s,'tea');
 for(const control of [{aim:0,tilt:1,pressed:false},{aim:0,tilt:.15,pressed:true}]){sim.controlTea(s,control);sim.step(s,1);assert.equal(s.activities.active.poured,0)}
 sim.controlTea(s,{aim:0,tilt:.575,pressed:true});sim.step(s,50);
 assert.ok(Math.abs(s.activities.active.poured-.275)<1e-9);
 const before=raw(s);assert.equal(sim.controlTea(s,{aim:0,tilt:1,pressed:true,score:100,dt:100}).reason,'invalid');assert.equal(raw(s),before);
});

test('equivalent frame durations fill equivalent amounts and aperture boundaries are physical',()=>{
 const a=sim.createState(),b=sim.createState();sim.beginActivity(a,'tea');sim.beginActivity(b,'tea');
 for(const s of [a,b])sim.controlTea(s,{aim:(-.23+.111)/.45,tilt:1,pressed:true});
 sim.step(a,.8);for(let i=0;i<8;i++)sim.step(b,.1);
 assert.ok(Math.abs(a.activities.active.cups[0].fill-b.activities.active.cups[0].fill)<1e-9);
 sim.controlTea(a,{aim:(-.23+.113)/.45,tilt:1,pressed:true});sim.step(a,.2);assert.ok(a.activities.active.spills>0);
});

test('overflow caps the cup and local emptying retains cumulative waste without touching other cups',()=>{
 const s=sim.createState();sim.beginActivity(s,'tea');sim.controlTea(s,{aim:-.23/.45,tilt:1,pressed:true});
 for(let i=0;i<3;i++)sim.step(s,1);
 assert.equal(s.activities.active.cups[0].fill,1.2);assert.ok(Math.abs(s.activities.active.spills-.45)<1e-9);
 assert.equal(sim.emptyTeaCup(s,0).reason,'teaHeld');sim.releaseTea(s);const poured=s.activities.active.poured,spills=s.activities.active.spills;
 assert.equal(sim.emptyTeaCup(s,0).ok,true);assert.equal(s.activities.active.cups[0].fill,0);assert.equal(s.activities.active.poured,poured);assert.ok(s.activities.active.spills>=spills+1.2);
 assert.equal(s.activities.active.cups[1].fill,0);const before=raw(s);
 assert.equal(sim.emptyTeaCup(s,1).reason,'teaNotOverfilled');assert.equal(raw(s),before);assert.equal(sim.emptyTeaCup(s,9).reason,'invalid');assert.equal(raw(s),before);
});

test('pause freezes flow and rejects commands, while release always clears held input',()=>{
 const s=sim.createState();sim.beginActivity(s,'tea');sim.controlTea(s,{aim:0,tilt:1,pressed:true});s.paused=true;const before=raw(s);
 sim.step(s,1);assert.equal(raw(s),before);
 for(const fn of [()=>sim.controlTea(s,{aim:0,tilt:0,pressed:false}),()=>sim.emptyTeaCup(s,0),()=>sim.serveTea(s)]){assert.equal(fn().reason,'pausedActivity');assert.equal(raw(s),before)}
 assert.equal(sim.releaseTea(s).ok,true);assert.equal(s.activities.active.pressed,false);assert.equal(s.activities.active.tilt,0);assert.equal(s.activities.active.phase,'pour');
});

test('invalid controls, cup IDs and non-tea commands never corrupt state',()=>{
 const s=sim.createState();assert.equal(sim.teaStatus(s),null);assert.equal(sim.controlTea(s,{}).reason,'teaNotActive');sim.beginActivity(s,'tea');
 for(const input of [null,[],{}, {aim:NaN,tilt:1,pressed:true},{aim:0,tilt:Infinity,pressed:true},{aim:2,tilt:1,pressed:true},{aim:0,tilt:-1,pressed:true},{aim:0,tilt:1,pressed:1},{aim:'0',tilt:1,pressed:true}]){
  const before=raw(s);assert.equal(sim.controlTea(s,input).reason,'invalid');assert.equal(raw(s),before);
 }
 const before=raw(s);for(const id of [null,'0',{},-1,1.5]){assert.equal(sim.emptyTeaCup(s,id).reason,'invalid');assert.equal(raw(s),before)}
});

test('an active ritual owns its session until explicit cleanup; served tea cannot silently restart',()=>{
 const s=sim.createState();sim.beginActivity(s,'tea');const before=raw(s);
 for(const id of ['tea','stitch','lullaby']){assert.equal(sim.beginActivity(s,id).reason,'activityBusy');assert.equal(raw(s),before)}
 assert.equal(sim.endActivity(s).ok,true);assert.equal(sim.teaStatus(s),null);assert.equal(sim.beginActivity(s,'stitch').ok,true);
 assert.equal(sim.beginActivity(s,'tea').reason,'activityBusy');sim.endActivity(s);sim.beginActivity(s,'tea');finishTea(s);
 assert.equal(sim.beginActivity(s,'tea').reason,'activityBusy');sim.endActivity(s);assert.equal(sim.beginActivity(s,'tea').ok,true);
});

test('only a released, fully correct tray can serve and terminal service cannot pay twice',()=>{
 const s=sim.createState();sim.beginActivity(s,'tea');const before=raw(s);assert.equal(sim.serveTea(s).reason,'teaNotReady');assert.equal(raw(s),before);
 fillTea(s);sim.controlTea(s,{aim:0,tilt:0,pressed:true});assert.equal(sim.serveTea(s).reason,'teaHeld');sim.releaseTea(s);
 const result=sim.serveTea(s);assert.equal(result.complete,true);assert.equal(result.reward,7);assert.equal(result.mode,'ritual');assert.equal(result.score,100);
 assert.equal(s.activities.active.phase,'served');assert.deepEqual(s.activities.active.result,result);assert.equal(s.activities.teaRecords[0],100);
 const served=raw(s);
 for(const fn of [()=>sim.serveTea(s),()=>sim.emptyTeaCup(s,0),()=>sim.controlTea(s,{aim:0,tilt:1,pressed:true})]){assert.equal(fn().reason,'teaServed');assert.equal(raw(s),served)}
 sim.releaseTea(s);assert.equal(raw(s),served);wait(s);assert.equal(s.activities.active.phase,'served');assert.deepEqual(s.activities.active.result,result);
});

test('practice can improve its record without increasing earned mastery or paying care benefits',()=>{
 const s=sim.createState();sim.beginActivity(s,'tea');sim.controlTea(s,{aim:0,tilt:1,pressed:true});sim.step(s,.2);sim.releaseTea(s);
 const first=finishTea(s);assert.ok(first.score<100);sim.endActivity(s);sim.beginActivity(s,'tea');fillTea(s);
 const before=structuredClone(s),second=sim.serveTea(s);assert.equal(second.practice,true);assert.equal(second.score,100);assert.equal(s.activities.teaRecords[0],100);
 for(const key of ['buttons','earnedToday','dolls','unease'])assert.deepEqual(s[key],before[key]);
 assert.deepEqual(s.activities.mastery,before.activities.mastery);assert.deepEqual(s.activities.completed,before.activities.completed);assert.deepEqual(s.activities.lastReward,before.activities.lastReward);
});

test('two earned daily services, cooldown and quick dawn preserve the existing reward economy',()=>{
 let s=sim.createState();const finish=()=>{sim.beginActivity(s,'tea');const r=finishTea(s);sim.endActivity(s);return r};
 assert.equal(finish().reward,7);assert.equal(finish().reward,0);wait(s);const second=finish();assert.equal(second.reward,7);assert.equal(second.bonus,10);wait(s);assert.equal(finish().reward,0);
 s=sim.restore(raw(s));sim.changeLight(s);sim.changeLight(s);assert.equal(finish().reward,0);
 wait(s,60);sim.changeLight(s);sim.changeLight(s);assert.equal(finish().reward,9);
});

test('earned mastery chooses stable cup layouts and scores are stored by the played difficulty',()=>{
 for(const [mastery,count,level] of [[0,2,0],[2,2,1],[5,3,2],[9,3,3]]){
  const s=sim.createState();s.activities.mastery.tea=mastery;sim.beginActivity(s,'tea');const status=sim.teaStatus(s);assert.equal(status.level,level);assert.equal(status.cups.length,count);
  const targets=status.cups.map(c=>c.target);assert.ok(targets.every(v=>v>=.6&&v<=.8));sim.endActivity(s);sim.beginActivity(s,'tea');assert.deepEqual(sim.teaStatus(s).cups.map(c=>c.target),targets);
  assert.equal(finishTea(s).score,100);assert.equal(s.activities.teaRecords[level],100);
 }
});

test('guest story needs a real poured service and advances without ritual rewards or records',()=>{
 const s=sim.createState();guest(s);const story=structuredClone(s.story),started=sim.interactStory(s,'prop:tea-set');
 assert.equal(started.startedActivity,'tea');assert.equal(sim.storyStatus(s).held,'jasmine-sprig');assert.deepEqual(s.story,story);assert.equal(sim.teaStatus(s).mode,'guest');assert.equal(sim.teaStatus(s).cups.length,1);
 assert.equal(sim.interactStory(s,'prop:tea-set').reason,'activityBusy');fillTea(s);const before=structuredClone(s),result=sim.serveTea(s);
 assert.equal(result.mode,'guest');assert.equal(result.reward,0);assert.equal(result.storyResult.held,'guest-cup');assert.equal(result.storyResult.reward,0);assert.equal(sim.storyStatus(s).step,3);
 for(const key of ['buttons','earnedToday','dolls','unease','wishes','journal','achieved','milestones','decor'])assert.deepEqual(s[key],before[key],key);
 for(const key of ['mastery','completed','lastReward','teaRecords'])assert.deepEqual(s.activities[key],before.activities[key]);
 const served=raw(s);assert.equal(sim.serveTea(s).reason,'teaServed');assert.equal(raw(s),served);
 sim.endActivity(s);assert.equal(sim.interactStory(s,'prop:doorstep').reward,20);
});

test('guest cancellation and reload retain sprig; served reload retains guest cup and no live flow',()=>{
 let s=sim.createState();guest(s);sim.interactStory(s,'prop:tea-set');sim.controlTea(s,{aim:0,tilt:1,pressed:true});sim.step(s,.2);
 s=sim.restore(raw(s));assert.equal(s.activities.active,null);assert.equal(sim.storyStatus(s).held,'jasmine-sprig');
 sim.interactStory(s,'prop:tea-set');sim.endActivity(s);assert.equal(sim.storyStatus(s).held,'jasmine-sprig');sim.interactStory(s,'prop:tea-set');finishTea(s);
 s=sim.restore(raw(s));assert.equal(sim.storyStatus(s).held,'guest-cup');assert.equal(s.activities.active,null);assert.deepEqual(s.activities.teaRecords,[null,null,null,null]);
});

test('guest service validates the story step and rejects incompatible story actions without mutation',()=>{
 const s=sim.createState();guest(s);sim.interactStory(s,'prop:tea-set');const before=raw(s);
 assert.equal(sim.interactStory(s,'prop:doorstep').reason,'activityBusy');assert.equal(raw(s),before);
 fillTea(s);s.story.step=1;const corrupt=raw(s);assert.equal(sim.serveTea(s).reason,'storyNotHere');assert.equal(raw(s),corrupt);
});

test('version-one best records whitelist finite scores and all active sessions are discarded',()=>{
 const old=sim.restore(JSON.stringify({version:1,activities:{}}));assert.deepEqual(old.activities.teaRecords,[null,null,null,null]);
 const loaded=sim.restore(JSON.stringify({version:1,activities:{teaRecords:[125,-7,'100',80.9,99],active:{id:'tea',phase:'served',result:{reward:999}}}}));
 assert.deepEqual(loaded.activities.teaRecords,[100,0,null,80]);assert.equal(loaded.activities.active,null);assert.equal(loaded.buttons,0);
 const s=sim.createState();sim.beginActivity(s,'tea');finishTea(s);const reload=sim.restore(raw(s));assert.deepEqual(reload.activities.teaRecords,[100,null,null,null]);assert.equal(reload.activities.completed.tea,1);assert.equal(reload.activities.active,null);
});
