import test from 'node:test';
import assert from 'node:assert/strict';
import {bootHome} from './helpers/main-home-harness.mjs';
import {createState} from '../src/simulation.js';
import {SAVE_KEY} from '../src/content.js';

test('return waves wait for real Continue and schedule once without advancing the house on Home',()=>{
 const saved=createState();saved.cares=4;saved.elapsed=78;const game=bootHome({saved:JSON.stringify(saved)}),before=game.state();game.frame(9000);assert.deepEqual(game.welcomeEvents,[]);assert.deepEqual(game.state(),before);game.button('play').click();assert.deepEqual(game.welcomeEvents,[[78.9,79.4,79.9]]);game.button('play').click();assert.equal(game.welcomeEvents.length,1);
});
test('first visits, reduced motion and rejected stale Home entries never schedule return waves',()=>{
 for(const kind of ['first','reduced','stale']){const saved=createState();saved.cares=4;if(kind==='reduced')saved.settings.reducedMotion=true;const game=bootHome(kind==='first'?{}:{saved:JSON.stringify(saved)});if(kind==='stale'){const latest=createState();latest.day=9;game.storage.set(SAVE_KEY,JSON.stringify(latest))}game.button('play').click();assert.deepEqual(game.welcomeEvents,[],kind)}
});
test('failed-save entry keeps its visible error instead of a return effect or greeting',()=>{
 const saved=createState();saved.cares=4;const game=bootHome({saved:JSON.stringify(saved),writeFails:true});game.button('play').click();assert.deepEqual(game.welcomeEvents,[]);assert.equal(game.notices.length,1);assert.match(game.notices[0],/Saving is unavailable/);
});
