import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const css=readFileSync(new URL('../src/visual-upgrade.css',import.meta.url),'utf8');
test('vignette and grain layer sits under the HUD, never takes touches and is hideable',()=>{
 const rule=css.match(/#app::after\{[^}]*\}/)[0];
 assert.match(rule,/pointer-events:none/);assert.match(rule,/z-index:1/);assert.doesNotMatch(rule,/url\(["']?https?:/);
 assert.match(css,/prefers-contrast:more\)[^{]*prefers-reduced-transparency:reduce\)\{#app::after\{display:none\}/);
 assert.match(readFileSync(new URL('../src/styles.css',import.meta.url),'utf8'),/#ui\{[^}]*z-index:2/);
});
