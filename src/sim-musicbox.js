// The music box key (DESIGN.md #49). From the second lived night, each doll's small music box in her room has
// run down by dusk. There is one brass key in the house: the player carries it from room to room and winds
// with a circular motion. A box wound before midnight plays to its end and its doll dances in the dark; a box
// left stops halfway through the tune and its doll stays still until morning. One key, three rooms, forty
// seconds: which room first? Nothing is lost for good and nothing costs buttons; a dance is a little comfort.
import {emit,growBond} from './sim-core.js';
import {isNight} from './sim-queries.js';
import {clamp,integer,fail} from './sim-util.js';
import {DOLLS,ROOMS,MUSIC_BOXES,KEY_REST,MUSIC_MIDNIGHT,WIND_TURNS,WIND_SLIP,MUSIC_FIRST_DAY,
  WISH_REFRESH_SECONDS} from './content.js';

export const DANCE_COMFORT=8,DANCE_BOND=2;
const ids=()=>Object.fromEntries(DOLLS.map(d=>[d.id,0]));
export const freshMusic=()=>({key:KEY_REST.room,night:0,done:true,wind:ids(),
  result:Object.fromEntries(DOLLS.map(d=>[d.id,''])),nights:0});
export const boxOf=doll=>MUSIC_BOXES.find(b=>b.doll===doll)??null;
// A lived day (the wish rule): hurrying dusk with the light control never starts the boxes.
const lived=s=>s.dayTime>=WISH_REFRESH_SECONDS;
export const windingOpen=s=>Boolean(s.music)&&s.music.night===s.day&&!s.music.done&&isNight(s)&&
  s.clock<MUSIC_MIDNIGHT;
const wound=(s,doll)=>(s.music?.wind?.[doll]??0)>=1;
function dusk(s){
 const m=s.music;m.night=s.day;m.done=false;m.nights=Math.min(9999,m.nights+1);
 for(const d of DOLLS){m.wind[d.id]=0;m.result[d.id]=''}
 emit(s,{type:'musicbox-dusk',first:m.nights===1});
}
function midnight(s){
 const m=s.music,danced=[],stilled=[];m.done=true;
 for(const b of MUSIC_BOXES){
  if(wound(s,b.doll)){m.result[b.doll]='dance';danced.push(b.doll);const d=s.dolls.find(x=>x.id===b.doll);
   d.comfort=clamp(d.comfort+DANCE_COMFORT);growBond(s,d,DANCE_BOND)}
  else{m.result[b.doll]='still';stilled.push(b.doll)}
 }
 emit(s,{type:'musicbox-midnight',danced,stilled});
}
export function stepMusic(s,dt){
 const m=s.music;if(!m)return;
 // The light control hurried past midnight: the night still ends as midnight would have ended it.
 if(!m.done&&m.night&&(m.night<s.day||s.clock>=MUSIC_MIDNIGHT))midnight(s);
 if(isNight(s)&&s.day>=MUSIC_FIRST_DAY&&m.night!==s.day&&lived(s)&&s.clock<MUSIC_MIDNIGHT)dusk(s);
 if(!windingOpen(s)||!Number.isFinite(dt)||dt<=0)return;
 for(const d of DOLLS)if(!wound(s,d.id))m.wind[d.id]=Math.max(0,m.wind[d.id]-dt*WIND_SLIP);
}
// The key goes wherever it is carried, by day or night.
export function moveKey(s,room){
 if(s.paused)return fail('paused');if(!ROOMS.some(r=>r.id===room))return fail('invalid');
 const from=s.music.key;s.music.key=room;return {ok:true,from,room};
}
// Turns of the key in a doll's box (a circle of the finger is one turn). Only in the box's own room, at night,
// before midnight; a wound box takes no more.
export function turnKey(s,doll,turns){
 const box=boxOf(doll);if(!box||!Number.isFinite(turns))return fail('invalid');if(s.paused)return fail('paused');
 if(!windingOpen(s))return fail('musicResting');if(s.music.key!==box.room)return fail('keyElsewhere');
 if(wound(s,doll))return {ok:true,doll,wind:1,wound:true,already:true};
 const m=s.music;m.wind[doll]=Math.min(1,m.wind[doll]+Math.max(0,turns)/WIND_TURNS);
 return {ok:true,doll,wind:m.wind[doll],wound:m.wind[doll]>=1,already:false};
}
// What the house shows (read-only): where the key is, each box's wind and tonight's outcome.
export function musicStatus(s){
 const m=s.music;if(!m)return null;const tonight=m.night===s.day;
 return {key:m.key,open:windingOpen(s),wind:{...m.wind},
   result:tonight?{...m.result}:Object.fromEntries(DOLLS.map(d=>[d.id,''])),tonight};
}
export function restoreMusic(v,day){
 const m=freshMusic();if(!v||typeof v!=='object'||Array.isArray(v))return m;
 if(ROOMS.some(r=>r.id===v.key))m.key=v.key;m.night=integer(v.night,0,day);m.nights=integer(v.nights,0,9999);
 m.done=v.done!==false||m.night!==day;
 for(const d of DOLLS){m.wind[d.id]=Number.isFinite(v.wind?.[d.id])?clamp(v.wind[d.id],0,1):0;
  m.result[d.id]=['dance','still'].includes(v.result?.[d.id])?v.result[d.id]:''}
 return m;
}
