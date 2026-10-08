import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html=readFileSync(new URL('../src/shell-markup.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/hud.css',import.meta.url),'utf8');
const storyCss=readFileSync(new URL('../src/story.css',import.meta.url),'utf8');

test('normal play retires duplicated Home branding, not the accessible game title',()=>{
 assert.match(html,/<header class="brand">/);
 assert.match(css,/#ui \.brand\{[^}]*clip-path:inset\(50%\)/);
 assert.match(css,/#ui \.brand\{[^}]*pointer-events:none/);
 assert.doesNotMatch(css,/#ui \.brand\{[^}]*display:none/);
});
test('the first playable phone row contains the folded story clue and the house status, not app chrome',()=>{
 assert.match(css,/@media\(max-width:680px\) and \(orientation:portrait\)\{[\s\S]*?#ui \.objective\{top:max\(14px,env\(safe-area-inset-top\)\)/);
 assert.match(css,/#ui \.house-status\{top:max\(16px,env\(safe-area-inset-top\)\)/);
 assert.match(html,/class="clue-toggle"\s+data-action="toggle-clue"/);
 assert.match(storyCss,/\.objective \.clue-toggle\{[^}]*width:44px;min-width:44px;min-height:52px/);
});
test('the complete house keeps its existing controls and options',()=>{
 for(const name of ['household','activities','decorate','journal','settings'])assert.ok(html.includes("'"+name+"'")||html.includes(name),'keeps '+name);
 assert.match(html,/button\('toggle-tools'/);
 assert.match(html,/button\('pause'/);
 assert.match(html,/data-action="light"/);
});
