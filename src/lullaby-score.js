// Original, repeating toy-house phrase. Sparse night rests leave room for the
// courtyard and distant wood sounds; no claim of reproducing an acoustic oud.
const phrase=Object.freeze([0,1,4,5,7,5,4,1,0,-5,0,1,4,5,1,0]);
export function lullabyBeat(index,night=false){
 const beat=(Number.isFinite(index)?Math.max(0,Math.floor(index)):0)%phrase.length;
 const rest=Boolean(night)&&(beat===7||beat===15),base=night?146.832:196;
 return {
  frequency:base*Math.pow(2,phrase[beat]/12),rest,
  duration:night?2:1.6,volume:rest?0:night?.040:.052,
  delay:rest?2.6:night?1.15:beat===15?1.8:.82,
  drone:!rest&&beat%8===0,
 };
}
