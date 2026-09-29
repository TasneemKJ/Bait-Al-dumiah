// Pure, testable presentation policy. It never mutates gameplay or save state.
import {ROOMS} from '../content.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number.isFinite(v)?v:a));
export function lighting(mix){
 const t=clamp(mix,0,1),lerp=(a,b)=>a+(b-a)*t;
 return {ambient:lerp(1.15,.50),key:lerp(2.35,.50),rim:lerp(1.05,1.70),lamps:lerp(1.4,8.4),exposure:lerp(1.08,1.03)};
}
export function fog(mix){
 const t=clamp(mix,0,1),lerp=(a,b)=>a+(b-a)*t;
 const a=0xe7d8c8,b=0x252943;
 const channel=shift=>Math.round(lerp((a>>shift)&255,(b>>shift)&255));
 return {density:lerp(.0012,.0105),color:(channel(16)<<16)|(channel(8)<<8)|channel(0)};
}
export function detail(width,height,preference='auto',dpr=1){
 const level=preference==='high'?'high':preference==='low'?'low':Math.min(width,height)<700?'low':'high';
 return {level,pixelRatio:clamp(dpr,1,level==='low'?1.25:1.75),shadows:level==='high'};
}
export function framing(width,height,roomId=null){
 const aspect=Math.max(1,width)/Math.max(1,height),room=ROOMS.find(r=>r.id===roomId);
 const heightWorld=Math.max(11.7,10.8/aspect);
 return {height:heightWorld,zoom:room?(width<700?3.15:1.85):1,target:room?[room.x,room.y+1.65,.15]:[0,3.65,0]};
}

// Shader uniforms are linear RGB. Hex art-direction swatches are sRGB.
// Explicit conversion prevents an intended midnight blue becoming pale gray.
export function nightSky(){
 const linear=hex=>[16,8,0].map(shift=>{const c=((hex>>shift)&255)/255;return c<=.04045?c/12.92:Math.pow((c+.055)/1.055,2.4)});
 return {bottom:linear(0x292940),top:linear(0x10162c),glow:linear(0x1b1830)};
}
