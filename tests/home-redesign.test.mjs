import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createState} from '../src/simulation.js';
import {translate} from '../src/i18n.js';

// Home redesign for 1.4 (2026-11-24): a room around the house, words beside it on wide screens, the
// returning player's own day, and an iPad build.
const source=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('wide Home stands the house on the reading-start side, away from the words, and smaller than play',async()=>{
 const {homeFraming,houseFraming}=await import('../src/render/house-framing.js');
 for(const [w,h] of [[1366,1024],[844,390],[1024,768]]){
  const en=homeFraming(w,h,{rtl:false}),ar=homeFraming(w,h,{rtl:true});
  assert.ok(en.target[0]>0,'English: camera right of the house, so the house sits left');
  assert.equal(ar.target[0],-en.target[0],'Arabic mirrors English');
  const visibleWidth=en.height*w/h;assert.ok(13/visibleWidth<=.57,'the house leaves the words their side');
  assert.ok(en.height>=houseFraming(w,h).height);
 }
 assert.deepEqual(homeFraming(390,844,{rtl:true}),houseFraming(390,844),'phone portrait keeps the centred house');
 // iPad portrait: the roof (y 9.7) sits below the top 30% the words use (2026-11-24: the promise ran over the roof).
 for(const [w,h] of [[768,1024],[820,1180],[1024,1366]]){const p=homeFraming(w,h);
  assert.ok(.5+(9.7-p.target[1])/p.height<=.70,`${w}x${h} roof under the words`);
  assert.ok(.5+(-1-p.target[1])/p.height>=.2,`${w}x${h} plinth above the buttons`)}
});

test('a returning player reads their own day and hour on Home; a new player reads the promise',async()=>{
 const {homeLine}=await import('../src/home-ui.js');
 const s=createState();s.day=12;
 for(const locale of ['en','ar']){s.settings.locale=locale;const t=key=>translate(locale,key);
  s.clock=0;assert.equal(homeLine(s,false,t),t('homePromise'));
  assert.match(homeLine(s,true,t),new RegExp(t('morning')));
  s.clock=150;assert.match(homeLine(s,true,t),new RegExp(t('evening')));
  assert.match(homeLine(s,true,t),locale==='ar'?/١٢/:/12/);
 }
});

test('the backdrop draws the Home room only while Home is showing',()=>{
 const atmosphere=source('src/render/atmosphere.js'),frame=source('src/render/world-frame.js');
 assert.match(atmosphere,/homeRoom\(c,night\)/);
 assert.match(frame,/st\.homeMix=st\.homeStage\?1:/,'Home mix eases out on Play');
 assert.match(source('src/cmd-home.js'),/setHomeStage\?\.\(null\)/,'Play leaves the Home stage');
});

test('the iPhone app is also an iPad app, portrait and full screen like the other Tas games',()=>{
 const pbx=source('ios/BaitAlDumiah.xcodeproj/project.pbxproj');
 assert.equal((pbx.match(/TARGETED_DEVICE_FAMILY = "1,2";/g)||[]).length,4);
 assert.doesNotMatch(pbx,/TARGETED_DEVICE_FAMILY = 1;/);
 assert.equal((pbx.match(/INFOPLIST_KEY_UISupportedInterfaceOrientations_iPad = "UIInterfaceOrientationPortrait /g)||[]).length,2);
 assert.equal((pbx.match(/INFOPLIST_KEY_UIRequiresFullScreen = YES;/g)||[]).length,2);
});

test('Home gives the iPad its own type and every landscape screen the side-by-side layout',()=>{
 const css=source('src/home.css');
 assert.match(css,/@media\(min-width:700px\) and \(min-height:700px\)\{[^@]*\.home-play\{[^}]*min-height:70px/);
 assert.match(css,/@media\(orientation:landscape\)\{/);
 assert.match(css,/\.home-title:before\{[^}]*radial-gradient/,'a feathered scrim sits only behind the words');
});

test('an iPad in portrait opens on the kitchen with the room in the middle, not over a third of empty floor',async()=>{
 const {framing}=await import('../src/render/visual-policy.js');
 const tea=[-.53,.85],ipad=framing(1024,1366,'kitchen',{subject:tea}),phone=framing(390,844,'kitchen',{subject:tea});
 assert.ok(ipad.target[1]>=2.4,'the iPad view centres the room, not the table top');
 assert.equal(phone.target[1],.85,'phones still centre the tea set');
 assert.equal(ipad.target[0],phone.target[0]);
});
