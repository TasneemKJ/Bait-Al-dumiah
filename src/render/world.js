import {createLevantineSetting} from './levantine-setting.js';
import {portraitFraming} from './doll-camera.js';
import * as T from 'three';
import {renderPortrait,createPortraitCache} from './doll-portraits.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {ROOMS,SLOTS,TEA_TABLE,STITCH_TABLE} from '../content.js';
import {isNight,stitchStatus} from '../simulation.js';
import {createTapGesture} from '../pointer-gesture.js';
import {createHouse,makeFurniture} from './house.js';
import {createDolls,createGhost} from './dolls.js';
import {createCraftDetails,createGarden} from './ornaments.js';
import {createKeepsakeDetails} from './keepsake-details.js';
import {createPlacementPreview} from './placement-preview.js';
import {createRoomFrame} from './room-frame.js';
import {createRoomEffects} from './room-effects.js';
import {createObjectInteractions} from './object-interactions.js';
import {createStoryProps} from './story-props.js';
import {createTeaTable} from './tea-table.js';
import {teaFraming} from './tea-camera.js';
import {createSewingPlay} from './sewing-play.js';
import {stitchFraming} from './stitch-camera.js';
import {createMoonChimes,CHIME_LAYOUT} from './moon-chimes.js';
import {chimeFraming} from './chime-camera.js';
import {createRestoration} from './restoration.js';
import {createCameraMove} from './camera-motion.js';
import {createRoomPresentation} from './room-presentation.js';
import {createAtmosphere} from './atmosphere.js';
import {lighting,detail,framing,fog as fogPolicy,roomLighting} from './visual-policy.js';

