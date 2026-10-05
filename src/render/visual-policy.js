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
const ROOM_LIGHTS=Object.freeze({
 kitchen:{color:0xffc27d,night:2.72,distance:4.8},
 parlor:{color:0xffa88f,night:2.38,distance:5.1},
 studio:{color:0xf2c48f,night:2.55,distance:4.4},
 bedroom:{color:0xffd9a8,night:2.26,distance:5.5},
});
export function roomLighting(roomId,mix){
 const profile=ROOM_LIGHTS[roomId]||ROOM_LIGHTS.kitchen;
 const t=Number.isFinite(mix)?clamp(mix,0,1):1;
 return {color:profile.color,intensity:.18+(profile.night-.18)*t,distance:profile.distance};
}
// One room practical's values. The house light list also holds window glass,
// so callers identify a lamp by its room tag, never by its list position.
export function practicalLight(roomId,mix,lamps,cue=1,focused=false){
 const practical=roomLighting(roomId,mix),energy=Number.isFinite(lamps)?Math.max(0,lamps):0,gain=Number.isFinite(cue)?Math.max(0,cue):1;
 return {color:practical.color,distance:practical.distance,intensity:(energy*PRACTICAL_SHARE+practical.intensity)*gain*(focused?1.12:1)};
}
const PRACTICAL_SHARE=.22;
export function detail(width,height,preference='auto',dpr=1){
 const level=preference==='high'?'high':preference==='low'?'low':Math.min(width,height)<700?'low':'high';
 return {level,pixelRatio:clamp(dpr,1,level==='low'?1.25:1.75),shadows:level==='high'};
}
export function framing(width,height,roomId=null){
 const w=Number.isFinite(width)?Math.max(1,width):390,h=Number.isFinite(height)?Math.max(1,height):844;
 const aspect=w/h,room=ROOMS.find(r=>r.id===roomId);
 const heightWorld=Math.max(11.7,10.8/aspect);
 if(!room)return {height:heightWorld,zoom:1,target:[0,3.65,0]};
 // Fit the room's projected width and depth inside the free playfield. A fixed
 // phone zoom cut off the tin, plant and cabinet at the edges of the room.
 const phone=w<700&&h>w,short=h<560,top=phone?166:short?48:112,bottom=phone?308:short?138:248;
 const usable=Math.max(120,h-top-bottom),span=Math.max(5.95/aspect,4.25*h/usable),zoom=Math.min(1.85,heightWorld/span);
 const effectiveSpan=heightWorld/zoom,upY=Math.hypot(5.8,24)/Math.hypot(5.8,5.6,24),offset=((top+usable/2)/h-.5)*effectiveSpan/upY;
 return {height:heightWorld,aspect,zoom,target:[room.x,room.y+1.875+offset,.325]};
}

// Shader uniforms are linear RGB. Hex art-direction swatches are sRGB.
// Explicit conversion prevents an intended midnight blue becoming pale gray.
export function nightSky(){
 const linear=hex=>[16,8,0].map(shift=>{const c=((hex>>shift)&255)/255;return c<=.04045?c/12.92:Math.pow((c+.055)/1.055,2.4)});
 return {bottom:linear(0x292940),top:linear(0x10162c),glow:linear(0x1b1830)};
}
