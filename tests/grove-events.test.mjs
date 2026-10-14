import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as sim from '../src/simulation.js';
import {EVENTS,ERRANDS} from '../src/content-grove.js';
import {strings} from '../src/i18n.js';
import {todayMarkup} from '../src/grove-ui.js';
import {rollErrands} from '../src/sim-grove.js';

const t=k=>strings.en[k]??k,button=(a,l)=>`<button data-action="${a}">${l}</button>`;
test('a running seasonal event joins today with an extra errand worth two embers',()=>{
 const s=sim.createState();sim.setMonth(s,9);assert.equal(sim.currentEvent(s),'olive');
 assert.equal(s.grove.errands.length,4);assert.equal(s.grove.errands[3].id,'event-olive');
 sim.setMonth(s,9);assert.equal(s.grove.errands.length,4,'never twice');
 sim.cook(s,'kaak');assert.equal(s.grove.errands[3].done,true);
 assert.equal(sim.collectErrand(s,'event-olive').embers,2);
 assert.match(todayMarkup(s,{t,n:String,button}),/data-event="olive"/);
});
test('outside an event month there is no card and no extra errand; event errands never come from the pool',()=>{
 const s=sim.createState();sim.setMonth(s,4);assert.equal(sim.currentEvent(s),null);assert.equal(s.grove.errands.length,3);
 assert.doesNotMatch(todayMarkup(s,{t,n:String,button}),/event-card/);sim.setMonth(s,99);assert.equal(s.grove.month,4);
 for(let d=2;d<60;d++){const x=sim.createState();x.day=d;x.grove.month=4;rollErrands(x);
  assert.ok(x.grove.errands.every(e=>!e.id.startsWith('event-')))}
});
test('each event errand is finished by its own act, restores, and every event is bilingual',()=>{
 for(const e of EVENTS){assert.ok(ERRANDS.some(x=>x.event===e.id));for(const k of ['','Text'])
  assert.match(strings.ar['event-'+e.id+k],/[؀-ۿ]/);assert.match(strings.ar['errand-event-'+e.id],/[؀-ۿ]/)}
 const s=sim.createState();sim.setMonth(s,0);s.grove.embers=3;sim.tendLantern(s);
 assert.equal(s.grove.errands.find(e=>e.id==='event-lamps').done,true);
 const r=sim.restore(JSON.stringify(s));assert.equal(r.grove.month,0);assert.ok(r.grove.errands.some(e=>e.id==='event-lamps'));
 const n=sim.createState();sim.setMonth(n,6);sim.changeLight(n);sim.tuckIn(n,'noor');
 assert.equal(n.grove.errands.find(e=>e.id==='event-jasmine').done,true);
 assert.match(readFileSync(new URL('../src/app-loop.js',import.meta.url),'utf8'),/sim\.setMonth\(app\.state,app\.month,app\.date\)/);
});
import * as T from 'three';
import {createBunting,buntingFlags} from '../src/render/bunting.js';
import {BIRTHDAYS} from '../src/content-grove.js';
test('a resident\'s calendar birthday hangs bunting and adds a birthday hug worth three embers',()=>{
 const s=sim.createState();sim.setMonth(s,9,19);assert.equal(sim.birthdayToday(s),null);
 sim.setMonth(s,9,20);assert.equal(sim.birthdayToday(s),'lina');const e=s.grove.errands.find(x=>x.id==='birthday-lina');assert.ok(e);
 sim.hug(s,'noor');assert.equal(e.done,false);sim.hug(s,'lina');assert.equal(e.done,true);
 assert.equal(sim.collectErrand(s,'birthday-lina').embers,3);
 assert.match(todayMarkup(s,{t,n:String,button}),/birthday-card/);
 const parent=new T.Group(),bunting=createBunting(parent);bunting.update(s);assert.equal(bunting.flags.visible,true);
 s.settings.reducedMotion=true;bunting.update(s);assert.equal(bunting.flags.rotation.x,0);
 sim.setMonth(s,9,21);bunting.update(s);assert.equal(bunting.flags.visible,false);
 assert.ok(buntingFlags().every(f=>f.y>5.8&&Math.abs(f.x)<4.5));
 for(const id of Object.keys(BIRTHDAYS))assert.match(strings.ar['errand-birthday-'+id],/[؀-ۿ]/);
 const r=sim.restore(JSON.stringify({...s,grove:{...s.grove,date:99}}));assert.equal(r.grove.date,31);
});
