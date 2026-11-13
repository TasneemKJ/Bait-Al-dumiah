import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {createAppStore,APP_NAMES} from '../src/app-store.js';
import {translate} from '../src/i18n.js';
import {createState} from '../src/simulation.js';
import {visitRoom,IDLE} from '../src/idle-life.js';
import {bootHome} from './helpers/main-home-harness.mjs';

function store(owned={}){
 const w={};w.webkit={messageHandlers:{[APP_NAMES.handler]:{postMessage(){}}}};
 vm.runInNewContext(readFileSync(new URL('../public/tas-bridge.js',import.meta.url),'utf8'),{window:w});
 const s=createAppStore(w);w.baitApp.update({owned});return s;
}
function live(game,seconds,from=0){let t=from;for(let i=0;i<seconds*10;i++){t+=100;game.frame(t)}return t}
const visits=game=>game.visitLog.filter(v=>v&&typeof v==='object');
const sang=(game,lang='en')=>game.notices.some(m=>m.startsWith(translate(lang,'canaryFor-lina')));

test('a quiet house breathes: one heart visits another room, a curtain stirs, and nothing in the save moves',()=>{
 const game=bootHome({store:store()});game.button('play').click();
 const before=game.state();let t=live(game,IDLE.after-2);assert.deepEqual(visits(game),[],'not before the quiet');
 t=live(game,4,t);
 assert.deepEqual(visits(game),[{id:'lina',room:'parlor'}]);assert.ok(game.visitLog.includes('stir'));
 const after=game.state();
 assert.deepEqual(after.dolls.map(d=>d.room),before.dolls.map(d=>d.room));
 assert.equal(after.buttons,before.buttons);assert.deepEqual(after.dolls.map(d=>d.bond),before.dolls.map(d=>d.bond));
 assert.equal(sang(game),false,'no canary, no line and no teaser');assert.deepEqual(game.opens,[]);
 live(game,IDLE.stay+1,t);assert.equal(game.visitLog.at(-1),null,'she goes home again');
});

test('for a canary subscriber, by day, the canary sings the memory the heart cannot say',()=>{
 const game=bootHome({store:store({canaryMonthly:true})});game.button('play').click();live(game,IDLE.after+12);
 assert.ok(sang(game));assert.ok(game.notices.some(m=>m.includes(translate('en','canaryMemory-lina-0'))));
});

test('a sheet or a ritual ends the visit at once; reduced motion keeps everyone still',()=>{
 const game=bootHome({store:store()});game.button('play').click();const t=live(game,IDLE.after+2);
 assert.equal(visits(game).length,1);game.ui().open('journal');live(game,.2,t);
 assert.equal(game.visitLog.at(-1),null);
 const still=createState();still.settings.reducedMotion=true;still.introSeen=true;
 const calm=bootHome({store:store(),saved:JSON.stringify(still)});calm.button('play').click();live(calm,IDLE.after*3);
 assert.deepEqual(visits(calm),[]);assert.ok(!calm.visitLog.includes('stir'));
});

test('each heart drifts to her favourite room, or the liwan, never the room she is in',()=>{
 const s=createState();
 assert.equal(visitRoom(s,'lina'),'parlor');assert.equal(visitRoom(s,'noor'),'parlor');
 assert.equal(visitRoom(s,'sami'),'kitchen');s.dolls[0].room='parlor';assert.equal(visitRoom(s,'lina'),'kitchen');
 for(const id of ['lina','noor','sami'])for(let n=0;n<IDLE.lines;n++)for(const lang of ['en','ar'])
  assert.notEqual(translate(lang,`canaryMemory-${id}-${n}`),`canaryMemory-${id}-${n}`);
});
