import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

// Studio bar (2026-11-13): no sheet text under 15 px on a phone (the audit found 234 smaller runs at 375 px).
// The browser audit is the proof (ios/store/GATE.md); this keeps the rule from being dropped.
test('sheets on a phone floor every text run at 15 px, and Large text at 17 px',()=>{
 const css=readFileSync(new URL('../src/hud.css',import.meta.url),'utf8');
 const rule=css.match(/@media\(max-width:680px\)\{\s*#ui dialog :is\(([^)]*)\)[^{]*\{font-size:max\(15px,1em\)/);
 assert.ok(rule,'the 15 px floor');
 for(const tag of ['p','span','small','strong','em','label','button','select','li','bdi'])assert.ok(rule[1].split(',').includes(tag),tag);
 assert.match(css,/\.large-text #ui dialog :is\([^)]*\)[^{]*\{font-size:max\(17px,1em\)/);
});
