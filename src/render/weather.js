import * as T from 'three';
import {rainyDay} from '../simulation.js';

// Soft rain on rainy days: thin pale streaks falling past the courtyard, one line batch, no lights.
// Under reduced motion the streaks hold still and stay faint.
const STREAKS=48,TOP=6,BOTTOM=-.15,LENGTH=.32;
export function streak(i,t,still){
 const x=Math.sin(i*78.233)*5.1,z=2.0+Math.cos(i*12.9)*1.1,phase=(i*.381)%1,span=TOP-BOTTOM;
 const y=still?BOTTOM+phase*span:TOP-((phase*span+t*3.2)%span);
 return [x,y,z,x-.03,y-LENGTH,z];
}
export function createWeather(parent){
 const positions=new Float32Array(STREAKS*6),geometry=new T.BufferGeometry();
 geometry.setAttribute('position',new T.BufferAttribute(positions,3));
 const rain=new T.LineSegments(geometry,new T.LineBasicMaterial({color:0xc9d3df,transparent:true,opacity:.42,
   depthWrite:false}));rain.name='soft-rain';rain.visible=false;rain.frustumCulled=false;parent.add(rain);
 const status={rain:false};let drawnStill=false;
 return {rain,status,update(state,night){
  const on=rainyDay(state);rain.visible=on;status.rain=on;if(!on)return;
  const still=state.settings.reducedMotion||state.paused;rain.material.opacity=(still?.25:.42)*(1-.35*night);
  if(still&&drawnStill)return;
  for(let i=0;i<STREAKS;i++)positions.set(streak(i,state.elapsed,still),i*6);
  geometry.attributes.position.needsUpdate=true;drawnStill=still;
 }};
}
