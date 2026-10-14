import * as T from 'three';
import {rainyDay} from '../simulation.js';

// Soft rain on rainy days: pale streak sprites falling past the courtyard in one point batch, no lights.
// Point sizes are screen pixels under the orthographic camera. Reduced motion holds them still and faint.
const STREAKS=48,TOP=6,BOTTOM=-.15;
export const RAIN_PIXELS=22;
export function streak(i,t,still){
 const x=Math.sin(i*78.233)*5.1,z=2.0+Math.cos(i*12.9)*1.1,phase=(i*.381)%1,span=TOP-BOTTOM;
 const y=still?BOTTOM+phase*span:TOP-((phase*span+t*3.2)%span);
 return [x,y,z];
}
function streakTexture(){
 const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');
 const g=x.createLinearGradient(0,0,0,64);g.addColorStop(0,'rgba(255,255,255,0)');
 g.addColorStop(1,'rgba(255,255,255,1)');
 x.fillStyle=g;x.fillRect(29,2,6,60);return new T.CanvasTexture(c);
}
export function createWeather(parent){
 const positions=new Float32Array(STREAKS*3),geometry=new T.BufferGeometry();
 geometry.setAttribute('position',new T.BufferAttribute(positions,3));
 const rain=new T.Points(geometry,new T.PointsMaterial({map:streakTexture(),color:0x8fa3b8,size:RAIN_PIXELS,
   sizeAttenuation:false,transparent:true,opacity:.7,depthWrite:false}));
 rain.name='soft-rain';rain.visible=false;rain.frustumCulled=false;parent.add(rain);
 const status={rain:false};let drawnStill=false;
 return {rain,status,update(state,night){
  const on=rainyDay(state);rain.visible=on;status.rain=on;if(!on)return;
  const still=state.settings.reducedMotion||state.paused;rain.material.opacity=(still?.4:.7)*(1-.3*night);
  if(still&&drawnStill)return;
  for(let i=0;i<STREAKS;i++)positions.set(streak(i,state.elapsed,still),i*3);
  geometry.attributes.position.needsUpdate=true;drawnStill=still;
 }};
}
