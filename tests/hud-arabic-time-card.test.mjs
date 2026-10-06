import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('the Arabic time-card button stays on one line in the narrow card',()=>{
 const css=readFileSync(new URL('../src/hud.css',import.meta.url),'utf8');
 assert.match(css,/html\[lang=ar\] \.time-tools>button\{[^}]*white-space:nowrap/);
});
