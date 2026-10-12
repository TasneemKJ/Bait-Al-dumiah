import {buildScene,disposeScene} from './world-scene.js';
import {bindScenePointers} from './world-pointers.js';
import {applyWorkActivity} from './world-work.js';
import {cameraApi} from './world-camera.js';
import {renderFrame} from './world-frame.js';
import {visualStatus} from './world-status.js';
import {houseFraming} from './house-framing.js';
import {portraitFraming} from './doll-camera.js';
import * as T from 'three';
import {createWorkPicking} from './work-picking.js';
import {createTapGesture} from '../pointer-gesture.js';
import {teaFraming} from './tea-camera.js';
import {stitchFraming} from './stitch-camera.js';
import {chimeFraming} from './chime-camera.js';
import {createCameraMove} from './camera-motion.js';
import {createRoomPresentation} from './room-presentation.js';

// The camera pose for what the player is looking at: a ritual table, a resident, a room or the whole house.
function focusPoseFor(st,canvas,residents,house,presentation){
 const w=canvas.clientWidth,h=canvas.clientHeight;
 if(st.chimeActive)return chimeFraming(w,h);if(st.teaActive)return teaFraming(w,h);
 if(st.stitchActive)return stitchFraming(w,h);
 const p=st.focusedDoll?residents.position(st.focusedDoll):null;
 if(p){p.add(house.root.position);return portraitFraming(w,h,p.toArray())}
 return houseFraming(w,h,st.focusedRoom,presentation.value);
}
// The story object under a screen point, or null outside the canvas.
function pickObject({canvas,camera,ray,mouse,objects},x,y){
 const rect=canvas.getBoundingClientRect();
 if(!Number.isFinite(x)||!Number.isFinite(y)||x<rect.left||x>rect.right||y<rect.top||y>rect.bottom)return null;
 mouse.set((x-rect.left)/rect.width*2-1,-(y-rect.top)/rect.height*2+1);ray.setFromCamera(mouse,camera);
 return ray.intersectObjects(objects.targets,false)[0]?.object.userData.object??null;
}
function fitViewport(canvas,camera,renderer,height){
 const w=canvas.clientWidth,h=canvas.clientHeight,aspect=w/Math.max(1,h);
 camera.left=-height*aspect/2;camera.right=height*aspect/2;camera.top=height/2;camera.bottom=-height/2;
 camera.updateProjectionMatrix();renderer.setSize(w,h,false);
}

export function createWorld(canvas,{onPick,onError}){
 const parts=buildScene(canvas);
 const {renderer,scene,camera,controls,house,residents,ghost,portraitCache,preview,objects,
   teaTable,sewingPlay,moonChimes,slots}=parts;
 const st={focusedRoom:null,focusedDoll:null,reducedMotion:false,teaActive:false,stitchActive:false,
   chimeActive:false,chimeSelection:-1,requestedEnabled:true,
   previewPose:null,stitchSections:[],placement:null,disposed:false,lost:false,quality:'',nightMix:0};
 const working=()=>st.teaActive||st.stitchActive||st.chimeActive;const cameraMove=createCameraMove(camera,controls);
 const cancelCameraMove=()=>cameraMove.cancel();controls.addEventListener('start',cancelCameraMove);
 const scenePointers=new Set();
 const presentation=createRoomPresentation(resized=>{if(st.focusedRoom&&
   !st.focusedDoll)cameraMove.moveTo(focusPose(),st.reducedMotion||resized)},
   ()=>Boolean(objects.selected)||!st.requestedEnabled||scenePointers.size>0);
 function focusPose(){return focusPoseFor(st,canvas,residents,house,presentation)}
 function applyFraming(){cameraMove.moveTo(focusPose(),true)}
 function home(){if(working())return;st.focusedRoom=null;st.focusedDoll=null;applyFraming()}
 home();
 const ray=new T.Raycaster(),mouse=new T.Vector2();
 const objectAt=(x,y)=>st.lost||working()?null:pickObject({canvas,camera,ray,mouse,objects},x,y);
 const tapGesture=createTapGesture();
 const setWorkActivity=id=>applyWorkActivity(w,id);
 const workSwitch=(id,flag)=>active=>{if(active)setWorkActivity(id);else if(st[flag])setWorkActivity(null)};
 const setTeaActive=workSwitch('tea','teaActive'),setStitchActive=workSwitch('stitch','stitchActive');
 const setChimeActive=workSwitch('lullaby','chimeActive');
 const picking=createWorkPicking({canvas,camera,house,ray,mouse,teaTable,sewingPlay,
   moonChimes,isActive:id=>id==='tea'?st.teaActive:id==='stitch'?
   st.stitchActive:st.chimeActive,isLost:()=>st.lost,sections:()=>st.stitchSections});
 const unbindPointers=bindScenePointers({st,canvas,camera,controls,ray,mouse,residents,objects,ghost,
   slots,tapGesture,scenePointers},{onPick,onError});
 const resize=()=>fitViewport(canvas,camera,renderer,focusPose().height);
 let viewportWidth=0,viewportHeight=0;
 function syncViewport(){
  const w=canvas.clientWidth,h=canvas.clientHeight;if(w===viewportWidth&&h===viewportHeight)return false;
  viewportWidth=w;viewportHeight=h;scenePointers.clear();tapGesture.cancel();resize();
  if(st.focusedRoom||st.focusedDoll)applyFraming();return true;
 }
 syncViewport();
 const w={...parts,st,canvas,cameraMove,presentation,picking,working,
   setWorkActivity,resize,focusPose,applyFraming,tapGesture};
 return {
  ...picking,renderer,camera,scene,home,syncViewport,setTeaActive,setStitchActive,setChimeActive,
    setChimeSelection(index){st.chimeSelection=Number.isInteger(index)&&index>=0&&index<4?index:-1},
  welcomeBack(times){residents.greetAll(times)},
    selectObject(key){return objects.select(key)},clearObjectSelection(){objects.clear()},objectAt,
    objectPositions(){return objects.project(camera,canvas.clientWidth,canvas.clientHeight)},
  getPortraits(){return portraitCache.getAll()},
  setPresentation(value,viewport){if(!working())presentation.update(value,viewport)},
  visualStatus(){return visualStatus(w)},
  ...cameraApi(w),
  setPlacement(item){st.placement=item;slots.setActive(item);if(!item){st.previewPose=null;preview.clear()}},
  setPreview(pose){st.previewPose=pose},
  render(state,dt,selected){renderFrame(w,state,dt,selected)},
  dispose(){st.disposed=true;portraitCache.dispose();
  controls.removeEventListener('start',cancelCameraMove);controls.dispose();
  unbindPointers();disposeScene(scene);renderer.dispose()}
 };
}
