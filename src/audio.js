import {lullabyBeat} from './lullaby-score.js';
// Original synthesized music and room sounds. No samples, network requests or
// claim of reproducing an acoustic instrument. Audio remains gesture-gated.
const bounded=(n,lo,hi,fallback)=>Math.max(lo,Math.min(hi,Number.isFinite(n)?n:fallback));
function voice(context,destination,frequency,start,length,volume,type,cutoff,attack=.012){
 const when=Math.max(context.currentTime+.001,Number.isFinite(start)?start:context.currentTime);
 const duration=bounded(length,.06,4,1),level=bounded(volume,0,.10,.04),rise=bounded(attack,.012,duration*.6,.012);
 const osc=context.createOscillator(),overtone=context.createOscillator();
 const filter=context.createBiquadFilter(),gain=context.createGain(),partial=context.createGain();
 osc.type=type;osc.frequency.value=bounded(frequency,65,1800,196);
 overtone.type='sine';overtone.frequency.value=osc.frequency.value*2.002;partial.gain.value=.15;
 filter.type='lowpass';filter.frequency.value=cutoff;filter.Q.value=.3;
 gain.gain.setValueAtTime(0,when);gain.gain.linearRampToValueAtTime(level,when+rise);
 gain.gain.exponentialRampToValueAtTime(.00001,when+duration);gain.gain.setValueAtTime(0,when+duration+.02);
 osc.connect(filter);overtone.connect(partial);partial.connect(filter);filter.connect(gain);gain.connect(destination);
 let remaining=2,closed=false;
 const record={done:null,kind:type,stop(){if(closed)return;
 for(const o of [osc,overtone])try{o.stop()}catch{};cleanup()}};
 function cleanup(){if(closed)return;closed=true;
 for(const node of [osc,overtone,partial,filter,gain])node.disconnect();record.done?.()}
 for(const source of [osc,overtone]){source.onended=()=>{if(--remaining===0)cleanup()};
 source.start(when);source.stop(when+duration+.03)}
 return record;
}
export function playPluck(context,destination,frequency,start,length=1.7,volume=.055){
 return voice(context,destination,frequency,start,length,volume,'triangle',1500);
}
export function playWoodTap(context,destination,start,volume=.025){
 return voice(context,destination,126,start,.15,volume,'sine',420);
}
// Short local foley belongs to the material being handled, not a reward cue.
export function playTinTouch(context,destination,start){
 return voice(context,destination,880,start,.19,.027,'triangle',2800);
}
export function playClothTouch(context,destination,start){
 const when=Math.max(context.currentTime+.001,Number.isFinite(start)?start:context.currentTime),duration=.28;
 const buffer=context.createBuffer(1,Math.ceil(context.sampleRate*duration),
   context.sampleRate),data=buffer.getChannelData(0);
 // Deterministic, original broadband friction; no fetched samples or randomness
 // shared with gameplay. Filtering removes the brittle top of white noise.
 let seed=71;for(let i=0;i<data.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;data[i]=(seed/4294967296)*2-1}
 const source=context.createBufferSource(),filter=context.createBiquadFilter(),gain=context.createGain();
 source.buffer=buffer;filter.type='lowpass';filter.frequency.value=1100;filter.Q.value=.3;
 gain.gain.setValueAtTime(0,when);gain.gain.linearRampToValueAtTime(.035,when+.045);
 gain.gain.exponentialRampToValueAtTime(.00001,when+duration);gain.gain.setValueAtTime(0,when+duration+.01);
 source.connect(filter);filter.connect(gain);gain.connect(destination);let closed=false;
 const record={done:null,kind:'cloth',stop(){if(closed)return;try{source.stop()}catch{};cleanup()}};
 function cleanup(){if(closed)return;closed=true;for(const n of [source,filter,gain])n.disconnect();record.done?.()}
 source.onended=cleanup;source.start(when);source.stop(when+duration+.02);return record;
}

