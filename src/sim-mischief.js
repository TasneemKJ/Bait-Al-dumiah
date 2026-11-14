// The midnight visitor's mischief. Each night (one a game day, never on a hurried one) the little visitor
// borrows one small thing that belongs to a doll and hides it somewhere in the house. Touching the right
// place before the next nightfall brings it home and its owner brightens (closeness and comfort, never
// buttons). Missed, its owner is quiet for a day and the house gets a short elegy; the thing itself comes
// back at dawn, so nothing is ever lost for good. Hiding places widen over the visitor's own first nights:
// the first night is taught in the owner's room with a glint, then the room, then the floor, then the house.
import {emit,growBond,checkMilestones} from './sim-core.js';
import {isNight} from './sim-queries.js';
import {clamp,integer,fail} from './sim-util.js';
import {DOLLS,ROOMS,MISCHIEF_ITEMS,MISCHIEF_SPOTS,MISCHIEF_GRACE,MISCHIEF_LOG,WISH_REFRESH_SECONDS} from './content.js';

// Elegies per thing (copy keys `elegy-<item>-<n>` in locale-mischief.js); a thing lost again gets the next one.
export const ELEGIES=Object.freeze({teaspoon:2,strainer:1,thimble:2,'blue-button':2,spool:1,ribbon:2,hairpin:1,bell:1});
export const FOUND_BOND=4,FOUND_COMFORT=10,QUIET_NEED=.75,QUIET_BOND=.5;
const ORDER=['lina','noor','sami'];
const floorOf=room=>ROOMS.find(r=>r.id===room)?.y??0;
export const itemDef=id=>MISCHIEF_ITEMS.find(i=>i.id===id)??null;
export const spotDef=id=>MISCHIEF_SPOTS.find(p=>p.id===id)??null;
// A story object that doubles as a hiding place ('prop:moon-bed' -> the quilt).
export const spotForObject=key=>MISCHIEF_SPOTS.find(p=>p.prop&&'prop:'+p.prop===key)??null;
export const freshMischief=()=>({nights:0,item:'',spot:'',takenDay:0,takenAt:0,lastDay:0,losses:0,
  lost:Object.fromEntries(MISCHIEF_ITEMS.map(i=>[i.id,0])),gone:'',goneDay:0,
  quiet:Object.fromEntries(DOLLS.map(d=>[d.id,0])),log:[]});

// The game's own deterministic scramble (the audio noise LCG), seeded by the night, never a random source.
function scramble(a,b){let x=(Math.imul(a+1,1664525)+Math.imul(b+7,22695477)+1013904223)>>>0;
 x=(Math.imul(x^(x>>>15),2246822519)+3266489917)>>>0;return (x^(x>>>13))>>>0}
// How widely tonight's thing may hide: the visitor's own night count, so an old save still starts gently.
export function scopeFor(n){return n<=1?'first':n<=3?'room':n<=5?'floor':'house'}
function pickItem(s,n){
 if(n<=1)return 'teaspoon';
 const doll=ORDER[(n-1)%ORDER.length],last=s.mischief.log.at(-1)?.item;
 const own=MISCHIEF_ITEMS.filter(i=>i.doll===doll&&i.id!==last);
 return own[scramble(n,s.day)%own.length].id;
}
function pickSpot(s,n,item){
 const home=itemDef(item).room,scope=scopeFor(n);
 if(scope==='first')return 'kettle';
 const places=MISCHIEF_SPOTS.filter(p=>scope==='house'||(scope==='room'?p.room===home:
   floorOf(p.room)===floorOf(home)));
 return places[scramble(n*3,s.day+11)%places.length].id;
}
export function missing(s){const m=s.mischief;if(!m?.item)return null;const item=itemDef(m.item),spot=spotDef(m.spot);
 return {item:item.id,doll:item.doll,home:item.room,spot:spot.id,room:spot.room,night:m.nights,
   scope:scopeFor(m.nights),glint:scopeFor(m.nights)==='first'}}
