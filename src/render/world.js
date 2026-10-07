import {buildScene,disposeScene} from './world-scene.js';
import {bindScenePointers} from './world-pointers.js';
import {applyWorkActivity} from './world-work.js';
import {renderFrame} from './world-frame.js';
import {visualStatus} from './world-status.js';
import {houseFraming} from './house-framing.js';
import {portraitFraming} from './doll-camera.js';
import * as T from 'three';
import {ROOMS} from '../content.js';
import {createWorkPicking} from './work-picking.js';
import {createTapGesture} from '../pointer-gesture.js';
import {teaFraming} from './tea-camera.js';
import {stitchFraming} from './stitch-camera.js';
import {chimeFraming} from './chime-camera.js';
import {createCameraMove} from './camera-motion.js';
import {createRoomPresentation} from './room-presentation.js';
import {framing} from './visual-policy.js';

export function createWorld(canvas,{onPick,onError}){
 const {renderer,scene,camera,depthFog,controls,hemi,key,fill,house,residents,ghost,courtyard,portraitCache,details,atmosphere,
   roomEffects,roomFrame,preview,restoration,objects,storyProps,teaTable,sewingPlay,moonChimes,decorSync,slots}=buildScene(canvas);
 
 const st={focusedRoom:null,focusedDoll:null,reducedMotion:false,teaActive:false,stitchActive:false,
   chimeActive:false,chimeSelection:-1,requestedEnabled:true,
   previewPose:null,stitchSections:[],placement:null,disposed:false,lost:false,quality:'',nightMix:0};
 const working=()=>st.teaActive||st.stitchActive||st.chimeActive;const cameraMove=createCameraMove(camera,controls);
 const cancelCameraMove=()=>cameraMove.cancel();controls.addEventListener('start',cancelCameraMove);
 const scenePointers=new Set();
 const presentation=createRoomPresentation(resized=>{if(st.focusedRoom&&!st.focusedDoll)cameraMove.moveTo(focusPose(),st.reducedMotion||resized)},
   ()=>Boolean(objects.selected)||!st.requestedEnabled||scenePointers.size>0);
 function focusPose(){if(st.chimeActive)return chimeFraming(canvas.clientWidth,canvas.clientHeight);
 if(st.teaActive)return teaFraming(canvas.clientWidth,canvas.clientHeight);
 if(st.stitchActive)return stitchFraming(canvas.clientWidth,canvas.clientHeight);
 const p=st.focusedDoll?residents.position(st.focusedDoll):null;if(p){p.add(house.root.position);
 return portraitFraming(canvas.clientWidth,canvas.clientHeight,
   p.toArray())}return houseFraming(canvas.clientWidth,canvas.clientHeight,st.focusedRoom,presentation.value)}
 function applyFraming(){cameraMove.moveTo(focusPose(),true)}
 function home(){if(working())return;st.focusedRoom=null;st.focusedDoll=null;applyFraming()}
 home();
 const ray=new T.Raycaster(),mouse=new T.Vector2();
 function objectAt(x,y){
  const rect=canvas.getBoundingClientRect();
  if(!Number.isFinite(x)||!Number.isFinite(y)||x<rect.left||x>rect.right||y<rect.top||y>rect.bottom||st.lost||working())return null;
  mouse.set((x-rect.left)/rect.width*2-1,-(y-rect.top)/rect.height*2+1);ray.setFromCamera(mouse,camera);
  return ray.intersectObjects(objects.targets,false)[0]?.object.userData.object??null;
 }
 const tapGesture=createTapGesture();
 const setWorkActivity=id=>applyWorkActivity(w,id);
 function setTeaActive(active){if(active)setWorkActivity('tea');else if(st.teaActive)setWorkActivity(null)}
 function setStitchActive(active){if(active)setWorkActivity('stitch');else if(st.stitchActive)setWorkActivity(null)}
 function setChimeActive(active){if(active)setWorkActivity('lullaby');else if(st.chimeActive)setWorkActivity(null)}
 const picking=createWorkPicking({canvas,camera,house,ray,mouse,teaTable,sewingPlay,moonChimes,isActive:id=>id==='tea'?st.teaActive:id==='stitch'?
   st.stitchActive:st.chimeActive,isLost:()=>st.lost,sections:()=>st.stitchSections});
 const {teaAt,teaAimAt,teaPositions,stitchAt,stitchPointAt,stitchPositions,projectStitch,chimeAt,chimePositions,chimePullSpan}=picking;
 const unbindPointers=bindScenePointers({st,canvas,camera,controls,ray,mouse,residents,objects,ghost,
   slots,tapGesture,scenePointers},{onPick,onError});
 function resize(){const w=canvas.clientWidth,h=canvas.clientHeight;const aspect=w/Math.max(1,h),height=focusPose().height;
 camera.left=-height*aspect/2;camera.right=height*aspect/2;camera.top=height/2;camera.bottom=-height/2;
 camera.updateProjectionMatrix();renderer.setSize(w,h,false)}
 let viewportWidth=0,viewportHeight=0;
 function syncViewport(){
  const w=canvas.clientWidth,h=canvas.clientHeight;if(w===viewportWidth&&h===viewportHeight)return false;
  viewportWidth=w;viewportHeight=h;scenePointers.clear();tapGesture.cancel();resize();
  if(st.focusedRoom||st.focusedDoll)applyFraming();return true;
 }
 syncViewport();
 const w={st,canvas,renderer,scene,camera,controls,depthFog,hemi,key,fill,house,residents,ghost,courtyard,details,atmosphere,roomEffects,roomFrame,
   preview,restoration,objects,storyProps,teaTable,sewingPlay,moonChimes,decorSync,slots,portraitCache,cameraMove,presentation,picking,working,
   setWorkActivity,resize,focusPose,applyFraming,tapGesture};
 return {
  renderer,camera,scene,home,syncViewport,setChimeActive,chimeAt,chimePositions,chimePullSpan,
    setChimeSelection(index){st.chimeSelection=Number.isInteger(index)&&index>=0&&index<4?index:-1},
      setTeaActive,teaAt,teaAimAt,teaPositions,setStitchActive,
    stitchAt,stitchPointAt,stitchPositions,projectStitch,
  welcomeBack(times){residents.greetAll(times)},selectObject(key){return objects.select(key)},clearObjectSelection(){objects.clear()},objectAt,
    objectPositions(){return objects.project(camera,canvas.clientWidth,canvas.clientHeight)},
  getPortraits(){return portraitCache.getAll()},
  setPresentation(value,viewport){if(!working())presentation.update(value,viewport)},
  focusRoom(id,immediate=false){if(working()||!ROOMS.some(r=>r.id===id))return false;st.focusedRoom=id;st.focusedDoll=null;
  cameraMove.moveTo(framing(canvas.clientWidth,canvas.clientHeight,id,presentation.value),st.reducedMotion||immediate);return true},
  focusDoll(id){const p=residents.position(id);if(working()||!p)return false;st.focusedDoll=id;
  st.focusedRoom=null;cameraMove.moveTo(focusPose(),st.reducedMotion);return true},
  visualStatus(){return visualStatus(w)},
  zoom(amount){if(working())return;cameraMove.cancel();camera.zoom=T.MathUtils.clamp(camera.zoom*amount,.8,3.5);camera.updateProjectionMatrix()},
  orbit(amount){if(working())return;cameraMove.cancel();const offset=camera.position.clone().sub(controls.target);
  offset.applyAxisAngle(new T.Vector3(0,1,0),amount);camera.position.copy(controls.target).add(offset);controls.update()},
  setEnabled(enabled){st.requestedEnabled=Boolean(enabled);controls.enabled=st.requestedEnabled&&!working();if(!enabled)cameraMove.cancel()},
  setPlacement(item){st.placement=item;slots.setActive(item);if(!item){st.previewPose=null;preview.clear()}},
  setPreview(pose){st.previewPose=pose},
  project(id,height=1.0){const p=residents.position(id);if(!p)return null;p.y+=height;p.add(house.root.position);p.project(camera);
  return {x:(p.x+1)*canvas.clientWidth/2,y:(1-p.y)*canvas.clientHeight/2}},
  render(state,dt,selected){renderFrame(w,state,dt,selected)},
  dispose(){st.disposed=true;portraitCache.dispose();controls.removeEventListener('start',cancelCameraMove);controls.dispose();
  unbindPointers();disposeScene(scene);renderer.dispose()}
 };
}
