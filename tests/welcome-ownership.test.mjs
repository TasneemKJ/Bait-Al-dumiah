import test from 'node:test';
import assert from 'node:assert/strict';
import {bootHome} from './helpers/main-home-harness.mjs';
import {createState} from '../src/simulation.js';

function returning(){const s=createState();s.cares=1;
 const game=bootHome({saved:JSON.stringify(s)});game.button('play').click();return game}
// Canvas pointer and keyboard ownership before the glance is covered by welcome-input.test.mjs.
test('hiding or pausing after the welcome glance does not reset the camera',t=>{
 t.mock.timers.enable({apis:['setTimeout']});
 for(const [name,interrupt] of [['hidden',game=>game.hidden(true)],['pause',game=>game.dispatch()('pause')]]){
  const game=returning();t.mock.timers.tick(700);assert.deepEqual(game.focuses,['kitchen']);
  interrupt(game);t.mock.timers.tick(2600);
  assert.equal(game.host.dataset.focusRoom,'kitchen',name+' must keep the delayed return from moving the camera');
 }
});
