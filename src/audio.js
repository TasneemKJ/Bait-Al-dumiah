// An original, gentle generative music-box motif. No audio files or network requests.
export class DollhouseAudio{
 constructor(){this.context=null;this.master=null;this.enabled=false;this.paused=false;this.next=0;this.index=0;this.night=false;this.nodes=new Set()}
 async enable(){try{const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return false;if(!this.context){this.context=new Audio();this.master=this.context.createGain();this.master.gain.value=.45;this.master.connect(this.context.destination)}await this.context.resume();this.enabled=true;this.next=this.context.currentTime+.1;return true}catch{return false}}
 mute(){this.enabled=false;if(this.context)this.context.suspend().catch(()=>{})}
 setPaused(paused){if(this.paused===paused)return;this.paused=paused;if(!this.context)return;if(paused)this.context.suspend().catch(()=>{});else if(this.enabled){this.context.resume().catch(()=>{});this.next=this.context.currentTime+.15}}
 tone(frequency,start,length,volume=.07,type='sine'){
  if(!this.context||!this.enabled||this.paused)return;
  const osc=this.context.createOscillator(),gain=this.context.createGain();osc.type=type;osc.frequency.value=frequency;
  gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(volume,start+.016);gain.gain.exponentialRampToValueAtTime(.0001,start+length);
  osc.connect(gain);gain.connect(this.master);osc.start(start);osc.stop(start+length+.02);this.nodes.add(osc);osc.onended=()=>{osc.disconnect();gain.disconnect();this.nodes.delete(osc)};
 }
 tick(night){if(!this.context||!this.enabled||this.paused)return;this.night=night;const now=this.context.currentTime;if(now<this.next-.12)return;
  const melody=[0,7,12,11,7,4,2,7,0,4,9,7,4,2,-1,2];const n=melody[this.index%melody.length];const base=night?220:261.626;
  this.tone(base*Math.pow(2,n/12),now,1.8,.055);this.tone(base*Math.pow(2,n/12)*2.003,now,1.1,.012);
  if(this.index%4===0)this.tone(base/2,now,3.4,.04,'triangle');
  this.index++;this.next=now+(night?.95:.72);
 }
 effect(kind){if(!this.enabled||!this.context)return;const t=this.context.currentTime;const notes=kind==='secret'?[392,369.99,523.25]:kind==='place'?[523.25,659.25]:[659.25,783.99];notes.forEach((f,i)=>this.tone(f,t+i*.11,1,.05))}
 dispose(){for(const n of this.nodes){try{n.stop()}catch{}}this.nodes.clear();this.context?.close().catch(()=>{})}
}
