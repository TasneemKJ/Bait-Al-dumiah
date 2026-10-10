import * as T from 'three';
import {ROOMS} from '../content.js';
import {framing} from './visual-policy.js';
import {applyIntroPose,introKeys,introPose,introVelocity,INTRO_HANDOFF,SETTLE_RESPONSE,
  SKIP_RESPONSE} from './intro-camera.js';

// The camera-facing part of the world's public API: focusing rooms and residents, zoom, orbit and projection.
export function cameraApi(w){
 const {st,canvas,camera,controls,house,residents,cameraMove,presentation,working,focusPose}=w;
 const kitchenPose=()=>framing(canvas.clientWidth,canvas.clientHeight,'kitchen',presentation.value);
 function handOff(response,seconds){st.introHanded=true;cameraMove.moveTo(kitchenPose(),{response,
   velocity:introVelocity(introKeys(canvas.clientWidth,canvas.clientHeight,presentation.value),seconds)})}
 return {
  focusRoom(id,immediate=false){if(working()||!ROOMS.some(r=>r.id===id))return false;
  st.focusedRoom=id;st.focusedDoll=null;
  cameraMove.moveTo(framing(canvas.clientWidth,canvas.clientHeight,id,presentation.value),
    st.reducedMotion||immediate);return true},
  focusDoll(id){const p=residents.position(id);if(working()||!p)return false;st.focusedDoll=id;
  st.focusedRoom=null;cameraMove.moveTo(focusPose(),st.reducedMotion);return true},
  zoom(amount){if(working())return;cameraMove.cancel();
  camera.zoom=T.MathUtils.clamp(camera.zoom*amount,.8,3.5);camera.updateProjectionMatrix()},
  orbit(amount){if(working())return;cameraMove.cancel();const offset=camera.position.clone().sub(controls.target);
  offset.applyAxisAngle(new T.Vector3(0,1,0),amount);
  camera.position.copy(controls.target).add(offset);controls.update()},
  // Disabling input never freezes an authored room glide: a carry or sheet that starts mid-glide
  // would otherwise strand the camera between rooms, away from where the player aimed.
  // Direct camera input (controls 'start', zoom, orbit) still cancels the glide.
  setEnabled(enabled){st.requestedEnabled=Boolean(enabled);
  controls.enabled=st.requestedEnabled&&!working()},
  // One intro frame. While the scripted beats play the intro owns the camera: a queued glide yields and room
  // focus clears. At the handoff the play camera's own spring takes over from the path's pose and velocity and
  // settles in the kitchen, so play begins inside that motion. Null when the renderer cannot play it.
  introFrame(seconds,still=false){if(st.lost||st.disposed||working())return null;
  const w=canvas.clientWidth,h=canvas.clientHeight,keys=introKeys(w,h,presentation.value);
  if(seconds<=0)st.introHanded=false;
  if(still||seconds<INTRO_HANDOFF){cameraMove.cancel();st.focusedRoom=null;st.focusedDoll=null;
   const pose=introPose(keys,seconds,still);applyIntroPose(camera,controls,pose,w/Math.max(1,h));
   return {beat:pose.beat,done:pose.done}}
  if(!st.introHanded)handOff(SETTLE_RESPONSE,INTRO_HANDOFF);
  const pose=introPose(keys,seconds);return {beat:pose.beat,done:pose.done}},
  // Skip: glide to the kitchen from the live pose, carrying the path's velocity (the still version cuts).
  introSkip(seconds,still=false){if(st.lost||st.disposed||working())return false;
  if(still)return cameraMove.moveTo(kitchenPose(),true);
  if(!st.introHanded)handOff(SKIP_RESPONSE,Math.min(seconds,INTRO_HANDOFF));return true},
  project(id,height=1.0){const p=residents.position(id);if(!p)return null;p.y+=height;
  p.add(house.root.position);p.project(camera);
  return {x:(p.x+1)*canvas.clientWidth/2,y:(1-p.y)*canvas.clientHeight/2}},
 };
}
