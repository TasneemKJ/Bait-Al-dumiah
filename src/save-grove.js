// Restores the reference-game systems' record. Every field is whitelisted, clamped and defaulted.
import {ERRANDS,LANTERN_LEVELS,DISHES} from './content-grove.js';
import {rollErrands} from './sim-grove.js';
import {integer,clamp} from './sim-util.js';

const obj=v=>v&&typeof v==='object'&&!Array.isArray(v)?v:null;
export function restoreGrove(s,raw){
 const v=obj(raw)??{},g=s.grove,seen=new Set();
 g.embers=integer(v.embers,0,999);g.warmth=integer(v.warmth,0,9999);
 // A house saved before the lantern existed has already been cared for: its lantern starts warm, so
 // colour never drains from a returning player's home.
 if(!obj(raw)&&s.cares>0)g.warmth=LANTERN_LEVELS[2];
 g.errandDay=integer(v.errandDay,0,s.day);
 const hugs=obj(v.hugs)??{};
 for(const d of s.dolls)if(Number.isFinite(hugs[d.id]))g.hugs[d.id]=integer(hugs[d.id],0,s.day);
 const known=e=>obj(e)&&ERRANDS.some(x=>x.id===e.id)&&!seen.has(e.id)&&seen.add(e.id);
 g.errands=(Array.isArray(v.errands)?v.errands.slice(0,6):[]).filter(known)
   .map(e=>({id:e.id,done:e.done===true||e.collected===true,collected:e.collected===true}));
 g.dishDay=integer(v.dishDay,0,s.day);const tastes=obj(v.tastes)??{};
 g.dish=DISHES.some(d=>d.id===v.dish)?v.dish:null;g.dishAt=Number.isFinite(v.dishAt)?clamp(v.dishAt,-99,s.elapsed):-99;
 for(const d of s.dolls){const known=obj(tastes[d.id]);if(!known)continue;
  for(const dish of DISHES)if(['love','like','meh'].includes(known[dish.id]))
   (g.tastes[d.id]??={})[dish.id]=known[dish.id]}
 if(!g.errands.length||!g.errandDay)rollErrands(s);
}
