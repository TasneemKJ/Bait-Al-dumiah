import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const css=readFileSync(new URL('../src/grove.css',import.meta.url),'utf8');
test('sheet titles and section headings carry a local hand-inked swash, mirrored in Arabic, hidden in forced colours',()=>{
 assert.match(css,/#sheet h2#sheet-title::after,#sheet \.section-heading::after\{content:"";/);
 assert.match(css,/url\("data:image\/svg\+xml,/,'drawn inline: no remote asset');assert.doesNotMatch(css,/url\("?https?:/);
 assert.match(css,/\[dir=rtl\] #sheet h2#sheet-title::after[^{]*\{transform:scaleX\(-1\)/);
 assert.match(css,/@media\(forced-colors:active\)\{#sheet h2#sheet-title::after,#sheet \.section-heading::after\{display:none\}\}/);
 assert.match(css,/pointer-events:none/);
 assert.match(readFileSync(new URL('../index.html',import.meta.url),'utf8'),/href="\.\/src\/grove\.css"/);
});
