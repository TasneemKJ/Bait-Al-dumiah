import {buildScene,disposeScene} from './world-scene.js';
import {bindScenePointers} from './world-pointers.js';
import {applyWorkActivity} from './world-work.js';
import {cameraApi} from './world-camera.js';
import {renderFrame} from './world-frame.js';
import {takePicture} from './world-picture.js';
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
// A finger is wider than a doll's teacup: a tap that misses every object still takes the nearest one whose
// centre lies within PICK_SLOP CSS pixels on screen (2026-11-14, owner: "most things are not tappable").
const PICK_SLOP=36,pickPoint=new T.Vector3();
function pickObject({canvas,camera,ray,mouse,objects},x,y){
 const rect=canvas.getBoundingClientRect();
 if(!Number.isFinite(x)||!Number.isFinite(y)||x<rect.left||x>rect.right||y<rect.top||y>rect.bottom)return null;
 mouse.set((x-rect.left)/rect.width*2-1,-(y-rect.top)/rect.height*2+1);ray.setFromCamera(mouse,camera);
 const hit=ray.intersectObjects(objects.targets,false)[0]?.object.userData.object;
 if(hit)return hit;
 let best=null,bestD=PICK_SLOP*PICK_SLOP;
 for(const target of objects.targets){
  if(!target.userData.object)continue;
  target.getWorldPosition(pickPoint).project(camera);
  if(pickPoint.z<-1||pickPoint.z>1)continue;
  const dx=rect.left+(pickPoint.x+1)/2*rect.width-x,dy=rect.top+(1-pickPoint.y)/2*rect.height-y,d=dx*dx+dy*dy;
  if(d<bestD){bestD=d;best=target.userData.object}
 }
 return best;
}
// A point in the house's own space, in CSS pixels on the page (null when there is none).
function screenPoint(canvas,camera,house,p){if(!p)return null;house.root.updateWorldMatrix(true,false);
 p.applyMatrix4(house.root.matrixWorld).project(camera);const r=canvas.getBoundingClientRect();
 return {x:r.left+(p.x+1)/2*r.width,y:r.top+(1-p.y)/2*r.height}}
// The canary (the App Store's answer, never saved): present or not, a song, and a point above its cage.
const canaryApi=(canary,canvas,camera,house)=>({setCanary(on){canary.setPresent(on)},
 canarySing(t,soft){canary.sing(t,soft)},canaryPoint(){return canary.root.visible?screenPoint(canvas,camera,house,
  canary.root.position.clone().add(new T.Vector3(0,.55,0))):null}});
// The midnight visitor: a found thing flies home, a wrong place puffs; points are for the caption.
function mischiefApi({mischief},canvas,camera,house,objects){
 // A story object that doubles as a hiding place (the quilt) answers from its own touch volume.
 mischief.setPropPoint(id=>objects.targets.find(o=>o.userData.object==='prop:'+id)?.position.clone()??null);
 return {mischiefFound(item,spot){mischief.found(item,spot)},mischiefPuff(spot,near){mischief.puff(spot,near)},
  mischiefPoint(kind,id){return screenPoint(canvas,camera,house,mischief.point(kind,id))},
  mischiefSpots(){return mischief.targets.map(t=>({key:t.userData.nook,room:t.userData.room,
   ...screenPoint(canvas,camera,house,t.position.clone())}))}};
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
   previewPose:null,stitchSections:[],placement:null,disposed:false,lost:false,quality:'',pixelRatio:0,
   nightMix:0,lightingReady:false};
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
   slots,tapGesture,scenePointers,mischief:parts.mischief,house},{onPick,onError});
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
  welcomeBack(times){residents.greetAll(times)},greet(id){residents.greet(id)},
    selectObject(key){return objects.select(key)},clearObjectSelection(){objects.clear()},objectAt,
    objectPositions(){return objects.project(camera,canvas.clientWidth,canvas.clientHeight)},
  setPresentation(value,viewport){if(!working())presentation.update(value,viewport)},
  visualStatus(){return visualStatus(w)},getPortraits(){return portraitCache.getAll()},
  ...cameraApi(w),
  setPlacement(item){st.placement=item;slots.setActive(item);if(!item){st.previewPose=null;preview.clear()}},
  setPreview(pose){st.previewPose=pose},picture:(s,use)=>takePicture(w,s,use),stirCurtain:parts.roomEffects.stir,
  ...mischiefApi(parts,canvas,camera,house,objects),
  ...canaryApi(parts.canary,canvas,camera,house),setVisit:parts.residents.setVisit,
  render(state,dt,selected){renderFrame(w,state,dt,selected)},
  dispose(){st.disposed=true;portraitCache.dispose();
  controls.removeEventListener('start',cancelCameraMove);controls.dispose();
  unbindPointers();disposeScene(scene);renderer.dispose()}
 };
}
