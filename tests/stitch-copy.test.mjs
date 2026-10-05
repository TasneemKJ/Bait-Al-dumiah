import test from 'node:test';
import assert from 'node:assert/strict';
import {strings,translate,number} from '../src/i18n.js';
import {createState,beginActivity,stitchStatus} from '../src/simulation.js';
import {activityMarkup} from '../src/activities-ui.js';
import {stitchView} from '../src/stitch-ui.js';

const keys=["stitchPhysical","stitchNotActive","stitchFinished","stitchHeld","stitchNotReady","stitchNoRepair","stitchCanvasLabel","stitchWorkRegion","stitchWorkExit","stitchMendTitle","stitchPointerInstructions","stitchPointerShort","stitchKeyboardInstructions","stitchKeyboardShort","stitchRepairInstructions","stitchRepairKeyboard","stitchRepairShort","stitchReadyInstructions","stitchReadyKeyboard","stitchReadyShort","stitchFinishedInstructions","stitchFinishedKeyboard","stitchFinishedShort","stitchMendFinishedInstructions","stitchMendFinishedKeyboard","stitchMendFinishedShort","stitchProgress","stitchSectionProgress","stitchLoose","stitchReadyStatus","stitchNeedleReadout","stitchNeedlePosition","stitchGuidePosition","stitchAxisInstructions","stitchScore","stitchBest","stitchRestoreGoal","stitchRestoreReady","stitchHomeRestored"];
const length=points=>points.reduce((sum,p,i)=>i?sum+Math.hypot(p[0]-points[i-1][0],p[1]-points[i-1][1]):sum,0);

test('sewing instructions, terminal actions and failures have English and Shami copy',()=>{
 for(const locale of ['en','ar'])for(const key of keys){
  assert.ok(strings[locale][key]?.trim(),locale+': '+key);
  assert.notEqual(translate(locale,key),key);
  if(locale==='ar')assert.match(strings[locale][key],/[\u0600-\u06ff]/,key);
 }
});

test('sewing view reads accepted section progress and actual needle/guide coordinates',()=>{
 for(const locale of ['en','ar']){
  const s=createState();s.settings.locale=locale;beginActivity(s,'stitch');
  const stitch=stitchStatus(s);stitch.distance=length(stitch.sections[0])/2;
  stitch.needle={x:.25,y:-.1};stitch.nextGuidePoint={x:0,y:-.6};
  const view=stitchView(s,stitch);
  assert.ok(view.status.includes(number(locale,50)),locale);
  assert.ok(view.readout.includes(number(locale,25)),locale);
  assert.ok(view.readout.includes(number(locale,-10)),locale);
  assert.ok(view.readout.includes(number(locale,-60)),locale);
  assert.equal(view.instructions,translate(locale,'stitchPointerInstructions'));
  assert.equal(stitchView(s,stitch,{inputMode:'keyboard'}).instructions,translate(locale,'stitchKeyboardInstructions'));
 }
});

test('repair and fully covered held seams give the next physical action without claiming a finish',()=>{
 for(const locale of ['en','ar']){
  const s=createState();s.settings.locale=locale;beginActivity(s,'stitch');
  const stitch=stitchStatus(s);stitch.loose=true;
  assert.equal(stitchView(s,stitch).instructions,translate(locale,'stitchRepairInstructions'));
  assert.equal(stitchView(s,stitch,{inputMode:'keyboard'}).instructions,translate(locale,'stitchRepairKeyboard'));
  stitch.loose=false;stitch.section=stitch.sections.length;stitch.completedSections=stitch.sections.length;
  stitch.pressed=true;stitch.ready=false;
  assert.equal(stitchView(s,stitch).instructions,translate(locale,'stitchReadyInstructions'));
  assert.equal(stitchView(s,stitch,{inputMode:'keyboard'}).instructions,translate(locale,'stitchReadyKeyboard'));
  assert.equal(stitch.phase,'sew');
 }
});

test('finished mend copy preserves the carried bear route and never advertises ritual earnings or a record',()=>{
 for(const locale of ['en','ar']){
  const s=createState();s.settings.locale=locale;beginActivity(s,'stitch');
  const stitch=stitchStatus(s);stitch.phase='finished';stitch.mode='mend';
  stitch.result={score:92,mode:'mend',reward:0,bonus:0,practice:true};stitch.best=92;
  const view=stitchView(s,stitch);
  assert.equal(view.instructions,translate(locale,'stitchMendFinishedInstructions'));
  assert.equal(stitchView(s,stitch,{inputMode:'keyboard'}).instructions,translate(locale,'stitchMendFinishedKeyboard'));
  assert.equal(view.status,translate(locale,'story-mended-friend-1-done'));
  assert.equal(view.progress,'');assert.equal(view.detail,'');
 }
});

test('standard finish displays the actual score and best; failures use translated inline feedback',()=>{
 for(const locale of ['en','ar']){
  const s=createState();s.settings.locale=locale;beginActivity(s,'stitch');
  const stitch=stitchStatus(s);stitch.phase='finished';stitch.best=94;
  stitch.result={score:87,reward:0,bonus:0,practice:true};
  const view=stitchView(s,stitch);
  assert.ok(view.progress.includes(number(locale,87)));assert.ok(view.progress.includes(number(locale,94)));
  assert.equal(view.status,translate(locale,'practiceLabel'));
  assert.equal(stitchView(s,stitch,{reason:'stitchHeld'}).status,translate(locale,'stitchHeld'));
 }
});

test('all three physical rituals keep their controls out of the answer grid',()=>{
 const t=k=>translate('en',k),n=v=>number('en',v),button=(action,text)=>'<button data-action="'+action+'">'+text+'</button>';
 for(const id of ['stitch','tea']){
  const s=createState();beginActivity(s,id);
  assert.equal(activityMarkup(s,t,n,button,null),'');
  s.activities.active.phase=id==='stitch'?'finished':'served';
  assert.equal(activityMarkup(s,t,n,button,{complete:true,id,score:90}),'');
 }
 const s=createState();beginActivity(s,'lullaby');
 const markup=activityMarkup(s,t,n,button,null);
 assert.equal(markup,'');
 for(const locale of ['en','ar'])for(const key of ['activityRule-stitch','activity-stitchIntro','object-sewing-machineStory']){
  assert.doesNotMatch(translate(locale,key),/memory|Study|ذاكرة/);
 }
});
