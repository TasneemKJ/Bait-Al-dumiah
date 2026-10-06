import test from 'node:test';
import assert from 'node:assert/strict';
import {createHomeSession} from '../src/home-session.js';
import {createState} from '../src/simulation.js';
import {SAVE_KEY} from '../src/content.js';
import {bootHome} from './helpers/main-home-harness.mjs';
function memory(raw){const data=new Map(raw===null?[]:[[SAVE_KEY,raw]]),writes=[];let fail=false;return {data,writes,setFail(value){fail=value},getItem(key){if(fail&&key===SAVE_KEY)throw Error('read failed');return data.get(key)??null},setItem(key,value){writes.push({key,value});data.set(key,value)}}}
for(const scenario of ['newer-save','deleted-save','new-save-appeared','read-failed'])test('entry revalidates canonical identity: '+scenario,()=>{
 const old=createState();old.day=1;const initial=scenario==='new-save-appeared'?null:JSON.stringify(old),storage=memory(initial),session=createHomeSession({storage}),binding=session.state,before=structuredClone(binding);const latest=createState();latest.day=9;latest.buttons=317;
 if(scenario==='deleted-save')storage.data.delete(SAVE_KEY);else if(scenario==='read-failed')storage.setFail(true);else storage.data.set(SAVE_KEY,JSON.stringify(latest));
 const bytes=storage.data.get(SAVE_KEY);assert.equal(session.enter(),false,'stale or unverifiable Home must not enter play');assert.equal(session.entered,false);assert.equal(session.entryIssue,scenario==='read-failed'?'unavailable':'changed');assert.equal(session.save(binding),false);assert.equal(storage.data.get(SAVE_KEY),bytes);assert.equal(storage.writes.length,0);assert.equal(session.state,binding);assert.deepEqual(binding,before);
});
test('successful owned saves advance expected identity without rejecting unchanged revisits',()=>{
 const storage=memory(null),session=createHomeSession({storage});assert.equal(session.enter(),true);session.state.day=2;assert.equal(session.save(session.state),true);assert.equal(session.entryIssue,null);
});
test('a known external replacement remains protected even if a stale session tries to save after entry',()=>{
 const storage=memory(JSON.stringify(createState())),session=createHomeSession({storage});assert.equal(session.enter(),true);const latest=createState();latest.day=9;const raw=JSON.stringify(latest);storage.data.set(SAVE_KEY,raw);assert.equal(session.save(session.state),false);assert.equal(storage.data.get(SAVE_KEY),raw);assert.equal(storage.writes.length,0);
});
test('actual Continue exposes explicit Reload recovery without activating stale state or renderer input',()=>{
 const old=createState();old.day=1;const game=bootHome({saved:JSON.stringify(old)}),latest=createState();latest.day=9;const raw=JSON.stringify(latest);game.storage.set(SAVE_KEY,raw);game.button('play').click();
 assert.equal(game.app.dataset.screen,'home');assert.equal(game.host.hidden,true);assert.equal(game.canvas.inert,true);assert.equal(game.state().day,1);assert.equal(game.storage.get(SAVE_KEY),raw);assert.equal(game.writes.length,0);const reload=game.button('reload');assert.ok(reload,'recovery replaces Play rather than adding more controls');assert.match(game.home.all().find(n=>n.className==='home-notice').textContent,/changed|Reload/i);
});
test('entry-time read failure keeps Home frozen and requires a real Reload action',()=>{
 const game=bootHome({saved:JSON.stringify(createState())});game.setReadFailure(true);game.button('play').click();assert.equal(game.app.dataset.screen,'home');assert.equal(game.writes.length,0);assert.equal(game.reloads(),0);const before=game.state();game.frame(120000);assert.deepEqual(game.state(),before);game.button('reload').click();assert.equal(game.reloads(),1);assert.equal(game.app.dataset.screen,'home');
});
test('blocked-entry recovery text follows a subsequent Home language change',()=>{
 const game=bootHome({saved:JSON.stringify(createState())});game.storage.delete(SAVE_KEY);game.button('play').click();game.button('preferences').click();game.button('language').click();game.button('back').click();assert.match(game.home.all().find(n=>n.className==='home-notice').textContent,/[؀-ۿ]/);assert.ok(game.button('reload'));
});
