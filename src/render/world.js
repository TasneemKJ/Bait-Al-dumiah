import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {ROOMS,SLOTS} from '../content.js';
import {isNight} from '../simulation.js';
import {createTapGesture} from '../pointer-gesture.js';
import {createHouse,makeFurniture} from './house.js';
import {createDolls,createGhost} from './dolls.js';
import {createCraftDetails,createGarden} from './ornaments.js';
import {createKeepsakeDetails} from './keepsake-details.js';
import {createAtmosphere} from './atmosphere.js';
import {lighting,detail,framing} from './visual-policy.js';

export function createWorld(canvas,{onPick,onError}){
 const renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance'});
 renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
 const scene=new T.Scene(), camera=new T.OrthographicCamera(-10,10,6,-6,.1,100);
 const controls=new OrbitControls(camera,canvas);controls.enablePan=false;controls.enableDamping=true;controls.dampingFactor=.10;controls.minAzimuthAngle=-.48;controls.maxAzimuthAngle=.48;controls.minPolarAngle=1.10;controls.maxPolarAngle=1.50;controls.minZoom=.8;controls.maxZoom=3.5;
 controls.touches.ONE=T.TOUCH.ROTATE;controls.touches.TWO=T.TOUCH.DOLLY_ROTATE;
 let focusedRoom=null;
 function applyFraming(){const f=framing(canvas.clientWidth,canvas.clientHeight,focusedRoom);camera.zoom=f.zoom;controls.target.fromArray(f.target);camera.position.copy(controls.target).add(new T.Vector3(5.8,5.6,24));camera.updateProjectionMatrix();controls.update()}
 function home(){focusedRoom=null;applyFraming()}
 home();
 const hemi=new T.HemisphereLight(0xffecde,0x816a7b,2.3);scene.add(hemi);
 const key=new T.DirectionalLight(0xffeddb,3.5);key.position.set(-5,11,10);key.castShadow=true;key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-9,right:9,top:12,bottom:-5,near:1,far:35});key.shadow.normalBias=.035;key.shadow.bias=-.0003;scene.add(key);
 const fill=new T.DirectionalLight(0xbfbadb,1.8);fill.position.set(7,6,-6);scene.add(fill);
 const floor=new T.Mesh(new T.PlaneGeometry(200,200),new T.ShadowMaterial({opacity:.15}));floor.rotation.x=-Math.PI/2;floor.position.y=-.70;floor.receiveShadow=true;scene.add(floor);
 const house=createHouse(scene), residents=createDolls(house.root),ghost=createGhost(house.root);
 createKeepsakeDetails(house.root);const details=createCraftDetails(house.root);createGarden(house.root);const atmosphere=createAtmosphere(scene);
 const decor=new Map(),slotTargets=[];
 const slotGroup=new T.Group();house.root.add(slotGroup);
 for(const room of ROOMS)for(let i=0;i<SLOTS.length;i++){
  const slot=SLOTS[i],material=new T.MeshBasicMaterial({color:0xd2a972,side:T.DoubleSide,transparent:true,opacity:.85,depthWrite:false});
  const mesh=new T.Mesh(new T.RingGeometry(.21,.25,24),material);mesh.rotation.x=-Math.PI/2;mesh.position.set(room.x+slot.x,room.y+.14,slot.z);mesh.userData.slot={room:room.id,slot:i};
  const disk=new T.Mesh(new T.CircleGeometry(.42,20),new T.MeshBasicMaterial({visible:false}));disk.rotation.x=-Math.PI/2;disk.position.copy(mesh.position);disk.userData.slot=mesh.userData.slot;slotGroup.add(mesh,disk);slotTargets.push(disk);
 }
 slotGroup.visible=false;
 const ray=new T.Raycaster(),mouse=new T.Vector2();let placement=null,disposed=false,lost=false,quality='',nightMix=0;
 const tapGesture=createTapGesture();
 const pointerdown=e=>tapGesture.down(e);
 const pointermove=e=>tapGesture.move(e);
 const pointerup=e=>{
  if(!tapGesture.up(e)||!controls.enabled||lost)return;
  const rect=canvas.getBoundingClientRect();mouse.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(mouse,camera);
  const targets=placement?slotTargets:[...residents.targets,...(ghost.root.visible?[ghost.hit]:[])];
  const hit=ray.intersectObjects(targets,false)[0];if(hit)onPick(hit.object.userData);
 };
 const cancel=()=>tapGesture.cancel();canvas.addEventListener('pointerdown',pointerdown);canvas.addEventListener('pointermove',pointermove);canvas.addEventListener('pointerup',pointerup);canvas.addEventListener('pointercancel',cancel);
 const contextLost=e=>{e.preventDefault();lost=true;onError('context')};canvas.addEventListener('webglcontextlost',contextLost);
 function resize(){const w=canvas.clientWidth,h=canvas.clientHeight;const aspect=w/Math.max(1,h),height=framing(w,h,focusedRoom).height;camera.left=-height*aspect/2;camera.right=height*aspect/2;camera.top=height/2;camera.bottom=-height/2;camera.updateProjectionMatrix();renderer.setSize(w,h,false)}
 const observer=new ResizeObserver(()=>{resize();if(focusedRoom)applyFraming()});observer.observe(canvas);resize();
 return {
  renderer,camera,scene,home,
  focusRoom(id){if(!ROOMS.some(r=>r.id===id))return false;focusedRoom=id;applyFraming();return true},
  visualStatus(){return {quality,focusedRoom,nightMix,windowMaterials:house.windows.size}},
  zoom(amount){camera.zoom=T.MathUtils.clamp(camera.zoom*amount,.8,3.5);camera.updateProjectionMatrix()},
  orbit(amount){const offset=camera.position.clone().sub(controls.target);offset.applyAxisAngle(new T.Vector3(0,1,0),amount);camera.position.copy(controls.target).add(offset);controls.update()},
  setEnabled(enabled){controls.enabled=enabled},
  setPlacement(item){placement=item;slotGroup.visible=Boolean(item)},
  project(id){const p=residents.position(id);if(!p)return null;p.y+=1.0;p.add(house.root.position);p.project(camera);return {x:(p.x+1)*canvas.clientWidth/2,y:(1-p.y)*canvas.clientHeight/2}},
  render(state,dt,selected){
   if(disposed||lost)return;
   const budget=detail(canvas.clientWidth,canvas.clientHeight,state.settings.quality,window.devicePixelRatio||1);
   if(quality!==budget.level){quality=budget.level;renderer.setPixelRatio(budget.pixelRatio);renderer.shadowMap.enabled=budget.shadows;resize()}
   for(const d of state.decor)if(!decor.has(d.id)){const obj=makeFurniture(d.item),room=ROOMS.find(r=>r.id===d.room),slot=SLOTS[d.slot];obj.position.set(room.x+slot.x,room.y+.13,slot.z);house.root.add(obj);decor.set(d.id,obj)}
   for(const [id,obj] of decor)if(!state.decor.some(d=>d.id===id)){obj.removeFromParent();obj.traverse(o=>{if(o.material?.map&&!o.material.userData.shared){o.material.map.dispose();o.material.dispose();o.geometry?.dispose()}});decor.delete(id)}
   slotTargets.forEach(o=>{o.visible=!state.decor.some(d=>d.room===o.userData.slot.room&&d.slot===o.userData.slot.slot)});
   slotGroup.children.forEach(o=>{o.visible=!state.decor.some(d=>d.room===o.userData.slot.room&&d.slot===o.userData.slot.slot)});
   // Exponential interpolation is frame-rate independent; reduced motion switches instantly.
   const night=isNight(state);nightMix=state.settings.reducedMotion?Number(night):T.MathUtils.damp(nightMix,Number(night),2.2,dt);
   const look=lighting(nightMix);hemi.intensity=look.ambient;key.intensity=look.key;fill.intensity=look.rim;renderer.toneMappingExposure=look.exposure;
   hemi.color.set(0xe9e0d5).lerp(new T.Color(0x849bc9),nightMix);key.color.set(0xffe5c2).lerp(new T.Color(0xb8caff),nightMix);fill.color.set(0xb8cbd5).lerp(new T.Color(0x829bdb),nightMix);
   house.lights.forEach(l=>{if(l.isLight){l.intensity=look.lamps;l.color.set(0xffca8e)}});
   house.windows.forEach(m=>{m.emissive.set(0x8baaca);m.emissiveIntensity=.14+nightMix*.44});details.update(nightMix);atmosphere.update(state,nightMix);
   residents.update(state,dt,selected);ghost.update(state.elapsed,night,state.settings.reducedMotion||state.paused);
   controls.enableDamping=!state.settings.reducedMotion;controls.update();renderer.render(scene,camera);
  },
  dispose(){disposed=true;observer.disconnect();controls.dispose();canvas.removeEventListener('pointerdown',pointerdown);canvas.removeEventListener('pointermove',pointermove);canvas.removeEventListener('pointerup',pointerup);canvas.removeEventListener('pointercancel',cancel);canvas.removeEventListener('webglcontextlost',contextLost);const geos=new Set(),mats=new Set();scene.traverse(o=>{if(o.geometry)geos.add(o.geometry);if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])mats.add(m)});geos.forEach(g=>g.dispose());mats.forEach(m=>{m.map?.dispose();m.dispose()});renderer.dispose()}
 };
}
