import test from 'node:test';
import assert from 'node:assert/strict';
import {inNativeApp,NATIVE_HANDLER} from '../src/native-app.js';
import {translate} from '../src/i18n.js';

test('the page knows the iPhone app only by its message handler',()=>{
 assert.equal(NATIVE_HANDLER,'baitaldumiah','must match handlerName in ios/BaitAlDumiah/BaitConfig.swift');
 assert.equal(inNativeApp({}),false,'the web has no webkit handler');
 assert.equal(inNativeApp({webkit:{messageHandlers:{}}}),false,'Safari alone is not the app');
 assert.equal(inNativeApp({webkit:{messageHandlers:{baitaldumiah:{postMessage(){}}}}}),true);
 assert.equal(inNativeApp({get webkit(){throw new Error('blocked')}}),false,'a throwing global is not the app');
});

test('the app says where the house is kept, in English and Arabic',()=>{
 for(const key of ['privacyNoteApp','saveFileHelpApp']){
  const en=translate('en',key),ar=translate('ar',key);
  assert.ok(en&&en!==key,key);assert.ok(/[؀-ۿ]/.test(ar),key);
  assert.doesNotMatch(en,/browser/i,'the app is not a browser');
 }
 assert.match(translate('en','privacyNoteApp'),/iPhone/);
});
