import test from 'node:test';
import assert from 'node:assert/strict';
import * as sim from '../src/simulation.js';
import {INTERACTIVE_PROPS,STORY_CHAPTERS,SAVE_KEY} from '../src/content.js';
import {sceneObjectAction,objectInfo,objectMarkup} from '../src/object-ui.js';
import {strings} from '../src/i18n.js';

const mobile='prop:moon-mobile',bed='prop:moon-bed';
const saved=s=>JSON.stringify(s);
test('the existing bedroom mobile has one permanent activity target without care or save flags',()=>{
 const props=INTERACTIVE_PROPS.filter(p=>p.id==='moon-mobile');assert.equal(props.length,1);
 const p=props[0];assert.equal(p.room,'bedroom');assert.equal(p.activity,'lullaby');assert.equal(p.icon,'music');
 assert.deepEqual(p.position,[-1.70,2.36,-.60]);assert.deepEqual(p.size,[.90,1.00,.30]);
 assert.equal(p.care,undefined);assert.equal(p.story,undefined);assert.equal(p.resident,undefined);
 const s=sim.createState(),info=objectInfo(s,mobile);assert.equal(info.prop,true);assert.equal(info.title,'object-moon-mobile');assert.equal(info.story,'object-moon-mobileStory');assert.equal(SAVE_KEY,'bait-al-dumiah.v1');assert.equal(s.version,1);
});
test('fresh, every completed chapter and fully finished stories retain direct empty-handed mobile entry',()=>{
 for(let chapter=0;chapter<=STORY_CHAPTERS.length;chapter++){
  const s=sim.createState();s.story.chapter=chapter;s.story.step=0;const before=saved(s);
  assert.equal(sim.storyStatus(s).held,null);
  assert.deepEqual(sceneObjectAction(s,mobile),{action:'begin-activity',value:'lullaby',label:'activity-lullaby',icon:'play'});
  assert.equal(saved(s),before,'read-only routing must not award or progress');
  assert.equal(sim.beginActivity(s,sceneObjectAction(s,mobile).value).ok,true);assert.equal(sim.chimeStatus(s).phase,'listen');
  assert.equal(s.buttons,36);assert.equal(s.story.chapter,chapter);assert.equal(s.story.step,0);
 }
});
test('every held story item keeps generic destination priority and cannot be consumed by the mobile',()=>{
 for(let chapter=0;chapter<STORY_CHAPTERS.length;chapter++)for(let step=1;step<STORY_CHAPTERS[chapter].steps.length;step++){
  const s=sim.createState();s.story.chapter=chapter;s.story.step=step;const held=sim.storyStatus(s).held,before=saved(s);
  assert.ok(held);assert.deepEqual(sceneObjectAction(s,mobile),{action:'story-interact',value:mobile,label:'storyUseHeld',item:held,icon:'arrow'});
  assert.equal(sim.interactStory(s,mobile).reason,'storyNotHere');assert.equal(sim.storyStatus(s).held,held);assert.equal(saved(s),before);assert.equal(s.activities.active,null);
 }
});
test('the bed keeps its existing first visit, active bear delivery and earned replay routes',()=>{
 const s=sim.createState();assert.deepEqual(sceneObjectAction(s,bed),{action:'begin-activity',value:'lullaby',label:'activity-lullaby',icon:'play'});
 s.story.step=2;assert.equal(sim.storyStatus(s).held,'mended-bear');assert.deepEqual(sceneObjectAction(s,bed),{action:'story-interact',value:bed,label:'story-mended-friend-2-action',icon:'bear'});
 assert.equal(sim.interactStory(s,bed).chapterComplete,true);assert.equal(s.buttons,48);
 for(let chapter=1;chapter<=STORY_CHAPTERS.length;chapter++){
  s.story.chapter=chapter;s.story.step=0;assert.deepEqual(sceneObjectAction(s,bed),{action:'play-story-keepsake',value:bed,label:'story-play-moon-bed',icon:'rest'});
  const buttons=s.buttons;assert.equal(sim.playStoryKeepsake(s,bed).ok,true);assert.equal(s.buttons,buttons);
  assert.equal(sceneObjectAction(s,mobile).action,'begin-activity');
 }
});
test('unrelated held items retain the bed destination priority while earned replay remains locked behind the item',()=>{
 const s=sim.createState();s.story.chapter=1;s.story.step=1;assert.equal(sim.storyStatus(s).held,'brass-key');const before=saved(s);
 assert.deepEqual(sceneObjectAction(s,bed),{action:'story-interact',value:bed,label:'storyUseHeld',item:'brass-key',icon:'arrow'});
 assert.equal(sim.interactStory(s,bed).reason,'storyNotHere');assert.equal(saved(s),before);
});
test('bed care metadata and localized optional care action remain exactly available',()=>{
 const s=sim.createState(),p=INTERACTIVE_PROPS.find(p=>p.id==='moon-bed');assert.equal(p.activity,'lullaby');assert.equal(p.care,'rest');assert.equal(p.resident,'noor');
 const markup=objectMarkup(s,bed,key=>key,String,(action,label,icon,attrs='')=>action+' '+attrs);
 assert.ok(markup.includes('data-id="noor" data-care="rest"'));assert.ok(markup.includes('begin-activity data-id="lullaby"'));
 const noor=s.dolls.find(d=>d.id==='noor'),energy=noor.energy;assert.equal(sim.care(s,'noor','rest').ok,true);assert.ok(noor.energy>energy);
});
test('English and Shami name and describe the mobile without missing object keys',()=>{
 const s=sim.createState(),o=objectInfo(s,mobile);
 for(const locale of ['en','ar'])for(const key of [o.title,o.story]){
  assert.equal(typeof strings[locale][key],'string');assert.ok(strings[locale][key].trim().length>4);assert.notEqual(strings[locale][key],key);
 }
 assert.equal(strings.en[o.title],'Moon mobile');assert.equal(strings.ar[o.title],'زينة القمر');
});
