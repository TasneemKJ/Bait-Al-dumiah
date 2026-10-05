import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('objective step counter never wraps below its title on narrow cards',()=>{
 const css=readFileSync(new URL('../src/story.css',import.meta.url),'utf8');
 assert.match(css,/\.objective-head \.wish-count\{[^}]*white-space:nowrap/);
});
test('folded clue shares the top edge with a compact time control on portrait phones',()=>{
 const css=readFileSync(new URL('../src/story.css',import.meta.url),'utf8');
 assert.match(css,/orientation:portrait[\s\S]*?\.objective,\.night \.objective\{[^}]*width:calc\(100% - 110px\)/);
 assert.match(css,/\.objective \.clue-toggle\{[^}]*min-width:44px;min-height:52px/);
});

test('short-landscape tool width wins after the shared presentation-edge rules',()=>{
 const css=readFileSync(new URL('../src/story.css',import.meta.url),'utf8');
 const final=css.slice(css.lastIndexOf('@media(max-height:360px) and (orientation:landscape) and (max-width:567px)'));
 assert.match(final,/\.dock\[data-expanded=false\]>\.tools-toggle\{width:44px;min-width:44px/);
});
