import * as T from 'three';
import {createHouse} from '../src/render/house.js';
import {createCraftDetails,createGarden} from '../src/render/ornaments.js';
import {createKeepsakeDetails} from '../src/render/keepsake-details.js';
import {createLevantineSetting} from '../src/render/levantine-setting.js';
import {createRestoration} from '../src/render/restoration.js';
import {createStoryProps} from '../src/render/story-props.js';
import {createSewingPlay} from '../src/render/sewing-play.js';
import {createMoonChimes} from '../src/render/moon-chimes.js';
import {createState} from '../src/simulation.js';
import {STITCH_PATTERNS} from '../src/content.js';
import {stitchFraming} from '../src/render/stitch-camera.js';

const cases=[],test=(name,run)=>cases.push({name,run});
const assert=(ok,message)=>{if(!ok)throw new Error(message)};
export async function runArtChecks(){const results=[];for(const {name,run} of cases){try{await run();results.push({name,passed:true})}catch(error){results.push({name,passed:false,error:String(error.message)})}}return results}
const viewports=[[320,568],[390,844],[667,375],[667,320],[1280,900]];
function fixture(){
 const scene=new T.Scene(),house=createHouse(scene),state=createState();
 // Include the complete architectural/decorative scene around the worktable.
 // No roof, room ornament or foreground mesh is omitted to make a ray pass.
 createKeepsakeDetails(house.root);createCraftDetails(house.root);createGarden(house.root);
 const courtyard=createLevantineSetting(house.root);courtyard.update(state,0);
 createRestoration(house.root).update(state,0);createStoryProps(house.root).update(state,0);
 createMoonChimes(house.root).update(state);
 const sewing=createSewingPlay(house.root);
 return {scene,house,courtyard,state,sewing};
}
function setNeedle(f,pattern,p,pressed=false){
 f.state.activities.active={id:'stitch',mode:pattern.id==='bear-seam'?'mend':'ritual',phase:'sew',level:0,patternId:pattern.id,section:0,distance:0,needle:{x:p[0],y:p[1]},target:{x:p[0],y:p[1]},pressed,loose:false,travel:0,alignmentTravel:0,repairs:0,capture:null,result:null};
 f.sewing.update(f.state);f.scene.updateMatrixWorld(true);
}
function cameraFor(width,height){
 const pose=stitchFraming(width,height),span=pose.height/pose.zoom;
 const camera=new T.OrthographicCamera(-span*pose.aspect/2,span*pose.aspect/2,span/2,-span/2,.01,100);
 camera.position.fromArray(pose.target).add(new T.Vector3(...pose.eyeOffset));camera.lookAt(new T.Vector3(...pose.target));camera.updateMatrixWorld();
 return {camera,pose};
}
function visible(o){for(let p=o;p;p=p.parent)if(!p.visible)return false;return true}
function fullSceneHit(f,camera,ndc){
 f.scene.updateMatrixWorld(true);
 const meshes=[];f.scene.traverse(o=>{if(o.isMesh&&visible(o)){const materials=Array.isArray(o.material)?o.material:[o.material];if(materials.some(m=>m.visible&&m.opacity>0))meshes.push(o)}});
 const ray=new T.Raycaster();ray.setFromCamera(ndc,camera);
 // This is the full visible mesh set, not sewing.targets. Decorative meshes
 // remain eligible foreground hits, including the legitimate cream grip inlay.
 return ray.intersectObjects(meshes,false).find(hit=>{const m=Array.isArray(hit.object.material)?hit.object.material[hit.face?.materialIndex??0]:hit.object.material;return m.visible&&m.opacity>0})??null;
}
function gripPoint(f,camera){
 const point=f.sewing.points().find(p=>p.key==='needle');assert(point,'actual grip anchor is missing');
 return new T.Vector3(...point.world).project(camera);
}
function hitDescription(hit){
 if(!hit)return 'no visible mesh';
 const object=hit.object,owners=[];for(let p=object.parent;p;p=p.parent)if(p.name)owners.push(p.name);
 let source=object;
 if(Number.isInteger(hit.faceIndex)&&object.bakedParts){
  const index=object.geometry.index,vertices=[0,1,2].map(i=>index?index.getX(hit.faceIndex*3+i):hit.faceIndex*3+i);
  source=object.bakedParts.find(part=>vertices.every(i=>i>=part.vertexStart&&i<part.vertexStart+part.vertexCount))?.source??object;
 }
 return (object.name||object.type)+' owner='+owners.join('/')+' source='+(source.name||source.type)+' at='+source.position.toArray().join(',')+' face='+hit.faceIndex;
}
function needleHit(hit){return hit&&(hit.object.userData.stitch==='needle'||hit.object.name==='stitch-grip-cream-inlay')}
function belongsTo(o,group){for(let p=o;p;p=p.parent)if(p===group)return true;return false}
function projectedBounds(o,camera,width,height){
 o.updateWorldMatrix(true,false);const p=o.geometry.attributes.position;
 let left=Infinity,right=-Infinity,top=Infinity,bottom=-Infinity;
 for(let i=0;i<p.count;i++){const v=new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld).project(camera),x=(v.x+1)*width/2,y=(1-v.y)*height/2;left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y)}
 return {left,right,top,bottom,width:right-left,height:bottom-top};
}
function checkGrip(f,camera,pose,width,height,label){
 const grip=f.sewing.targets.find(o=>o.userData.stitch==='needle'),bounds=projectedBounds(grip,camera,width,height);
 assert(bounds.width>=44&&bounds.height>=44,label+' loses the real44px grip envelope');
 assert(bounds.left>=0&&bounds.right<=width&&bounds.top>=pose.safeArea.top&&bounds.bottom<=height-pose.safeArea.bottom,label+' leaves the existing safe work rectangle');
 const p=gripPoint(f,camera),hit=fullSceneHit(f,camera,new T.Vector2(p.x,p.y));
 assert(needleHit(hit),label+' is occluded by '+hitDescription(hit));
}
function contourSamples(pattern){
 const result=[],seen=new Set(),add=p=>{const key=p.join(',');if(!seen.has(key)){seen.add(key);result.push(p)}};
 for(const section of pattern.sections)for(let i=0;i<section.length;i++){add(section[i]);if(i)add([(section[i-1][0]+section[i][0])/2,(section[i-1][1]+section[i][1])/2])}
 // Deliberate misses may move outside a motif but remain inside this domain.
 for(const p of [[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]])add(p);
 return result;
}
function bakedPartBounds(root,name){
 const box=new T.Box3();let found=false;root.updateWorldMatrix(true,true);
 root.traverse(o=>{if(!o.isMesh)return;if(o.name===name){box.expandByObject(o);found=true}for(const part of o.bakedParts??[])if(part.source.name===name){const p=o.geometry.attributes.position;for(let i=part.vertexStart;i<part.vertexStart+part.vertexCount;i++)box.expandByPoint(new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld));found=true}});
 assert(found,'missing preserved ceiling part '+name);return box;
}
test('CW1: sewing cutaway contains only the original top slab and two front fascia finishes',()=>{
 const house=createHouse(new T.Scene()),ceiling=house.workCeiling;
 assert(ceiling?.isGroup&&ceiling.userData.noBatch&&ceiling.parent===house.root,'ceiling cannot hide independently');
 const expected=[['work-ceiling-slab',[0,6.66,-.02],[9.85,.16,3.65]],['work-ceiling-cream-fascia',[0,6.69,1.77],[9.91,.15,.10]],['work-ceiling-gold-fascia',[0,6.595,1.80],[9.87,.03,.04]]];
 const names=[];let calls=0;ceiling.traverse(o=>{if(!o.isMesh)return;calls++;if(o.bakedParts)names.push(...o.bakedParts.map(p=>p.source.name));else names.push(o.name)});
 assert(names.length===3&&names.every(name=>expected.some(p=>p[0]===name)),'cutaway includes unrelated roof or room geometry');
 assert(calls===2,'ceiling no longer batches its two original finishes efficiently');
 for(const [name,center,size] of expected){const b=bakedPartBounds(ceiling,name);assert(b.getCenter(new T.Vector3()).distanceTo(new T.Vector3(...center))<1e-6,name+' moved');assert(b.getSize(new T.Vector3()).distanceTo(new T.Vector3(...size))<1e-6,name+' changed size')}
 let houseCalls=0;house.root.traverse(o=>{if(o.isMesh)houseCalls++});assert(houseCalls<=40,'house exceeds its unchanged40-mesh budget');
});

