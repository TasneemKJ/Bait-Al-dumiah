import {Vector3,Plane} from 'three';
import {ROOMS} from '../content.js';
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

// The room whose open front a ray crosses (the house's facade plane), or null outside the house.
const facade=new Plane(),crossing=new Vector3(),normal=new Vector3(0,0,1);
export function roomUnder(ray,house){
 const origin=house.root.getWorldPosition(new Vector3());
 facade.setFromNormalAndCoplanarPoint(normal,origin.setZ(origin.z+1.9));
 if(!ray.ray.intersectPlane(facade,crossing))return null;house.root.worldToLocal(crossing);
 return ROOMS.find(r=>Math.abs(crossing.x-r.x)<2.3&&crossing.y>=r.y&&crossing.y<r.y+3.2)?.id??null;
}
// Touch and pointer input on the canvas: taps pick residents, objects, the ghost or a placement slot.
// The music box key's two gestures (src/render/music-boxes.js): a drag that carries the key to another room, and
// a circle of the finger round a box that winds it. Both hold the camera still while the finger is down.
const TAU=Math.PI*2,wrap=a=>a>Math.PI?a-TAU:a<-Math.PI?a+TAU:a;
function screenOf(point,camera,rect){point.project(camera);
 return {x:rect.left+(point.x+1)/2*rect.width,y:rect.top+(1-point.y)/2*rect.height}}
function musicGestures(w,onPick,cast){
 const {st,canvas,camera,controls,musicBoxes,house}=w;let g=null;
 const release=()=>{if(g?.controls!==undefined)controls.enabled=g.controls;musicBoxes.hold(false);g=null};
 return {
  down(e){const m=st.music;if(g||!m||st.placement||st.lost||!controls.enabled)return;
   const hit=cast(e,musicBoxes.targets)?.userData;if(!hit)return;
   if(hit.musicKey)g={kind:'key',x:e.clientX,y:e.clientY,moved:false,controls:controls.enabled};
   else if(hit.musicBox&&m.open&&m.key===hit.room){const c=screenOf(musicBoxes.point('box',hit.musicBox),camera,
    canvas.getBoundingClientRect());g={kind:'wind',doll:hit.musicBox,c,a:Math.atan2(e.clientY-c.y,e.clientX-c.x),
    total:0,best:0,controls:controls.enabled}}
   if(g)controls.enabled=false},
  move(e){if(!g)return;
   if(g.kind==='key'){if(!g.moved&&Math.hypot(e.clientX-g.x,e.clientY-g.y)>10){g.moved=true;musicBoxes.hold(true)}
    return}
   const a=Math.atan2(e.clientY-g.c.y,e.clientX-g.c.x),d=wrap(a-g.a);g.a=a;if(Math.abs(d)>Math.PI/2)return;
   g.total+=d;const best=Math.abs(g.total)/TAU;
   if(best>g.best+.02){onPick({wind:{doll:g.doll,turns:best-g.best}});g.best=best}},
  // True when the gesture used the touch, so it is not also a tap.
  up(e){if(!g)return false;const used=g.kind==='key'?g.moved:g.best>=.05;
   if(g.kind==='key'&&g.moved){const box=cast(e,musicBoxes.targets.filter(x=>x.userData.musicBox))?.userData;
    const room=box?.room??roomUnder(cast.ray(e),house);if(room)onPick({keyTo:room})}
   release();return used},
  cancel:release,
 };
}
export function bindScenePointers(w,{onPick,onError}){
 const {st,canvas,camera,controls,ray,mouse,residents,objects,ghost,slots,tapGesture,scenePointers,mischief,house,
   musicBoxes,courtyard}=w;
 const aim=e=>{const rect=canvas.getBoundingClientRect();
  mouse.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(mouse,camera);
  return ray};
 const cast=(e,targets)=>aim(e).intersectObjects(targets,false)[0]?.object??null;cast.ray=aim;
 const music=musicGestures(w,onPick,cast);
 const pointerup=e=>{
  scenePointers.delete(e.pointerId);
  if(music.up(e)){tapGesture.cancel();return}
  if(!tapGesture.up(e)||!controls.enabled||st.lost)return;
  const rect=canvas.getBoundingClientRect();aim(e);
  const targets=st.placement?slots.targets:[...residents.targets,...objects.targets,...mischief.targets,
    ...musicBoxes.targets,...(courtyard?.doorHit?[courtyard.doorHit]:[]),...(ghost.root.visible?[ghost.hit]:[])];
  const exact=ray.intersectObjects(targets,false)[0]?.object;
  const hit=exact??(st.placement?null:nearestTarget(targets,camera,rect,e.clientX,e.clientY));
  // On the whole house a prop is a few pixels wide, so a touch on or near one opens its room first
  // (iOS QA: a near touch snapped to the basin and the room never opened); in the room it selects.
  // Residents and the ghost still answer at once. A touch that hits nothing opens the room under it.
  const whole=!st.placement&&!st.focusedRoom&&!st.focusedDoll;
  if(hit&&!(whole&&hit.userData.object))onPick(hit.userData);
  else if(whole){const room=roomUnder(ray,house);
   if(room)onPick({roomTap:room});else if(hit)onPick(hit.userData)}
  // Inside a room a touch on a bare wall or floor still gets an answer: whoever lives there looks up.
  else if(!hit&&!st.placement&&st.focusedRoom)onPick({roomTouch:st.focusedRoom})
 };
 const cancel=()=>{scenePointers.clear();tapGesture.cancel();music.cancel()};
 return bindAll([
  [canvas,'pointerdown',e=>{scenePointers.add(e.pointerId);tapGesture.down(e);
   if(scenePointers.size===1)music.down(e)},false],
  [canvas,'pointermove',e=>{tapGesture.move(e);music.move(e)},false],[canvas,'pointerup',pointerup,false],
    [canvas,'pointercancel',cancel,false],
  [canvas,'webglcontextlost',e=>{e.preventDefault();st.lost=true;onError('context')},false],
 ]);
}
