import * as audio from '../src/audio.js';
export async function runArtChecks(){
 const checks=[],check=(name,passed)=>checks.push({name,passed:Boolean(passed)});
 const player=new audio.DollhouseAudio();player.tick(true);
 check('Audio: construction and silent ticks never create a context',player.context===null&&player.nodes.size===0);
 check('Audio: warm plucked voice is available',typeof audio.playPluck==='function');
 check('Audio: quiet wooden knock is available',typeof audio.playWoodTap==='function');
 if(audio.playPluck&&audio.playWoodTap){
  const ctx=new OfflineAudioContext(1,22050*4,22050);
  audio.playPluck(ctx,ctx.destination,196,.1,1.6,.055);
  audio.playWoodTap(ctx,ctx.destination,2.3,.025);
  const data=(await ctx.startRendering()).getChannelData(0);
  let peak=0,power=0;for(const v of data){peak=Math.max(peak,Math.abs(v));power+=v*v}
  check('Audio: actual rendered voices are finite, audible and below clipping',data.every(Number.isFinite)&&peak>.01&&peak<.18&&power/data.length>.000001);
  check('Audio: voices have a quiet attack and decay to silence',Math.max(...data.slice(0,2200).map(Math.abs))===0&&Math.max(...data.slice(-2200).map(Math.abs))<.0001);
  const clock=new OfflineAudioContext(1,22050,22050),p=new audio.DollhouseAudio();p.context=clock;p.master=clock.createGain();p.master.connect(clock.destination);p.enabled=true;
  p.tick(false);const size=p.nodes.size;p.tick(false);p.tick(false);
  check('Audio: repeated frames do not duplicate an already scheduled beat',size>0&&p.nodes.size===size);
  p.paused=true;const before=p.index;p.tick(true);
  check('Audio: paused frames do not schedule notes or knocks',p.index===before&&p.nodes.size===size);
  p.stopVoices();check('Audio: stopping releases all tracked voices',p.nodes.size===0);
 }
 if(audio.playTinTouch&&audio.playClothTouch){
  const signatures=[];
  for(const [kind,play] of [['tin',audio.playTinTouch],['cloth',audio.playClothTouch]]){
   const ctx=new OfflineAudioContext(1,22050,22050);play(ctx,ctx.destination,.1);
   const data=(await ctx.startRendering()).getChannelData(0);let peak=0,power=0;
   for(const v of data){peak=Math.max(peak,Math.abs(v));power+=v*v}
   check(`Audio: ${kind} foley renders finite quiet sound`,data.every(Number.isFinite)&&peak>.002&&peak<.12&&power/data.length>.00000005);
   check(`Audio: ${kind} foley begins after touch and settles within half a second`,data.slice(0,2200).every(v=>v===0)&&data.slice(11025).every(v=>Math.abs(v)<.00001));
   signatures.push([...data.slice(2500,2510)]);
  }
  check('Audio: metal and cloth render different actual waveforms',JSON.stringify(signatures[0])!==JSON.stringify(signatures[1]));
 }else check('Audio: material foley synthesis is available',false);
 return checks;
}
