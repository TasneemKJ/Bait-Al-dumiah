import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,interactStory} from '../src/simulation.js';
import {SAVE_KEY} from '../src/content.js';
let make;
try{({createHomeSession:make}=await import('../src/home-session.js'))}catch(error){if(error.code!=='ERR_MODULE_NOT_FOUND')throw error}
const create=options=>{assert.equal(typeof make,'function','a real Home session boundary is required before simulation or persistence');return make(options)};
function memory(entries={}){const data=new Map(Object.entries(entries)),writes=[];return {data,writes,getItem:key=>data.get(key)??null,setItem(key,value){writes.push({key,value});data.set(key,value)}}}
const prefKey=SAVE_KEY+'.preferences';

test('a fresh Home never advances canonical state or creates a game save',()=>{
 const storage=memory(),home=create({storage,reducedMotion:true}),state=home.state,before=structuredClone(state);
 for(let i=0;i<1200;i++)home.advance(state,.1);
 assert.deepEqual(state,before);assert.equal(home.entered,false);assert.equal(home.canContinue,false);assert.equal(home.save(state),false);assert.deepEqual(storage.writes,[]);assert.equal(state.settings.reducedMotion,true);
});
test('one activation enters real play once and then normal progression can save',()=>{
 const storage=memory(),home=create({storage}),state=home.state;
 assert.equal(home.enter(),true);assert.equal(home.enter(),false);home.advance(state,.1);
 assert.equal(state.elapsed,.1);assert.equal(home.save(state),true);assert.equal(JSON.parse(storage.data.get(SAVE_KEY)).elapsed,.1);
});
test('Continue preserves canonical save bytes throughout Home and retains earned state on entry',()=>{
 const saved=createState();saved.buttons=214;saved.day=8;saved.story.chapter=1;saved.story.step=2;saved.milestones=['firstCare'];saved.settings={locale:'ar',muted:false,reducedMotion:true,quality:'low'};
 const raw=JSON.stringify(saved),storage=memory({[SAVE_KEY]:raw}),home=create({storage,reducedMotion:false}),before=structuredClone(home.state);
 home.advance(home.state,120);home.save(home.state);
 assert.equal(home.canContinue,true);assert.deepEqual(home.state,before);assert.equal(storage.data.get(SAVE_KEY),raw);assert.equal(storage.writes.length,0);
 assert.deepEqual(home.state.settings,saved.settings);home.enter();assert.equal(home.state.buttons,214);assert.equal(home.state.story.chapter,1);assert.equal(home.state.story.step,2);
});
test('Home preferences persist separately and only whitelist legitimate settings',()=>{
 const saved=createState();saved.buttons=177;const raw=JSON.stringify(saved),storage=memory({[SAVE_KEY]:raw}),home=create({storage});
 home.state.settings.locale='ar';home.state.settings.muted=false;
 assert.equal(home.savePreferences({...home.state.settings,buttons:9999,script:'bad'}),true);
 assert.equal(storage.data.get(SAVE_KEY),raw);assert.deepEqual(JSON.parse(storage.data.get(prefKey)),{locale:'ar',muted:false,reducedMotion:false,quality:'auto',_base:JSON.stringify(saved.settings)});
 const reloaded=create({storage});assert.equal(reloaded.state.buttons,177);assert.equal(reloaded.state.settings.locale,'ar');assert.equal(reloaded.state.settings.muted,false);
});
test('invalid preference fields cannot override authoritative saved values',()=>{
 const saved=createState();saved.settings={locale:'ar',muted:false,reducedMotion:true,quality:'low'};
 const storage=memory({[SAVE_KEY]:JSON.stringify(saved),[prefKey]:JSON.stringify({locale:'xx',muted:'false',reducedMotion:null,quality:'ultra'})});
 assert.deepEqual(create({storage}).state.settings,saved.settings);
});
test('invalid, missing and future-version saves never show Continue or get replaced on Home',()=>{
 for(const raw of [null,'{broken','null','[]','{"version":2}','{"version":1,"elapsed":5}']){
  const storage=memory(raw===null?{}:{[SAVE_KEY]:raw}),home=create({storage});
  assert.equal(home.canContinue,raw==='{"version":1,"elapsed":5}');home.save(home.state);assert.equal(storage.writes.length,0);
  if(raw!==null&&raw!=='{"version":1,"elapsed":5}')assert.equal(home.loadStatus,'invalid');
 }
});
test('failed canonical storage read blocks fallback writes even after entry',()=>{
 let writes=0;const storage={getItem(){throw Error('blocked')},setItem(){writes++}},home=create({storage});
 assert.equal(home.loadStatus,'unavailable');home.enter();assert.equal(home.save(home.state),false);assert.equal(writes,0);
});
test('write failures are reported without changing or resetting game state',()=>{
 const storage={getItem(){return null},setItem(){throw Error('quota')}},home=create({storage});home.enter();home.state.buttons=201;const before=structuredClone(home.state);
 assert.equal(home.save(home.state),false);assert.equal(home.savePreferences(home.state.settings),false);assert.deepEqual(home.state,before);
});
test('entry cannot replay object commands or duplicate an earned chapter reward',()=>{
 const saved=createState();saved.story.chapter=1;saved.story.step=0;saved.buttons=98;
 const home=create({storage:memory({[SAVE_KEY]:JSON.stringify(saved)})}),before=structuredClone(home.state);
 home.enter();home.enter();assert.deepEqual(home.state,before);assert.equal(interactStory(home.state,'prop:mint-tin').ok,false);assert.equal(home.state.buttons,98);
});
test('an older Home preference record cannot override newer canonical saved settings',()=>{
 const saved=createState(),storage=memory({[SAVE_KEY]:JSON.stringify(saved)}),home=create({storage});
 home.savePreferences({...home.state.settings,locale:'ar'});
 // A subsequent canonical save can succeed even if the preference write fails.
 const newer=createState();newer.settings.quality='low';storage.data.set(SAVE_KEY,JSON.stringify(newer));
 assert.deepEqual(create({storage}).state.settings,newer.settings);
});
