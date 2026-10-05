import test from 'node:test';
import assert from 'node:assert/strict';
import {bootHome} from './helpers/main-home-harness.mjs';
import {createState} from '../src/simulation.js';
import {SAVE_KEY} from '../src/content.js';
function enter(game){const button=game.button('play');assert.ok(button,'cold launch needs a real entry button');button.click()}
test('actual main wiring leaves Home canonical state and save untouched for 120 seconds',()=>{
 const game=bootHome(),before=game.state();for(let now=100;now<=120000;now+=100)game.frame(now);
 assert.deepEqual(game.state(),before);assert.equal(game.writes.length,0);assert.ok(game.renders.every(frame=>frame.dt===0));assert.equal(game.audioEvents.includes('enable'),false);assert.equal(game.audioEvents.includes('tick'),false);
});
test('Home rejects actual scene picks and gameplay keyboard shortcuts',()=>{
 const game=bootHome(),before=game.state();game.pick({doll:'lina'});game.key(' ','Space');game.key('h','KeyH');assert.deepEqual(game.state(),before);assert.equal(game.ui().panel,null);assert.equal(game.focuses.length,0);
});
test('visibility and pagehide cannot overwrite an existing save before Continue',()=>{
 const saved=createState();saved.buttons=237;saved.story.chapter=1;saved.settings.muted=false;const raw=JSON.stringify(saved),game=bootHome({saved:raw});game.hidden(true);game.pagehide();game.hidden(false);game.frame(10000);
 assert.equal(game.storage.get(SAVE_KEY),raw);assert.equal(game.writes.length,0);assert.equal(game.audioEvents.includes('enable'),false);assert.equal(game.state().settings.muted,false);
});
test('one actual Play event activates existing play, focuses kitchen and cannot reinitialize twice',()=>{
 const game=bootHome();enter(game);assert.equal(game.app.dataset.screen,'play');assert.equal(game.host.hidden,false);assert.equal(game.host.inert,false);assert.equal(game.home.hidden,true);assert.equal(game.canvas.inert,false);assert.equal(game.canvas.getAttribute('tabindex'),'0');assert.equal(game.document.activeElement,game.canvas);assert.deepEqual(game.focuses,['kitchen']);
 game.frame(100);const before=game.state();enter(game);assert.deepEqual(game.state(),before);assert.deepEqual(game.focuses,['kitchen']);assert.ok(before.elapsed>0);assert.ok(game.writes.some(write=>write.key===SAVE_KEY));
});
test('Home preference events never write the canonical save and Continue unlocks saved sound with its gesture',async()=>{
 const saved=createState();saved.buttons=188;const raw=JSON.stringify(saved),game=bootHome({saved:raw});const options=game.button('preferences');assert.ok(options);options.click();game.button('language').click();assert.equal(game.state().settings.locale,'ar');assert.equal(game.storage.get(SAVE_KEY),raw);game.button('sound').click();await Promise.resolve();assert.equal(game.state().settings.muted,false);assert.equal(game.audioEvents.filter(event=>event==='enable').length,1);assert.equal(game.storage.get(SAVE_KEY),raw);
 game.button('back').click();enter(game);await Promise.resolve();assert.equal(game.state().buttons,188);assert.equal(game.state().paused,false);assert.equal(game.state().settings.locale,'ar');
});
test('saved unmuted preference waits for Continue rather than enabling at boot',async()=>{
 const saved=createState();saved.settings.muted=false;const game=bootHome({saved:JSON.stringify(saved)});assert.equal(game.audioEvents.includes('enable'),false);enter(game);await Promise.resolve();assert.equal(game.audioEvents.filter(event=>event==='enable').length,1);game.hidden(true);assert.equal(game.state().paused,true);game.hidden(false);assert.equal(game.state().paused,false);
});
test('a failed initial save read never replaces unknown progress after Play or pagehide',()=>{
 const game=bootHome({readFails:true});enter(game);game.frame(9000);game.pagehide();assert.equal(game.writes.filter(write=>write.key===SAVE_KEY).length,0);
});

test('failed sound activation reports the problem on visible Home Preferences',async()=>{
 const game=bootHome({audioSucceeds:false});game.button('preferences').click();game.button('sound').click();await Promise.resolve();await Promise.resolve();
 const notice=game.home.all().find(node=>node.className==='home-notice');assert.equal(notice.hidden,false);assert.match(notice.textContent,/sound|audio/i);assert.equal(game.state().settings.muted,true);assert.equal(game.writes.some(write=>write.key===SAVE_KEY),false);
});
