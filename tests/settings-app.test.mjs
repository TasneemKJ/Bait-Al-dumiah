import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {appInfoMarkup,APP_VERSION,hapticsOn,setHaptics,HAPTICS_KEY} from '../src/app-info.js';
import {pressFeedback} from '../src/app-touch.js';
import {button} from '../src/shell-markup.js';
import {translate} from '../src/i18n.js';

// Studio bar (2026-11-13): Settings carries haptics, support, privacy, the version and the studio's signature.
const ctx=lang=>({t:key=>translate(lang,key),button});
test('the version shown is the one in the Xcode project',()=>{
 const pbx=readFileSync(new URL('../ios/BaitAlDumiah.xcodeproj/project.pbxproj',import.meta.url),'utf8');
 assert.ok(pbx.includes(`MARKETING_VERSION = ${APP_VERSION};`));
});
test('settings in the app: haptics, support, privacy, version and credits, in both languages',()=>{
 for(const lang of ['en','ar']){
  const html=appInfoMarkup(ctx(lang),{inApp:true,haptics:true});
  assert.match(html,/data-field="haptics"[^>]*checked/);assert.match(html,/data-id="support"/);assert.match(html,/data-id="privacy"/);
  assert.ok(html.includes(APP_VERSION));assert.match(html,/Tas Games/);assert.match(html,/three\.js/);
  if(lang==='ar')assert.match(html,/[؀-ۿ]/);
 }
 assert.doesNotMatch(appInfoMarkup(ctx('en'),{inApp:false,haptics:true}),/data-field="haptics"/,'the web has no haptics row');
});
test('haptics can be turned off, and then a press does not buzz',()=>{
 const store=new Map(),storage={getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v)};
 assert.equal(hapticsOn(storage),true);setHaptics(false,storage);assert.equal(store.get(HAPTICS_KEY),'off');
 assert.ok(HAPTICS_KEY.startsWith('bait-al-dumiah'),'kept in the vault with the save');
 const buzz=[];pressFeedback({audio:{}},{target:{closest:()=>({})}},{vibrate:ms=>buzz.push(ms)},storage);
 assert.deepEqual(buzz,[]);setHaptics(true,storage);
 pressFeedback({audio:{}},{target:{closest:()=>({})}},{vibrate:ms=>buzz.push(ms)},storage);assert.deepEqual(buzz,[8]);
});
