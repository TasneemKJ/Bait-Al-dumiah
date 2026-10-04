import test from 'node:test';
import assert from 'node:assert/strict';
import * as sim from '../src/simulation.js';
import {finishStitch} from './tea-test-helpers.mjs';
test('move is atomic, preserves ownership, costs nothing and cannot farm rewards',()=>{
 const s=sim.createState();sim.place(s,'plant','kitchen',0);sim.place(s,'lamp','parlor',1);const id=s.decor[0].id,before=structuredClone(s);
 assert.equal(sim.moveDecor(s,id,'parlor',1).reason,'occupied');assert.deepEqual(s,before);
 assert.equal(sim.moveDecor(s,id,'unknown',0).ok,false);assert.equal(sim.moveDecor(s,id,'parlor',0).ok,true);assert.equal(s.decor[0].room,'parlor');assert.equal(s.decor[0].id,id);assert.equal(s.buttons,before.buttons);assert.deepEqual(s.dolls,before.dolls);assert.deepEqual(s.activities,before.activities);
 assert.equal(sim.moveDecor(s,id,'parlor',0).ok,true);assert.equal(sim.moveDecor(s,999,'kitchen',0).ok,false);
});
test('rotation uses four safe orientations and survives version-one saves',()=>{
 const s=sim.createState();sim.place(s,'bear','studio',0);const before=s.buttons,id=s.decor[0].id;
 for(let i=1;i<=4;i++){assert.equal(sim.rotateDecor(s,id).ok,true);assert.equal(s.decor[0].rotation,i%4)}assert.equal(s.buttons,before);sim.rotateDecor(s,id);
 assert.equal(sim.restore(JSON.stringify(s)).decor[0].rotation,1);assert.equal(sim.rotateDecor(s,999).ok,false);
 s.decor[0].rotation='HTML';assert.equal(sim.restore(JSON.stringify(s)).decor[0].rotation,0);delete s.decor[0].rotation;assert.equal(sim.restore(JSON.stringify(s)).decor[0].rotation,0);
});
test('embroidery starts on real cloth, refuses answers and lifts/repairs without rewards',()=>{
 const s=sim.createState(),buttons=s.buttons;sim.beginActivity(s,'stitch');assert.equal(s.activities.active.phase,'sew');assert.deepEqual(sim.activityAnswer(s),[]);assert.equal(sim.activityInput(s,0).reason,'stitchPhysical');
 const before=structuredClone(s);assert.equal(sim.startRecall(s).ok,false);assert.equal(sim.toggleActivityHint(s).ok,false);assert.deepEqual(s,before);
 sim.controlStitch(s,{x:-.3,y:-.4,pressed:true});sim.step(s,.1);assert.ok(s.activities.active.distance>0);assert.equal(sim.unpickStitch(s).reason,'stitchHeld');const travel=s.activities.active.travel;sim.releaseStitch(s);
 const needle=structuredClone(s.activities.active.needle);sim.step(s,.2);assert.deepEqual(s.activities.active.needle,needle);assert.equal(s.buttons,buttons);assert.equal(sim.unpickStitch(s).ok,true);assert.equal(s.activities.active.distance,0);assert.equal(s.activities.active.travel,travel);assert.equal(s.activities.active.repairs,1);assert.equal(s.activities.mastery.stitch,0);
 const result=finishStitch(s);assert.equal(result.reward,7);assert.ok(result.score<100);assert.equal(s.activities.mastery.stitch,1);assert.equal(s.activities.active.phase,'finished');assert.equal(sim.finishStitch(s).reason,'stitchFinished');
});
test('physical activity conflicts preserve both current work and economy until explicit exit',()=>{
 const s=sim.createState();sim.beginActivity(s,'stitch');sim.controlStitch(s,{x:-.3,y:-.4,pressed:true});sim.step(s,.1);const before=structuredClone(s);
 for(const id of ['tea','stitch','lullaby']){assert.equal(sim.beginActivity(s,id).reason,'activityBusy');assert.deepEqual(s,before)}
 assert.equal(sim.interactStory(s,'prop:mint-tin').reason,'activityBusy');assert.deepEqual(s,before);sim.endActivity(s);assert.equal(s.activities.active,null);assert.equal(s.activities.mastery.stitch,0);assert.equal(sim.beginActivity(s,'tea').ok,true);
});
test('moon song echoes the shown sequence in reverse without rewarding wrong input',()=>{
 const s=sim.createState();sim.beginActivity(s,'lullaby');const p=sim.activityPattern(s,'lullaby');assert.equal(sim.activityInput(s,(p.at(-1)+1)%4).mistake,true);assert.equal(s.activities.mastery.lullaby,0);let result;for(const c of [...p].reverse())result=sim.activityInput(s,c);assert.equal(result.complete,true);assert.equal(s.activities.mastery.lullaby,1);
});
test('moving then refunding cannot leave the original placement comfort as a farmable bonus',()=>{
 const s=sim.createState(),before=structuredClone(s);sim.place(s,'plant','kitchen',0);const id=s.decor[0].id;
 sim.moveDecor(s,id,'parlor',2);sim.remove(s,id);assert.equal(s.buttons,before.buttons);assert.deepEqual(s.dolls,before.dolls);assert.equal(s.decor.length,0);
});
