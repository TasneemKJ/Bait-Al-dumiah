import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {shellMarkup,button} from '../src/shell-markup.js';
import {createState} from '../src/simulation.js';
import {translate,number} from '../src/i18n.js';

// Hand-play (2026-11-13): the bottom bar had uneven gaps and four icon-only buttons with no visible meaning.
const BAR={'toggle-tools':'barTools',sound:'barSound',pause:'barPause',camera:'barHouse'};
test('every bottom-bar control carries a short visible label in both languages',()=>{
 for(const lang of ['en','ar']){
  const t=k=>translate(lang,k),html=shellMarkup(createState(),{t,n:v=>number(lang,v),button,clueExpanded:false,toolsExpanded:false});
  for(const [action,key] of Object.entries(BAR)){
   const label=t(key);assert.ok(label&&label!==key&&[...label].length<=7,`${lang} ${key}: ${label}`);
   assert.match(html,new RegExp(`data-action="${action}"[^>]*data-short="${label}"`,'s'),`${lang} ${action}`);
  }
  assert.ok([...t('barObjects')].length<=7&&t('barObjects')!=='barObjects');
 }
 assert.match(readFileSync(new URL('../src/object-controls.js',import.meta.url),'utf8'),/data-short="\$\{t\('barObjects'\)\}"/);
});
test('the phone bar is five equal columns and prints the short labels under the icons',()=>{
 const css=readFileSync(new URL('../src/hud.css',import.meta.url),'utf8');
 assert.match(css,/content:attr\(data-short\)/);assert.match(css,/--bar-col:calc\(\(100% - 24px\)\/5\)/);
});
test('the bar sits on one baseline, 48 px tall, and its tray and drawer text is at least 15 px on a phone',()=>{
 const css=readFileSync(new URL('../src/hud.css',import.meta.url),'utf8');
 const story=readFileSync(new URL('../src/story.css',import.meta.url),'utf8');
 for(const part of ['\\.dock\\[data-expanded=false\\]\\{bottom','\\.object-controls\\{inset-inline-start:12px;bottom',
  '\\.camera-tools\\{inset-inline-end:12px;bottom'])assert.match(story,new RegExp(part+':var\\(--edge-bottom\\)'));
 assert.match(css,/height:48px;min-height:48px/);
 assert.match(css,/#ui \.dock\[data-expanded=true\]>button\{[^}]*font-size:max\(15px,1rem\)/);
 assert.match(css,/#ui \.object-list button\{font-size:15px/);
});
