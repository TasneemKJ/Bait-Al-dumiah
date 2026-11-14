import test from 'node:test';
import assert from 'node:assert/strict';
import {createTeaGesture} from '../src/tea-input.js';
import {createTapPour} from '../src/tea-ui.js';
import * as sim from '../src/simulation.js';

// First 30 seconds (owner, 2026-11-14): a new player taps, never holds. A tap on the pot pours a cup to its line;
// a hold and drag stays the skilled pour.
const pointer=(x,y)=>({pointerId:1,clientX:x,clientY:y,button:0,isPrimary:true});
const tea=()=>{const s=sim.createState();assert.equal(sim.beginActivity(s,'tea').ok,true);return s};
const act=s=>(action,value)=>action==='tea-control'?sim.controlTea(s,value):action==='tea-release'?sim.releaseTea(s):
 action==='tea-serve'?sim.serveTea(s):null;
function pourBy(s,pour,id){assert.equal(pour.start([id]),true);let frames=0;
 while(pour.cup!==null&&frames++<2000){sim.step(s,1/60);pour.tick(sim.teaStatus(s),1/60)}return frames}

test('a touch that never leaves the pot is a tap; a drag is still the held pour',()=>{
 const g=createTeaGesture(),pouring={phase:'pour',aim:.2,cups:[]};
 g.down(pointer(100,100),'pot',pouring,.2);assert.deepEqual(g.up(pointer(103,104),'pot'),{type:'pour-tap'});
 g.down(pointer(100,100),'pot',pouring,.2);g.move(pointer(100,150),.2);assert.deepEqual(g.up(pointer(100,150),'pot'),{type:'release'});
});

test('one tap fills one cup to its gold line, in the simulation, and lifts the pot',()=>{
 const s=tea(),pour=createTapPour(()=>sim.teaStatus(s),act(s)),[first,second]=sim.teaStatus(s).cups;
 const frames=pourBy(s,pour,first.id);assert.ok(frames<180,`${frames} frames: under three seconds`);
 let t=sim.teaStatus(s);assert.equal(t.cups[0].ready,true);assert.equal(t.cups[0].overfilled,false);
 assert.equal(t.pressed,false);assert.equal(t.tilt,0);assert.equal(t.ready,false,'the other cup waits');
 pourBy(s,pour,second.id);t=sim.teaStatus(s);assert.equal(t.phase,'served','the last cup at its line serves the tea');
});

test('a tap pour stops when the ritual ends or after six seconds, never pouring on',()=>{
 const s=tea(),pour=createTapPour(()=>sim.teaStatus(s),act(s));pour.start([0]);sim.endActivity(s);
 assert.equal(pour.tick({phase:'served',cups:[]},1/60),true);assert.equal(pour.cup,null);
 const t2=tea(),p2=createTapPour(()=>sim.teaStatus(t2),act(t2));p2.start([0]);
 assert.equal(p2.tick({phase:'pour',cups:[{id:0,fill:0,target:.7}]},7),true,'a stuck pour lets go');
});

test('one tap pours every cup in turn and serves, well inside the first fifteen seconds',()=>{
 const s=tea(),pour=createTapPour(()=>sim.teaStatus(s),act(s));
 assert.equal(pour.start(sim.teaStatus(s).cups.map(c=>c.id)),true);let frames=0;
 while(pour.cup!==null&&frames++<2000){sim.step(s,1/60);pour.tick(sim.teaStatus(s),1/60)}
 assert.equal(sim.teaStatus(s).phase,'served');assert.ok(frames<60*4,`${(frames/60).toFixed(1)} s`);
 assert.ok(sim.teaStatus(s).result.score>=70,'a tap pour is a good pour, not a perfect one');
});
