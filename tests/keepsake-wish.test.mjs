import test from 'node:test';
import assert from 'node:assert/strict';
import * as sim from '../src/simulation.js';
import {restore} from '../src/save-codec.js';
import {nextStep} from '../src/objective-ui.js';
import {decorateMarkup} from '../src/panels-ui.js';
import {button} from '../src/shell-markup.js';
import {translate} from '../src/i18n.js';
import {CATALOG,ROOMS,SLOTS,SECRETS,STORY_CHAPTERS,DOLLS} from '../src/content.js';

// Simulated week (2026-11-13): after the stories and whispers nothing new arrived and buttons had no use.
// One keepsake wish a day, from the dolls, until every corner of the house is furnished; then the house says so.
const done=()=>{const s=sim.createState();s.story.chapter=STORY_CHAPTERS.length;s.buttons=500;s.cares=5;return s};
const t=k=>translate('en',k),n=String;
test('no keepsake wish before the three stories are told',()=>{assert.equal(sim.keepsakeWish(sim.createState()),null)});
test('once a day a doll wishes for one keepsake in one room with a free corner',()=>{
 const s=done(),wish=sim.keepsakeWish(s);
 assert.ok(DOLLS.some(d=>d.id===wish.doll)&&CATALOG.some(c=>c.id===wish.item)&&ROOMS.some(r=>r.id===wish.room));
 assert.deepEqual(sim.keepsakeWish(s),wish,'the same wish all day');
 const other=CATALOG.find(c=>c.id!==wish.item).id;
 assert.equal(sim.place(s,other,wish.room,0).wish,undefined,'another keepsake does not grant it');
 const doll=s.dolls.find(d=>d.id===wish.doll),bond=doll.bond,buttons=s.buttons;
 const placed=sim.place(s,wish.item,wish.room,1);
 assert.equal(placed.wish,wish.doll);assert.ok(doll.bond>bond,'closeness, never buttons');
 assert.ok(s.buttons<=buttons,'the wish spends buttons and pays none');
 assert.equal(sim.keepsakeWish(s),null,'one a day');
 s.day++;assert.ok(sim.keepsakeWish(s),'a new one tomorrow');
});
test('the wish day survives the save and is clamped',()=>{
 const s=done();const w=sim.keepsakeWish(s);sim.place(s,w.item,w.room,0);
 assert.equal(restore(JSON.stringify(s)).keepsakeWishDay,s.day);
 assert.equal(restore(JSON.stringify({...s,keepsakeWishDay:9e9})).keepsakeWishDay,s.day);
 assert.equal(restore(JSON.stringify({...s,keepsakeWishDay:undefined})).keepsakeWishDay,0,'older saves load');
});
test('it is bounded: a fully furnished house has no wish, and the clue says the story is complete',()=>{
 const s=done();s.journal=[...SECRETS];s.wishes=DOLLS.map(d=>d.id);let id=1;
 s.decor=ROOMS.flatMap(r=>SLOTS.map((_,slot)=>({id:id++,item:'plant',room:r.id,slot,rotation:0,originRoom:r.id,active:false,tendedDay:0,lastUse:-10})));
 for(const r of ROOMS)s.restoration[r.id]=3;s.activities.mastery={tea:9,stitch:9,lullaby:9};s.milestones=[...s.achieved];
 assert.equal(sim.keepsakeWish(s),null);
 const step=nextStep(s,t,n,'',{fifthRoom:false,canary:false});
 assert.equal(step.copy,t('objectiveComplete'));assert.match(step.copy,/complete/i);
 assert.match(translate('ar','objectiveComplete'),/[؀-ۿ]/);
});
test('the clue and the Decorate sheet name the wish, in both languages',()=>{
 const s=done();s.wishes=DOLLS.map(d=>d.id);s.journal=[...SECRETS];s.decor=[{id:1,item:'plant',room:'kitchen',slot:0}];
 for(const r of ROOMS)s.restoration[r.id]=3;s.activities.mastery={tea:9,stitch:9,lullaby:9};
 const w=sim.keepsakeWish(s),step=nextStep(s,t,n,'',{fifthRoom:false,canary:false});
 assert.equal(step.action,'panel');assert.equal(step.value,'decorate');
 for(const lang of ['en','ar']){const tr=k=>translate(lang,k);
  const html=decorateMarkup(s,{t:tr,n,button});
  assert.ok(html.includes('keepsake-wish')&&html.includes(tr(w.item))&&html.includes(tr(w.room))&&html.includes(tr(w.doll)),lang)}
});
