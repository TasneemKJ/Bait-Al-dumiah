// Small pure helpers shared by the rule modules.
export const clamp=(v,min=0,max=100)=>Math.max(min,Math.min(max,Number.isFinite(v)?v:min));
export const integer=(v,min,max)=>Math.floor(clamp(v,min,max));
export const has=(items,id)=>items.some(x=>x.id===id);
export const fail=(reason,extra)=>({ok:false,reason,...extra});
