// The rain night's ambience (src/sim-arc.js): soft rain on the shutters, made here from a deterministic
// noise loop (no fetched samples), with sparse patter baked in. It fades in and out with the rain.
const SECONDS=2.5;
export function rainBuffer(context){
 const buffer=context.createBuffer(1,Math.ceil(context.sampleRate*SECONDS),context.sampleRate),
   data=buffer.getChannelData(0);let seed=907,hold=0,patter=0;
 for(let i=0;i<data.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const r=seed/4294967296;
  hold=hold*.6+(r*2-1)*.4;if(r>.9993)patter=1;patter*=.995;data[i]=hold*(.55+patter*.9)}
 // The loop's ends meet without a click.
 const edge=Math.floor(context.sampleRate*.02);
 for(let i=0;i<edge;i++){const k=i/edge;data[i]*=k;data[data.length-1-i]*=k}
 return buffer;
}
export function createRainSound(context,destination){
 const source=context.createBufferSource(),band=context.createBiquadFilter(),gain=context.createGain();
 source.buffer=rainBuffer(context);source.loop=true;band.type='bandpass';band.frequency.value=1500;band.Q.value=.45;
 gain.gain.value=0;source.connect(band);band.connect(gain);gain.connect(destination);source.start();
 let level=0;
 return {
  set(on){const want=on?.045:0;if(want===level)return;level=want;const t=context.currentTime;
   gain.gain.cancelScheduledValues(t);gain.gain.setValueAtTime(gain.gain.value,t);
   gain.gain.linearRampToValueAtTime(want,t+3)},
  stop(){try{source.stop()}catch{/* already stopped */}for(const n of [source,band,gain])n.disconnect()},
 };
}
