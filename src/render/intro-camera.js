import {INTRO_BEATS} from '../content.js';
import {houseFraming} from './house-framing.js';

// The first-launch intro as camera poses over the real house. Presentation only: it reads framing, never state.
// Beats one and two follow one continuous path (no dead stop between them); beat three is the play camera's own
// spring glide into the kitchen, started from the path's live pose and velocity at the handoff.
export const INTRO_SECONDS=INTRO_BEATS.reduce((sum,beat)=>sum+beat.seconds,0);
export const INTRO_HANDOFF=INTRO_SECONDS-INTRO_BEATS.at(-1).seconds;
// Spring responses (seconds): the settle beat lands within its 2.6 s; a skip goes there briskly but softly.
export const SETTLE_RESPONSE=2,SKIP_RESPONSE=.9;
const PLAY_EYE=[5.8,5.6,24],RADIUS=Math.hypot(...PLAY_EYE);
const PLAY_ANGLES=[Math.atan2(PLAY_EYE[0],PLAY_EYE[2]),Math.acos(PLAY_EYE[1]/RADIUS)];
// Azimuth and polar angles stay inside the OrbitControls limits (±0.48, 1.10 to 1.50), so its update never clamps.
const eyeAt=([azimuth,polar])=>[RADIUS*Math.sin(polar)*Math.sin(azimuth),RADIUS*Math.cos(polar),
  RADIUS*Math.sin(polar)*Math.cos(azimuth)];

// Four keys: low and far, the whole house, the upper rooms, then the kitchen exactly as play frames it.
// Zoom never drops below the controls' minimum; the far shot widens the orthographic span instead.
export function introKeys(width,height,presentation={}){
 const house=houseFraming(width,height,null,presentation),upper=houseFraming(width,height,'bedroom',presentation);
 const kitchen=houseFraming(width,height,'kitchen',presentation);
 return [
  {target:[0,4.3,0],angles:[-.42,1.46],zoom:house.zoom,height:house.height*1.55},
  {target:house.target,angles:[-.1,1.32],zoom:house.zoom,height:house.height},
  {target:upper.target,angles:[.34,1.24],zoom:upper.zoom*.86,height:upper.height},
  {target:kitchen.target,angles:PLAY_ANGLES,zoom:kitchen.zoom,height:kitchen.height,eye:PLAY_EYE},
 ];
}
// A key as one flat vector: target xyz, azimuth, polar, zoom, height.
const flat=key=>[...key.target,...key.angles,key.zoom,key.height];
const KEY_TIMES=[0,INTRO_BEATS[0].seconds,INTRO_HANDOFF,INTRO_SECONDS];
// Cubic Hermite through the keys. The first tangent is zero (it eases out of rest); later tangents are
// Catmull-Rom, so the path is velocity-continuous through beat one into beat two and still moving at the handoff.
function pathAt(keys,seconds){
 const p=keys.map(flat),t=Math.min(INTRO_HANDOFF,Math.max(0,Number(seconds)||0)),seg=t<KEY_TIMES[1]?0:1;
 const tangent=i=>i===0?p[0].map(()=>0):p[i].map((_,c)=>(p[i+1][c]-p[i-1][c])/(KEY_TIMES[i+1]-KEY_TIMES[i-1]));
 const t0=KEY_TIMES[seg],span=KEY_TIMES[seg+1]-t0,s=(t-t0)/span,m0=tangent(seg),m1=tangent(seg+1);
 const h00=2*s**3-3*s*s+1,h10=s**3-2*s*s+s,h01=-2*s**3+3*s*s,h11=s**3-s*s;
 return p[seg].map((v,c)=>h00*v+h10*span*m0[c]+h01*p[seg+1][c]+h11*span*m1[c]);
}
const poseOf=(v,eye)=>({target:v.slice(0,3),eye:eye??eyeAt(v.slice(3,5)),zoom:v[5],height:v[6]});
// The beat playing at a time in seconds.
export function introBeat(seconds){
 let start=0;for(const [index,beat] of INTRO_BEATS.entries()){start+=beat.seconds;if(seconds<start)return index}
 return INTRO_BEATS.length-1;
}
// The scripted pose (beats one and two; held at the handoff afterwards). `still` is the reduced-motion version:
// each beat is one still shot of its end key, changed 0.35 s into the beat under the paper veil.
export function introPose(keys,seconds,still=false){
 const beat=introBeat(seconds),done=seconds>=INTRO_SECONDS;
 if(still){let start=0;for(let i=0;i<beat;i++)start+=INTRO_BEATS[i].seconds;
  const shown=beat>0&&seconds-start<VEIL_CUT?beat:beat+1,key=keys[shown];
  return {beat,done,...poseOf(flat(key),key.eye)}}
 return {beat,done,...poseOf(pathAt(keys,seconds))};
}
// The scripted path's velocity per second on the camera-motion channels (target xyz, position xyz, zoom, height).
export function introVelocity(keys,seconds){
 const t=Math.min(INTRO_HANDOFF,Math.max(1/240,seconds)),a=introPose(keys,t-1/240),b=introPose(keys,t);
 const channels=p=>[...p.target,...p.target.map((v,i)=>v+p.eye[i]),p.zoom,p.height];
 const ca=channels(a);return channels(b).map((v,i)=>(v-ca[i])*240);
}
// The paper veil: it lifts off the Home screen over the first second, and in the still version dips over each
// shot change so the cut happens unseen. Opacity is driven here, not by CSS, so it survives the reduced-motion
// stylesheet that removes animations.
export const VEIL_CUT=.35;
export function introVeil(seconds,still=false){
 const t=Math.max(0,Number(seconds)||0),ease=x=>{const k=Math.min(1,Math.max(0,x));return k*k*(3-2*k)};
 let veil=1-ease(t/1.1);
 if(still){let start=0;for(const beat of INTRO_BEATS.slice(0,-1)){start+=beat.seconds;const d=t-start;
  if(d>-VEIL_CUT&&d<.8)veil=Math.max(veil,.88*(d<0?ease((d+VEIL_CUT)/VEIL_CUT):1-ease((d-VEIL_CUT)/.45)))}}
 return veil;
}
// The camera at a pose: target, eye offset, zoom and the orthographic span for the canvas aspect.
export function applyIntroPose(camera,controls,pose,aspect){
 controls.target.set(...pose.target);
 camera.position.set(pose.target[0]+pose.eye[0],pose.target[1]+pose.eye[1],pose.target[2]+pose.eye[2]);
 camera.zoom=pose.zoom;camera.top=pose.height/2;camera.bottom=-pose.height/2;
 camera.left=-pose.height*aspect/2;camera.right=pose.height*aspect/2;
 camera.updateProjectionMatrix();camera.lookAt(controls.target);
}
