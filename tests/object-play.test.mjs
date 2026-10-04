import test from 'node:test';
import assert from 'node:assert/strict';
import * as sim from '../src/simulation.js';
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
test('embroidery starts with study and accepts recall only after ready; hints are free',()=>{
 const s=sim.createState();sim.beginActivity(s,'stitch');const p=sim.activityPattern(s,'stitch');assert.equal(s.activities.active.phase,'study');assert.equal(sim.activityInput(s,p[0]).reason,'studyFirst');const before=s.buttons;
 assert.equal(sim.startRecall(s).ok,true);assert.equal(s.activities.active.phase,'recall');assert.equal(sim.toggleActivityHint(s).ok,true);assert.equal(s.activities.active.hint,true);assert.equal(s.buttons,before);for(const c of p)sim.activityInput(s,c);assert.equal(s.activities.mastery.stitch,1);assert.equal(sim.startRecall(s).ok,false);
});
test('moon song echoes the shown sequence in reverse without rewarding wrong input',()=>{
 const s=sim.createState();sim.beginActivity(s,'lullaby');const p=sim.activityPattern(s,'lullaby');assert.equal(sim.activityInput(s,(p.at(-1)+1)%4).mistake,true);assert.equal(s.activities.mastery.lullaby,0);let result;for(const c of [...p].reverse())result=sim.activityInput(s,c);assert.equal(result.complete,true);assert.equal(s.activities.mastery.lullaby,1);
});
