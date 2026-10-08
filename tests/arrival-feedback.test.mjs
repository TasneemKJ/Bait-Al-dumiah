import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createState,step} from '../src/simulation.js';
import {DOLLS} from '../src/content.js';
import {installFeedback} from '../src/app-feedback.js';
import {translate} from '../src/i18n.js';
import {returnGreeting,waveSchedule,waveRoom} from '../src/return-greeting.js';

test('the first calm moment and first night reach the player in both languages',()=>{
 for(const locale of ['en','ar']){
  const state=createState();state.settings.locale=locale;state.cares=1;
  const shown=[],app={state,session:{},audio:{},host:{},ui:{t:key=>translate(locale,key),n:String,toast:message=>shown.push(message)}};
  installFeedback(app);
  for(let i=0;i<121;i++){step(state,1);for(const event of state.events.splice(0))app.announce(event)}
  const hintMessages=[translate(locale,'calmDayOne'),translate(locale,'firstNightHint')];
  const delivered=()=>[...shown,...app.notices].filter(message=>hintMessages.includes(message));
  assert.deepEqual(delivered(),hintMessages);
  for(let i=0;i<300;i++){step(state,1);for(const event of state.events.splice(0))if(['calm','first-night'].includes(event.type))app.announce(event)}
  assert.equal(delivered().length,2,'one-time hints must remain one-time at the display boundary');
 }
});

// Execute the real entry commands with a deterministic browser timer boundary.
function returningHome(){
 const state=createState();state.cares=1;state.settings.muted=true;
 const timers=new Map(),actions=[];let nextTimer=1;
 const canvas=new EventTarget(),host=new EventTarget();host.dataset={};
 Object.assign(canvas,{removeAttribute(){},setAttribute(){},focus(){}});
 const noop=()=>{},app={state,canvas,host,session:{canContinue:true,enter:()=>true},homeUI:{hide:noop},
  world:{syncViewport:noop,setEnabled:noop,welcomeBack:noop},ui:{panel:null,t:key=>key,n:String},
  audio:{},playfieldLayout:{measure:noop},syncPause:noop,refreshUI:noop,save:()=>true,say:noop,
  dispatch(action,room){actions.push([action,room]);if(action==='focus-room')host.dataset.focusRoom=room;else delete host.dataset.focusRoom}};
 const source=readFileSync(new URL('../src/cmd-home.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'').replace(/^export /gm,'');
 const commands=new Function('DOLLS','returnGreeting','waveSchedule','waveRoom','document','performance','setTimeout','clearTimeout',
  source+'\nreturn homeCommands;')(DOLLS,returnGreeting,waveSchedule,waveRoom,{querySelector:()=>({dataset:{}})},
  {now:()=>0},callback=>{const id=nextTimer++;timers.set(id,callback);return id},id=>timers.delete(id));
 commands['home-play'](app);
 return {app,actions,pending:()=>timers.size,runNext(){const first=timers.entries().next().value;if(first){timers.delete(first[0]);first[1]()}}};
}

test('touch, keyboard, zoom and semantic activation cancel the returning camera before it moves',()=>{
 for(const surface of ['canvas','host'])for(const type of ['pointerdown','keydown','wheel','click']){
  const h=returningHome();h.app[surface].dispatchEvent(new Event(type));h.runNext();h.runNext();
  assert.deepEqual(h.actions,[],type+' must leave the camera with the player');
  assert.equal(h.pending(),0);
 }
});

test('input after the welcome glance prevents its delayed whole-house reset',()=>{
 for(const surface of ['canvas','host'])for(const type of ['pointerdown','click']){
  const h=returningHome();h.runNext();assert.deepEqual(h.actions,[['focus-room','kitchen']]);
  h.app[surface].dispatchEvent(new Event(type));h.runNext();
  assert.deepEqual(h.actions,[['focus-room','kitchen']],surface+' input must retain the chosen view');
  assert.equal(h.pending(),0);
 }
});

test('an untouched returning house still glances at the residents and returns home',()=>{
 const h=returningHome();h.runNext();h.runNext();
 assert.deepEqual(h.actions,[['focus-room','kitchen'],['camera',undefined]]);assert.equal(h.pending(),0);
});
