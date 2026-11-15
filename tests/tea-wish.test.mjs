import test from 'node:test';
import assert from 'node:assert/strict';
import * as sim from '../src/simulation.js';
import {DOLLS} from '../src/content.js';
import {fillTea,finishTea,storyAction} from './tea-test-helpers.mjs';
const wait=(s,n=21)=>{for(let i=0;i<n;i++)sim.step(s,1)};
const ritualTea=s=>{assert.equal(sim.beginActivity(s,'tea').ok,true);const r=finishTea(s);sim.endActivity(s);return r};
// A day on which Lina does not wish for tea (day one always does).
const otherDay=s=>{for(let i=0;i<12&&sim.wishFor(s,'lina')==='tea';i++){wait(s,61);sim.changeLight(s);sim.changeLight(s)}
 assert.notEqual(sim.wishFor(s,'lina'),'tea')};

// One act, one reward: the tea poured at the table is Lina's tea, so it grants her tea wish, and it pays only
// the ritual's own reward (no care cost, no wish reward on top).
test('a ritual tea on Lina\'s tea day grants her wish and pays only the ritual\'s seven buttons',()=>{
 const s=sim.createState();assert.equal(sim.wishFor(s,'lina'),'tea');assert.equal(sim.wishGranted(s,'lina'),false);
 const buttons=s.buttons,result=ritualTea(s);
 assert.equal(result.reward,7);assert.equal(result.wish,'lina');
 assert.equal(s.buttons,buttons+7);assert.equal(s.earnedToday,7);
 assert.equal(s.activities.mastery.tea,1);assert.equal(s.activities.completed.tea,1);
 assert.equal(sim.wishGranted(s,'lina'),true);
 // The tea was given: the household counts it as care, so the house moves on to the next wish.
 assert.equal(s.cares,1);
});

test('the granted wish never pays again: a second earned tea the same day pays only the ritual',()=>{
 const s=sim.createState();ritualTea(s);wait(s);const buttons=s.buttons,second=ritualTea(s);
 // The second earned service of the day (the cap is two) keeps its seven plus the level bonus, as before.
 assert.equal(second.reward,7);assert.equal(second.bonus,10);assert.equal(second.wish,undefined);
 assert.equal(s.buttons,buttons+17);assert.deepEqual(s.wishes,['lina']);
 wait(s);const capped=s.buttons,third=ritualTea(s);assert.equal(third.practice,true);assert.equal(s.buttons,capped);
});

test('a practice tea on Lina\'s tea day still grants the wish without any payout',()=>{
 const s=sim.createState();ritualTea(s);ritualTea(s);s.wishes=[];// the wish is open again, the ritual on cooldown
 const buttons=s.buttons,result=ritualTea(s);assert.equal(result.practice,true);assert.equal(result.wish,'lina');
 assert.equal(s.buttons,buttons);assert.deepEqual(s.wishes,['lina']);
});

test('on a day Lina wishes for something else, the tea leaves her wish open',()=>{
 const s=sim.createState();otherDay(s);const before=s.cares,result=ritualTea(s);
 assert.equal(result.wish,undefined);assert.equal(sim.wishGranted(s,'lina'),false);assert.equal(s.cares,before);
});

test('the guest\'s story tea never grants Lina\'s wish',()=>{
 const s=sim.createState();
 for(const id of ['mint-tin','sewing-machine','moon-bed','parlor-sofa','music-cabinet','sewing-machine','music-cabinet','wash-basin','jasmine-window'])
  assert.equal(storyAction(s,id).ok,true);
 s.wishes=[];assert.equal(sim.wishFor(s,'lina'),'tea');
 const begun=sim.interactStory(s,'prop:tea-set');assert.equal(begun.startedActivity,'tea');
 fillTea(s);const served=sim.serveTea(s);assert.equal(served.mode,'guest');assert.equal(sim.wishGranted(s,'lina'),false);
});

test('a tea that grants the day\'s last wish completes the day as a care would: streak and full-house bonus',()=>{
 const s=sim.createState();s.buttons=99;
 for(const d of DOLLS.filter(d=>d.id!=='lina')){s.elapsed+=5;assert.equal(sim.care(s,d.id,sim.wishFor(s,d.id)).ok,true)}
 const buttons=s.buttons,result=ritualTea(s);
 assert.equal(s.streak,1);assert.equal(s.lastFullDay,1);
 const full=s.events.find(e=>e.type==='full-house');assert.ok(full);
 // The ritual's seven and the day's full-house bonus, never the tea care's cost or wish reward.
 assert.equal(s.buttons,buttons+result.reward+result.bonus+full.reward);assert.equal(result.reward,7);
});

test('the tea command no longer dispatches a paid care for the ritual tea',async()=>{
 const {readFileSync}=await import('node:fs');
 const src=readFileSync(new URL('../src/cmd-activities.js',import.meta.url),'utf8');
 assert.doesNotMatch(src,/dispatch\('care',\{id:'lina',action:'tea'\}\)/);
});
