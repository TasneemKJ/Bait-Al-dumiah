// Restores the reference-game systems' record. Every field is whitelisted, clamped and defaulted.
import {ERRANDS} from './content-grove.js';
import {rollErrands} from './sim-grove.js';
import {integer} from './sim-util.js';

const obj=v=>v&&typeof v==='object'&&!Array.isArray(v)?v:null;
export function restoreGrove(s,raw){
 const v=obj(raw)??{},g=s.grove,seen=new Set();
 g.embers=integer(v.embers,0,999);g.warmth=integer(v.warmth,0,9999);
 g.errandDay=integer(v.errandDay,0,s.day);
 const known=e=>obj(e)&&ERRANDS.some(x=>x.id===e.id)&&!seen.has(e.id)&&seen.add(e.id);
 g.errands=(Array.isArray(v.errands)?v.errands.slice(0,6):[]).filter(known)
   .map(e=>({id:e.id,done:e.done===true||e.collected===true,collected:e.collected===true}));
 if(!g.errands.length||!g.errandDay)rollErrands(s);
}
