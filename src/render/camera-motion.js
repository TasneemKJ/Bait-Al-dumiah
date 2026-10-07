import * as T from 'three';

// Camera state is presentation-only. Whole-house reset remains instantaneous;
// room visits ease for 420 ms and yield immediately to direct camera input.
export function createCameraMove(camera,controls){
 let flight=null;
 function tick(dt,instant=false){
  if(!flight)return false;if(!instant&&(!Number.isFinite(dt)||dt<=0))return true;
  flight.elapsed=Math.min(.42,flight.elapsed+Math.min(.1,Math.max(0,dt||0)));
  const phase=instant?1:flight.elapsed/.42,ease=phase*phase*(3-2*phase);
  controls.target.lerpVectors(flight.from,flight.to,ease);camera.position.lerpVectors(flight.fromCamera,flight.toCamera,ease);
  camera.zoom=T.MathUtils.lerp(flight.fromZoom,flight.toZoom,ease);if(phase>=1){controls.target.copy(flight.to);camera.position.copy(flight.toCamera);
  camera.zoom=flight.toZoom}if(flight.toHeight){const height=T.MathUtils.lerp(flight.fromHeight,flight.toHeight,ease);camera.top=height/2;
  camera.bottom=-height/2;camera.left=-height*flight.aspect/2;camera.right=height*flight.aspect/2}camera.updateProjectionMatrix();controls.update();
  if(phase>=1){
   // OrbitControls normalizes its cursor radius even when unbounded; restore
   // the exact authored endpoint after that floating-point round trip.
   controls.target.copy(flight.to);camera.position.copy(flight.toCamera);camera.zoom=flight.toZoom;camera.lookAt(controls.target);flight=null;
  }return Boolean(flight);
 }
 return {get active(){return Boolean(flight)},cancel(){flight=null},tick,
  moveTo(pose,instant=false){
   if(!Array.isArray(pose?.target)||pose.target.length!==3||!pose.target.every(Number.isFinite)||!Number.isFinite(pose.zoom))return false;
   const eye=Object.hasOwn(pose,'eyeOffset')?pose.eyeOffset:[5.8,5.6,24];
   if(!Array.isArray(eye)||eye.length!==3||!eye.every(Number.isFinite)||Math.hypot(...eye)<.1)return false;
   const damping=controls.enableDamping;controls.enableDamping=false;controls.update();controls.enableDamping=damping;
   const to=new T.Vector3(...pose.target);
   flight={fromHeight:camera.top-camera.bottom,toHeight:Number.isFinite(pose.height)&&pose.height>0?pose.height:null,
     aspect:Number.isFinite(pose.aspect)&&pose.aspect>0?pose.aspect:(camera.right-camera.left)/(camera.top-camera.bottom),elapsed:0,
     from:controls.target.clone(),to,fromCamera:camera.position.clone(),toCamera:to.clone().add(new T.Vector3(...eye)),fromZoom:camera.zoom,
     toZoom:T.MathUtils.clamp(pose.zoom,controls.minZoom,controls.maxZoom)};
   if(instant)tick(0,true);return true;
  }
 };
}
