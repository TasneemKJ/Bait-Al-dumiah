import test from 'node:test';
import assert from 'node:assert/strict';
import {DollhouseAudio,roomCutoff} from '../src/audio.js';
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
test('material foley respects mute, pause and disposal and releases completed sources',async()=>{
 for(const mode of ['muted','paused','disposed']){
  const {audio,sources}=fixture();audio.enabled=mode!=='muted';audio.paused=mode==='paused';audio.disposed=mode==='disposed';
  audio.effect('mint-tin');audio.effect('moon-bed');assert.equal(sources.length,0,mode);
 }
 for(const kind of ['mint-tin','moon-bed','porcelain','paper','stitch']){
  const {audio,sources}=fixture();audio.enabled=true;audio.effect(kind);for(const s of sources)s.onended?.();assert.equal(audio.nodes.size,0,kind);
 }
 assert.ok(roomCutoff('kitchen')>roomCutoff('parlor')&&roomCutoff('parlor')>roomCutoff('bedroom'));
 const {audio}=fixture();audio.setRoom('bedroom');assert.equal(audio.room,'bedroom');audio.setRoom('invalid');assert.equal(audio.room,null);
 const {cameraCommands}=await import('../src/cmd-camera.js');
 const {activitiesCommands}=await import('../src/cmd-activities.js');
 const {createState,beginActivity}=await import('../src/simulation.js');
 const effects=[];const state=createState();
 const app={state,audio:{paper(){effects.push('paper')},effect(k){effects.push(k)},setRoom(r){effects.push('room:'+r)}},
  cancelWorkInput(){},syncPause(){},updateWorkUI(){},world:{setEnabled(){},clearObjectSelection(){},focusRoom:()=>true},
  ui:{clearObject(){},tick(){}},host:{dataset:{}},roomViews:{update(){}}};
 cameraCommands['panel-state'](app,'journal');cameraCommands['focus-room'](app,'parlor');
 beginActivity(state,'tea');state.activities.active.cups[0].fill=.9;activitiesCommands['tea-empty'](app,0);
 state.activities.active=null;beginActivity(state,'stitch');
 state.activities.active.distance=.3;activitiesCommands['stitch-unpick'](app);
 assert.deepEqual(effects,['paper','room:parlor','porcelain','stitch']);
});

test('paper rustle never repeats the same sheet twice in a row and stays soft', async () => {
 const {paperRustleShape} = await import('../src/audio.js');
 const shapes = Array.from({length: 12}, (_, i) => paperRustleShape(i));
 for (let i = 1; i < shapes.length; i++) assert.notDeepEqual(shapes[i], shapes[i - 1]);
 assert.equal(new Set(shapes.map(s => s.seed)).size, shapes.length);
 for (const s of shapes) {
  assert.ok(s.cutoff >= 1450 && s.cutoff <= 1850);
  assert.ok(s.peak <= .026 && s.duration <= .211);
 }
 assert.deepEqual(paperRustleShape(3), paperRustleShape(3));
});
