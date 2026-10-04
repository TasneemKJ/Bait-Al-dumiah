import * as T from 'three';
import {createHouse} from '../src/render/house.js';
import {createCraftDetails,createGarden} from '../src/render/ornaments.js';
import {createKeepsakeDetails} from '../src/render/keepsake-details.js';
import {createLevantineSetting} from '../src/render/levantine-setting.js';
import {createRestoration} from '../src/render/restoration.js';
import {createStoryProps} from '../src/render/story-props.js';
import {createMoonChimes} from '../src/render/moon-chimes.js';
import {chimeFraming} from '../src/render/chime-camera.js';
import {createState,beginActivity,step,grabChime,pullChime,cancelChime} from '../src/simulation.js';

const cases=[],test=(name,run)=>cases.push({name,run}),assert=(ok,message)=>{if(!ok)throw new Error(message)};
export async function runArtChecks(){const results=[];for(const {name,run} of cases){try{await run();results.push({name,passed:true})}catch(error){results.push({name,passed:false,error:String(error.message)})}}return results}
const viewports=[[320,568],[390,844],[667,320],[667,375],[844,390],[1280,900]];
function fixture(){
 const scene=new T.Scene(),house=createHouse(scene),state=createState();
 createKeepsakeDetails(house.root);createCraftDetails(house.root);createGarden(house.root);
 createLevantineSetting(house.root).update(state,0);createRestoration(house.root).update(state,0);createStoryProps(house.root).update(state,0);
 const instrument=createMoonChimes(house.root);beginActivity(state,'lullaby');
 for(let i=0;i<40&&state.activities.active.phase==='listen';i++)step(state,.1);
 assert(state.activities.active.phase==='echo','fixture did not reach real echo phase');
 instrument.update(state);scene.updateMatrixWorld(true);return {scene,house,state,instrument};
}
function cameraFor(width,height){
 const pose=chimeFraming(width,height),span=pose.height/pose.zoom;
 const camera=new T.OrthographicCamera(-span*pose.aspect/2,span*pose.aspect/2,span/2,-span/2,.01,100);
 camera.position.fromArray(pose.target).add(new T.Vector3(...pose.eyeOffset));camera.lookAt(new T.Vector3(...pose.target));camera.updateMatrixWorld();return {camera,pose};
}
function bounds(target,camera,width,height){
 target.updateWorldMatrix(true,false);const p=target.geometry.attributes.position;
 let left=Infinity,right=-Infinity,top=Infinity,bottom=-Infinity;
 for(let i=0;i<p.count;i++){const v=new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(target.matrixWorld).project(camera),x=(v.x+1)*width/2,y=(1-v.y)*height/2;left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y)}
 return {left,right,top,bottom,width:right-left,height:bottom-top};
}
function visible(o){for(let p=o;p;p=p.parent)if(!p.visible)return false;return true}
function belongsTo(o,root){for(let p=o;p;p=p.parent)if(p===root)return true;return false}
function renderedMeshes(root){const meshes=[];root.traverse(o=>{if(!o.isMesh||!visible(o))return;const ms=Array.isArray(o.material)?o.material:[o.material];if(ms.some(m=>m.visible&&m.opacity>0))meshes.push(o)});return meshes}
function firstRendered(ray,meshes){return ray.intersectObjects(meshes,false).find(h=>{const m=Array.isArray(h.object.material)?h.object.material[h.face?.materialIndex??0]:h.object.material;return m.visible&&m.opacity>0})??null}
function owner(instrument,key){return instrument.root.getObjectByName(key==='moon'?'chime-wind-up-moon':'chime-charm-'+key)}
function inspectTargets(f,camera,pose,width,height,label){
 f.scene.updateMatrixWorld(true);const fullScene=renderedMeshes(f.scene);
 assert(f.instrument.targets.length===5,label+' does not have all five actual action meshes');
 for(const target of f.instrument.targets){
  const key=target.userData.chime,box=bounds(target,camera,width,height),own=owner(f.instrument,key),ownMeshes=renderedMeshes(own);
  assert(box.width>=44&&box.height>=44,label+' target '+key+' is only '+box.width.toFixed(2)+'x'+box.height.toFixed(2)+'px');
  assert(box.left>=0&&box.right<=width&&box.top>=pose.safeArea.top&&box.bottom<=height-pose.safeArea.bottom,label+' target '+key+' leaves reserved work area');
  assert(ownMeshes.length>0,label+' action '+key+' has no visible charm or moon');
  const center=target.getWorldPosition(new T.Vector3()),p=center.clone().project(camera);
  // Each charm has a legitimate grab envelope around its curved silhouette.
  // Shape gaps may reveal the room, but foreground architecture cannot mask it.
  for(const [dx,dy] of [[0,0],[-20,0],[20,0],[0,-20],[0,20]]){
   const ray=new T.Raycaster();ray.setFromCamera(new T.Vector2(p.x+2*dx/width,p.y-2*dy/height),camera);
   const pick=ray.intersectObjects(f.instrument.targets,false)[0];
   assert(pick?.object===target,label+' target '+key+' loses or shares its central44px input envelope');
   const sceneHit=firstRendered(ray,fullScene),ownHit=firstRendered(ray,ownMeshes);
   if(ownHit)assert(sceneHit&&belongsTo(sceneHit.object,own),label+' visible charm '+key+' is masked by '+(sceneHit?.object.name||'no rendered mesh'));
   else{
    const planeDistance=center.clone().sub(ray.ray.origin).dot(ray.ray.direction);
    assert(!sceneHit||sceneHit.distance>=planeDistance,label+' grab envelope '+key+' is covered by foreground '+(sceneHit?.object.name||'no rendered mesh'));
   }
  }
 }
}

test('CM1: every actual chime action mesh including the visible replay moon has44px safe geometry',()=>{
 const f=fixture(),moon=f.instrument.targets.find(t=>t.userData.chime==='moon');
 assert(moon.material.visible&&Math.abs(moon.geometry.parameters.radiusTop-.31)<1e-12,'replay moon uses a small visible dial or a larger invisible proxy');
 for(const [width,height] of viewports){const {camera,pose}=cameraFor(width,height);inspectTargets(f,camera,pose,width,height,'rest '+width+'x'+height)}
});

test('CM2: fully pulled charms keep their real target size and clear full-scene input envelopes',()=>{
 const f=fixture();
 for(let id=0;id<4;id++){
  assert(grabChime(f.state,id).ok&&pullChime(f.state,1).ok,'fixture cannot physically pull charm '+id);
  f.instrument.update(f.state);
  for(const [width,height] of viewports){const {camera,pose}=cameraFor(width,height);inspectTargets(f,camera,pose,width,height,'held '+id+' '+width+'x'+height)}
  cancelChime(f.state);f.instrument.update(f.state);
 }
});
