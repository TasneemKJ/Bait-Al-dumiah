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
