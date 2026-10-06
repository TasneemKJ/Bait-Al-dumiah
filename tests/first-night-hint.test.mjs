import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,step,restore,readSave,changeLight,isNight} from '../src/simulation.js';
import {strings} from '../src/i18n.js';
const run=(s,seconds)=>{for(let i=0;i<seconds;i++)step(s,1)};
const kinds=s=>s.events.map(e=>e.type);

test('the first night gives one pointer, then never again',()=>{
 const s=createState();run(s,119);assert.equal(kinds(s).includes('first-night'),false);
 run(s,2);assert.equal(isNight(s),true);assert.equal(kinds(s).filter(k=>k==='first-night').length,1);
 s.events.length=0;run(s,60);assert.equal(kinds(s).includes('first-night'),false);assert.equal(s.hints.night,true);
});
test('switching the light to night also gives the pointer once',()=>{
 const s=createState();changeLight(s);step(s,1);assert.equal(kinds(s).filter(k=>k==='first-night').length,1);
});
test('the flag survives a save round trip and is whitelisted',()=>{
 const s=createState();run(s,125);const back=readSave(JSON.stringify(s));assert.equal(back.ok,true);assert.equal(back.state.hints.night,true);
 const junk=createState();junk.hints={night:'yes',extra:1};assert.equal(restore(JSON.stringify(junk)).hints.night,false);
 assert.deepEqual(Object.keys(restore(JSON.stringify(junk)).hints).sort(),['calm','night']);
});
test('an old save without the field only hints a brand-new house',()=>{
 const fresh=createState();delete fresh.hints;assert.equal(restore(JSON.stringify(fresh)).hints.night,false);
 const veteran=createState();delete veteran.hints;veteran.day=4;assert.equal(restore(JSON.stringify(veteran)).hints.night,true);
 const whispered=createState();delete whispered.hints;whispered.journal=['music-box'];assert.equal(restore(JSON.stringify(whispered)).hints.night,true);
});
test('first-night copy exists in English and Arabic and names the button',()=>{
 assert.match(strings.en.firstNightHint,new RegExp(strings.en.investigate));
 assert.match(strings.ar.firstNightHint,/[؀-ۿ]/);assert.ok(strings.ar.firstNightHint.includes(strings.ar.investigate));
});

test('day one gets one calm line between minute 1.5 and 2, once, after the player has cared',()=>{
 const s=createState();s.cares=1;run(s,89);assert.equal(kinds(s).includes('calm'),false);
 run(s,2);assert.equal(kinds(s).filter(k=>k==='calm').length,1);s.events.length=0;run(s,200);assert.equal(kinds(s).includes('calm'),false);
});
test('no calm line before any care, on later days, or for a save that is already past it',()=>{
 const idle=createState();run(idle,95);assert.equal(kinds(idle).includes('calm'),false);assert.equal(idle.hints.calm,true);
 const later=createState();later.day=3;later.cares=4;run(later,95);assert.equal(kinds(later).includes('calm'),false);
 const old=createState();delete old.hints;old.cares=3;old.clock=100;assert.equal(restore(JSON.stringify(old)).hints.calm,true);
 const fresh=createState();delete fresh.hints;assert.equal(restore(JSON.stringify(fresh)).hints.calm,false);
 const junk=createState();junk.hints={night:false,calm:'yes'};assert.equal(restore(JSON.stringify(junk)).hints.calm,false);
 assert.deepEqual(Object.keys(restore(JSON.stringify(junk)).hints).sort(),['calm','night']);
});
test('calm copy exists in English and Arabic',()=>{assert.ok(strings.en.calmDayOne);assert.match(strings.ar.calmDayOne,/لينا/)});