// A soft D-minor chord that rises once as dusk turns to night: D3, A3, D4.
export const DUSK_SWELL=[146.832,220,293.665];
export class DollhouseAudio{
 constructor(){this.context=null;this.master=null;this.enabled=false;this.paused=false;
 this.next=0;this.index=0;this.night=false;this.nodes=new Set();
 this.nextKnock=Infinity;this.sawDay=false;this.disposed=false;this.enableGeneration=0}
 async enable(){
  if(this.disposed)return false;
  const generation=++this.enableGeneration;
  try{
   const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return false;
   if(!this.context){this.context=new Audio();this.master=this.context.createGain();
   this.master.gain.value=.38;this.master.connect(this.context.destination)}
   await this.context.resume();
   // A late permission/resume result must not undo a newer mute or disposal.
   if(this.disposed||generation!==this.enableGeneration)return false;
   this.enabled=true;this.next=this.context.currentTime+.12;this.nextKnock=this.context.currentTime+18;
   if(this.paused)this.context.suspend().catch(()=>{});
   return true;
  }catch{return false}
 }
 track(record){this.nodes.add(record);record.done=()=>this.nodes.delete(record);return record}
 stopVoices(){for(const n of [...this.nodes])n.stop();this.nodes.clear()}
 mute(){this.enableGeneration++;this.enabled=false;this.sawDay=false;this.stopVoices();
 this.nextKnock=Infinity;if(this.context)this.context.suspend().catch(()=>{})}
 setPaused(paused){
  if(this.paused===paused)return;this.paused=paused;if(!this.context)return;
  if(paused){this.sawDay=false;this.stopVoices();this.context.suspend().catch(()=>{})}
  else if(this.enabled){this.next=this.context.currentTime+.15;
  this.nextKnock=this.context.currentTime+18;this.context.resume().catch(()=>{})}
 }
 tone(frequency,start,length,volume=.04,type='sine',attack){
  if(!this.context||!this.enabled||this.paused)return;
  return this.track(voice(this.context,this.master,frequency,start,length,volume,type,1800,attack));
 }
 // Heard only when day turns to night while listening, never on load or after a resume.
 duskSwell(){
  if(!this.context)return;const t=this.context.currentTime;
  DUSK_SWELL.forEach((f,i)=>this.tone(f,t+i*.35,4,.022,'sine',1.8));
 }
 tick(night){
  if(!this.context||!this.enabled||this.paused||this.disposed)return;
  const now=this.context.currentTime;
  if(!night)this.sawDay=true;
  if(this.night!==night){this.night=night;this.nextKnock=night?now+18:Infinity;
  if(night&&this.sawDay){this.sawDay=false;this.duskSwell()}}
  // One current beat only: an idle tab or resumed context never replays backlog.
  if(now>=this.next){
   const beat=lullabyBeat(this.index,night);
   if(!beat.rest)this.track(playPluck(this.context,this.master,beat.frequency,now,beat.duration,beat.volume));
   if(beat.drone)this.tone((night?146.832:196)/2,now,3.6,.018,'sine');
   this.index++;this.next=now+beat.delay;
  }
  if(night&&now>=this.nextKnock){
   this.track(playWoodTap(this.context,this.master,now,.023));
   this.track(playWoodTap(this.context,this.master,now+.42,.018));
   this.nextKnock=now+47;
  }
 }
 chime(index){
  if(!Number.isInteger(index)||index<0||index>3||!this.enabled||!this.context||this.paused||this.disposed)return;
  const frequency=[293.665,349.228,392,440][index];
  this.track(playPluck(this.context,this.master,frequency,this.context.currentTime,1.3,.055));
 }
 effect(kind){
  if(!this.enabled||!this.context||this.paused||this.disposed)return;
  const care=kind?.startsWith('care:')?kind.slice(5):null;
  if(care){
   const now=this.context.currentTime;
   if(care==='tea'){
    this.track(voice(this.context,this.master,640,now,.22,.023,'sine',2200));
    this.track(playTinTouch(this.context,this.master,now+.13));
   }else if(care==='play'){
    this.track(playWoodTap(this.context,this.master,now,.026));
    this.track(playWoodTap(this.context,this.master,now+.19,.018));
   }else if(care==='rest'||care==='soothe'){
    this.track(playClothTouch(this.context,this.master,now));
    if(care==='soothe')this.track(playWoodTap(this.context,this.master,now+.16,.012));
   }
   return;
  }
  if(kind==='mint-tin')return this.track(playTinTouch(this.context,this.master,this.context.currentTime));
  if(kind==='moon-bed')return this.track(playClothTouch(this.context,this.master,this.context.currentTime));
  const t=this.context.currentTime,notes=kind==='secret'?[293.665,311.127,
    392]:kind==='place'?[392,493.883]:kind==='musicbox'?[523.251,659.255,
    783.991,659.255]:kind==='mobile'?[392,493.883,587.33]:[440,523.251];
  notes.forEach((f,i)=>this.tone(f,t+i*.16,1.2,.035));
 }
 dispose(){if(this.disposed)return;this.disposed=true;this.enableGeneration++;this.enabled=false;
 this.stopVoices();this.context?.close().catch(()=>{})}
}
