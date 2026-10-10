import * as T from 'three';

// Camera state is presentation-only. Whole-house reset remains instantaneous; room visits ride a critically
// damped spring (no overshoot) that starts from the camera's current pose and velocity, so a new destination,
// the intro's handoff or a skip never restarts from rest. Direct camera input still cancels it at once.
export const ROOM_RESPONSE=.45;
const RAMP=.3;
const CHANNELS=8;// target xyz, camera position xyz, zoom, orthographic height
// Exact critically damped step for any dt: stable at low frame rates where Euler integration would explode.
export function springStep(x,v,omega,dt){
 const e=Math.exp(-omega*dt),c=v+omega*x;return [(x+c*dt)*e,(v-omega*c*dt)*e];
}
function poseVector(camera,controls){
 return [...controls.target.toArray(),...camera.position.toArray(),camera.zoom,camera.top-camera.bottom];
}
function validPose(pose){
 if(!Array.isArray(pose?.target)||pose.target.length!==3||!pose.target.every(Number.isFinite)||
   !Number.isFinite(pose.zoom))return null;
 const eye=Object.hasOwn(pose,'eyeOffset')?pose.eyeOffset:[5.8,5.6,24];
 if(!Array.isArray(eye)||eye.length!==3||!eye.every(Number.isFinite)||Math.hypot(...eye)<.1)return null;
 return eye;
}
// Velocity a spring may start with: never faster toward the goal than the spring itself would close the gap,
// so a carried velocity eases in without overshooting a target nothing threw.
function startVelocity(gap,velocity,omega){
 if(!Number.isFinite(velocity))return 0;
 return gap*velocity>0?Math.sign(velocity)*Math.min(Math.abs(velocity),.8*omega*Math.abs(gap)):velocity;
}
export function createCameraMove(camera,controls){
 let flight=null;
 function apply(values,aspect){
  controls.target.set(values[0],values[1],values[2]);camera.position.set(values[3],values[4],values[5]);
  camera.zoom=values[6];
  if(flight.toHeight){const h=values[7];camera.top=h/2;camera.bottom=-h/2;camera.left=-h*aspect/2;
   camera.right=h*aspect/2}
  camera.updateProjectionMatrix();camera.lookAt(controls.target);
 }
 function tick(dt,instant=false){
  if(!flight)return false;if(!instant&&(!Number.isFinite(dt)||dt<=0))return true;
  const step=instant?Infinity:Math.min(.1,dt);let settled=true;
  // The spring's pull eases in over the first part of its response, so a glide from rest gathers speed instead
  // of lurching, while a carried velocity simply keeps going until the pull arrives.
  if(step!==Infinity)flight.age+=step;const omega=flight.omega*Math.min(1,flight.age/flight.ramp);
  for(let i=0;i<CHANNELS;i++){
   if(step===Infinity){flight.x[i]=0;flight.v[i]=0;continue}
   [flight.x[i],flight.v[i]]=springStep(flight.x[i],flight.v[i],omega,step);
   const scale=Math.max(1,Math.abs(flight.goal[i]));
   if(Math.abs(flight.x[i])>1e-4*scale||Math.abs(flight.v[i])>2e-3*scale)settled=false;
  }
  if(settled)flight.x.fill(0);
  apply(flight.goal.map((g,i)=>g+flight.x[i]),flight.aspect);controls.update();
  // OrbitControls normalizes its cursor radius; restore the exact authored endpoint after that round trip.
  if(settled){apply(flight.goal,flight.aspect);flight=null}
  return Boolean(flight);
 }
 // The live velocity of every channel, per second (zero when still), so the next motion can inherit it.
 function velocity(){return flight?[...flight.v]:new Array(CHANNELS).fill(0)}
 return {get active(){return Boolean(flight)},cancel(){flight=null},tick,velocity,
  // options: true (instant) or {instant, response (seconds), velocity (8 channels per second)}.
  moveTo(pose,options=false){
   const eye=validPose(pose);if(!eye)return false;
   const {instant=false,response=ROOM_RESPONSE,velocity:carried=null}=typeof options==='object'&&options?
     options:{instant:Boolean(options)};
   const damping=controls.enableDamping;controls.enableDamping=false;controls.update();controls.enableDamping=damping;
   const to=new T.Vector3(...pose.target),current=poseVector(camera,controls);
   const toHeight=Number.isFinite(pose.height)&&pose.height>0?pose.height:null;
   const goal=[...to.toArray(),...to.clone().add(new T.Vector3(...eye)).toArray(),
     T.MathUtils.clamp(pose.zoom,controls.minZoom,controls.maxZoom),toHeight??current[7]];
   const aspect=Number.isFinite(pose.aspect)&&pose.aspect>0?pose.aspect:(camera.right-camera.left)/current[7];
   // Asking again for where the camera is already gliding keeps that glide, its pace and its velocity.
   if(flight&&!instant&&goal.every((g,i)=>Math.abs(g-flight.goal[i])<1e-6))return true;
   const seconds=Math.max(.05,Number.isFinite(response)?response:ROOM_RESPONSE),omega=2*Math.PI/seconds;
   const from=carried??velocity();
   if(!flight&&!instant&&current.every((c,i)=>Math.abs(c-goal[i])<1e-9)&&from.every(v=>!v))return true;
   flight={goal,toHeight,aspect,omega,age:0,ramp:RAMP*seconds,x:current.map((c,i)=>c-goal[i]),
     v:current.map((c,i)=>startVelocity(goal[i]-c,from[i]??0,omega))};
   if(instant)tick(0,true);return true;
  }
 };
}
