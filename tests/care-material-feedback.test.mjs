import test from 'node:test';import assert from 'node:assert/strict';import {DollhouseAudio} from '../src/audio.js';
// Break caught: every care action playing the reward melody instead of its handled material.
function graph(){const frequencies=[],sources=[],param=()=>({value:0,setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}}),node=extra=>({connect(){},disconnect(){},...extra});
 const context={currentTime:1,sampleRate:1200,createOscillator:()=>node({frequency:{set value(v){frequencies.push(v)}},start(){},stop(){}}),createGain:()=>node({gain:param()}),createBiquadFilter:()=>node({frequency:{value:0},Q:{value:0}}),createBuffer:(c,n)=>({getChannelData:()=>new Float32Array(n)}),createBufferSource:()=>{const n=node({start(){},stop(){}});sources.push(n);return n},suspend:()=>Promise.resolve(),close:()=>Promise.resolve()};
 const audio=new DollhouseAudio();audio.context=context;audio.master={};audio.enabled=true;return {audio,frequencies,sources};}
test('care has distinct cup, toy and textile contacts while mute and pause suppress them',()=>{
 const tea=graph(),play=graph(),rest=graph(),soothe=graph();for(const [kind,g] of [['tea',tea],['play',play],['rest',rest],['soothe',soothe]])g.audio.effect('care:'+kind);
 assert.equal(tea.frequencies[0],640);assert.equal(play.frequencies[0],126);assert.equal(rest.sources.length,1);assert.equal(rest.frequencies.length,0);
 assert.equal(soothe.sources.length,1);assert.equal(soothe.frequencies[0],126);
 const quiet=graph();quiet.audio.paused=true;quiet.audio.effect('care:tea');assert.equal(quiet.frequencies.length,0);quiet.audio.paused=false;quiet.audio.mute();quiet.audio.effect('care:play');assert.equal(quiet.frequencies.length,0);
 tea.audio.dispose();assert.equal(tea.audio.nodes.size,0);
});
