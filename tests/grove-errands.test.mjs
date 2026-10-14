import test from 'node:test';
import assert from 'node:assert/strict';
import * as sim from '../src/simulation.js';
import {ERRANDS,ERRANDS_PER_DAY} from '../src/content-grove.js';
import {strings} from '../src/i18n.js';
import {todayMarkup} from '../src/grove-ui.js';

const ids=s=>s.grove.errands.map(e=>e.id);
test('a new house has three distinct, possible errands for today',()=>{
 const s=sim.createState();assert.equal(s.grove.errands.length,ERRANDS_PER_DAY);
 assert.equal(new Set(ids(s)).size,ERRANDS_PER_DAY);assert.equal(s.grove.errandDay,1);
 for(const id of ids(s))assert.ok(!ERRANDS.find(e=>e.id===id).needs||id==='whisper','no errand needs a keepsake not owned');
});
test('doing the matching house action marks the errand done and announces it, once',()=>{
 const s=sim.createState();s.grove.errands=[{id:'care-lina',done:false,collected:false},
  {id:'basket',done:false,collected:false},{id:'place',done:false,collected:false}];
 sim.care(s,'noor','rest');assert.equal(s.grove.errands[0].done,false,'other resident does not count');
 sim.care(s,'lina','tea');assert.equal(s.grove.errands[0].done,true);
 assert.deepEqual(s.events.filter(e=>e.type==='errand').map(e=>e.id),['care-lina']);
 sim.place(s,'plant','kitchen',0);assert.equal(s.grove.errands[2].done,true);
 assert.equal(s.grove.errands[1].done,false);s.basket=2;sim.collectBasket(s);assert.equal(s.grove.errands[1].done,true);
});
test('errands refresh only after a day spent in the house, like wishes',()=>{
 const s=sim.createState();const first=ids(s);s.grove.errands[0].done=true;
 sim.changeLight(s);sim.changeLight(s);assert.equal(s.day,2);assert.deepEqual(ids(s),first,'hurried dawn keeps the list');
 assert.equal(s.grove.errands[0].done,true);
 for(let i=0;i<300;i++)sim.step(s,1);assert.ok(s.day>=3);assert.equal(s.grove.errandDay,s.day);
 assert.ok(s.grove.errands.every(e=>!e.done));
});
test('restore whitelists, dedupes and clamps the errand record; old saves get a fresh list',()=>{
 const s=sim.createState();const raw=JSON.parse(JSON.stringify(s));
 raw.grove={embers:-4,warmth:1e9,errandDay:99,errands:[{id:'basket',collected:true},{id:'basket'},{id:'evil'},null,7]};
 const r=sim.restore(JSON.stringify(raw));assert.deepEqual(r.grove.errands,[{id:'basket',done:true,collected:true}]);
 assert.equal(r.grove.embers,0);assert.equal(r.grove.warmth,9999);assert.equal(r.grove.errandDay,1);
 delete raw.grove;raw.day=5;const old=sim.restore(JSON.stringify(raw));
 assert.equal(old.grove.errands.length,ERRANDS_PER_DAY);assert.equal(old.grove.errandDay,5);
});
test('Today copy exists in both languages and the sheet lists every errand',()=>{
 for(const e of ERRANDS){assert.ok(strings.en['errand-'+e.id]);assert.match(strings.ar['errand-'+e.id],/[؀-ۿ]/)}
 const s=sim.createState();s.grove.errands[0].done=true;const t=k=>strings.en[k]??k;
 const html=todayMarkup(s,{t,n:String,button:()=>''});assert.equal((html.match(/class="errand /g)||[]).length,3);
 assert.match(html,/errand done/);assert.match(html,/id="sheet-title">Today/);
});
test('a finished errand is collected once, by hand, for an ember',()=>{
 const s=sim.createState();const id=s.grove.errands[0].id;
 assert.deepEqual(sim.collectErrand(s,id),{ok:false,reason:'errandNotDone'});assert.equal(s.grove.embers,0);
 s.grove.errands[0].done=true;const buttons=s.buttons;
 assert.equal(sim.collectErrand(s,id).ok,true);assert.equal(s.grove.embers,sim.ERRAND_EMBERS);assert.equal(s.buttons,buttons);
 assert.deepEqual(sim.collectErrand(s,id),{ok:false,reason:'errandCollected'});assert.equal(s.grove.embers,sim.ERRAND_EMBERS);
 assert.equal(sim.collectErrand(s,'nope').ok,false);
 const t=k=>strings.en[k]??k,html=todayMarkup(s,{t,n:String,button:(a,l,i,x)=>`<button data-action="${a}" ${x}>${l}</button>`});
 assert.match(html,/Collected/);s.grove.errands[1].done=true;
 assert.match(todayMarkup(s,{t,n:String,button:(a,l,i,x)=>`<button data-action="${a}" ${x}>${l}</button>`}),/data-action="collect-errand" data-id/);
 for(const k of ['embers','errandCollectedNote','errandCollected','errandNotDone'])assert.match(strings.ar[k],/[؀-ۿ]/);
});
import {FIRST_DAY_ERRANDS} from '../src/content-grove.js';
test('day one teaches the house through fixed errands that its opening already points to',()=>{
 const s=sim.createState();assert.deepEqual(ids(s),FIRST_DAY_ERRANDS);
 assert.equal(sim.wishFor(s,'lina'),'tea','Lina\'s first wish is the first errand');
 sim.care(s,'lina','tea');sim.place(s,'plant','kitchen',0);assert.equal(sim.errandsDone(s),2);
 const later=sim.createState();later.day=2;later.dayTime=999;sim.changeLight(later);sim.changeLight(later);
 assert.notDeepEqual(ids(later),FIRST_DAY_ERRANDS,'later days draw from the pool');
});
import {nextStep} from '../src/objective-ui.js';
import {todayNews} from '../src/grove-ui.js';
test('a ready errand or held embers mark Today and the clue hands off to it after the wishes',()=>{
 const s=sim.createState(),t=k=>strings.en[k]??k;s.story.chapter=3;
 for(const d of s.dolls)s.wishes.push(d.id);assert.equal(todayNews(s),false);
 s.grove.errands[0].done=true;assert.equal(todayNews(s),true);
 let step=nextStep(s,t,String,'');assert.equal(step.value,'today');assert.equal(step.copy,strings.en.objectiveErrand);
 sim.collectErrand(s,s.grove.errands[0].id);step=nextStep(s,t,String,'');assert.equal(step.copy,strings.en.objectiveTend);
 sim.tendLantern(s);assert.equal(todayNews(s),false);assert.notEqual(nextStep(s,t,String,'').value,'today');
 s.wishes=[];assert.equal(nextStep(s,t,String,'').action,'care','wishes still come first');
});
