import test from 'node:test';
import assert from 'node:assert/strict';
import {inNativeApp,NATIVE_HANDLER} from '../src/native-app.js';
import {translate} from '../src/i18n.js';
import {useAppWording} from '../src/locale-data.js';

test('the page knows the iPhone app only by its message handler',()=>{
 assert.equal(NATIVE_HANDLER,'baitaldumiah','must match handlerName in ios/BaitAlDumiah/BaitConfig.swift');
 assert.equal(inNativeApp({}),false,'the web has no webkit handler');
 assert.equal(inNativeApp({webkit:{messageHandlers:{}}}),false,'Safari alone is not the app');
 assert.equal(inNativeApp({webkit:{messageHandlers:{baitaldumiah:{postMessage(){}}}}}),true);
 assert.equal(inNativeApp({get webkit(){throw new Error('blocked')}}),false,'a throwing global is not the app');
});

const APP_KEYS=['privacyNote','saveFileHelp','saveImportNotSaved','saveRecovered','audioUnavailable','webglHelp'];

test('in the app no line the player can reach talks about a browser, in English or Arabic',()=>{
 try{
  useAppWording(true);
  for(const key of APP_KEYS){
   const en=translate('en',key),ar=translate('ar',key);
   assert.doesNotMatch(en,/browser/i,key);assert.doesNotMatch(ar,/متصف/,key);
   assert.ok(/[؀-ۿ]/.test(ar),`${key} has Arabic`);
  }
  assert.match(translate('en','privacyNote'),/iPhone/);
  assert.equal(translate('en','saveFile'),'Save file','keys without an app wording are unchanged');
  assert.equal(translate('en','no-such-key'),'no-such-key');
 }finally{useAppWording(false)}
});

test('on the web the wording is the web wording',()=>{
 useAppWording(false);
 assert.match(translate('en','privacyNote'),/browser/);
 assert.match(translate('ar','saveRecovered'),/المتصفح/);
});
