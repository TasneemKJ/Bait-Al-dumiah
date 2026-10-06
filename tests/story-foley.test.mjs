import test from 'node:test';
import assert from 'node:assert/strict';
import {DollhouseAudio} from '../src/audio.js';
function fixture(){
 const sources=[],nodes=[];const param=()=>({value:0,setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}});
 const node=()=>{const n={connect(){},disconnect(){this.disconnected=true}};nodes.push(n);return n};
 const source=()=>{const s={...node(),frequency:param(),start(){this.started=true},stop(){this.stopped=true}};sources.push(s);return s};
 const context={currentTime:2,sampleRate:22050,createOscillator:source,createGain:()=>({...node(),gain:param()}),createBiquadFilter:()=>({...node(),frequency:param(),Q:param()}),createBufferSource:source,createBuffer:(n,length)=>({getChannelData:()=>new Float32Array(length)}),suspend:()=>Promise.resolve()};
 const audio=new DollhouseAudio();audio.context=context;audio.master=node();return {audio,sources,nodes};
}
test('tin and cloth use short material foley instead of generic reward notes',()=>{
 const tin=fixture();tin.audio.enabled=true;tin.audio.effect('mint-tin');
 assert.equal(tin.audio.nodes.size,1,'tin touch should create one short material voice');
 assert.ok(tin.sources.some(s=>s.frequency.value>=800),'tin has no higher metal resonance');
 const cloth=fixture();cloth.audio.enabled=true;cloth.audio.effect('moon-bed');
 assert.equal(cloth.audio.nodes.size,1);assert.ok(cloth.sources.some(s=>s.buffer),'cloth should use filtered rustle, not a melody');
 cloth.audio.mute();assert.equal(cloth.audio.nodes.size,0);assert.ok(cloth.sources.every(s=>s.stopped));
});
test('material foley respects mute, pause and disposal and releases completed sources',()=>{
 for(const mode of ['muted','paused','disposed']){
  const {audio,sources}=fixture();audio.enabled=mode!=='muted';audio.paused=mode==='paused';audio.disposed=mode==='disposed';
  audio.effect('mint-tin');audio.effect('moon-bed');assert.equal(sources.length,0,mode);
 }
 for(const kind of ['mint-tin','moon-bed']){
  const {audio,sources}=fixture();audio.enabled=true;audio.effect(kind);for(const s of sources)s.onended?.();assert.equal(audio.nodes.size,0,kind);
 }
});
