import test from 'node:test';
import assert from 'node:assert/strict';
import * as sim from '../src/simulation.js';
import {translate} from '../src/i18n.js';
import {finishTea} from './tea-test-helpers.mjs';

// DESIGN.md #67, second idea: the night porter's bell. A small bell on the hall table rings when someone in the house
// has something to say; a tap turns the house to that room. It replaces the badge dots. Measured problem (round 3):
// after the first tea nothing called the player; the bell must call within 8 s.
const bell=await import('../src/porter-bell.js').catch(()=>({}));

test('the bell names the room that is waiting: the visitor\'s night first, then a box to wind, then a wish',()=>{
 assert.equal(typeof bell.houseCall,'function');
 const s=sim.createState();assert.deepEqual(bell.houseCall(s),{room:'kitchen',doll:'lina',reason:'wish'});
 sim.care(s,'lina','tea');assert.equal(bell.houseCall(s).doll!=='lina',true,'a granted wish stops calling');
 for(const d of s.dolls)if(!sim.wishGranted(s,d.id)){s.buttons=99;sim.care(s,d.id,sim.wishFor(s,d.id))}
 assert.equal(bell.houseCall(s),null,'a content house is quiet');
 const n=sim.createState();for(const d of n.dolls)d.comfort=50;for(let i=0;i<122;i++)sim.step(n,1);
 assert.equal(bell.houseCall(n).reason,'visitor');assert.equal(bell.houseCall(n).room,'kitchen');
});

test('after the first tea is served the bell rings within 8 s, gently, and never during a pour',()=>{
 const s=sim.createState(),rings=[];let now=0;
 const b=bell.createBellClock({ring:call=>rings.push([now,call.room])});
 sim.care(s,'lina','tea');assert.equal(sim.beginActivity(s,'tea').ok,true);
 for(;now<5;now+=.25)b.tick(s,now,{pouring:true});assert.deepEqual(rings,[],'never over a pour');
 finishTea(s);const served=now;for(;now<served+30;now+=.25)b.tick(s,now,{pouring:false});
 assert.ok(rings.length>=1);assert.ok(rings[0][0]-served<=8,`first call ${rings[0][0]-served}s after the tea`);
 assert.ok(rings.length<=3,'it rings again only after a long pause, never nags');
 assert.ok(['bedroom','studio'].includes(rings[0][1]));
});

test('the bell has words in both languages, without exclamation, and the badge dots are gone',async()=>{
 const {readFileSync}=await import('node:fs');
 for(const lang of ['en','ar'])assert.ok(translate(lang,'porterBell').length>2);
 assert.doesNotMatch(translate('en','porterBell')+translate('ar','porterBell'),/!/);
 const shell=readFileSync(new URL('../src/shell-markup.js',import.meta.url),'utf8');
 assert.doesNotMatch(shell,/notification-dot|clue-dot/);
});
