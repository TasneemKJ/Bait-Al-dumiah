import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {shellMarkup,button} from '../src/shell-markup.js';
import {keyRingMarkup,ringKeys} from '../src/key-ring.js';
import {createState} from '../src/simulation.js';
import {translate,number} from '../src/i18n.js';

// DESIGN.md #67 (D7, round 3): the nine-button bottom bar folded into the house as a key ring by the front door.
test('the bar is gone: the shell has no dock, room buttons or house button, only zoom and the clock',()=>{
 for(const lang of ['en','ar']){
  const t=k=>translate(lang,k),html=shellMarkup(createState(),{t,n:v=>number(lang,v),button,clueExpanded:false,toolsExpanded:false});
  assert.doesNotMatch(html,/class="dock"|data-action="toggle-tools"|data-action="camera"|data-short=/);
  assert.match(html,/data-action="zoom-in"/);assert.match(html,/data-action="light"/);
 }
});
test('every key carries a short paper tag in both languages, and its touch target is at least 44 px',()=>{
 const s=Object.assign(createState(),{day:3,journal:['jasmine']});
 for(const lang of ['en','ar']){const t=k=>translate(lang,k),html=keyRingMarkup(ringKeys(s,{store:true}),t);
  for(const k of ringKeys(s,{store:true})){const tag=t('key-'+k.id);assert.ok([...tag].length<=15,`${lang} ${tag}`);
   assert.match(html,new RegExp(`data-key="${k.id}"[^>]*aria-label="${tag}"`))}}
 const css=readFileSync(new URL('../src/hud.css',import.meta.url),'utf8');
 assert.match(css,/#ui \.key-ring \.ring-key\{[^}]*min-width:44px;min-height:44px/);
 assert.match(css,/#ui \.porter-bell\{[^}]*width:48px;height:48px/);
 assert.match(css,/@media \(prefers-reduced-motion:reduce\)\{[^}]*#ui \.porter-bell\.ringing/);
});
