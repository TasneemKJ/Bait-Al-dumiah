import test from 'node:test';
import assert from 'node:assert/strict';
import {bootHome} from './helpers/main-home-harness.mjs';
import {createState} from '../src/simulation.js';

function returning(){const s=createState();s.cares=1;
 const game=bootHome({saved:JSON.stringify(s)});game.button('play').click();return game}
test('actual canvas pointer and keyboard ownership cancel the welcome camera',()=>{
 for(const type of ['pointerdown','keydown']){
  const game=returning();game.input(game.canvas,type);game.timer();
  assert.deepEqual(game.focuses,[],type+' must keep the player camera');
 }
});
test('hiding or pausing after the welcome glance does not reset the camera',()=>{
 for(const interrupt of [game=>game.hidden(true),game=>game.dispatch()('pause')]){
  const game=returning();game.timer();assert.deepEqual(game.focuses,['kitchen']);
  interrupt(game);game.timer();assert.equal(game.cameraResets.length,0);
 }
});
