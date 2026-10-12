import {INTRO_BEATS} from './content.js';

// The intro's sound score on the intro's own clock (seconds), so every sound lands on its visual beat.
// Synthesized by audio.js like the lullaby: a quiet room-tone bed of low drones, a music-box line and one or two
// house sounds per beat, then a soft chord as play begins. Peaks stay below the lullaby's (pluck .055 + drone .018).
const BEAT_START=INTRO_BEATS.reduce((starts,beat)=>[...starts,starts.at(-1)+beat.seconds],[0]);
export const INTRO_CUES=Object.freeze([
 // Bed: D2/D3 room tone that swells in under the paper veil and renews once per beat.
 {at:.2,beat:0,kind:'drone',frequency:73.416,length:4,volume:.016,attack:1.6},
 {at:.3,beat:0,kind:'drone',frequency:146.832,length:4,volume:.010,attack:1.8},
 // Approach: the music box wakes.
 {at:.7,beat:0,kind:'pluck',frequency:440,length:2.2,volume:.030},
 {at:1.8,beat:0,kind:'pluck',frequency:587.33,length:2,volume:.024},
 // Reveal: the house answers with a soft knock as the rooms open, and the tune climbs.
 {at:BEAT_START[1],beat:1,kind:'wood',volume:.016},
 {at:BEAT_START[1]+.1,beat:1,kind:'drone',frequency:110,length:4,volume:.012,attack:1.2},
 {at:BEAT_START[1]+.15,beat:1,kind:'pluck',frequency:493.883,length:2,volume:.028},
 // Settle: a kettle lid's tin touch in the kitchen and the tune turning home.
 {at:BEAT_START[2],beat:2,kind:'tin'},
 {at:BEAT_START[2]+.2,beat:2,kind:'drone',frequency:73.416,length:3.4,volume:.012,attack:1},
 {at:BEAT_START[2]+.3,beat:2,kind:'pluck',frequency:659.255,length:2,volume:.024},
]);
// The resolve as the intro hands into play: D4, A4, D5, rolled gently.
export const INTRO_RESOLVE=Object.freeze([293.665,440,587.33].map((frequency,index)=>
  ({at:index*.09,kind:'pluck',frequency,length:2.4,volume:.022})));
// The cues due after `from` up to and including `to`, in time order.
export function introCuesIn(from,to){return INTRO_CUES.filter(cue=>cue.at>from&&cue.at<=to)}
