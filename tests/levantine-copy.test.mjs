import test from 'node:test';
import assert from 'node:assert/strict';
import {strings, translate, number} from '../src/i18n.js';
import {createState, restore} from '../src/simulation.js';

test('Shami language is named explicitly and resident wishes use colloquial speech', () => {
  assert.equal(strings.ar.languageArabic, 'العربية · شامي');
  assert.match(strings.ar.linaWish, /بدها/);
  assert.match(strings.ar.noorWish, /بده/);
  assert.match(strings.ar.samiWish, /بده/);
  assert.equal(strings.ar.household, 'أهل البيت');
});
test('all six whispers use authored Shami stories and preserve mystery rather than dismissing it', () => {
  for (const key of ['music-box','small-footsteps','portrait','jasmine','tea-for-four','welcome-home']) {
    assert.ok(strings.ar[key+'Text'].length > 80, key);
  }
  assert.match(strings.ar['welcome-homeText'], /الدقّات/);
  assert.match(strings.en['welcome-homeText'], /knock/);
  assert.doesNotMatch(strings.en['welcome-homeText'], /never haunted/);
});
test('care copy preserves numeric effects and existing Arabic saves keep their locale', () => {
  const state=createState();state.settings.locale='ar';
  const saved=restore(JSON.stringify(state));
  assert.equal(saved.settings.locale,'ar');
  assert.equal(translate(saved.settings.locale,'household'),'أهل البيت');
  assert.match(strings.ar.teaEffect,/٣٨/);
  assert.match(strings.ar.sootheEffect,/٢٤/);
  assert.equal(number('ar',38),'٣٨');
});