// Missed tonight: its place stays empty until dawn, then the visitor quietly puts it back.
export const goneItem=s=>s.mischief?.gone&&s.mischief.goneDay===s.day?s.mischief.gone:null;
export const quietDoll=(s,id)=>(s.mischief?.quiet?.[id]??0)>=s.day;
function record(s,entry){s.mischief.log.push(entry);if(s.mischief.log.length>MISCHIEF_LOG)s.mischief.log.shift()}
function take(s){
 const m=s.mischief,n=Math.min(9999,m.nights+1),item=pickItem(s,n),spot=pickSpot(s,n,item);
 Object.assign(m,{nights:n,item,spot,takenDay:s.day,takenAt:s.elapsed,lastDay:s.day});
 emit(s,{type:'mischief-take',...missing(s)});
}
function lose(s){
 // Each thing's own losses choose its elegy: its first loss gets its first line, a second loss the next.
 const m=s.mischief,item=itemDef(m.item),elegy=m.lost[item.id]%ELEGIES[item.id];
 m.losses=Math.min(9999,m.losses+1);m.lost[item.id]=Math.min(9999,m.lost[item.id]+1);
 m.quiet[item.doll]=s.day+1;m.gone=item.id;m.goneDay=s.day;
 record(s,{item:item.id,day:s.day,found:false,elegy});
 // No new mischief on a night that has just cost something.
 Object.assign(m,{item:'',spot:'',lastDay:s.day});
 emit(s,{type:'mischief-lost',item:item.id,doll:item.doll,elegy});
}
// A lived-in day (the wish rule): hurrying dawn or dusk with the light control never takes or loses anything.
const lived=s=>s.dayTime>=WISH_REFRESH_SECONDS;
export function stepMischief(s){
 const m=s.mischief;if(!m||!isNight(s)||s.activities.active||!lived(s))return;
 if(m.item){if(s.day>m.takenDay&&s.elapsed-m.takenAt>=MISCHIEF_GRACE)lose(s);return}
 if(m.lastDay!==s.day)take(s);
}
// The canary's silence (the app's subscription, drawn only for it): at dusk it knows tonight's visitor
// from the very choice nightfall will make, and faces the room the visitor comes to first: the borrowed
// thing's own room, which every player sees moments later. Never the hiding place. Read-only, never saved.
export const CANARY_DUSK=96,CANARY_SLEEP=180;
export function forecast(s){
 const m=s.mischief;if(!m||isNight(s)||s.clock<CANARY_DUSK||m.item||m.lastDay===s.day||!lived(s))return null;
 const item=itemDef(pickItem(s,Math.min(9999,m.nights+1)));return {item:item.id,doll:item.doll,room:item.room};
}
// Where the canary keeps watch: from dusk until the visitor has come, then that night while the thing is out.
export function canaryWatch(s){
 const f=forecast(s);if(f)return f.room;const m=s.mischief;
 return isNight(s)&&m?.item&&m.takenDay===s.day?itemDef(m.item).room:null;
}
// The morning after the visitor took something, the canary has a word to say about it.
export const visitorLastNight=s=>Boolean(s.mischief?.nights)&&s.mischief.takenDay===s.day-1;
// A touch on a hiding place. Wrong places answer whether the thing is in this room (`near`), never where.
export function search(s,spotId){
 const spot=spotDef(spotId);if(!spot)return fail('invalid');if(s.paused)return fail('paused');
 const m=s.mischief;if(!m.item)return {ok:true,found:false,empty:true,spot:spot.id,room:spot.room};
 if(m.spot!==spot.id)return {ok:true,found:false,near:spotDef(m.spot).room===spot.room,spot:spot.id,room:spot.room};
 const item=itemDef(m.item),d=s.dolls.find(x=>x.id===item.doll);
 record(s,{item:item.id,day:s.day,found:true,elegy:0});Object.assign(m,{item:'',spot:''});
 d.comfort=clamp(d.comfort+FOUND_COMFORT);growBond(s,d,FOUND_BOND);checkMilestones(s);
 return {ok:true,found:true,item:item.id,doll:item.doll,home:item.room,spot:spot.id,room:spot.room,
   first:m.nights===1};
}
export function restoreMischief(v,day,elapsed){
 const m=freshMischief();if(!v||typeof v!=='object'||Array.isArray(v))return m;
 m.nights=integer(v.nights,0,9999);m.losses=integer(v.losses,0,9999);m.lastDay=integer(v.lastDay,0,day);
 if(itemDef(v.item)&&spotDef(v.spot)&&m.nights>0){m.item=v.item;m.spot=v.spot;
  m.takenDay=integer(v.takenDay,1,day);m.takenAt=clamp(v.takenAt,0,elapsed)}
 if(itemDef(v.gone)){m.gone=v.gone;m.goneDay=integer(v.goneDay,0,day)}
 for(const d of DOLLS)m.quiet[d.id]=integer(v.quiet?.[d.id],0,day+1);
 for(const i of MISCHIEF_ITEMS)m.lost[i.id]=integer(v.lost?.[i.id],0,9999);
 if(Array.isArray(v.log))m.log=v.log.filter(e=>e&&itemDef(e.item)).slice(-MISCHIEF_LOG).map(e=>({item:e.item,
   day:integer(e.day,1,day),found:e.found===true,elegy:e.found===true?0:integer(e.elegy,0,ELEGIES[e.item]-1)}));
 return m;
}
