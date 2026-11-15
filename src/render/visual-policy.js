// Pure, testable presentation policy. It never mutates gameplay or save state.
import {ROOMS} from '../content.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number.isFinite(v)?v:a));
export function lighting(mix){
 const t=clamp(mix,0,1),lerp=(a,b)=>a+(b-a)*t;
 return {ambient:lerp(1.15,.50),key:lerp(2.35,.50),rim:lerp(1.05,1.70),lamps:lerp(1.4,8.4),exposure:lerp(1.08,1.03)};
}
// The rain night (src/sim-arc.js): cooler and dimmer daylight-sky, more haze; the room lamps stay warm.
export function rainLook(mix){
 const t=clamp(mix,0,1);
 return {ambient:1-.22*t,key:1-.38*t,fog:1+.7*t,tint:0x6f86b0,tintAmount:.4*t,glass:.3*t};
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
 const profile=typeof roomId==='string'&&Object.hasOwn(ROOM_LIGHTS,roomId)?ROOM_LIGHTS[roomId]:ROOM_LIGHTS.kitchen;
 const t=Number.isFinite(mix)?clamp(mix,0,1):1;
 return {color:profile.color,intensity:.18+(profile.night-.18)*t,distance:profile.distance};
}
// One room practical's values. The house light list also holds window glass,
// so callers identify a lamp by its room tag, never by its list position.
export function practicalLight(roomId,mix,lamps,cue=1,focused=false){
 const practical=roomLighting(roomId,mix),energy=Number.isFinite(lamps)?Math.max(0,
   lamps):0,gain=Number.isFinite(cue)?Math.max(0,cue):1;
 return {color:practical.color,distance:practical.distance,
   intensity:(energy*PRACTICAL_SHARE+practical.intensity)*gain*(1+.12*focusWeight(focused))};
}
const PRACTICAL_SHARE=.22;
// A focused room's lamp lifts 12%; a weight between 0 and 1 eases it so focus changes never jump in brightness.
const focusWeight=f=>f===true?1:Number.isFinite(f)?Math.min(1,Math.max(0,f)):0;
// The tier decides shadows; sharpness is the device's own up to 3x (a 3x iPhone draws every pixel), unless
// the player chose Low. The pixel governor below steps it down only while frames are actually slow.
export const PIXEL_CEILING=3,PIXEL_FLOOR=1,LOW_PIXELS=1.25;
export function detail(width,height,preference='auto',dpr=1){
 const level=preference==='high'?'high':preference==='low'?'low':Math.min(width,height)<700?'low':'high';
 return {level,pixelRatio:clamp(dpr,1,preference==='low'?LOW_PIXELS:PIXEL_CEILING),shadows:level==='high'};
}
// Adaptive sharpness: a smoothed frame time over 20 ms for 1.5 s drops a quarter step; under 17.5 ms (60 fps
// or better) for 6 s climbs one back, never above the ceiling. A level that has already proved too slow waits
// twice as long each time (up to about three minutes) before it is tried again, so a device never see-saws.
// The first seconds (shader compiles) are ignored; one stall cannot move it, only a slow stretch can.
// Pure: the caller passes each frame's dt and the ceiling, and gets the ratio to draw.
export const PIXEL_STEP=.25,SLOW_FRAME=.020,FAST_FRAME=.0175,SLOW_HOLD=1.5,FAST_HOLD=6,WARM_UP=2;
export function pixelGovernor(){
 let scale=null,ema=null,slow=0,fast=0,seen=0;
 const failed=new Map(),key=v=>Math.round(v*100);
 const wait=v=>FAST_HOLD*2**Math.min(5,failed.get(key(v))??0);
 return {ratio(max,dt){
  const top=clamp(max,PIXEL_FLOOR,PIXEL_CEILING);if(scale===null||scale>top)scale=top;
  if(Number.isFinite(dt)&&dt>0){dt=Math.min(dt,.1);seen+=dt;if(seen>WARM_UP){
   ema=ema===null?dt:ema+(dt-ema)*.12;
   if(ema>SLOW_FRAME){slow+=dt;fast=0}else if(ema<FAST_FRAME){fast+=dt;slow=0}else{slow=0;fast=0}
   if(slow>=SLOW_HOLD&&scale>PIXEL_FLOOR){failed.set(key(scale),(failed.get(key(scale))??0)+1);
    scale=Math.max(PIXEL_FLOOR,scale-PIXEL_STEP);slow=0;ema=null}
   else if(scale<top&&fast>=wait(Math.min(top,scale+PIXEL_STEP))){
    scale=Math.min(top,scale+PIXEL_STEP);fast=0;ema=null}}}
  return Math.round(scale*100)/100;
 }};
}
export function framing(width,height,roomId=null,presentation={}){
 const w=Number.isFinite(width)?Math.max(1,width):390,h=Number.isFinite(height)?Math.max(1,height):844;
 const aspect=w/h,room=ROOMS.find(r=>r.id===roomId);
 const heightWorld=Math.max(11.7,10.8/aspect);
 if(!room)return {height:heightWorld,zoom:1,target:[0,3.65,0]};
 // Fit the room's projected width and depth inside the free playfield. A fixed
 // phone zoom cut off the tin, plant and cabinet at the edges of the room.
 const phone=w<700&&h>w,short=h<560;
 // The controller supplies measured visible HUD bounds. Defaults are the
 // folded browsing edge, never reservations for unopened selection panels.
 const top=clamp(presentation?.top??(phone?136:short?48:112),0,h-120);
 const bottom=clamp(presentation?.bottom??(phone?128:short?138:160),0,h-120);
 const usable=Math.max(120,h-top-bottom),span=Math.max(5.95/aspect,4.25*h/usable),zoom=Math.min(1.85,heightWorld/span);
 const effectiveSpan=heightWorld/zoom,upY=Math.hypot(5.8,24)/Math.hypot(5.8,5.6,24);
 // Tall phones are width-bound. Place the selected room toward the lower
 // safe edge, keeping adjoining-room context above instead of blank canvas.
 const roomPixels=4.25/effectiveSpan*h,slack=Math.max(0,usable-roomPixels);
 const center=top+roomPixels/2+slack*(phone?.8:.5),offset=(center/h-.5)*effectiveSpan/upY;
 // A subject (room-local [x, y]) is put at the centre of the screen at the same scale: a new household's first
 // view centres the tea set, the first thing the house asks for.
 const subject=presentation?.subject;
 if(Array.isArray(subject)&&subject.length===2&&subject.every(Number.isFinite))
  return {height:heightWorld,aspect,zoom,target:[room.x+subject[0],room.y+subject[1],.325]};
 return {height:heightWorld,aspect,zoom,target:[room.x,room.y+1.875+offset,.325]};
}

// Shader uniforms are linear RGB. Hex art-direction swatches are sRGB.
// Explicit conversion prevents an intended midnight blue becoming pale gray.
export function nightSky(){
 const linear=hex=>[16,8,0].map(shift=>{const c=((hex>>shift)&255)/255;
 return c<=.04045?c/12.92:Math.pow((c+.055)/1.055,2.4)});
 return {bottom:linear(0x292940),top:linear(0x10162c),glow:linear(0x1b1830)};
}

// Golden hour: the last stretch of daylight before the clock turns to night
// (clock 120) glows warm for about half a minute, then hands over to the night
// look. Pure and bounded; 0 for the rest of the day.
export function duskGlow(clock){
 const c=Number.isFinite(clock)?clock:0,ramp=x=>{const t=clamp(x,0,1);return t*t*(3-2*t)};
 return ramp((c-96)/14)*(1-ramp((c-118)/8));
}
