import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createState,restore} from '../src/simulation.js';
import {strings} from '../src/i18n.js';

test('large text defaults off and only a real true survives a save',()=>{
 assert.equal(createState().settings.largeText,false);
 for(const bad of ['yes',1,null,{}])assert.equal(restore(JSON.stringify({...createState(),settings:{largeText:bad}})).settings.largeText,false);
 assert.equal(restore(JSON.stringify({...createState(),settings:{largeText:true}})).settings.largeText,true);
});
test('an old save without the field still opens with large text off',()=>{
 const old=createState();delete old.settings.largeText;assert.equal(restore(JSON.stringify(old)).settings.largeText,false);
});
test('large text copy exists in English and Arabic',()=>{
 for(const k of ['largeText','largeTextHelp']){assert.ok(strings.en[k]);assert.match(strings.ar[k],/[؀-ۿ]/)}
});
test('the loading card carries a bilingual Levantine saying',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 assert.match(html,/الجار قبل الدار/);assert.match(html,/The neighbour before the house/);
});
