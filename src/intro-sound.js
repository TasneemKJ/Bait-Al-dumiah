import {INTRO_RESOLVE,introCuesIn} from './intro-score.js';

// Plays the intro score from the intro's clock. Nothing sounds until a gesture has unlocked audio (Play and
// Watch intro are taps that enable it) and sound is on; cues missed while locked or paused are dropped rather
// than replayed as a burst. Reduced motion does not mute it.
export const LOOKAHEAD=.12,STALE=.25;
export function createIntroSound(audio){
 let until=-Infinity,live=false;
 return {
  start(){until=-Infinity;live=true},
  advance(seconds){
   if(!live||!audio?.ready)return 0;
   const due=introCuesIn(Math.max(until,seconds-STALE),seconds+LOOKAHEAD);until=seconds+LOOKAHEAD;
   for(const cue of due)audio.introCue(cue,cue.at-seconds);return due.length;
  },
  // A skip or a grab fades the score out over 200 ms; reaching play resolves it with a soft chord.
  finish({skipped=false}={}){
   if(!live)return;live=false;if(!audio?.ready)return;
   if(skipped){audio.introFade(.2);return}
   for(const cue of INTRO_RESOLVE)audio.introCue(cue,cue.at);audio.holdLullaby(2.6);
  },
 };
}
