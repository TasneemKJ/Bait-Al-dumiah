import test from 'node:test';
import assert from 'node:assert/strict';
import * as sim from '../src/simulation.js';

test('the moon bed starts a physical listening phase rather than an answer grid',()=>{
 const s=sim.createState();assert.equal(sim.beginActivity(s,'lullaby').ok,true);
 assert.equal(s.activities.active.phase,'listen');
 assert.equal(sim.activityInput(s,0).reason,'chimePhysical');
});
const fresh=()=>{const s=sim.createState();sim.beginActivity(s,'lullaby');return s};
const wait=s=>{for(let i=0;i<100&&s.activities.active.phase==='listen';i++)sim.step(s,.1);assert.equal(s.activities.active.phase,'echo')};
const pluck=(s,id,pull=.7)=>{assert.equal(sim.grabChime(s,id).ok,true);assert.equal(sim.pullChime(s,pull).ok,true);return sim.releaseChime(s)};
const economy=s=>JSON.stringify([s.buttons,s.activities.mastery,s.activities.completed,s.activities.lastReward,s.dolls.map(d=>d.bond)]);
test('listening demonstrates each authored note and reaches echo without rewards',()=>{
 const s=fresh(),before=economy(s),heard=[];let token=null;
 while(s.activities.active.phase==='listen'){sim.step(s,.05);const v=sim.chimeStatus(s);if(v.tone&&v.tone!==token){heard.push(v.sounding);token=v.tone}}
 assert.deepEqual(heard,s.activities.active.pattern);assert.equal(economy(s),before);
});
test('neither answer submission nor touch-without-pull advances the melody',()=>{
 const s=fresh();wait(s);const before=economy(s);assert.equal(sim.activityInput(s,0).ok,false);
 assert.equal(pluck(s,0,0).silent,true);assert.equal(pluck(s,1,.219).silent,true);
 assert.equal(s.activities.active.cursor,0);assert.equal(economy(s),before);
});
test('a validated backward echo completes once and earns the shared bounded reward',()=>{
 const s=fresh();wait(s);const before=s.buttons;let result;
 for(const note of [...s.activities.active.pattern].reverse())result=pluck(s,note);
 assert.equal(result.complete,true);assert.equal(result.practice,false);assert.equal(s.activities.active.phase,'finished');
 assert.equal(s.activities.mastery.lullaby,1);assert.equal(s.buttons-before,7);
 const snapshot=economy(s);for(let i=0;i<10;i++){sim.releaseChime(s);sim.grabChime(s,0);sim.replayChimes(s)}
 assert.equal(economy(s),snapshot);
});
test('a wrong note offers a fresh demonstration, not a currency penalty',()=>{
 const s=fresh();wait(s);const before=economy(s),wrong=(s.activities.active.pattern.at(-1)+1)%4;
 assert.equal(pluck(s,wrong).mistake,true);assert.equal(s.activities.active.phase,'listen');
 assert.equal(s.activities.active.held,null);assert.equal(s.activities.active.mistakes,1);
 wait(s);assert.equal(s.activities.active.cursor,0);assert.equal(economy(s),before);
});
test('free replay cancels a held charm and resets only this phrase',()=>{
 const s=fresh();wait(s);pluck(s,s.activities.active.pattern.at(-1));sim.grabChime(s,1);sim.pullChime(s,.8);
 const before=economy(s);assert.equal(sim.replayChimes(s).ok,true);assert.equal(sim.chimeStatus(s).held,null);
 assert.equal(sim.chimeStatus(s).cursor,0);assert.equal(economy(s),before);wait(s);
});
test('pause freezes demonstration and cancels rather than releases a held note',()=>{
 const s=fresh();sim.step(s,.5);s.paused=true;const time=sim.chimeStatus(s).listenTime;sim.step(s,1);assert.equal(sim.chimeStatus(s).listenTime,time);
 s.paused=false;wait(s);sim.grabChime(s,2);sim.pullChime(s,1);const before=economy(s);
 s.paused=true;sim.step(s,.1);assert.equal(sim.chimeStatus(s).held,null);assert.equal(sim.releaseChime(s).ok,false);assert.equal(economy(s),before);
});
test('invalid, duplicate and second-owner commands leave the active state untouched',()=>{
 const s=fresh();assert.equal(sim.grabChime(s,0).ok,false);wait(s);
 for(const id of [-1,4,NaN,'0',null,{},.5])assert.equal(sim.grabChime(s,id).ok,false);
 sim.grabChime(s,2);sim.pullChime(s,.5);const before=JSON.stringify(sim.chimeStatus(s));
 assert.equal(sim.grabChime(s,1).ok,false);
 for(const pull of [-1,1.01,NaN,Infinity,'1',null,{}])assert.equal(sim.pullChime(s,pull).ok,false);
 assert.equal(JSON.stringify(sim.chimeStatus(s)),before);sim.cancelChime(s);assert.equal(sim.releaseChime(s).ok,false);
});
test('cancel and exit never pluck, while status snapshots cannot mutate progress',()=>{
 const s=fresh();wait(s);sim.grabChime(s,0);sim.pullChime(s,1);const before=economy(s);
 const snapshot=sim.chimeStatus(s);snapshot.pattern[0]=999;assert.notEqual(sim.chimeStatus(s).pattern[0],999);
 sim.cancelChime(s);assert.equal(sim.chimeStatus(s).tone,null);assert.equal(sim.chimeStatus(s).cursor,0);
 sim.endActivity(s);assert.equal(sim.chimeStatus(s),null);assert.equal(economy(s),before);
});
test('a replay within cooldown is free practice without extra mastery or bond',()=>{
 const s=fresh();wait(s);for(const n of [...s.activities.active.pattern].reverse())pluck(s,n);
 const before=economy(s);sim.endActivity(s);sim.beginActivity(s,'lullaby');wait(s);let result;
 for(const n of [...s.activities.active.pattern].reverse())result=pluck(s,n);
 assert.equal(result.practice,true);assert.equal(economy(s),before);
});
test('earned mastery survives version-one restore while an active pull does not',()=>{
 const s=fresh();wait(s);for(const n of [...s.activities.active.pattern].reverse())pluck(s,n);
 sim.endActivity(s);sim.beginActivity(s,'lullaby');wait(s);sim.grabChime(s,0);sim.pullChime(s,1);
 const restored=sim.restore(JSON.stringify(s));assert.equal(restored.version,1);assert.equal(restored.activities.active,null);
 assert.equal(restored.activities.mastery.lullaby,1);
});
