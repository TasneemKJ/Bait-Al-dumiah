import test from 'node:test';
import assert from 'node:assert/strict';
import {bootHome} from './helpers/main-home-harness.mjs';

function press(game,extra={}){
 let prevented=false;
 game.window.handlers.keydown({key:' ',code:'Space',target:game.canvas,defaultPrevented:false,
  repeat:false,preventDefault(){prevented=true},...extra});
 return prevented;
}

test('holding Space keeps the house paused until another deliberate press',()=>{
 const game=bootHome();game.button('play').click();
 assert.equal(game.state().paused,false);assert.equal(press(game),true);
 assert.equal(game.state().paused,true);
 for(let i=0;i<3;i++){
  assert.equal(press(game,{repeat:true}),true);
  assert.equal(game.state().paused,true,'key repeat must not resume the house');
 }
 press(game);assert.equal(game.state().paused,false);
});

test('modified system shortcuts do not pause the game or prevent browser handling',()=>{
 for(const modifier of ['altKey','ctrlKey','metaKey']){
  const game=bootHome();game.button('play').click();const before=game.state();
  assert.equal(press(game,{[modifier]:true}),false,modifier+' belongs to the browser');
  assert.deepEqual(game.state(),before);
 }
});
