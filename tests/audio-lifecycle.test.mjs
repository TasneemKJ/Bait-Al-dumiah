import test from 'node:test';
import assert from 'node:assert/strict';
import {DollhouseAudio,DUSK_SWELL} from '../src/audio.js';

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

// A tiny audio graph that records gain automation so the swell's shape is real data.
function graph(){
 const events=[],param=()=>({value:0,setValueAtTime(v,t){events.push(['set',v,t])},linearRampToValueAtTime(v,t){events.push(['ramp',v,t])},exponentialRampToValueAtTime(v,t){events.push(['exp',v,t])}});
 const node=extra=>({connect(){},disconnect(){},...extra});
 const context={currentTime:10,createOscillator:()=>node({frequency:{value:0},start(){},stop(){},type:''}),
  createBiquadFilter:()=>node({frequency:{value:0},Q:{value:0}}),createGain:()=>node({gain:param()})};
 return {context,events};
}
test('dusk swell plays once when day turns to night while listening, with a slow rise',()=>{
 const {context,events}=graph(),audio=new DollhouseAudio();audio.context=context;audio.master={};audio.enabled=true;audio.next=Infinity;
 audio.tick(false);assert.equal(audio.nodes.size,0);
 audio.tick(true);assert.equal(audio.nodes.size,DUSK_SWELL.length*1);
 const rises=events.filter(e=>e[0]==='ramp'&&e[2]-context.currentTime>1);assert.ok(rises.length>=DUSK_SWELL.length,'slow attack, not a pluck');
 const before=audio.nodes.size;audio.tick(true);assert.equal(audio.nodes.size,before,'no repeat while night continues');
});
test('no swell when the game opens at night, when muted, or when paused',()=>{
 const a=graph(),opened=new DollhouseAudio();opened.context=a.context;opened.master={};opened.enabled=true;opened.next=Infinity;opened.tick(true);assert.equal(opened.nodes.size,0);
 const b=graph(),muted=new DollhouseAudio();muted.context=b.context;muted.master={};muted.enabled=false;muted.sawDay=true;muted.tick(true);assert.equal(muted.nodes.size,0);
 const c=graph(),paused=new DollhouseAudio();paused.context=c.context;paused.master={};paused.enabled=true;paused.paused=true;paused.tick(false);paused.tick(true);assert.equal(paused.nodes.size,0);
});

test('a day heard before Pause cannot produce a stale dusk swell on night resume',()=>{
 const {context}=graph();context.suspend=context.resume=()=>Promise.resolve();const audio=new DollhouseAudio();audio.context=context;audio.master={};audio.enabled=true;audio.next=Infinity;audio.tick(false);audio.setPaused(true);audio.setPaused(false);audio.next=Infinity;audio.tick(true);assert.equal(audio.nodes.size,0,'resuming into night is not a heard day-to-night transition');audio.tick(false);audio.tick(true);assert.equal(audio.nodes.size,DUSK_SWELL.length,'a later real listened transition still plays once');
});
test('muting retires the observed daytime so re-enabling at night cannot replay dusk',()=>{
 const {context}=graph();context.suspend=()=>Promise.resolve();const audio=new DollhouseAudio();audio.context=context;audio.master={};audio.enabled=true;audio.next=Infinity;audio.tick(false);audio.mute();audio.enabled=true;audio.tick(true);assert.equal(audio.nodes.size,0);audio.tick(false);audio.tick(true);assert.equal(audio.nodes.size,DUSK_SWELL.length);
});
