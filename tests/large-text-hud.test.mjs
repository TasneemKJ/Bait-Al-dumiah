import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const css=read('src/accessibility.css'),markup=read('src/ui.js')+read('src/story-ui.js');

test('large text reaches the HUD cards and story paper through classes that exist',()=>{
 const rule=css.match(/\.large-text :is\(([^)]*)\)\{zoom:1\.15\}/);assert.ok(rule,'zoom rule present');
 for(const sel of rule[1].split(',')){
  const names=[...sel.matchAll(/[.#]([a-z][\w-]*)/g)].map(m=>m[1]);
  for(const n of names)assert.ok(markup.includes(n),`${sel} uses ${n}, which must exist in the markup`);
 }
});
test('only inner text is zoomed: positioned card anchors keep their offsets',()=>{
 const rule=css.match(/\.large-text :is\(([^)]*)\)\{zoom:1\.15\}/)[1];
 for(const anchor of ['.objective,','.object-ribbon','.house-status,','.time-tools','.dock','.brand'])assert.ok(!rule.split(',').includes(anchor.replace(',','')),anchor+' must not be zoomed');
 assert.match(css,/\.large-text \.scene-response\{font-size:14px\}/);
});
