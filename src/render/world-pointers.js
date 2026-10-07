import {bindAll} from '../event-bindings.js';

// Touch and pointer input on the canvas: taps pick residents, objects, the ghost or a placement slot.
export function bindScenePointers(w,{onPick,onError}){
 const {st,canvas,camera,controls,ray,mouse,residents,objects,ghost,slots,tapGesture,scenePointers}=w;
 const pointerup=e=>{
  scenePointers.delete(e.pointerId);
  if(!tapGesture.up(e)||!controls.enabled||st.lost)return;
  const rect=canvas.getBoundingClientRect();
  mouse.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(mouse,camera);
  const targets=st.placement?slots.targets:[...residents.targets,...objects.targets,...(ghost.root.visible?[ghost.hit]:[])];
  const hit=ray.intersectObjects(targets,false)[0];if(hit)onPick(hit.object.userData);
 };
 const cancel=()=>{scenePointers.clear();tapGesture.cancel()};
 return bindAll([
  [canvas,'pointerdown',e=>{scenePointers.add(e.pointerId);tapGesture.down(e)},false],
  [canvas,'pointermove',e=>tapGesture.move(e),false],[canvas,'pointerup',pointerup,false],[canvas,'pointercancel',cancel,false],
  [canvas,'webglcontextlost',e=>{e.preventDefault();st.lost=true;onError('context')},false],
 ]);
}
