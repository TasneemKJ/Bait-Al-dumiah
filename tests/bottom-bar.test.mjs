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
  assert.doesNotMatch(html,/data-action="toggle-tools"|data-action="camera"|data-short=|data-action="panel-/);
  // The only dock left is the rituals' Sound and Pause pair, hidden outside a ritual (hud.css).
  const dock=html.match(/<nav class="dock work-dock"[\s\S]*?<\/nav>/)?.[0]??'';
  assert.deepEqual([...dock.matchAll(/data-action="(\w+)"/g)].map(m=>m[1]),['sound','pause']);
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
test('five keys and the bell fit a 375 px phone: the ring stops short of the bell corner and each key is 54 px',()=>{
 const css=readFileSync(new URL('../src/hud.css',import.meta.url),'utf8');
 assert.match(css,/#ui \.key-ring\{[^}]*max-width:calc\(100% - 100px\)/);
 assert.match(css,/#ui \.key-ring \.ring-key\{[^}]*width:54px;flex:0 1 54px/);
 assert.ok(5*44+4*3+8<=375-100,'five keys at their 44 px minimum fit the ring at 375 px');
 assert.doesNotMatch(css,/#ui \.key-ring \.ring-key\{[^}]*transform:rotate/,'upright keys never lean into each other');
});
test('a key tag wraps only between words, never inside one',()=>{
 const css=readFileSync(new URL('../src/hud.css',import.meta.url),'utf8');
 assert.match(css,/#ui \.key-ring \.ring-tag\{[^}]*overflow-wrap:normal;word-break:normal/);
 assert.doesNotMatch(css,/#ui \.key-ring \.ring-tag\{[^}]*overflow-wrap:anywhere/);
 assert.match(css,/\.night #ui \.key-ring \.ring-tag\{[^}]*background:#2e273bf2/);
 assert.match(css,/\.night #ui \.porter-bell\{[^}]*background:#2e273be6/);
});
test('a ritual keeps its touch Sound and Pause pair; the house keeps them in the fuse box',()=>{
 const css=readFileSync(new URL('../src/hud.css',import.meta.url),'utf8');
 assert.match(css,/#ui:not\(\[data-tea-active=true\]\):not\(\[data-stitch-active=true\]\):not\(\[data-chime-active=true\]\) \.work-dock\{display:none\}/);
 for(const f of ['tea.css','stitch.css','chime.css'])
  assert.match(readFileSync(new URL('../src/'+f,import.meta.url),'utf8'),/\.dock>button(:is\()?\[data-action=sound\]/,f);
});
test('a ritual hides the key ring, the bell and the house list, as it hid the room buttons',()=>{
 const css=readFileSync(new URL('../src/hud.css',import.meta.url),'utf8');
 assert.match(css,/#ui:is\(\[data-tea-active=true\],\[data-stitch-active=true\],\[data-chime-active=true\]\) :is\(\.key-ring-holder,\.porter-bell,\.house-access\)\{\s*display:none\}/);
});
// stitch_check, round 10: the old phone bar's portrait rule still stretched the dock to three bar columns and grew
// each button, so the rituals' pair spread under the heading (390px Arabic: Sound at 188-232 under a 160-378 heading).
// The pair is placed only by the ritual rules: 96px wide, two 44px buttons, at the top inline end.
test('no leftover bar rule widens the rituals\' Sound and Pause pair on a phone',()=>{
 const css=readFileSync(new URL('../src/hud.css',import.meta.url),'utf8');
 assert.doesNotMatch(css,/\.dock\[data-expanded=false\]\{[^}]*width/);
 assert.doesNotMatch(css,/\.dock\[data-expanded=false\]>:is\([^)]*\[data-action=sound\][^)]*\)\{[^}]*flex:1/);
 for(const f of ['tea.css','stitch.css','chime.css'])
  assert.match(readFileSync(new URL('../src/'+f,import.meta.url),'utf8'),/\] \.dock\{[^}]*width:96px/,f);
});
