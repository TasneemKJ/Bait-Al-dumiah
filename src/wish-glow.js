// A gentle floor glow under a resident whose wish today is still unspoken.
// It teaches "dolls want things" in the first days, then fades from the game.
export const WISH_GLOW_DAYS=3;
export function wishGlowActive(state,id){
 const d=state.dolls.find(x=>x.id===id);
 return Boolean(d)&&state.day<=WISH_GLOW_DAYS&&!state.wishes.includes(id)&&d.action==='idle';
}
// Opacity of the glow: a slow breath, or a steady level when motion is reduced.
export function wishGlowOpacity(active,time,still){
 if(!active)return 0;
 return still?.45:.30+.2*(.5+.5*Math.sin(time*1.6));
}