export function createWorld(canvas,{onPick,onError}){
 const renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance'});
 renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
 const scene=new T.Scene(), camera=new T.OrthographicCamera(-10,10,6,-6,.1,100);
 const depthFog=new T.FogExp2(0xe7d8c8,.0012);scene.fog=depthFog;
 const controls=new OrbitControls(camera,canvas);controls.enablePan=false;controls.enableDamping=true;controls.dampingFactor=.10;controls.minAzimuthAngle=-.48;controls.maxAzimuthAngle=.48;controls.minPolarAngle=1.10;controls.maxPolarAngle=1.50;controls.minZoom=.8;controls.maxZoom=3.5;
 controls.touches.ONE=T.TOUCH.ROTATE;controls.touches.TWO=T.TOUCH.DOLLY_ROTATE;
 let focusedRoom=null,focusedDoll=null,reducedMotion=false,teaActive=false,stitchActive=false,chimeActive=false,chimeSelection=-1,requestedEnabled=true;const working=()=>teaActive||stitchActive||chimeActive;const cameraMove=createCameraMove(camera,controls);const cancelCameraMove=()=>cameraMove.cancel();controls.addEventListener('start',cancelCameraMove);
 const scenePointers=new Set();
 const presentation=createRoomPresentation(()=>{if(focusedRoom&&!focusedDoll)cameraMove.moveTo(focusPose(),reducedMotion)},()=>Boolean(objects.selected)||!requestedEnabled||scenePointers.size>0);
 function focusPose(){if(chimeActive)return chimeFraming(canvas.clientWidth,canvas.clientHeight);if(teaActive)return teaFraming(canvas.clientWidth,canvas.clientHeight);if(stitchActive)return stitchFraming(canvas.clientWidth,canvas.clientHeight);const p=focusedDoll?residents.position(focusedDoll):null;if(p){p.add(house.root.position);return portraitFraming(canvas.clientWidth,canvas.clientHeight,p.toArray())}return framing(canvas.clientWidth,canvas.clientHeight,focusedRoom,presentation.value)}
 function applyFraming(){cameraMove.moveTo(focusPose(),true)}
 function home(){if(working())return;focusedRoom=null;focusedDoll=null;applyFraming()}
 home();
 const hemi=new T.HemisphereLight(0xffecde,0x816a7b,2.3);scene.add(hemi);
 const key=new T.DirectionalLight(0xffeddb,3.5);key.position.set(-5,11,10);key.castShadow=true;key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-9,right:9,top:12,bottom:-5,near:1,far:35});key.shadow.normalBias=.035;key.shadow.bias=-.0003;scene.add(key);
 const fill=new T.DirectionalLight(0xbfbadb,1.8);fill.position.set(7,6,-6);scene.add(fill);
 const floor=new T.Mesh(new T.PlaneGeometry(200,200),new T.ShadowMaterial({opacity:.15}));floor.rotation.x=-Math.PI/2;floor.position.y=-.70;floor.receiveShadow=true;scene.add(floor);
 const house=createHouse(scene), residents=createDolls(house.root),ghost=createGhost(house.root);
 const courtyard=createLevantineSetting(house.root);
 const portraitCache=createPortraitCache(residents,doll=>renderPortrait(renderer,doll));
 createKeepsakeDetails(house.root);const details=createCraftDetails(house.root);createGarden(house.root);const atmosphere=createAtmosphere(scene),roomEffects=createRoomEffects(house.root),roomFrame=createRoomFrame(house.root),preview=createPlacementPreview(house.root);let previewPose=null;
 const restoration=createRestoration(house.root),objects=createObjectInteractions(house.root),storyProps=createStoryProps(house.root),teaTable=createTeaTable(house.root),sewingPlay=createSewingPlay(house.root),moonChimes=createMoonChimes(house.root);let stitchSections=[];
 const decor=new Map(),slotTargets=[];
 const slotGroup=new T.Group();house.root.add(slotGroup);
 for(const room of ROOMS)for(let i=0;i<SLOTS.length;i++){
  const slot=SLOTS[i],material=new T.MeshBasicMaterial({color:0xd2a972,side:T.DoubleSide,transparent:true,opacity:.85,depthWrite:false});
  const mesh=new T.Mesh(new T.RingGeometry(.21,.25,24),material);mesh.rotation.x=-Math.PI/2;mesh.position.set(room.x+slot.x,room.y+.14,slot.z);mesh.userData.slot={room:room.id,slot:i};
  const disk=new T.Mesh(new T.CircleGeometry(.42,20),new T.MeshBasicMaterial({visible:false}));disk.rotation.x=-Math.PI/2;disk.position.copy(mesh.position);disk.userData.slot={room:room.id,slot:i};slotGroup.add(mesh,disk);slotTargets.push(disk);
 }
 slotGroup.visible=false;
 const ray=new T.Raycaster(),mouse=new T.Vector2();let placement=null,disposed=false,lost=false,quality='',nightMix=0;
 function objectAt(x,y){
  const rect=canvas.getBoundingClientRect();if(!Number.isFinite(x)||!Number.isFinite(y)||x<rect.left||x>rect.right||y<rect.top||y>rect.bottom||lost||working())return null;
  mouse.set((x-rect.left)/rect.width*2-1,-(y-rect.top)/rect.height*2+1);ray.setFromCamera(mouse,camera);
  return ray.intersectObjects(objects.targets,false)[0]?.object.userData.object??null;
 }
 const tapGesture=createTapGesture();
 function setWorkActivity(id){
  const current=teaActive?'tea':stitchActive?'stitch':chimeActive?'lullaby':null;
  const next=['tea','stitch','lullaby'].includes(id)?id:null;if(next===current)return;
  const room={tea:'kitchen',stitch:'studio',lullaby:'bedroom'}[next??current]??'bedroom';
  teaActive=next==='tea';stitchActive=next==='stitch';chimeActive=next==='lullaby';chimeSelection=-1;
  if(!next)presentation.reset(); // The returned house starts with its folded idle edge.
  tapGesture.cancel();cameraMove.cancel();objects.clear();focusedRoom=room;focusedDoll=null;
  controls.enabled=requestedEnabled&&!working();controls.enableDamping=false;controls.minPolarAngle=working()?.8:1.10;controls.maxPolarAngle=1.50;
  if(house.originalTeaSet)house.originalTeaSet.visible=!teaActive;
  if(house.studioChair)house.studioChair.visible=!stitchActive;
  if(house.workCeiling)house.workCeiling.visible=!stitchActive;
  if(courtyard.studioArch)courtyard.studioArch.visible=!stitchActive;
  applyFraming();
 }
 function setTeaActive(active){if(active)setWorkActivity('tea');else if(teaActive)setWorkActivity(null)}
 function setStitchActive(active){if(active)setWorkActivity('stitch');else if(stitchActive)setWorkActivity(null)}
 function setChimeActive(active){if(active)setWorkActivity('lullaby');else if(chimeActive)setWorkActivity(null)}
 function workRay(x,y,id){
  const active=id==='tea'?teaActive:id==='stitch'?stitchActive:id==='lullaby'?chimeActive:false,rect=canvas.getBoundingClientRect();
  if(!active||lost||!Number.isFinite(x)||!Number.isFinite(y)||x<rect.left||x>rect.right||y<rect.top||y>rect.bottom)return false;
  mouse.set((x-rect.left)/rect.width*2-1,-(y-rect.top)/rect.height*2+1);camera.updateMatrixWorld();ray.setFromCamera(mouse,camera);return true;
 }
 function teaRay(x,y){return workRay(x,y,'tea')}
 function teaAt(x,y){
  if(!teaRay(x,y)||!teaTable.root.visible)return null;teaTable.root.updateWorldMatrix(true,true);
  const targets=teaTable.targets.filter(target=>{for(let p=target;p;p=p.parent)if(!p.visible)return false;return true});
  return ray.intersectObjects(targets,false)[0]?.object.userData.tea??null;
 }
 const teaPlane=new T.Plane(new T.Vector3(0,1,0),-(house.root.position.y+TEA_TABLE.y+.48)),teaPoint=new T.Vector3();
 function teaAimAt(x,y){
  if(!teaRay(x,y)||!ray.ray.intersectPlane(teaPlane,teaPoint))return null;
  // The grabbed body is offset from the spout. Keep this coordinate unbounded
  // so delta gestures can reach the edge cups; simulation aim is clamped later.
  const room=ROOMS.find(r=>r.id===TEA_TABLE.room);return (teaPoint.x-room.x-TEA_TABLE.x)/TEA_TABLE.aimSpan;
 }
 function projectWorkPoint(point){const p=new T.Vector3(...point).project(camera);return {x:(p.x+1)*canvas.clientWidth/2,y:(1-p.y)*canvas.clientHeight/2}}
 function teaPositions(){
  if(!teaActive)return [];camera.updateMatrixWorld();teaTable.root.updateWorldMatrix(true,true);
  return teaTable.points().map(point=>({key:point.key,...projectWorkPoint(point.world)}));
 }
 const stitchRoom=ROOMS.find(room=>room.id===STITCH_TABLE.room);
 const stitchPlane=new T.Plane(new T.Vector3(0,1,0),-(house.root.position.y+stitchRoom.y+STITCH_TABLE.y)),stitchPoint=new T.Vector3();
 function stitchAt(x,y){
  if(!workRay(x,y,'stitch')||!sewingPlay.root.visible)return null;sewingPlay.root.updateWorldMatrix(true,true);
  const targets=sewingPlay.targets.filter(target=>{for(let p=target;p;p=p.parent)if(!p.visible)return false;return true});
  return ray.intersectObjects(targets,false)[0]?.object.userData.stitch??null;
 }
 function stitchPointAt(x,y){
  if(!workRay(x,y,'stitch')||!ray.ray.intersectPlane(stitchPlane,stitchPoint))return null;
  // The elevated grip projects beyond the cloth. Preserve that raw offset;
  // the input adapter clamps only after applying its two-dimensional delta.
  return {x:(stitchPoint.x-stitchRoom.x-STITCH_TABLE.x)/STITCH_TABLE.clothScale,y:(stitchPoint.z-STITCH_TABLE.z)/STITCH_TABLE.clothScale};
 }
 function stitchPositions(){
  if(!stitchActive)return [];camera.updateMatrixWorld();sewingPlay.root.updateWorldMatrix(true,true);
  return sewingPlay.points().map(point=>({key:point.key,...projectWorkPoint(point.world)}));
 }
 function projectStitch(x,y,height=0){
  if(!stitchActive||lost||![x,y,height].every(Number.isFinite))return null;camera.updateMatrixWorld();
  const point=projectWorkPoint([stitchRoom.x+STITCH_TABLE.x+x*STITCH_TABLE.clothScale,house.root.position.y+stitchRoom.y+STITCH_TABLE.y+height,STITCH_TABLE.z+y*STITCH_TABLE.clothScale]);
  return Number.isFinite(point.x)&&Number.isFinite(point.y)?point:null;
 }
 function stitchGuidePositions(){
  if(!stitchActive||lost)return [];
  return stitchSections.map(section=>section.map(([x,y])=>projectStitch(x,y)));
 }
 function chimeAt(x,y){
  if(!workRay(x,y,'lullaby')||!moonChimes.root.visible)return null;
  moonChimes.root.updateWorldMatrix(true,true);
  return ray.intersectObjects(moonChimes.targets,false)[0]?.object.userData.chime??null;
 }
 function chimeTargetBounds(target){
  target.updateWorldMatrix(true,false);
  const positions=target.geometry.attributes.position,point=new T.Vector3();
  let left=Infinity,right=-Infinity,top=Infinity,bottom=-Infinity;
  for(let i=0;i<positions.count;i++){
   point.fromBufferAttribute(positions,i).applyMatrix4(target.matrixWorld).project(camera);
   const x=(point.x+1)*canvas.clientWidth/2,y=(1-point.y)*canvas.clientHeight/2;
   left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
  }
  return {left,right,top,bottom,width:right-left,height:bottom-top};
 }
 function chimePositions(){
  if(!chimeActive)return [];camera.updateMatrixWorld();
  return moonChimes.points().map(p=>({key:p.key,...projectWorkPoint(p.world),bounds:chimeTargetBounds(moonChimes.targets.find(target=>target.userData.chime===p.key))}));
 }
 function chimePullSpan(){
  if(!chimeActive)return 0;moonChimes.root.updateWorldMatrix(true,true);camera.updateMatrixWorld();
  const p=moonChimes.root.localToWorld(new T.Vector3(0,1.16,0)),q=p.clone();q.y-=CHIME_LAYOUT.pull;
  return Math.abs(projectWorkPoint(p.toArray()).y-projectWorkPoint(q.toArray()).y);
 }
 const pointerdown=e=>{scenePointers.add(e.pointerId);tapGesture.down(e)};
 const pointermove=e=>tapGesture.move(e);
 const pointerup=e=>{
  scenePointers.delete(e.pointerId);
  if(!tapGesture.up(e)||!controls.enabled||lost)return;
  const rect=canvas.getBoundingClientRect();mouse.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(mouse,camera);
  const targets=placement?slotTargets:[...residents.targets,...objects.targets,...(ghost.root.visible?[ghost.hit]:[])];
  const hit=ray.intersectObjects(targets,false)[0];if(hit)onPick(hit.object.userData);
 };
 const cancel=()=>{scenePointers.clear();tapGesture.cancel()};canvas.addEventListener('pointerdown',pointerdown);canvas.addEventListener('pointermove',pointermove);canvas.addEventListener('pointerup',pointerup);canvas.addEventListener('pointercancel',cancel);
 const contextLost=e=>{e.preventDefault();lost=true;onError('context')};canvas.addEventListener('webglcontextlost',contextLost);
 function resize(){const w=canvas.clientWidth,h=canvas.clientHeight;const aspect=w/Math.max(1,h),height=focusPose().height;camera.left=-height*aspect/2;camera.right=height*aspect/2;camera.top=height/2;camera.bottom=-height/2;camera.updateProjectionMatrix();renderer.setSize(w,h,false)}
 const observer=new ResizeObserver(()=>{resize();if(focusedRoom||focusedDoll)applyFraming()});observer.observe(canvas);resize();
 return {
  renderer,camera,scene,home,setChimeActive,chimeAt,chimePositions,chimePullSpan,setChimeSelection(index){chimeSelection=Number.isInteger(index)&&index>=0&&index<4?index:-1},setTeaActive,teaAt,teaAimAt,teaPositions,setStitchActive,stitchAt,stitchPointAt,stitchPositions,projectStitch,
  selectObject(key){return objects.select(key)},clearObjectSelection(){objects.clear()},objectAt,objectPositions(){return objects.project(camera,canvas.clientWidth,canvas.clientHeight)},
  getPortraits(){return portraitCache.getAll()},
  setPresentation(value,viewport){if(!working())presentation.update(value,viewport)},
  focusRoom(id,immediate=false){if(working()||!ROOMS.some(r=>r.id===id))return false;focusedRoom=id;focusedDoll=null;cameraMove.moveTo(framing(canvas.clientWidth,canvas.clientHeight,id,presentation.value),reducedMotion||immediate);return true},
  focusDoll(id){const p=residents.position(id);if(working()||!p)return false;focusedDoll=id;focusedRoom=null;cameraMove.moveTo(focusPose(),reducedMotion);return true},
  visualStatus(){return {portraitCount:portraitCache.size,quality,focusedRoom,focusedDoll,presentation:presentation.value,nightMix,cameraMoving:cameraMove.active,previewVisible:preview.root.visible,previewValid:preview.root.userData.valid??false,windowMaterials:house.windows.size,activeOwnedLights:[...decor.values()].filter(o=>o.userData.ownedLight?.intensity>0).length,restoredLights:restoration.lights.filter(l=>l.intensity>0).length,reactivePoses:Object.fromEntries([...decor].map(([id,o])=>[id,{turn:o.rotation.y,rock:o.rotation.z,scale:o.scale.x}])),courtyard:house.root.getObjectByName('levantine-courtyard')?.userData.nightCue,selectedObject:objects.selected,story:storyProps.status(),teaActive,tea:teaTable.status(),stitchActive,workCeilingVisible:house.workCeiling.visible,workArchVisible:courtyard.studioArch.visible,stitch:sewingPlay.status(),stitchGuides:stitchGuidePositions(),chimeActive,chimes:moonChimes.status()}},
  zoom(amount){if(working())return;cameraMove.cancel();camera.zoom=T.MathUtils.clamp(camera.zoom*amount,.8,3.5);camera.updateProjectionMatrix()},
  orbit(amount){if(working())return;cameraMove.cancel();const offset=camera.position.clone().sub(controls.target);offset.applyAxisAngle(new T.Vector3(0,1,0),amount);camera.position.copy(controls.target).add(offset);controls.update()},
  setEnabled(enabled){requestedEnabled=Boolean(enabled);controls.enabled=requestedEnabled&&!working();if(!enabled)cameraMove.cancel()},
  setPlacement(item){placement=item;slotGroup.visible=Boolean(item);if(!item){previewPose=null;preview.clear()}},
  setPreview(pose){previewPose=pose},
  project(id,height=1.0){const p=residents.position(id);if(!p)return null;p.y+=height;p.add(house.root.position);p.project(camera);return {x:(p.x+1)*canvas.clientWidth/2,y:(1-p.y)*canvas.clientHeight/2}},
  render(state,dt,selected){
   if(disposed||lost)return;reducedMotion=state.settings.reducedMotion;setWorkActivity(state.activities.active?.id);stitchSections=stitchActive?(stitchStatus(state)?.sections??[]):[];if(!state.paused)cameraMove.tick(dt,reducedMotion);
   const budget=detail(canvas.clientWidth,canvas.clientHeight,state.settings.quality,window.devicePixelRatio||1);
   if(quality!==budget.level){quality=budget.level;renderer.setPixelRatio(budget.pixelRatio);renderer.shadowMap.enabled=budget.shadows;resize()}
   for(const d of state.decor)if(!decor.has(d.id)){const obj=makeFurniture(d.item),room=ROOMS.find(r=>r.id===d.room),slot=SLOTS[d.slot];obj.position.set(room.x+slot.x,room.y+.13,slot.z);if(d.item==='lamp'){const light=new T.PointLight(0xffc07a,0,3.4,2);light.name='owned-keepsake-light';light.position.set(0,1.05,0);light.castShadow=false;obj.add(light);obj.userData.ownedLight=light}house.root.add(obj);decor.set(d.id,obj)}
   for(const d of state.decor){const obj=decor.get(d.id),room=ROOMS.find(r=>r.id===d.room),slot=SLOTS[d.slot],recent=state.elapsed-(d.lastUse??-10)<5,phase=Math.max(0,state.elapsed-(d.lastUse??-10));obj.position.set(room.x+slot.x,room.y+.13,slot.z);obj.scale.setScalar(d.item==='plant'&&d.tendedDay===state.day?1.08:1);obj.rotation.y=(d.rotation??0)*Math.PI/2+(d.item==='musicbox'&&recent?(reducedMotion ? .14 : phase*2.4):0);obj.rotation.z=d.item==='mobile'&&recent?(reducedMotion ? .06 : Math.sin(phase*5)*.12):0;if(obj.userData.ownedLight)obj.userData.ownedLight.intensity=d.active?(.25+nightMix*2.15):0;obj.visible=d.id!==previewPose?.moveId}
   objects.update(state,working());
   for(const [id,obj] of decor)if(!state.decor.some(d=>d.id===id)){obj.removeFromParent();obj.traverse(o=>{if(o.material?.map&&!o.material.userData.shared){o.material.map.dispose();o.material.dispose();o.geometry?.dispose()}});decor.delete(id)}
   slotTargets.forEach(o=>{o.visible=!state.decor.some(d=>d.id!==previewPose?.moveId&&d.room===o.userData.slot.room&&d.slot===o.userData.slot.slot)});
   slotGroup.children.forEach(o=>{o.visible=!state.decor.some(d=>d.id!==previewPose?.moveId&&d.room===o.userData.slot.room&&d.slot===o.userData.slot.slot)});
   // Exponential interpolation is frame-rate independent; reduced motion switches instantly.
   const night=isNight(state);nightMix=state.settings.reducedMotion?Number(night):T.MathUtils.damp(nightMix,Number(night),2.2,dt);
   const cue=courtyard.update(state,nightMix),look=lighting(nightMix),haze=fogPolicy(nightMix);hemi.intensity=look.ambient;key.intensity=look.key;fill.intensity=look.rim;renderer.toneMappingExposure=look.exposure;depthFog.density=haze.density;depthFog.color.setHex(haze.color);
   hemi.color.set(0xe9e0d5).lerp(new T.Color(0x849bc9),nightMix);key.color.set(0xffe5c2).lerp(new T.Color(0xb8caff),nightMix);fill.color.set(0xb8cbd5).lerp(new T.Color(0x829bdb),nightMix);
   house.lights.forEach((l,i)=>{if(l.isLight){
    const practical=roomLighting(ROOMS[i]?.id,nightMix),focusBoost=focusedRoom===ROOMS[i]?.id?1.12:1;
    // Reuse the four persistent authored room lights instead of allocating
    // extra lights per frame. Each room now has its own miniature-film color
    // and falloff while the global night cue still owns overall lamp energy.
    l.intensity=(look.lamps*.22+practical.intensity)*cue.lamp*focusBoost;
    l.color.setHex(practical.color);l.distance=practical.distance;
   }});
   house.windows.forEach(m=>{m.emissive.set(0x8baaca);m.emissiveIntensity=.14+nightMix*.44});details.update(nightMix);atmosphere.update(state,nightMix,quality);roomEffects.update(state,nightMix);restoration.update(state,nightMix);storyProps.update(state,nightMix);teaTable.update(state);sewingPlay.update(state);moonChimes.update(state,chimeSelection);roomFrame.show(working()?null:focusedRoom);preview.update(previewPose,state);
   residents.update(state,dt,selected,Math.atan2(camera.position.x-controls.target.x,camera.position.z-controls.target.z));
   for(const doll of residents.dolls){const room=state.dolls.find(d=>d.id===doll.id)?.room;doll.root.visible=!(teaActive&&room==='kitchen'||stitchActive&&room==='studio'||chimeActive&&room==='bedroom')}
   if(focusedDoll){const room=state.dolls.find(d=>d.id===focusedDoll)?.room;if(room!==scene.userData.portraitRoom){scene.userData.portraitRoom=room;cameraMove.moveTo(focusPose(),reducedMotion)}}else scene.userData.portraitRoom=null;ghost.update(state.elapsed,night,state.settings.reducedMotion||state.paused,state.journal.length);
   if(working())ghost.root.visible=false;
   controls.enableDamping=!working()&&!state.settings.reducedMotion;controls.update();renderer.render(scene,camera);
  },
  dispose(){disposed=true;portraitCache.dispose();observer.disconnect();controls.removeEventListener('start',cancelCameraMove);controls.dispose();canvas.removeEventListener('pointerdown',pointerdown);canvas.removeEventListener('pointermove',pointermove);canvas.removeEventListener('pointerup',pointerup);canvas.removeEventListener('pointercancel',cancel);canvas.removeEventListener('webglcontextlost',contextLost);const geos=new Set(),mats=new Set();scene.traverse(o=>{if(o.geometry)geos.add(o.geometry);if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])mats.add(m)});geos.forEach(g=>g.dispose());mats.forEach(m=>{m.map?.dispose();m.dispose()});renderer.dispose()}
 };
}
