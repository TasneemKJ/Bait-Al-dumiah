// Original synthesized music and room sounds. No samples, network requests or
// claim of reproducing an acoustic instrument. Audio remains gesture-gated.
const bounded=(n,lo,hi,fallback)=>Math.max(lo,Math.min(hi,Number.isFinite(n)?n:fallback));
function voice(context,destination,frequency,start,length,volume,type,cutoff){
 const when=Math.max(context.currentTime+.001,Number.isFinite(start)?start:context.currentTime);
 const duration=bounded(length,.06,4,1),level=bounded(volume,0,.10,.04);
 const osc=context.createOscillator(),overtone=context.createOscillator();
 const filter=context.createBiquadFilter(),gain=context.createGain(),partial=context.createGain();
 osc.type=type;osc.frequency.value=bounded(frequency,65,1800,196);
 overtone.type='sine';overtone.frequency.value=osc.frequency.value*2.002;partial.gain.value=.15;
 filter.type='lowpass';filter.frequency.value=cutoff;filter.Q.value=.3;
 gain.gain.setValueAtTime(0,when);gain.gain.linearRampToValueAtTime(level,when+.012);
 gain.gain.exponentialRampToValueAtTime(.00001,when+duration);gain.gain.setValueAtTime(0,when+duration+.02);
 osc.connect(filter);overtone.connect(partial);partial.connect(filter);filter.connect(gain);gain.connect(destination);
 let remaining=2,closed=false;
 const record={done:null,kind:type,stop(){if(closed)return;for(const o of [osc,overtone])try{o.stop()}catch{};cleanup()}};
 function cleanup(){if(closed)return;closed=true;for(const node of [osc,overtone,partial,filter,gain])node.disconnect();record.done?.()}
 for(const source of [osc,overtone]){source.onended=()=>{if(--remaining===0)cleanup()};source.start(when);source.stop(when+duration+.03)}
 return record;
}
export function playPluck(context,destination,frequency,start,length=1.7,volume=.055){
 return voice(context,destination,frequency,start,length,volume,'triangle',1500);
}
export function playWoodTap(context,destination,start,volume=.025){
 return voice(context,destination,126,start,.15,volume,'sine',420);
}
export class DollhouseAudio{
 constructor(){this.context=null;this.master=null;this.enabled=false;this.paused=false;this.next=0;this.index=0;this.night=false;this.nodes=new Set();this.nextKnock=Infinity;this.disposed=false}
 async enable(){
  if(this.disposed)return false;
  try{
   const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return false;
   if(!this.context){this.context=new Audio();this.master=this.context.createGain();this.master.gain.value=.38;this.master.connect(this.context.destination)}
   await this.context.resume();this.enabled=true;this.next=this.context.currentTime+.12;this.nextKnock=this.context.currentTime+18;return true;
  }catch{return false}
 }
 track(record){this.nodes.add(record);record.done=()=>this.nodes.delete(record);return record}
 stopVoices(){for(const n of [...this.nodes])n.stop();this.nodes.clear()}
 mute(){this.enabled=false;this.stopVoices();this.nextKnock=Infinity;if(this.context)this.context.suspend().catch(()=>{})}
 setPaused(paused){
  if(this.paused===paused)return;this.paused=paused;if(!this.context)return;
  if(paused){this.stopVoices();this.context.suspend().catch(()=>{})}
  else if(this.enabled){this.next=this.context.currentTime+.15;this.nextKnock=this.context.currentTime+18;this.context.resume().catch(()=>{})}
 }
 tone(frequency,start,length,volume=.04,type='sine'){
  if(!this.context||!this.enabled||this.paused)return;
  return this.track(voice(this.context,this.master,frequency,start,length,volume,type,1800));
 }
 tick(night){
  if(!this.context||!this.enabled||this.paused||this.disposed)return;
  const now=this.context.currentTime;
  if(this.night!==night){this.night=night;this.nextKnock=night?now+18:Infinity}
  // One current beat only: an idle tab or resumed context never replays backlog.
  if(now>=this.next){
   const phrase=[0,1,4,5,7,5,4,1,0,-5,0,1,4,5,1,0],base=night?146.832:196;
   const frequency=base*Math.pow(2,phrase[this.index%phrase.length]/12);
   this.track(playPluck(this.context,this.master,frequency,now,night?2.0:1.6,night?.040:.052));
   if(this.index%8===0)this.tone(base/2,now,3.6,.018,'sine');
   this.index++;this.next=now+(night?1.15:.82);
  }
  if(night&&now>=this.nextKnock){
   this.track(playWoodTap(this.context,this.master,now,.023));
   this.track(playWoodTap(this.context,this.master,now+.42,.018));
   this.nextKnock=now+47;
  }
 }
 effect(kind){
  if(!this.enabled||!this.context||this.paused)return;
  const t=this.context.currentTime,notes=kind==='secret'?[293.665,311.127,392]:kind==='place'?[392,493.883]:[440,523.251];
  notes.forEach((f,i)=>this.tone(f,t+i*.16,1.2,.035));
 }
 dispose(){if(this.disposed)return;this.disposed=true;this.enabled=false;this.stopVoices();this.context?.close().catch(()=>{})}
}
