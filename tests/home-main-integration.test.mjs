import test from 'node:test';
import assert from 'node:assert/strict';
import {createHomeSession} from '../src/home-session.js';
import {SAVE_KEY} from '../src/content.js';
import {createState} from '../src/simulation.js';
import {houseFraming} from '../src/render/house-framing.js';
import {framing} from '../src/render/visual-policy.js';
const storageFor=(raw,backupFails=false)=>{const data=new Map(raw===null?[]:[[SAVE_KEY,raw]]),writes=[];return {data,writes,getItem:key=>data.get(key)??null,setItem(key,value){if(backupFails&&key===SAVE_KEY+'.backup')throw Error('backup blocked');writes.push({key,value});data.set(key,value)}}};
test('invalid/newer save backup waits until Play and precedes any canonical replacement',()=>{
 for(const raw of ['{broken','{"version":2,"future":"keep me"}']){const storage=storageFor(raw),session=createHomeSession({storage});assert.equal(storage.writes.length,0);assert.equal(session.save(session.state),false);session.enter();assert.equal(session.save(session.state),true);assert.equal(storage.writes[0].key,SAVE_KEY+'.backup');assert.equal(storage.data.get(SAVE_KEY+'.backup'),raw);assert.equal(session.recovered,true)}
});
test('failed backup blocks canonical overwrite and preserves every byte of unknown progress',()=>{
 const raw='{"version":22,"future":"keep me"}',storage=storageFor(raw,true),session=createHomeSession({storage});session.enter();assert.equal(session.save(session.state),false);assert.equal(storage.data.get(SAVE_KEY),raw);assert.equal(storage.writes.length,0);
});
test('new Larger text setting survives a Home preference overlay with the existing canonical base',()=>{
 const state=createState();state.settings.largeText=true;const storage=storageFor(JSON.stringify(state)),session=createHomeSession({storage});session.state.settings.locale='ar';session.savePreferences(session.state.settings);const pref=JSON.parse(storage.data.get(SAVE_KEY+'.preferences'));assert.equal(pref.largeText,true);assert.equal(createHomeSession({storage}).state.settings.largeText,true);
});
test('main whole-house framing composes with measured focused-room insets rather than discarding them',()=>{
 const insets={top:137,bottom:211};for(const [w,h]of [[320,640],[390,844],[844,390]])assert.deepEqual(houseFraming(w,h,'kitchen',insets),framing(w,h,'kitchen',insets));
});
test('a valid pre-Larger-text Home preference base remains compatible while newer canonical settings win',()=>{
 const state=createState();delete state.settings.largeText;const storage=storageFor(JSON.stringify(state));storage.setItem(SAVE_KEY+'.preferences',JSON.stringify({locale:'ar',muted:true,reducedMotion:false,quality:'auto',_base:JSON.stringify(state.settings)}));
 assert.equal(createHomeSession({storage}).state.settings.locale,'ar');state.settings.largeText=true;storage.data.set(SAVE_KEY,JSON.stringify(state));assert.equal(createHomeSession({storage}).state.settings.locale,'en');
});
test('return greeting is visible only after actual Continue and fires once',async()=>{
 const {bootHome}=await import('./helpers/main-home-harness.mjs');const s=createState();s.cares=1;s.basket=4;const game=bootHome({saved:JSON.stringify(s)});assert.deepEqual(game.notices,[]);game.button('play').click();assert.equal(game.notices.length,1);assert.match(game.notices[0],/Welcome home/);game.button('play').click();assert.equal(game.notices.length,1);
});
test('new performance sampling crosses the real Home entry before recording play frames',async()=>{
 const {readFileSync}=await import('node:fs');const source=readFileSync(new URL('../scripts/perf_check.py',import.meta.url),'utf8');assert.match(source,/from game_entry import enter_game/);assert.ok(source.indexOf('enter_game(pg)')>source.indexOf('pg.goto('));assert.ok(source.indexOf('enter_game(pg)')<source.indexOf("pg.evaluate('window.__frameCost.length=0')"));
});
test('a welcome-back line cannot overwrite a failed-save warning on Continue',async()=>{
 const {bootHome}=await import('./helpers/main-home-harness.mjs');const s=createState();s.cares=1;s.basket=3;const game=bootHome({saved:JSON.stringify(s),writeFails:true});game.button('play').click();assert.equal(game.notices.length,1);assert.match(game.notices[0],/Saving is unavailable/);assert.doesNotMatch(game.notices[0],/Welcome home/);
});
test('async audio failure on Continue retains the more important failed-save warning',async()=>{
 const {bootHome}=await import('./helpers/main-home-harness.mjs');const s=createState();s.cares=1;s.settings.muted=false;const game=bootHome({saved:JSON.stringify(s),writeFails:true,audioSucceeds:false});game.button('play').click();await Promise.resolve();await Promise.resolve();assert.match(game.notices.at(-1),/Saving is unavailable/);assert.match(game.notices.at(-1),/sound|audio/i);
});
