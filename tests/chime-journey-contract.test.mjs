import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const journey=readFileSync(new URL('../scripts/tea_check.py',import.meta.url),'utf8');
test('cross-ritual phone regression checks physical moon entry and cancellation, not the removed dialog',()=>{
  const helper=journey.slice(journey.indexOf('    def dismiss_sequence'),journey.indexOf('    def enter():'));
  assert.match(helper,/elif activity == 'lullaby':/);
  assert.match(helper,/window\.dollhouse\.visual\(\)\.chimes\?\.active/);
  assert.match(helper,/window\.dollhouse\.chimes\(\)\.phase/);
  assert.match(helper,/economy\(\) == before_exit/);
  assert.match(helper,/window\.dollhouse\.visual\(\)\.chimeActive/);
  assert.doesNotMatch(helper,/dialog\[open\] \.ritual-play/);
});
