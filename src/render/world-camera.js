import * as T from 'three';
import {ROOMS} from '../content.js';
import {framing} from './visual-policy.js';

// The camera-facing part of the world's public API: focusing rooms and residents, zoom, orbit and projection.
export function cameraApi(w){
 const {st,canvas,camera,controls,house,residents,cameraMove,presentation,working,focusPose}=w;
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
  setEnabled(enabled){st.requestedEnabled=Boolean(enabled);
  controls.enabled=st.requestedEnabled&&!working();if(!enabled)cameraMove.cancel()},
  project(id,height=1.0){const p=residents.position(id);if(!p)return null;p.y+=height;
  p.add(house.root.position);p.project(camera);
  return {x:(p.x+1)*canvas.clientWidth/2,y:(1-p.y)*canvas.clientHeight/2}},
 };
}
