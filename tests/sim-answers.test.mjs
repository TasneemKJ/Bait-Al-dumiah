import test from 'node:test';
import assert from 'node:assert/strict';
import * as sim from '../src/simulation.js';
import {finishTea,finishStitch} from './tea-test-helpers.mjs';
import {finishChimes,listenChimes} from './chime-test-helpers.mjs';

// The interface tells the simulation what happened and reads the answer; it never re-derives a rule.

test('physicalActivity names only the ritual that owns a work surface',()=>{
 const s=sim.createState();assert.equal(sim.physicalActivity(s),null);
 for(const id of sim.PHYSICAL_ACTIVITIES){
  assert.equal(sim.beginActivity(s,id).ok,true);assert.equal(sim.physicalActivity(s),id);sim.endActivity(s);
 }
 assert.equal(sim.physicalActivity(s),null);
});

test('dollRoom answers where a resident is, and null for a stranger',()=>{
 const s=sim.createState();
 assert.equal(sim.dollRoom(s,'lina'),s.dolls.find(d=>d.id==='lina').room);
 assert.equal(sim.dollRoom(s,'nobody'),null);assert.equal(sim.dollRoom(s,undefined),null);
});

test('replayActivity restarts a finished tea or seam with a fresh run',()=>{
 for(const [id,finish] of [['tea',finishTea],['stitch',finishStitch]]){
  const s=sim.createState();sim.beginActivity(s,id);
  assert.equal(sim.replayActivity(s,id).reason,'invalid','an unfinished run is not replayed');
  finish(s);const before=s.activities.active;
  const result=sim.replayActivity(s,id);
  assert.deepEqual(result,{ok:true,restarted:true});
  assert.equal(s.activities.active.id,id);assert.notEqual(s.activities.active,before);
  sim.endActivity(s);
 }
});

test('replayActivity refuses another ritual, a paused house and an unknown id',()=>{
 const s=sim.createState();sim.beginActivity(s,'tea');finishTea(s);
 assert.equal(sim.replayActivity(s,'stitch').ok,false);
 assert.equal(sim.replayActivity(s,'nap').ok,false);
 s.paused=true;assert.equal(sim.replayActivity(s,'tea').reason,'pausedActivity');
 assert.equal(s.activities.active.phase,'served','a refused replay leaves the run alone');
});

test('a lullaby in play replays its phrase; a finished one restarts',()=>{
 const s=sim.createState();sim.beginActivity(s,'lullaby');listenChimes(s);
 const run=s.activities.active,round=run.round;
 assert.deepEqual(sim.replayActivity(s,'lullaby'),{ok:true,restarted:false});
 assert.equal(s.activities.active,run);assert.equal(run.round,round+1);assert.equal(run.phase,'listen');
 finishChimes(s);assert.equal(s.activities.active.phase,'finished');
 assert.deepEqual(sim.replayActivity(s,'lullaby'),{ok:true,restarted:true});
 assert.notEqual(s.activities.active,run);
});

test('endActivity hands back the story beat a run completed',()=>{
 const s=sim.createState();sim.beginActivity(s,'tea');
 s.activities.active.result={storyResult:{message:'storyBeat'}};
 assert.deepEqual(sim.endActivity(s),{ok:true,storyResult:{message:'storyBeat'}});
 assert.deepEqual(sim.endActivity(s),{ok:true,storyResult:null});
});

test('useDecor reports the keepsake kind and room it was used in',()=>{
 const s=sim.createState();s.buttons=999;
 const placed=sim.place(s,'lamp','parlor',0);assert.equal(placed.ok,true);
 const id=s.decor.at(-1).id,used=sim.useDecor(s,id);
 assert.equal(used.ok,true);assert.equal(used.item,'lamp');assert.equal(used.room,'parlor');
 assert.equal(used.effect,'light');
});

test('mendDoor says when the last step opened the door',()=>{
 const s=sim.createState();s.buttons=99999;s.journal=[...Array(20).keys()].map(String);
 for(const d of s.dolls)d.bond=9999;
 const results=[];for(let i=0;i<10;i++){const r=sim.mendDoor(s);if(!r.ok)break;results.push(r)}
 assert.ok(results.length>1);
 assert.deepEqual(results.map(r=>r.opened),results.map((_,i)=>i===results.length-1));
 assert.equal(sim.doorOpen(s),true);
});
