import test from 'node:test';
import assert from 'node:assert/strict';
import * as sim from '../src/simulation.js';
import {finishChimes,listenChimes,pluckChime} from './chime-test-helpers.mjs';
import {finishTea,finishStitch,fillStitch} from './tea-test-helpers.mjs';
const finish=(s,id)=>{assert.equal(sim.beginActivity(s,id).ok,true);if(id==='tea'){const result=finishTea(s);sim.endActivity(s);return result}if(id==='stitch'){const result=finishStitch(s);sim.endActivity(s);return result}const result=finishChimes(s);sim.endActivity(s);return result};
const wait=(s,seconds=21)=>{for(let i=0;i<seconds;i++)sim.step(s,1)};

test('physical stitch and reverse lullaby reward completed play, never starting or submitted scores',()=>{
 const s=sim.createState(),before=s.buttons;assert.equal(sim.beginActivity(s,'stitch').ok,true);assert.equal(s.buttons,before);assert.equal(sim.activityInput(s,0).reason,'stitchPhysical');fillStitch(s);assert.equal(s.buttons,before);const sewn=sim.finishStitch(s);assert.equal(sewn.reward,7);assert.equal(s.activities.mastery.stitch,1);assert.equal(s.activities.active.phase,'finished');sim.endActivity(s);
 const t=sim.createState();sim.beginActivity(t,'lullaby');listenChimes(t);const pattern=sim.activityAnswer(t);assert.equal(pattern.length,3);for(const x of pattern.slice(0,-1)){assert.equal(pluckChime(t,x).complete,false);assert.equal(t.buttons,36)}const result=pluckChime(t,pattern.at(-1));assert.equal(result.reward,7);assert.equal(t.activities.active.phase,'finished');assert.equal(sim.releaseChime(t).ok,false);
});
test('wrong input gently restarts and invalid input cannot corrupt progress',()=>{
 const s=sim.createState();sim.beginActivity(s,'lullaby');listenChimes(s);const p=sim.activityAnswer(s);pluckChime(s,p[0]);assert.equal(pluckChime(s,(p[1]+1)%4).mistake,true);assert.equal(s.activities.active.cursor,0);const before=JSON.stringify(s);assert.equal(sim.activityInput(s,99).ok,false);assert.equal(JSON.stringify(s),before);assert.equal(sim.beginActivity(s,'unknown').ok,false);
});
test('practice cannot farm currency, mastery or bonds; reward caps survive reload and instant dawn',()=>{
 let s=sim.createState();finish(s,'tea');const bonds=JSON.stringify(s.dolls.map(d=>d.bond)),buttons=s.buttons;const result=finish(s,'tea');assert.equal(result.reward,0);assert.equal(s.buttons,buttons);assert.equal(JSON.stringify(s.dolls.map(d=>d.bond)),bonds);assert.equal(s.activities.mastery.tea,1);wait(s);finish(s,'tea');assert.equal(s.activities.mastery.tea,2);wait(s);assert.equal(finish(s,'tea').reward,0);s=sim.restore(JSON.stringify(s));sim.changeLight(s);sim.changeLight(s);assert.equal(finish(s,'tea').reward,0);wait(s,60);sim.changeLight(s);sim.changeLight(s);assert.ok(finish(s,'tea').reward>0);
});
test('mastery selects more physical contour sections and grants level bonus once',()=>{
 const s=sim.createState();finish(s,'stitch');wait(s);const second=finish(s,'stitch');assert.equal(second.bonus,10);assert.equal(sim.activityLevel(s,'stitch'),1);sim.beginActivity(s,'stitch');assert.equal(sim.stitchStatus(s).sections.length,4);sim.endActivity(s);const before=s.buttons;finish(s,'stitch');assert.equal(s.buttons,before);
});
test('restoration has explicit costs and earned prerequisites without changing decoration slots',()=>{
 const s=sim.createState();assert.equal(sim.restoreRoom(s,'kitchen').reason,'restorationLocked');finish(s,'tea');s.buttons=1000;assert.equal(sim.restoreRoom(s,'kitchen').cost,45);assert.equal(s.restoration.kitchen,1);assert.equal(s.buttons,955);assert.equal(s.decor.length,0);assert.equal(sim.restoreRoom(s,'kitchen').reason,'restorationLocked');s.activities.mastery.tea=6;assert.equal(sim.restoreRoom(s,'kitchen').cost,85);assert.equal(sim.restoreRoom(s,'kitchen').cost,140);assert.equal(sim.restoreRoom(s,'kitchen').reason,'restorationDone');assert.equal(sim.restoreRoom(s,'__proto__').ok,false);
});
test('insufficient funds and invalid/paused commands do not change state',()=>{
 const s=sim.createState();s.activities.mastery.tea=1;s.buttons=0;const before=JSON.stringify(s);assert.equal(sim.restoreRoom(s,'kitchen').reason,'funds');assert.equal(JSON.stringify(s),before);s.paused=true;assert.equal(sim.beginActivity(s,'tea').reason,'pausedActivity');s.paused=false;sim.beginActivity(s,'tea');s.paused=true;assert.equal(sim.activityInput(s,0).reason,'pausedActivity');
});
test('old saves and nested tampering restore safe bounded state and no stale active session',()=>{
 const old=sim.restore(JSON.stringify({version:1,buttons:55}));assert.equal(old.buttons,55);assert.equal(old.activities.mastery.tea,0);assert.equal(old.restoration.kitchen,0);
 const s=sim.createState();finish(s,'tea');sim.beginActivity(s,'stitch');const loaded=sim.restore(JSON.stringify(s));assert.equal(loaded.activities.mastery.tea,1);assert.equal(loaded.activities.active,null);assert.equal(loaded.activities.completed.tea,1);assert.equal(finish(loaded,'tea').reward,0);
 const corrupt=sim.restore(JSON.stringify({version:1,elapsed:50,activities:{mastery:{tea:Infinity,stitch:-7,lullaby:90000},completed:{tea:99},lastReward:{tea:99999},active:{id:'tea',cursor:99}},restoration:{kitchen:99,parlor:-3,studio:'3'}}));assert.equal(corrupt.activities.mastery.tea,0);assert.equal(corrupt.activities.mastery.stitch,0);assert.equal(corrupt.activities.mastery.lullaby,999);assert.equal(corrupt.activities.completed.tea,2);assert.equal(corrupt.activities.lastReward.tea,50);assert.equal(corrupt.restoration.kitchen,3);assert.equal(corrupt.restoration.parlor,0);assert.equal(corrupt.restoration.studio,0);
});
