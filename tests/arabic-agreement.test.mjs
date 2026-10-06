import test from 'node:test';
import assert from 'node:assert/strict';
import {strings,number} from '../src/i18n.js';
const ar=strings.ar,en=strings.en,text=o=>Object.entries(o).filter(([,v])=>typeof v==='string');
const holes=s=>(s.match(/\{[a-zA-Z]+\}/g)||[]).sort().join();

test('Arabic copy has no Western digits and every placeholder matches English',()=>{
 for(const [k,v] of text(ar)){
  assert.doesNotMatch(v,/[0-9]/,`${k} must use Arabic-Indic digits or a {placeholder}`);
  assert.doesNotMatch(v,/%/,`${k} must use the Arabic percent sign ٪`);
  if(typeof en[k]==='string')assert.equal(holes(v),holes(en[k]),`${k} placeholders differ`);
 }
});
test('runtime numbers in Arabic come out as Arabic-Indic digits',()=>{
 assert.equal(number('ar',12),'١٢');assert.equal(number('ar',0),'٠');assert.equal(number('en',12),'12');
});
test('counts are written as "label: n / total", never as a number before a plural noun',()=>{
 for(const k of ['stitchProgress','teaProgress','chimeProgress'])assert.match(ar[k],/^[^{]+: \{[a-z]+\} \/ \{total\}$/,k);
 assert.doesNotMatch(ar.chimeReward,/أزرار/);assert.match(ar.chimeReward,/زرّ/);
 assert.match(ar.activityCooldown,/\{x\} من ثواني/);
});
test('room locatives carry their own preposition: no kashida joined to the definite article',()=>{
 for(const r of ['kitchen','parlor','studio','bedroom']){assert.ok(ar[r+'In']&&en[r+'In'],r);assert.match(ar[r+'In'],/^ب/)}
 assert.doesNotMatch(ar.storyFindRoom,/ـ/);assert.match(ar.storyFindRoom,/^شوف \{room\}$/);
});
test('every English key has an Arabic form',()=>{
 for(const k of Object.keys(en))assert.ok(k in ar,`missing Arabic for ${k}`);
});
