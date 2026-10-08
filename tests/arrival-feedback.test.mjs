import test from 'node:test';
import assert from 'node:assert/strict';
import {installFeedback} from '../src/app-feedback.js';
import {createState,step,care} from '../src/simulation.js';
import {translate} from '../src/i18n.js';

function feedback(locale='en'){
 const state=createState();state.settings.locale=locale;const messages=[];
 const app={state,session:{entered:true,save:()=>true},audio:{effect(){}},
  host:{querySelector:()=>null},ui:{t:key=>translate(locale,key),n:String,toast:m=>messages.push(m)}};
 installFeedback(app);
 const advance=seconds=>{for(let i=0;i<seconds;i++){step(state,1);
  for(const event of state.events.splice(0))app.announce(event)}};
 return {app,state,messages,advance};
}
test('first night reaches the existing visible bilingual visitor hint once',()=>{
 for(const locale of ['en','ar']){
  const game=feedback(locale);game.advance(120);
  assert.ok(game.messages.includes(translate(locale,'firstNightHint')));
  game.advance(10);
  assert.equal(game.messages.filter(m=>m===translate(locale,'firstNightHint')).length,1);
 }
});
test('first-day quiet after actual care reaches its existing bilingual line once',()=>{
 for(const locale of ['en','ar']){
  const game=feedback(locale);assert.equal(care(game.state,'lina','tea').ok,true);
  game.advance(90);
  while(game.app.notices.length)game.app.showNotice(performance.now()+100000);
  assert.ok(game.messages.includes(translate(locale,'calmDayOne')));
  game.advance(20);
  while(game.app.notices.length)game.app.showNotice(performance.now()+100000);
  assert.equal(game.messages.filter(m=>m===translate(locale,'calmDayOne')).length,1);
 }
});
