import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('objective step counter never wraps below its title on narrow cards',()=>{
 const css=readFileSync(new URL('../src/story.css',import.meta.url),'utf8');
 assert.match(css,/\.objective-head \.wish-count\{[^}]*white-space:nowrap/);
});
