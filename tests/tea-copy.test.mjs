import test from 'node:test';
import assert from 'node:assert/strict';
import {strings,translate,number} from '../src/i18n.js';
import {createState,beginActivity,teaStatus} from '../src/simulation.js';
import {activityMarkup} from '../src/activities-ui.js';
import {teaView} from '../src/tea-ui.js';

const keys=['activityBusy','teaPhysical','teaNotActive','teaServed','teaHeld','teaNotReady','teaNotOverfilled',
 'teaCanvasLabel','teaWorkRegion','teaWorkExit','teaPointerInstructions','teaPointerShort','teaKeyboardInstructions','teaKeyboardShort',
 'teaReadyInstructions','teaReadyKeyboard','teaReadyShort','teaServedInstructions','teaServedKeyboard','teaServedShort',
 'teaGuestServedInstructions','teaGuestServedKeyboard','teaGuestServedShort','teaProgress','teaCupState','teaCupReady','teaCupOverfilled',
 'teaAimBetween','teaEmptyInstructions','teaEmptyKeyboard','teaEmptyShort','teaScore','teaBest','teaRestoreGoal','teaRestoreReady','teaHomeRestored','teaCupList'];

test('tea instructions, feedback and input failures have complete English and Shami copy',()=>{
 for(const locale of ['en','ar'])for(const name of keys){
  assert.ok(strings[locale][name]?.trim(),`${locale}: ${name}`);
  assert.notEqual(translate(locale,name),name);
  if(locale==='ar')assert.match(strings[locale][name],/[\u0600-\u06ff]/,name);
 }
});

test('tea work copy reports the actual cup, target and readiness without exposing sequence answers',()=>{
 for(const locale of ['en','ar']){
  const s=createState();s.settings.locale=locale;beginActivity(s,'tea');
  const tea=teaStatus(s);tea.aimedCup=0;tea.cups[0].fill=.35;tea.cups[0].target=.7;
  const view=teaView(s,tea);
  assert.ok(view.status.includes(number(locale,35)),locale);
  assert.ok(view.status.includes(number(locale,70)),locale);
  assert.equal(view.cups.length,2);
  assert.ok(view.instructions.includes(translate(locale,'teaPointerInstructions')));
  tea.cups.forEach(c=>{c.fill=c.target;c.ready=true});tea.ready=true;
  assert.equal(teaView(s,tea).instructions,translate(locale,'teaReadyInstructions'));
  assert.equal(teaView(s,tea,{inputMode:'keyboard'}).instructions,translate(locale,'teaReadyKeyboard'));
 }
});

test('served guest copy preserves its next physical delivery and never advertises a ritual payout',()=>{
 for(const locale of ['en','ar']){
  const s=createState();s.settings.locale=locale;beginActivity(s,'tea');
  const tea=teaStatus(s);tea.phase='served';tea.mode='guest';tea.result={score:90,mode:'guest',reward:0,bonus:0,practice:true};
  const view=teaView(s,tea);
  assert.equal(view.instructions,translate(locale,'teaGuestServedInstructions'));
  assert.equal(view.status,translate(locale,'story-guest-tea-2-done'));
  assert.equal(view.detail,'');
  assert.equal(view.progress,'');
 }
});

test('an active tea table never renders the old answer grid or a completion modal',()=>{
 const s=createState();beginActivity(s,'tea');
 const t=k=>translate('en',k),n=v=>number('en',v),button=()=>'<button>unexpected</button>';
 assert.equal(activityMarkup(s,t,n,button,null),'');
 s.activities.active.phase='served';
 assert.equal(activityMarkup(s,t,n,button,{complete:true,id:'tea',score:90}),'');
});
