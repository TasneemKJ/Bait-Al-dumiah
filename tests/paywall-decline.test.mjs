import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {createAppStore,APP_NAMES} from '../src/app-store.js';
import {doorMarkup} from '../src/panels-ui.js';
import {button} from '../src/shell-markup.js';
import {translate,number} from '../src/i18n.js';
import {createState} from '../src/simulation.js';
import {bootHome} from './helpers/main-home-harness.mjs';

// A free player who says no to The Fifth Room and to the canary keeps a whole, usable house:
// closing the card returns to play, nothing reopens it on its own, and the door stays visible.
function page(){
 const posts=[],w={posts};
 w.webkit={messageHandlers:{[APP_NAMES.handler]:{postMessage:m=>posts.push(m)}}};
 vm.runInNewContext(readFileSync(new URL('../public/tas-bridge.js',import.meta.url),'utf8'),{window:w});
 return w;
}
// Walks the clock in 0.1 s frames (the loop's own cap) through whole days and nights.
function live(game,seconds,from){let t=from;for(let i=0;i<seconds*10;i++){t+=100;game.frame(t)}return t}
function playable(game,label){
 const s=game.state();
 assert.equal(s.paused,false,`${label}: the house is not left paused`);
 assert.equal(game.ui().panel,null,`${label}: no sheet stays open`);
}
const OUTCOMES={
 cancelled:w=>w.baitApp.update({status:''}),
 failed:w=>w.baitApp.update({status:'failed'}),
 'never answers':()=>{},
 'no products':w=>w.baitApp.update({prices:{},status:'unavailable'}),
};

for(const [outcome,answer] of Object.entries(OUTCOMES))test(`declining both sheets (${outcome}) leaves a usable house`,()=>{
 const w=page(),store=createAppStore(w);const saved=createState();saved.buttons=400;
 const game=bootHome({store,saved:JSON.stringify(saved)});game.button('play').click();let t=live(game,1,0);
 // The Fifth Room: the door asks, the card opens once, the player buys and backs out.
 game.dispatch()('mend-door');assert.deepEqual(game.opens,['store']);
 game.dispatch()('store-buy','fifthRoom');answer(w);game.ui().close();playable(game,'after the Fifth Room');
 // The canary: from Settings, the same.
 game.ui().open('store');game.dispatch()('store-buy','canaryMonthly');answer(w);game.ui().close();
 playable(game,'after the canary');
 // Care still works, and two whole days and nights pass without any sheet opening by itself.
 const before=game.state().dolls.find(d=>d.id==='lina').hunger;
 game.dispatch()('care',{id:'lina',action:'tea'});
 assert.ok(game.state().dolls.find(d=>d.id==='lina').hunger>before,'tea is still served');
 const day=game.state().day;t=live(game,500,t);
 assert.ok(game.state().day>=day+2,'the days go on');
 assert.deepEqual(game.opens,['store','store'],'only the player opened the card');
 playable(game,'two days later');
 assert.equal(game.state().door,0,'nothing was mended without the purchase');
 // The locked door is still there and still invites, in both languages.
 for(const lang of ['en','ar']){
  const t2=key=>translate(lang,key);
  const door=doorMarkup(game.state(),{t:t2,n:v=>number(lang,v),button,access:store.access()});
  assert.match(door,/data-action="panel-store"/);assert.ok(door.includes(t2('doorLockedSee')),lang);
 }
});

test('an ended canary plan simply leaves; no card opens and play goes on',()=>{
 const w=page(),store=createAppStore(w);
 const game=bootHome({store});game.button('play').click();let t=live(game,1,0);
 w.baitApp.update({owned:{canaryMonthly:true}});t=live(game,5,t);
 w.baitApp.update({owned:{canaryMonthly:false}});t=live(game,250,t);
 assert.deepEqual(game.opens,[]);playable(game,'after the plan ended');
});
