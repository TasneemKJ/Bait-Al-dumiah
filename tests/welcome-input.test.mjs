import test from 'node:test';
import assert from 'node:assert/strict';
import {bootHome} from './helpers/main-home-harness.mjs';
import {createState} from '../src/simulation.js';

function returningGame(){
 const saved=createState();saved.cares=1;
 const game=bootHome({saved:JSON.stringify(saved)});game.button('play').click();return game;
}

for(const input of ['pointerdown','keydown'])test('canvas '+input+' keeps the welcome camera from interrupting play',t=>{
 t.mock.timers.enable({apis:['setTimeout']});
 const game=returningGame();
 game.canvas.listeners[input]?.({target:game.canvas});
 t.mock.timers.tick(700);
 assert.deepEqual(game.focuses,[],'a real canvas action must supersede the delayed welcome glance');
});

test('a canvas action during the welcome glance keeps the player in their chosen room',t=>{
 t.mock.timers.enable({apis:['setTimeout']});
 const game=returningGame();t.mock.timers.tick(700);
 assert.deepEqual(game.focuses,['kitchen']);assert.equal(game.host.dataset.focusRoom,'kitchen');
 game.canvas.listeners.pointerdown?.({target:game.canvas});t.mock.timers.tick(2600);
 assert.equal(game.host.dataset.focusRoom,'kitchen','the delayed return must yield to a scene interaction');
});

test('an untouched returning house still receives its brief welcome glance',t=>{
 t.mock.timers.enable({apis:['setTimeout']});
 const game=returningGame();t.mock.timers.tick(700);
 assert.deepEqual(game.focuses,['kitchen']);t.mock.timers.tick(2600);
 assert.equal(game.host.dataset.focusRoom,'');
});