test('CW2: original ceiling and studio arch demonstrably block jasmine and their cutaways expose the real grip',()=>{
 const f=fixture(),pattern=STITCH_PATTERNS.find(p=>p.id==='jasmine');
 f.house.studioChair.visible=false;setNeedle(f,pattern,pattern.sections[0][0]);
 for(const [width,height] of viewports){const {camera,pose}=cameraFor(width,height),p=gripPoint(f,camera);
  f.courtyard.studioArch.visible=true;f.house.workCeiling.visible=true;const before=fullSceneHit(f,camera,new T.Vector2(p.x,p.y));
  assert(before&&belongsTo(before.object,f.house.workCeiling),'fixture does not reproduce real jasmine ceiling occlusion at '+width+'x'+height);
  f.house.workCeiling.visible=false;
  const archHit=fullSceneHit(f,camera,new T.Vector2(p.x,p.y));
  assert(archHit?.object===f.courtyard.studioArch,'fixture does not reproduce remaining studio arch occlusion: '+hitDescription(archHit));
  f.courtyard.studioArch.visible=false;checkGrip(f,camera,pose,width,height,'jasmine '+width+'x'+height);
  // Inspect actual screen rays inside the44px target area as well as its center.
  for(const [x,y] of [[-20,0],[20,0],[0,-20],[0,20]]){const hit=fullSceneHit(f,camera,new T.Vector2(p.x+x*2/width,p.y-y*2/height));assert(needleHit(hit),'jasmine central grip area remains covered by '+hitDescription(hit))}
 }
});

