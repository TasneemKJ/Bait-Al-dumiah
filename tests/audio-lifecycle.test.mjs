import test from 'node:test';
import assert from 'node:assert/strict';
import {DollhouseAudio} from '../src/audio.js';

// The only stub is the browser's asynchronous resume boundary. Actual waveform
// synthesis is separately exercised through OfflineAudioContext in art checks.
function pendingAudio(t){
 const old=globalThis.window;globalThis.window={AudioContext:function(){}};
 t.after(()=>{if(old===undefined)delete globalThis.window;else globalThis.window=old});
 let release;const context={currentTime:1,resumes:0,suspends:0,closes:0,
  resume(){this.resumes++;return new Promise(resolve=>{release=resolve})},
  suspend(){this.suspends++;return Promise.resolve()},close(){this.closes++;return Promise.resolve()}};
 const audio=new DollhouseAudio();audio.context=context;audio.master={};
 return {audio,context,release:()=>release()};
}
test('mute during a pending resume cannot resurrect sound',async t=>{
 const {audio,release}=pendingAudio(t);const result=audio.enable();audio.mute();release();
 assert.equal(await result,false);assert.equal(audio.enabled,false);assert.equal(audio.nodes.size,0);
});
test('disposing while audio resumes cannot re-enable a closed player',async t=>{
 const {audio,context,release}=pendingAudio(t);const result=audio.enable();audio.dispose();release();
 assert.equal(await result,false);assert.equal(audio.enabled,false);assert.equal(context.closes,1);
});
test('enabling sound from paused settings leaves the audio context suspended',async t=>{
 const {audio,context,release}=pendingAudio(t);audio.paused=true;const result=audio.enable();release();
 assert.equal(await result,true);assert.equal(audio.enabled,true);assert.equal(context.suspends,1);
 audio.tick(true);assert.equal(audio.nodes.size,0);
});
