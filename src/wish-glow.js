// A gentle floor glow under a resident whose wish today is still unspoken.
// Days 1-3 it teaches "dolls want things" at full strength. Later it is half as
// strong and only appears in daylight after the player has been quiet for a while.
export const WISH_GLOW_DAYS=3;
export const WISH_GLOW_IDLE_SECONDS=75;
export function wishGlowStrength(state,id){
 const d=state.dolls.find(x=>x.id===id);
 if(!d||state.wishes.includes(id)||d.action!=='idle')return 0;
 if(state.day<=WISH_GLOW_DAYS)return 1;
 if(state.clock>=120)return 0;
 const lastCare=Math.max(...state.dolls.map(x=>Number.isFinite(x.lastCare)?x.lastCare:-Infinity));
 return state.elapsed-lastCare>=WISH_GLOW_IDLE_SECONDS?.5:0;
}
export const wishGlowActive=(state,id)=>wishGlowStrength(state,id)>0;
// Opacity of the glow: a slow breath scaled by strength, or a steady level when motion is reduced.
export function wishGlowOpacity(strength,time,still){
 const k=strength===true?1:Number.isFinite(strength)?Math.max(0,Math.min(1,strength)):0;
 if(k===0)return 0;
 return k*(still?.45:.30+.2*(.5+.5*Math.sin(time*1.6)));
}
