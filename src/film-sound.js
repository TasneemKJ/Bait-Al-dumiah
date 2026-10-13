// Original sparse music-box and material score, shared in timing with offline production.
const NOTES=[293.665,349.228,440,587.33,440,349.228,329.628,440];
export function createFilmSound(){
 let ctx=null,gain=null,last=-1,muted=true,generation=0;
 const voices=new Set();
 function stop(){for(const voice of voices){try{voice.stop();}catch{}}voices.clear();
  if(gain&&ctx)gain.gain.setTargetAtTime(0,ctx.currentTime,.06);last=-1;}
 function note(frequency,at,length,volume){
  for(const [ratio,level] of [[1,1],[2.76,.18],[5.4,.06]]){
   const oscillator=ctx.createOscillator(),envelope=ctx.createGain();
   oscillator.type='sine';oscillator.frequency.value=frequency*ratio;
   envelope.gain.setValueAtTime(0,at);envelope.gain.linearRampToValueAtTime(volume*level,at+.012);
   envelope.gain.exponentialRampToValueAtTime(.00001,at+length);
   voices.add(oscillator);oscillator.onended=()=>voices.delete(oscillator);
   oscillator.connect(envelope);envelope.connect(gain);oscillator.start(at);oscillator.stop(at+length+.05);
  }
 }
 return {
  async enable(){const request=generation;try{ctx??=new AudioContext();
   if(!gain){gain=ctx.createGain();gain.connect(ctx.destination);}
   await ctx.resume();if(request!==generation)return false;
   muted=false;return true;}catch{return false;}},
  mute(){generation++;muted=true;stop();},
  stop,
  tick(seconds){if(!ctx||muted||ctx.state!=='running')return;
   gain.gain.setTargetAtTime(.52,ctx.currentTime,.12);
   const beat=Math.floor(seconds/1.5);if(beat===last)return;last=beat;
   note(NOTES[beat%NOTES.length],ctx.currentTime,2.8,.11);
   if(beat%4===0)note(73.416,ctx.currentTime,3.8,.08);
   if(beat%6===2)note(980,ctx.currentTime+.12,.5,.025);
  },
  dispose(){generation++;muted=true;stop();void ctx?.close();ctx=null;gain=null;},
 };
}
