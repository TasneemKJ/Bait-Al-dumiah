// CPU-side scene contracts only; this substitutes the unavailable canvas texture
// boundary and deliberately makes no claim about pixels or WebGL rendering.
export function textureCanvas(t){const old=globalThis.document;
 const context=new Proxy({createRadialGradient:()=>({addColorStop(){}}),createLinearGradient:()=>({addColorStop(){}}),measureText:()=>({width:10}),createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)})},{get:(o,k)=>k in o?o[k]:()=>{}});
 globalThis.document={createElement:()=>({width:128,height:128,getContext:()=>context})};
 t.after(()=>{if(old===undefined)delete globalThis.document;else globalThis.document=old});
}
