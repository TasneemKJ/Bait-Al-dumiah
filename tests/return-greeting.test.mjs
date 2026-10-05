import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,care,claim,unclaimed} from '../src/simulation.js';
import {returnGreeting,waveSchedule} from '../src/return-greeting.js';
import {translate} from '../src/i18n.js';
test('a first visit gets no greeting; the opening clue teaches instead',()=>{assert.equal(returnGreeting(createState()),null);assert.equal(returnGreeting(null),null)});
test('returning players hear the most useful waiting thing first',()=>{
 const s=createState();s.cares=4;s.basket=3;assert.deepEqual(returnGreeting(s),{key:'returnBasket',count:3});
 s.basket=0;s.achieved=['first-care'];assert.deepEqual(returnGreeting(s),{key:'returnMilestone',count:1});
 claim(s,'first-care');s.wishes=['lina'];assert.deepEqual(returnGreeting(s),{key:'returnWishes',count:2});
 s.wishes=['lina','noor','sami'];assert.deepEqual(returnGreeting(s),{key:'returnCalm',count:0});
});
test('greeting copy is bilingual and carries the count placeholder',()=>{
 for(const key of ['returnBasket','returnMilestone','returnWishes']){assert.match(translate('en',key),/\{count\}/);assert.match(translate('ar',key),/\{count\}/);assert.match(translate('ar',key),/[؀-ۿ]/)}
 assert.match(translate('ar','returnCalm'),/[؀-ۿ]/);
});
test('residents wave one after another, after a short pause, never in the past',()=>{
 const times=waveSchedule(3,100);assert.equal(times.length,3);assert.ok(times[0]>100);
 assert.ok(times[1]>times[0]&&times[2]>times[1]);assert.deepEqual(waveSchedule(0,5),[]);
});
