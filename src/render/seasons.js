import * as T from 'three';
import {softTexture} from './textiles.js';

// Seasonal drift over the courtyard from the device calendar: olive leaves in autumn, snow in winter,
// almond petals in spring, jasmine flowers on summer nights. One point cloud; still under reduced motion.
export const SEASON_LOOK={
 autumn:{color:0xc98a4a,size:.10,count:28,fall:.22,sway:.35,night:1},
 winter:{color:0xf6f3ee,size:.065,count:40,fall:.16,sway:.18,night:1},
 spring:{color:0xf2c3cf,size:.085,count:30,fall:.12,sway:.4,night:1},
 summer:{color:0xfff1d6,size:.06,count:16,fall:.05,sway:.25,night:.4},
};
const COUNT=40,TOP=5.2,BOTTOM=-.1;
// Where flake i is at time t: it falls, wraps to the top and sways sideways. Pure, for tests.
export function driftPoint(i,t,look,still){
 const x0=Math.sin(i*12.9898)*4.9,z=2.2+Math.cos(i*4.1414)*.8,phase=((i*.618)%1);
 const span=TOP-BOTTOM,y=still?BOTTOM+phase*span:TOP-((phase*span+t*look.fall)%span);
 return [x0+(still?0:Math.sin(t*.7+i)*look.sway),y,z];
}
export function createSeasons(parent){
 const positions=new Float32Array(COUNT*3),geometry=new T.BufferGeometry();
 geometry.setAttribute('position',new T.BufferAttribute(positions,3));
 const points=new T.Points(geometry,new T.PointsMaterial({map:softTexture(),color:0xffffff,size:.08,
   transparent:true,opacity:.85,depthWrite:false}));points.name='season-drift';parent.add(points);
 const status={season:null,count:0};let season=null,stillDrawn=false;
 return {points,status,setSeason(value){if(!Object.hasOwn(SEASON_LOOK,value))value=null;season=value;
  stillDrawn=false;status.season=value},
 update(state,night){
  const look=season&&SEASON_LOOK[season];points.visible=Boolean(look);if(!look){status.count=0;return}
  const still=state.settings.reducedMotion||state.paused;const count=Math.round(look.count*(night>.5?look.night:1));
  status.count=count;geometry.setDrawRange(0,count);points.material.color.setHex(look.color);
  points.material.size=look.size;if(still&&stillDrawn)return;
  for(let i=0;i<count;i++)positions.set(driftPoint(i,state.elapsed,look,still),i*3);
  geometry.attributes.position.needsUpdate=true;stillDrawn=still;
 }};
}
