// The night porter's bell (DESIGN.md #67, second idea): a small brass bell on the hall table rings when someone in
// the house has something to say; a touch turns the house to that room. It replaces the badge dots. It never nags:
// it waits for a quiet beat after a ritual, never rings over a pour or a stitch, and repeats only after a long pause.
import {missing,windingOpen,wishGranted,boxOf} from './simulation.js';
import {MUSIC_BOXES} from './content.js';

export const BELL_BEAT=2,BELL_NEW=4,BELL_REPEAT=25;
// Who is calling, most urgent first: the visitor's night (the owner's room, never the hiding place), a music box
// still to wind before midnight, then a doll whose wish is waiting.
export function houseCall(s){
 const m=missing(s);if(m)return {room:m.home,doll:m.doll,reason:'visitor'};
 if(windingOpen(s)){const box=MUSIC_BOXES.find(b=>(s.music.wind[b.doll]??0)<1&&b.room===s.music.key)??
   MUSIC_BOXES.find(b=>(s.music.wind[b.doll]??0)<1);
  if(box)return {room:boxOf(box.doll).room,doll:box.doll,reason:'music'}}
 const d=s.dolls.find(x=>!wishGranted(s,x.id));return d?{room:d.room,doll:d.id,reason:'wish'}:null;
}
// When to ring (pure, clock in seconds): `busy` is a ritual still being played or a pause.
export function createBellClock({ring}){
 let calmSince=null,lastKey='',lastAt=-Infinity;
 return {tick(s,now,{pouring=false}={}){
  if(pouring||s.paused){calmSince=null;return null}
  const call=houseCall(s);if(!call){lastKey='';return null}
  calmSince??=now;if(now-calmSince<BELL_BEAT)return null;
  const key=call.reason+':'+call.room;
  if(now-lastAt<(key===lastKey?BELL_REPEAT:BELL_NEW))return null;
  lastKey=key;lastAt=now;ring(call);return call;
 }};
}
// A brass bell drawn in code: crown, cup and clapper, in the house's gold.
const bellArt=`<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="5" r="2.2" fill="currentColor"/><path
 d="M7 23c2-2 2-6 2.5-9.5C10 9 12.6 7 16 7s6 2 6.5 6.5C23 17 23 21 25 23z" fill="currentColor"/><rect x="5" y="23"
 width="22" height="2.4" rx="1.2" fill="currentColor"/><circle cx="16" cy="27.5" r="2" fill="currentColor"/></svg>`;
export function createPorterBell(host,getState,{t,onTap,sound=()=>{},now=()=>performance.now()/1000}){
 const button=host.ownerDocument.createElement('button');button.type='button';button.className='porter-bell';
 button.innerHTML=bellArt;button.hidden=true;let call=null,ringUntil=0;
 button.addEventListener('click',()=>{if(call)onTap(call)});
 const clock=createBellClock({ring:c=>{ringUntil=now()+1.6;sound()}});
 return {tick(pouring){
  if(!button.isConnected)host.append(button);const s=getState();clock.tick(s,now(),{pouring});
  call=pouring?null:houseCall(s);button.hidden=!call;
  if(call){const label=`${t('porterBell')} · ${t(call.room)}`;if(button.getAttribute('aria-label')!==label){
   button.setAttribute('aria-label',label);button.title=label}}
  button.classList.toggle('ringing',now()<ringUntil);
 },get call(){return call},dispose(){button.remove()}};
}
