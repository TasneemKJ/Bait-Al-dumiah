import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {ROOMS,SLOTS} from '../content.js';
import {isNight} from '../simulation.js';
import {createHouse,makeFurniture} from './house.js';
import {createDolls,createGhost} from './dolls.js';

export function createWorld(canvas,{onPick,onError}){
 const renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance'});
 renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
 const scene=new T.Scene(), camera=new T.OrthographicCamera(-10,10,6,-6,.1,100);
 const controls=new OrbitControls(camera,canvas);controls.enablePan=false;controls.enableDamping=true;controls.dampingFactor=.10;controls.minAzimuthAngle=-.48;controls.maxAzimuthAngle=.48;controls.minPolarAngle=1.12;controls.maxPolarAngle=1.53;controls.minZoom=.8;controls.maxZoom=2.5;
 controls.touches.ONE=T.TOUCH.ROTATE;controls.touches.TWO=T.TOUCH.DOLLY_ROTATE;
 function home(){camera.zoom=1;camera.position.set(8.7,8.4,24);controls.target.set(0,3.80,0);camera.updateProjectionMatrix();controls.update()}
 home();
 const hemi=new T.HemisphereLight(0xffecde,0x816a7b,2.3);scene.add(hemi);
 const key=new T.DirectionalLight(0xffeddb,3.5);key.position.set(-5,11,10);key.castShadow=true;key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-9,right:9,top:12,bottom:-5,near:1,far:35});key.shadow.normalBias=.035;key.shadow.bias=-.0003;scene.add(key);
 const fill=new T.DirectionalLight(0xbfbadb,1.8);fill.position.set(7,6,-6);scene.add(fill);
 const floor=new T.Mesh(new T.PlaneGeometry(200,200),new T.ShadowMaterial({opacity:.15}));floor.rotation.x=-Math.PI/2;floor.position.y=-.42;floor.receiveShadow=true;scene.add(floor);
 const house=createHouse(scene), residents=createDolls(house.root),ghost=createGhost(house.root);
 const decor=new Map(),slotTargets=[];
 const slotGroup=new T.Group();house.root.add(slotGroup);
 for(const room of ROOMS)for(let i=0;i<SLOTS.length;i++){
  const slot=SLOTS[i],material=new T.MeshBasicMaterial({color:0xd2a972,side:T.DoubleSide,transparent:true,opacity:.85,depthWrite:false});
  const mesh=new T.Mesh(new T.RingGeometry(.21,.25,24),material);mesh.rotation.x=-Math.PI/2;mesh.position.set(room.x+slot.x,room.y+.14,slot.z);mesh.userData.slot={room:room.id,slot:i};
  const disk=new T.Mesh(new T.CircleGeometry(.42,20),new T.MeshBasicMaterial({visible:false}));disk.rotation.x=-Math.PI/2;disk.position.copy(mesh.position);disk.userData.slot=mesh.userData.slot;slotGroup.add(mesh,disk);slotTargets.push(disk);
 }
 slotGroup.visible=false;
 // Sparse floating dust, not an expensive full-screen post-processing stack.
 const dustGeo=new T.BufferGeometry(),coords=new Float32Array(60*3);for(let i=0;i<60;i++){coords[i*3]=Math.sin(i*37.19)*8;coords[i*3+1]=(i*1.731)%11;coords[i*3+2]=Math.cos(i*13.33)*4-1}
 dustGeo.setAttribute('position',new T.BufferAttribute(coords,3));const dust=new T.Points(dustGeo,new T.PointsMaterial({color:0xf9dfb9,size:.036,transparent:true,opacity:.45,depthWrite:false}));scene.add(dust);
 const ray=new T.Raycaster(),mouse=new T.Vector2();let pointer=null,placement=null,disposed=false,lost=false,quality='',nightMix=0;
 const pointerdown=e=>{if(e.isPrimary)pointer={x:e.clientX,y:e.clientY,id:e.pointerId};else pointer=null};
 const pointerup=e=>{
  if(!pointer||pointer.id!==e.pointerId||!controls.enabled||lost)return;
  const travel=Math.hypot(e.clientX-pointer.x,e.clientY-pointer.y);pointer=null;if(travel>7)return;
  const rect=canvas.getBoundingClientRect();mouse.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(mouse,camera);
  const targets=placement?slotTargets:[...residents.targets,...(ghost.root.visible?[ghost.hit]:[])];
  const hit=ray.intersectObjects(targets,false)[0];if(hit)onPick(hit.object.userData);
 };
 const cancel=()=>{pointer=null};canvas.addEventListener('pointerdown',pointerdown);canvas.addEventListener('pointerup',pointerup);canvas.addEventListener('pointercancel',cancel);
 const contextLost=e=>{e.preventDefault();lost=true;onError('context')};canvas.addEventListener('webglcontextlost',contextLost);
 function resize(){const w=canvas.clientWidth,h=canvas.clientHeight;const aspect=w/Math.max(1,h),height=Math.max(10.8,14.6/aspect);camera.left=-height*aspect/2;camera.right=height*aspect/2;camera.top=height/2;camera.bottom=-height/2;camera.updateProjectionMatrix();renderer.setSize(w,h,false)}
 const observer=new ResizeObserver(resize);observer.observe(canvas);resize();
 return {
  renderer,camera,scene,home,
  zoom(amount){camera.zoom=T.MathUtils.clamp(camera.zoom*amount,.8,2.5);camera.updateProjectionMatrix()},
  orbit(amount){const offset=camera.position.clone().sub(controls.target);offset.applyAxisAngle(new T.Vector3(0,1,0),amount);camera.position.copy(controls.target).add(offset);controls.update()},
  setEnabled(enabled){controls.enabled=enabled},
  setPlacement(item){placement=item;slotGroup.visible=Boolean(item)},
  project(id){const p=residents.position(id);if(!p)return null;p.y+=1.5;p.add(house.root.position);p.project(camera);return {x:(p.x+1)*canvas.clientWidth/2,y:(1-p.y)*canvas.clientHeight/2}},
  render(state,dt,selected){
   if(disposed||lost)return;
   const q=state.settings.quality==='auto'?(canvas.clientWidth<700?'low':'high'):state.settings.quality;
   if(quality!==q){quality=q;renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,q==='low'?1.25:1.75));renderer.shadowMap.enabled=q!=='low';resize()}
   for(const d of state.decor)if(!decor.has(d.id)){const obj=makeFurniture(d.item),room=ROOMS.find(r=>r.id===d.room),slot=SLOTS[d.slot];obj.position.set(room.x+slot.x,room.y+.13,slot.z);house.root.add(obj);decor.set(d.id,obj)}
   for(const [id,obj] of decor)if(!state.decor.some(d=>d.id===id)){obj.removeFromParent();obj.traverse(o=>{if(o.material?.map){o.material.map.dispose();o.material.dispose();o.geometry?.dispose()}});decor.delete(id)}
   slotTargets.forEach(o=>{o.visible=!state.decor.some(d=>d.room===o.userData.slot.room&&d.slot===o.userData.slot.slot)});
   slotGroup.children.forEach(o=>{o.visible=!state.decor.some(d=>d.room===o.userData.slot.room&&d.slot===o.userData.slot.slot)});
   // Exponential interpolation is frame-rate independent; reduced motion switches instantly.
   const night=isNight(state);nightMix=state.settings.reducedMotion?Number(night):T.MathUtils.damp(nightMix,Number(night),2.2,dt);
   hemi.intensity=T.MathUtils.lerp(2.3,.95,nightMix);key.intensity=T.MathUtils.lerp(3.5,.65,nightMix);fill.intensity=T.MathUtils.lerp(1.8,2.0,nightMix);key.color.setRGB(1,1-nightMix*.20,1-nightMix*.02);
   house.lights.forEach(l=>{if(l.isLight)l.intensity=1.5+nightMix*4});
   residents.update(state,dt,selected);ghost.update(state.elapsed,night,state.settings.reducedMotion||state.paused);
   dust.visible=!state.settings.reducedMotion;dust.rotation.y=state.elapsed*.006;dust.position.y=Math.sin(state.elapsed*.09)*.12;
   controls.enableDamping=!state.settings.reducedMotion;controls.update();renderer.render(scene,camera);
  },
  dispose(){disposed=true;observer.disconnect();controls.dispose();canvas.removeEventListener('pointerdown',pointerdown);canvas.removeEventListener('pointerup',pointerup);canvas.removeEventListener('pointercancel',cancel);canvas.removeEventListener('webglcontextlost',contextLost);const geos=new Set(),mats=new Set();scene.traverse(o=>{if(o.geometry)geos.add(o.geometry);if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])mats.add(m)});geos.forEach(g=>g.dispose());mats.forEach(m=>{m.map?.dispose();m.dispose()});renderer.dispose()}
 };
}
