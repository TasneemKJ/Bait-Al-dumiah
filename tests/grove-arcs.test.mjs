import test from 'node:test';
import assert from 'node:assert/strict';
import * as sim from '../src/simulation.js';
import {ARCS} from '../src/content-grove.js';
import {strings} from '../src/i18n.js';
import {requestsMarkup} from '../src/grove-ui.js';

const t=k=>strings.en[k]??k,button=(a,l,i,x)=>`<button data-action="${a}" ${x}>${l}</button>`;
test('a request is heard at its closeness, done only when true in the house, paid once when told',()=>{
 const s=sim.createState();let a=sim.arcStatus(s,'sami');assert.equal(a.heard,false);
 assert.equal(sim.fulfilRequest(s,'sami').reason,'requestUnheard');
 s.dolls[2].bond=32;a=sim.arcStatus(s,'sami');assert.equal(a.heard,true);assert.equal(a.met,false);
 assert.equal(sim.fulfilRequest(s,'sami').reason,'requestNotMet');
 sim.place(s,'bear','kitchen',0);assert.equal(sim.arcStatus(s,'sami').met,true);const b=s.buttons;
 const r=sim.fulfilRequest(s,'sami');assert.equal(r.ok,true);assert.equal(r.reward,sim.ARC_REWARD(0));
 assert.equal(s.buttons,b+r.reward+10,'plus the closeness level it reached');
 assert.equal(sim.arcStatus(s,'sami').step,1);assert.equal(sim.arcStatus(s,'sami').heard,true,'closeness grew with the thanks');
 assert.equal(sim.arcStatus(s,'sami').met,false,'the next request is new work');
});
test('every resident has three ordered requests with bilingual words; progress restores clamped',()=>{
 for(const [id,arc] of Object.entries(ARCS)){assert.equal(arc.length,3);assert.deepEqual(arc.map(r=>r.bond),[1,2,3]);
  for(const r of arc){assert.ok(strings.en['request-'+r.id]);assert.match(strings.ar['request-'+r.id],/[؀-ۿ]/)}assert.ok(sim.arcStatus(sim.createState(),id))}
 const s=sim.createState();const raw=JSON.parse(JSON.stringify(s));raw.grove.arcs={lina:9,noor:-2,sami:1.5,ghost:2};
 assert.deepEqual(sim.restore(JSON.stringify(raw)).grove.arcs,{lina:3,noor:0,sami:1});
});
test('the household lists done requests, the current one and its Tell button only when met',()=>{
 const s=sim.createState();s.dolls[0].bond=20;let html=requestsMarkup(s,'lina',{t,n:String,button});
 assert.match(html,/class="open"/);assert.doesNotMatch(html,/fulfil-request/);
 sim.cook(s,'maamoul');html=requestsMarkup(s,'lina',{t,n:String,button});assert.match(html,/data-action="fulfil-request"/);
 sim.fulfilRequest(s,'lina');s.dolls[0].bond=20;html=requestsMarkup(s,'lina',{t,n:String,button});
 assert.match(html,/class="done"/);assert.match(html,/class="locked"/);
});
import {lettersMarkup} from '../src/grove-ui.js';
import {journalMarkup} from '../src/panels-ui.js';
import {readFileSync} from 'node:fs';
test('finishing an arc ties a ribbon once and leaves a letter in the journal; the resident stays',()=>{
 const s=sim.createState();s.grove.arcs.noor=2;s.dolls[1].bond=70;s.grove.warmth=20;
 assert.equal(sim.arcComplete(s,'noor'),false);assert.equal(lettersMarkup(s,t),'');
 const r=sim.fulfilRequest(s,'noor');assert.equal(r.finished,true);assert.deepEqual(sim.letters(s),['noor']);
 assert.equal(s.events.filter(e=>e.type==='arc-complete').length,1);assert.equal(s.dolls.length,3,'no farewell departure');
 const html=journalMarkup(s,{t,n:String,button});assert.match(html,/class="letter"/);assert.ok(html.includes(strings.en['letter-noor']));
 for(const id of Object.keys(ARCS))assert.match(strings.ar['letter-'+id],/[؀-ۿ]/);
 assert.match(readFileSync(new URL('../src/cmd-grove.js',import.meta.url),'utf8'),/dispatch\('focus-doll',value\)/);
});
import * as T from 'three';
import {createRibbon,ribbonShine} from '../src/render/doll-ribbon.js';
test('a resident with a finished arc wears a gold ribbon that shimmers only with motion allowed',()=>{
 const body=new T.Group(),ribbon=createRibbon(body);ribbon.update(false,1,false);assert.equal(ribbon.root.visible,false);
 ribbon.update(true,1,false);assert.equal(ribbon.root.visible,true);assert.equal(ribbon.root.userData.noBatch,true);
 assert.equal(ribbonShine(1,true),ribbonShine(9,true));assert.notEqual(ribbonShine(0,false),ribbonShine(1.2,false));
 assert.match(readFileSync(new URL('../src/render/dolls.js',import.meta.url),'utf8'),/ribbon\.update\(arcComplete\(state,v\.id\)/);
});