test('CW3: visible-scene rays reach lifted and pressed grips on every authored contour and domain edge',()=>{
 const f=fixture();f.house.studioChair.visible=false;f.house.workCeiling.visible=false;f.courtyard.studioArch.visible=false;
 for(const [width,height] of viewports){const {camera,pose}=cameraFor(width,height);
  for(const pattern of STITCH_PATTERNS)for(const p of contourSamples(pattern))for(const pressed of [false,true]){
   setNeedle(f,pattern,p,pressed);checkGrip(f,camera,pose,width,height,pattern.id+' '+p.join(',')+' '+(pressed?'pressed':'lifted')+' '+width+'x'+height);
  }
 }
});


test('CW4: all four original courtyard arches retain their geometry and only the studio arch escapes batching',()=>{
 const scene=new T.Scene(),parent=new T.Group();parent.position.y=.26;scene.add(parent);
 const courtyard=createLevantineSetting(parent),studio=courtyard.studioArch,entries=[];
 scene.updateMatrixWorld(true);
 courtyard.root.traverse(object=>{
  if(!object.isMesh)return;
  if(object.name==='courtyard-arch')entries.push({object,source:object,part:null});
  for(const part of object.bakedParts??[])if(part.source.name==='courtyard-arch')entries.push({object,source:part.source,part});
 });
 assert(entries.length===4,'an original courtyard arch was removed or duplicated');
 assert(studio?.isMesh&&studio.name==='courtyard-arch'&&studio.parent===courtyard.staticRoot&&studio.userData.noBatch,'studio arch is not independently retained before static batching');
 assert(entries.filter(entry=>entry.object===entry.source).length===1&&entries.find(entry=>entry.object===entry.source)?.source===studio,'an unrelated arch was excluded from batching');
 const expected=[[-2.4,0,1.64],[-2.4,3.2,1.64],[2.4,0,1.64],[2.4,3.2,1.64]];
 const original=studio.geometry,positions=original.attributes.position,colors=original.attributes.color;
 for(const entry of entries){
  const {object,source,part}=entry,position=source.position.toArray(),matched=expected.find(p=>p.every((v,i)=>Math.abs(v-position[i])<1e-9));
  assert(matched,'an original courtyard arch moved');
  expected.splice(expected.indexOf(matched),1);
  assert(source.material===studio.material&&source.material.vertexColors&&source.material.roughness===.91,'an original courtyard arch finish changed');
  const p=source.geometry.attributes.position,c=source.geometry.attributes.color;
  assert(p.count===positions.count&&c.count===colors.count,'an original courtyard arch lost geometry or masonry colors');
  for(let i=0;i<p.array.length;i++)assert(p.array[i]===positions.array[i],'an original courtyard arch shape changed');
  for(let i=0;i<c.array.length;i++)assert(c.array[i]===colors.array[i],'an original courtyard arch color stripes changed');
  const index=source.geometry.index,originalIndex=original.index;
  assert(Boolean(index)===Boolean(originalIndex)&&(!index||index.count===originalIndex.count),'an original courtyard arch topology changed');
  if(index)for(let i=0;i<index.count;i++)assert(index.getX(i)===originalIndex.getX(i),'an original courtyard arch triangle changed');
  const options=source.geometry.parameters.options;
  assert(options.depth===.09&&options.bevelEnabled===false&&options.curveSegments===32,'an original courtyard arch extrusion changed');
  const bounds=new T.Box3();
  if(part){const vertices=object.geometry.attributes.position;for(let i=part.vertexStart;i<part.vertexStart+part.vertexCount;i++)bounds.expandByPoint(new T.Vector3().fromBufferAttribute(vertices,i).applyMatrix4(object.matrixWorld))}
  else bounds.expandByObject(object);
  assert(bounds.getCenter(new T.Vector3()).distanceTo(new T.Vector3(position[0],position[1]+.26+2.815,1.685))<1e-5,'a visible courtyard arch transform changed during batching');
  assert(bounds.getSize(new T.Vector3()).distanceTo(new T.Vector3(4.48,.75,.09))<1e-5,'a visible courtyard arch envelope changed during batching');
 }
 assert(expected.length===0,'a room lost its original courtyard arch');
 // This tests constructed independent ownership, not production mode routing.
 const visibleArches=()=>entries.filter(entry=>visible(entry.object));
 const before=visibleArches();studio.visible=false;
 assert(before.length===4&&visibleArches().length===3&&entries.filter(entry=>entry.source!==studio).every(entry=>visible(entry.object)),'hiding the studio arch removes unrelated masonry');
});
