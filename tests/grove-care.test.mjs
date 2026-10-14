import test from 'node:test';
import assert from 'node:assert/strict';
import * as sim from '../src/simulation.js';
import {strings} from '../src/i18n.js';
import {heartsMarkup} from '../src/grove-ui.js';
import {householdMarkup} from '../src/panels-ui.js';

const t=k=>strings.en[k]??k,button=(a,l)=>`<button data-action="${a}">${l}</button>`;
test('closeness shows as four hearts, one filled per level, with a spoken label',()=>{
 for(let l=0;l<=4;l++){const html=heartsMarkup(l,t);assert.equal((html.match(/class="full"/g)||[]).length,l);
  assert.equal((html.match(/<i /g)||[]).length,4);assert.ok(html.includes(strings.en['bond'+l]))}
 assert.equal((heartsMarkup(99,t).match(/class="full"/g)||[]).length,4);assert.match(strings.ar.heartsLabel,/\{level\}/);
});
test('the household sheet shows hearts on every resident tab and on the closeness row',()=>{
 const s=sim.createState();s.dolls[0].bond=40;
 const html=householdMarkup(s,{t,n:String,button,avatar:()=>'',selected:'lina'});
 assert.equal((html.match(/class="hearts"/g)||[]).length,4);
});
test('one hug per resident per day: comfort and closeness rise, free, never farmed by hurrying dawn',()=>{
 const s=sim.createState(),lina=s.dolls[0],buttons=s.buttons,comfort=lina.comfort,bond=lina.bond;
 assert.equal(sim.hug(s,'lina').ok,true);assert.ok(lina.comfort>comfort);assert.ok(lina.bond>bond);
 assert.equal(s.buttons,buttons);assert.equal(lina.action,'hug');
 assert.deepEqual(sim.hug(s,'lina'),{ok:false,reason:'huggedToday'});assert.equal(sim.hug(s,'noor').ok,true);
 sim.changeLight(s);sim.changeLight(s);assert.equal(s.day,2);assert.equal(sim.hug(s,'lina').ok,false,'hurried dawn');
 sim.changeLight(s);s.dayTime=999;sim.changeLight(s);assert.equal(sim.hug(s,'lina').ok,true,'a day spent in the house');
 assert.equal(sim.hug(s,'nobody').ok,false);s.paused=true;assert.equal(sim.hug(s,'sami').ok,false);
});
test('hugs survive a save and the restore clamps them; the sheet offers or marks the hug',()=>{
 const s=sim.createState();sim.hug(s,'lina');const raw=JSON.parse(JSON.stringify(s));raw.grove.hugs.noor=1e9;raw.grove.hugs.x=1;
 const r=sim.restore(JSON.stringify(raw));assert.deepEqual(r.grove.hugs,{lina:1,noor:1});
 let html=householdMarkup(s,{t,n:String,button:(a,l,i,x)=>`<button data-action="${a}" ${x}>${l}</button>`,avatar:()=>'',selected:'lina'});
 assert.match(html,/data-action="hug"[^>]*disabled>Hugged today/);
 html=householdMarkup(s,{t,n:String,button:(a,l,i,x)=>`<button data-action="${a}" ${x}>${l}</button>`,avatar:()=>'',selected:'sami'});
 assert.match(html,/data-action="hug"[^>]*>Hug</);
 for(const k of ['hug','huggedToday','hugged'])assert.match(strings.ar[k],/[؀-ۿ]/);
});
import {readFileSync} from 'node:fs';
import {hugEnvelope} from '../src/render/doll-acting.js';
test('a hug gathers, holds and lets go within three seconds; reduced motion holds a still embrace',()=>{
 assert.equal(hugEnvelope(-1),0);assert.equal(hugEnvelope(3.1),0);assert.equal(hugEnvelope(NaN),0);
 assert.ok(hugEnvelope(.1)<hugEnvelope(.3));assert.equal(hugEnvelope(1.5),1);assert.ok(hugEnvelope(2.8)<1);
 assert.equal(hugEnvelope(.05,true),1);
 const dolls=readFileSync(new URL('../src/render/dolls.js',import.meta.url),'utf8');
 assert.match(dolls,/d\.action==='soothe'\|\|d\.action==='hug'/,'reassurance hearts rise for a hug too');
 assert.match(readFileSync(new URL('../src/render/doll-acting.js',import.meta.url),'utf8'),/if\(d\.action==='hug'\)/);
});
