import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('objective step counter never wraps below its title on narrow cards',()=>{
 const css=readFileSync(new URL('../src/story.css',import.meta.url),'utf8');
 assert.match(css,/\.objective-head \.wish-count\{[^}]*white-space:nowrap/);
});
test('objective card leaves room for the time control at 360px wide',()=>{
 const css=readFileSync(new URL('../src/story.css',import.meta.url),'utf8');
 assert.match(css,/max-width:360px\)\{[^\n]*\.objective\{width:calc\(100% - 150px\)\}/);
});
