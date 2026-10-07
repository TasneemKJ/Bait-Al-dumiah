// Moon chimes: the same validated pull/release commands serve pointer and keys.
import {completeActivity} from './sim-core.js';
import {fail} from './sim-util.js';
// Listening, cancellation and weak taps never enter the economic boundary.

// Whitelist all persisted fields: no saved HTML/prose, renderer objects, or wall-clock catch-up.
// Fields added after the first release default safely, so earlier version-1 saves keep loading.
// Save schema. Version 1 is the only released format (key bait-al-dumiah.v1).
// A future format adds MIGRATIONS[n] (n -> n+1) and bumps SAVE_VERSION; restore()
// then upgrades older saves step by step. Unknown or newer versions are refused.
// Moon chimes: the same validated pull/release commands serve pointer and keys.
// Listening, cancellation and weak taps never enter the economic boundary.
export const chimeActive=s=>s.activities.active?.id==='lullaby'?s.activities.active:null;
export const CHIME_LEAD=.35,CHIME_BEAT=.8,CHIME_RING=.52,CHIME_MIN_PULL=.22;
export function stepChimes(s,dt){
 const a=chimeActive(s);if(!a||a.phase!=='listen')return;
 a.listenTime+=dt;
 if(a.listenTime>=CHIME_LEAD+a.pattern.length*CHIME_BEAT){a.phase='echo';a.cursor=0}
}
export function chimeStatus(s){
 const a=chimeActive(s);if(!a)return null;
 const index=Math.floor((a.listenTime-CHIME_LEAD)/CHIME_BEAT);
 const demo=a.phase==='listen'&&index>=0&&index<a.pattern.length&&(a.listenTime-CHIME_LEAD)%CHIME_BEAT<CHIME_RING;
 const recent=a.lastTone!==null&&s.elapsed-a.lastPluck<CHIME_RING;
 const sounding=demo?a.pattern[index]:recent?a.lastTone:null;
 return {...a,pattern:[...a.pattern],result:a.result?structuredClone(a.result):null,
  sounding,tone:demo?`${a.round}:demo:${index}`:recent?`pluck:${a.toneSerial}`:null,
  demoIndex:demo?index:null,minPull:CHIME_MIN_PULL};
}
export function chimeBlocked(s,phase='echo'){
 if(s.paused)return fail('pausedActivity');const a=chimeActive(s);
 if(!a)return fail('chimeNotActive');
 if(a.phase!==phase)return fail(a.phase==='finished'?'chimeFinished':'chimeListening');return null;
}
export function grabChime(s,id){
 const blocked=chimeBlocked(s);if(blocked)return blocked;
 if(!Number.isInteger(id)||id<0||id>3)return fail('invalid');
 const a=chimeActive(s);if(a.held!==null)return fail('chimeHeld');
 a.held=id;a.pull=0;return {ok:true};
}
export function pullChime(s,pull){
 const blocked=chimeBlocked(s);if(blocked)return blocked;
 if(!Number.isFinite(pull)||pull<0||pull>1)return fail('invalid');
 const a=chimeActive(s);if(a.held===null)return fail('chimeNotHeld');
 a.pull=pull;return {ok:true};
}
export function cancelChime(s){
 const a=chimeActive(s);if(!a)return fail('chimeNotActive');a.held=null;a.pull=0;return {ok:true};
}
export function releaseChime(s){
 if(s.paused){cancelChime(s);return fail('pausedActivity')}
 const blocked=chimeBlocked(s);if(blocked)return blocked;
 const a=chimeActive(s);if(a.held===null)return fail('chimeNotHeld');
 const id=a.held,pull=a.pull;cancelChime(s);
 if(pull<CHIME_MIN_PULL)return {ok:true,silent:true};
 a.lastTone=id;a.lastPluck=s.elapsed;a.toneSerial++;
 if(id!==a.pattern[a.pattern.length-1-a.cursor]){
  a.cursor=0;a.mistakes++;a.phase='listen';a.listenTime=-.55;a.round++;
  return {ok:true,mistake:true,complete:false};
 }
 a.cursor++;
 if(a.cursor<a.pattern.length)return {ok:true,complete:false};
 a.phase='finished';a.result={...completeActivity(s,'lullaby'),mistakes:a.mistakes};
 return {...a.result};
}
export function replayChimes(s){
 if(s.paused)return fail('pausedActivity');const a=chimeActive(s);
 if(!a)return fail('chimeNotActive');if(a.phase==='finished')return fail('chimeFinished');
 cancelChime(s);a.phase='listen';a.listenTime=0;a.cursor=0;a.round++;a.lastTone=null;
 return {ok:true};
}

