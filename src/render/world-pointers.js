import {Vector3} from 'three';
import {bindAll} from '../event-bindings.js';

// A finger is wider than a doll's teacup (2026-11-14, owner: "most things are not tappable"):
// a tap that misses every target takes the nearest one whose centre is within slop CSS px on screen.
const at=new Vector3();
export function nearestTarget(targets,camera,rect,x,y,slop=36){
 let best=null,bestD=slop*slop;
 for(const target of targets){
  if(!target.userData||!Object.keys(target.userData).length)continue;
  target.getWorldPosition(at).project(camera);
  if(at.z<-1||at.z>1)continue;
  const dx=rect.left+(at.x+1)/2*rect.width-x,dy=rect.top+(1-at.y)/2*rect.height-y,d=dx*dx+dy*dy;
  if(d<bestD){bestD=d;best=target}
 }
 return best;
}

// Touch and pointer input on the canvas: taps pick residents, objects, the ghost or a placement slot.
export function bindScenePointers(w,{onPick,onError}){
 const {st,canvas,camera,controls,ray,mouse,residents,objects,ghost,slots,tapGesture,scenePointers}=w;
 const pointerup=e=>{
  scenePointers.delete(e.pointerId);
  if(!tapGesture.up(e)||!controls.enabled||st.lost)return;
  const rect=canvas.getBoundingClientRect();
  mouse.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(mouse,camera);
  const targets=st.placement?slots.targets:[...residents.targets,...objects.targets,
    ...(ghost.root.visible?[ghost.hit]:[])];
  const exact=ray.intersectObjects(targets,false)[0]?.object;
  const hit=exact??(st.placement?null:nearestTarget(targets,camera,rect,e.clientX,e.clientY));
  if(hit)onPick(hit.userData);
 };
 const cancel=()=>{scenePointers.clear();tapGesture.cancel()};
 return bindAll([
  [canvas,'pointerdown',e=>{scenePointers.add(e.pointerId);tapGesture.down(e)},false],
  [canvas,'pointermove',e=>tapGesture.move(e),false],[canvas,'pointerup',pointerup,false],
    [canvas,'pointercancel',cancel,false],
  [canvas,'webglcontextlost',e=>{e.preventDefault();st.lost=true;onError('context')},false],
 ]);
}
