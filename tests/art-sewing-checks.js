import * as T from 'three';
import {createSewingPlay} from '../src/render/sewing-play.js';
import {createHouse} from '../src/render/house.js';
import {createStoryProps} from '../src/render/story-props.js';
import {createState,stitchStatus,restore} from '../src/simulation.js';
import {STITCH_TABLE,STITCH_PATTERNS} from '../src/content.js';
import {stitchFraming} from '../src/render/stitch-camera.js';

const cases=[],test=(name,run)=>cases.push({name,run}),assert=(ok,message)=>{if(!ok)throw new Error(message)};
export async function runArtChecks(){const results=[];for(const {name,run} of cases){try{await run();results.push({name,passed:true})}catch(error){results.push({name,passed:false,error:String(error.message)})}}return results}
function fixture(patternId='leaf'){
 const state=createState(),pattern=STITCH_PATTERNS.find(p=>p.id===patternId);assert(pattern,'authored sewing pattern is missing');const first=pattern.sections[0][0];
 state.activities.active={id:'stitch',mode:patternId==='bear-seam'?'mend':'ritual',phase:'sew',level:0,patternId,section:0,distance:0,needle:{x:first[0],y:first[1]},target:{x:first[0],y:first[1]},pressed:false,loose:false,travel:0,alignmentTravel:0,repairs:0,capture:null,result:null};
 return {state,a:state.activities.active,pattern};
}
function view(){const parent=new T.Group();parent.position.y=.26;return createSewingPlay(parent)}
// Static batching records the source vertex range, so check the actual baked
// vertices rather than using stale detached source meshes or source text.
function authoredBounds(root,name){
 root.updateWorldMatrix(true,true);const result=new T.Box3();let found=false;
 root.traverse(o=>{if(!o.isMesh)return;if(o.name===name){result.expandByObject(o);found=true}for(const part of o.bakedParts??[])if(part.source.name===name){const p=o.geometry.attributes.position;for(let i=part.vertexStart;i<part.vertexStart+part.vertexCount;i++)result.expandByPoint(new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld));found=true}});
 assert(found,'missing constructed part '+name);return result;
}
function cameraFor(width,height){const p=stitchFraming(width,height),span=p.height/p.zoom,camera=new T.OrthographicCamera(-span*p.aspect/2,span*p.aspect/2,span/2,-span/2,.01,100);camera.position.fromArray(p.target).add(new T.Vector3(...p.eyeOffset));camera.lookAt(new T.Vector3(...p.target));camera.updateMatrixWorld();return {camera,pose:p}}
function projectedGeometry(o,camera,width,height){
 o.updateWorldMatrix(true,false);const p=o.geometry.attributes.position;let left=Infinity,right=-Infinity,top=Infinity,bottom=-Infinity;
 for(let i=0;i<p.count;i++){const ndc=new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld).project(camera),x=(ndc.x+1)*width/2,y=(1-ndc.y)*height/2;left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y)}
 return {left,right,top,bottom,width:right-left,height:bottom-top};
}
function inSafe(bounds,pose,width,height,name){assert(bounds.left>=0&&bounds.right<=width&&bounds.top>=pose.safeArea.top&&bounds.bottom<=height-pose.safeArea.bottom,name+' leaves the '+width+'x'+height+' safe rectangle')}
function lastPoint(pattern){return pattern.sections.at(-1).at(-1)}

test('W1: complete studio chair stays independently hideable and restores without house damage',()=>{
 const house=createHouse(new T.Group()),chair=house.studioChair;assert(chair?.isGroup&&chair.name==='studio-work-chair'&&chair.userData.noBatch,'studio chair is fused into room geometry');
 let calls=0,triangles=0;chair.traverse(o=>{if(o.isMesh){calls++;triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3}});assert(calls<=2&&triangles>=450,'chair upholstery, legs or efficient local batches were lost');
 const before=new T.Box3().setFromObject(chair);chair.visible=false;assert(house.root.visible&&house.originalTeaSet.visible,'hiding studio chair changes other rooms');chair.visible=true;assert(new T.Box3().setFromObject(chair).equals(before),'restored chair changes geometry or location');
});

test('W2: supported workboard has authored room origin and real machine clearance',()=>{
 const {state}=fixture(),v=view();v.update(state);v.root.updateWorldMatrix(true,true);assert(v.root.getWorldPosition(new T.Vector3()).distanceTo(new T.Vector3(-2.75,4.351,.05))<1e-6,'cloth misses approved world anchor');
 const board=authoredBounds(v.root,'stitch-working-board'),size=board.getSize(new T.Vector3());assert(size.distanceTo(new T.Vector3(1.68,.06,1.15))<1e-6,'physical board dimensions changed');assert(Math.abs(board.min.z-(-.525))<1e-6&&Math.abs(board.min.z-(-.58)-.055)<1e-6,'board penetrates existing machine base');
 for(const name of ['stitch-front-support-left','stitch-front-support-right']){const support=authoredBounds(v.root,name);assert(Math.abs(support.max.y-board.min.y)<1e-6,'front support does not reach board underside');assert(Math.abs(support.min.y-3.57)<1e-6,'front support floats above studio floor')}
});

test('W3: real target meshes keep stable ownership and observational tip is not actionable',()=>{
 const {state,a,pattern}=fixture(),v=view();v.update(state);const targets=v.targets;assert(targets.length===3&&targets.every(o=>o.isMesh&&o.material.visible),'sewing picks are invisible proxy boxes');assert(new Set(targets.map(o=>o.userData.stitch)).size===3,'needle/spool/cloth keys are not distinct');
 for(const point of v.points().filter(p=>p.key!=='tip')){const target=targets.find(o=>o.userData.stitch===point.key);assert(new T.Box3().setFromObject(target).containsPoint(new T.Vector3(...point.world)),'pick anchor misses its actual target')}
 assert(v.points().some(p=>p.key==='tip')&&!targets.some(o=>o.userData.stitch==='tip'),'needle tip became a second action target');assert(!v.points().some(p=>p.key==='cloth'),'unfinished cloth prematurely intercepts finish input');
 a.section=pattern.sections.length;a.distance=0;a.needle={x:lastPoint(pattern)[0],y:lastPoint(pattern)[1]};v.update(state);assert(v.targets===targets&&v.points().some(p=>p.key==='cloth'),'finished target array changes identity or cloth stays hidden');
});

test('W4: actual metal tip contacts and lifts with the actual needle rather than raw target',()=>{
 const {state,a}=fixture(),v=view();a.target={x:.9,y:.9};a.pressed=true;v.update(state);const tip=authoredBounds(v.root,'stitch-needle-tip'),point=v.points().find(p=>p.key==='tip'),grip=v.points().find(p=>p.key==='needle');
 assert(Math.abs(tip.min.y-4.351)<1e-6&&Math.abs(point.world[1]-tip.min.y)<1e-6,'needle cone does not actually touch the cloth');
 assert(Math.abs(grip.local[1]-point.local[1]-.38)<1e-6,'grip loses its authored finger clearance');assert(v.status().needle.x===a.needle.x&&v.status().needle.y===a.needle.y,'renderer predicts the raw target');
 a.pressed=false;v.update(state);assert(Math.abs(authoredBounds(v.root,'stitch-needle-tip').min.y-tip.min.y-.10)<1e-6,'released metal tip does not lift .10');assert(Math.abs(v.points().find(p=>p.key==='needle').local[1]-.48)<1e-6,'released grip misses approved height');
 a.needle={x:-.21,y:.17};v.update(state);assert(v.status().needle.x===-.21&&v.status().needle.y===.17,'actual lifted/corner-routed needle movement is hidden');
});

test('W5: raised thread grows from accepted coverage and completed prefix survives local repair',()=>{
 const {state,a,pattern}=fixture(),v=view();v.update(state);const trail=v.root.getObjectByName('stitch-accepted-thread');assert(!trail.visible,'empty contour already contains completed stitches');
 a.distance=.20;v.update(state);assert(trail.visible&&trail.geometry.attributes.position.count>0,'actual accepted prefix has no raised thread');const expected=stitchStatus(state).acceptedTrail;assert(JSON.stringify(v.status().trail)===JSON.stringify(expected),'visible trail comes from pointer intent instead of accepted state');
 a.section=1;a.distance=.10;v.update(state);const before=v.status().trail.length;assert(v.status().completedSections===1,'completed prefix is not represented');
 a.distance=0;a.needle={x:pattern.sections[1][0][0],y:pattern.sections[1][0][1]};v.update(state);assert(v.status().completedSections===1&&trail.visible&&v.status().trail.length<=before,'local repair removes finished sections');
 const bounds=new T.Box3().setFromObject(trail);assert(bounds.min.y>4.351,'accepted thread is a flat repaint beneath cloth');
});

test('W6: loose loop repairs locally while reduced motion retains necessary needle feedback',()=>{
 const {state,a}=fixture(),v=view();a.distance=.20;a.loose=true;state.settings.reducedMotion=true;v.update(state);const loop=v.root.getObjectByName('stitch-loose-loop');assert(loop.visible&&new T.Box3().setFromObject(loop).getSize(new T.Vector3()).x>.08,'mistake has no real loose thread loop');
 a.loose=false;a.distance=0;a.needle={x:-.6,y:0};v.update(state);assert(!loop.visible,'repair leaves a loose loop on clean work');a.needle={x:-.3,y:-.4};v.update(state);assert(v.status().needle.x===-.3,'reduced motion suppresses deliberate needle movement');
 const before=JSON.stringify(state),pose=JSON.stringify(v.status());state.paused=true;v.update(state);assert(JSON.stringify(v.status())===pose,'paused art animates stable needle/trail targets');state.paused=false;assert(JSON.stringify(state)===before,'sewing art mutates simulation state');
});

test('W7: completed embroidery leaves a physical side tableau and replay resets all work poses',()=>{
 const {state,a,pattern}=fixture(),v=view();a.section=pattern.sections.length;a.needle={x:lastPoint(pattern)[0],y:lastPoint(pattern)[1]};v.update(state);assert(v.status().finishedClothVisible&&v.points().some(p=>p.key==='cloth'),'covered work has no physical finish target');
 const sewn=v.root.getObjectByName('stitch-finished-embroidery');assert(sewn.visible&&sewn.geometry.attributes.position.count>0,'side cloth has no actual earned thread');a.phase='finished';v.update(state);assert(v.status().phase==='finished'&&v.status().finishedClothVisible,'explicit finish destroys the terminal tableau');
 const next=fixture('jasmine');v.update(next.state);assert(v.status().patternId==='jasmine'&&v.status().section===0&&!v.status().finishedClothVisible&&!v.root.getObjectByName('stitch-accepted-thread').visible,'replay keeps old pattern/progress/finish target');
 next.state.activities.active=null;v.update(next.state);assert(!v.root.visible&&v.points().length===0&&!v.status().active,'exit leaves sewing geometry or picks active');
});

test('W8: actual filled targets and all allowed grip positions fit five work cameras',()=>{
 const {state,a,pattern}=fixture(),v=view();a.section=pattern.sections.length;a.needle={x:0,y:0};v.update(state);
 for(const [width,height] of [[320,568],[390,844],[667,375],[667,320],[1280,900]]){const {camera,pose}=cameraFor(width,height);
  for(const target of v.targets){const bounds=projectedGeometry(target,camera,width,height);assert(bounds.width>=44&&bounds.height>=44,target.userData.stitch+' relies on a bigger invisible hit box');inSafe(bounds,pose,width,height,target.userData.stitch)}
  inSafe(projectedGeometry(v.root.getObjectByName('stitch-working-board'),camera,width,height),pose,width,height,'complete board');
  for(const x of [-1,1])for(const y of [-1,1])for(const pressed of [false,true]){a.needle={x,y};a.pressed=pressed;v.update(state);const grip=v.targets.find(o=>o.userData.stitch==='needle');inSafe(projectedGeometry(grip,camera,width,height),pose,width,height,'full-range '+(pressed?'contact':'released')+' grip');
   const points=v.points(),tip=new T.Vector3(...points.find(p=>p.key==='tip').world).project(camera),handle=new T.Vector3(...points.find(p=>p.key==='needle').world).project(camera);assert((handle.y-tip.y)*height/2>=36,'grip is less than36px above needle tip')}
 }
});

test('W9: all sewing feedback stays within rig draw/triangle/shadow budgets',()=>{
 const {state,a,pattern}=fixture('heart'),v=view();a.section=pattern.sections.length;a.needle={x:lastPoint(pattern)[0],y:lastPoint(pattern)[1]};a.loose=true;v.update(state);let triangles=0,calls=0,lights=0;v.root.traverse(o=>{if(o.isLight)lights++;if(!o.isMesh||!o.material.visible)return;for(let p=o;p;p=p.parent)if(!p.visible)return;triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;calls++;assert(!o.castShadow,'sewing adds shadow-pass geometry')});assert(triangles<5000,'sewing rig submits '+triangles+' triangles');assert(calls<=24,'sewing rig submits '+calls+' draws');assert(lights===0,'sewing rig adds lights');
});

test('W10: completed story derives a permanent cream patch and red seam after reload',()=>{
 const red=new T.Color(0xb44946);
 for(const restored of [false,true]){const state=createState();state.story={chapter:1,step:0,lastAction:null,lastActionAt:-10};const saved=restore(JSON.stringify(state)),v=createStoryProps(new T.Group());v.update(restored?saved:state,0);const bear=v.root.getObjectByName('story-mended-bear');assert(bear.visible&&v.status().bearVisible,'earned bear disappears after restored story');
  authoredBounds(bear,'story-earned-bear-patch');let count=0;bear.traverse(o=>{const c=o.geometry?.attributes.color;if(!c)return;for(let i=0;i<c.count;i++)if(Math.abs(c.getX(i)-red.r)<1e-6&&Math.abs(c.getY(i)-red.g)<1e-6&&Math.abs(c.getZ(i)-red.b)<1e-6)count++});assert(count>=100,'mended bear has no actual red stitch geometry')}
 const state=createState(),v=createStoryProps(new T.Group());v.update(state,0);assert(!v.root.getObjectByName('story-mended-bear').visible,'unearned patched bear appears');
});

test('W11: repair reel has closed cream flanges, inset red thread and no coincident faces',()=>{
 const {state}=fixture(),v=view();v.update(state);v.root.updateWorldMatrix(true,true);
 const spool=v.root.getObjectByName('stitch-repair-spool'),target=v.targets.find(o=>o.userData.stitch==='spool'),inverse=spool.matrixWorld.clone().invert(),faces=new Set(),cream=new T.Color(0xeedac1),red=new T.Color(0xa74345);
 let duplicates=0,topCreamArea=0,bottomCreamArea=0,barrelFaces=0,maxRadius=0,minY=Infinity,maxY=-Infinity;
 spool.traverse(o=>{
  if(!o.isMesh)return;
  const p=o.geometry.attributes.position,c=o.geometry.attributes.color,index=o.geometry.index,matrix=inverse.clone().multiply(o.matrixWorld),count=index?.count??p.count;
  assert(!Array.isArray(o.material)&&o.material.opacity===1&&!o.material.transparent,'repair reel introduces transparent overlapping finishes');
  for(let i=0;i<count;i+=3){
   const ids=[0,1,2].map(j=>index?index.getX(i+j):i+j),vertices=ids.map(j=>new T.Vector3().fromBufferAttribute(p,j).applyMatrix4(matrix));
   for(const a of vertices){minY=Math.min(minY,a.y);maxY=Math.max(maxY,a.y);maxRadius=Math.max(maxRadius,Math.hypot(a.x,a.z))}
   const normal=new T.Vector3().subVectors(vertices[1],vertices[0]).cross(new T.Vector3().subVectors(vertices[2],vertices[0])),area=normal.length()/2;if(area<1e-10)continue;
   const key=vertices.map(a=>a.toArray().map(n=>Math.round(n*1e6)).join(',')).sort().join('|');if(faces.has(key))duplicates++;faces.add(key);
   const isColor=color=>c&&ids.every(j=>Math.abs(c.getX(j)-color.r)<1e-6&&Math.abs(c.getY(j)-color.g)<1e-6&&Math.abs(c.getZ(j)-color.b)<1e-6);
   if(vertices.every(a=>Math.abs(a.y-.26)<1e-6)&&isColor(cream))topCreamArea+=area;
   if(vertices.every(a=>Math.abs(a.y)<1e-6)&&isColor(cream))bottomCreamArea+=area;
   if(vertices.every(a=>a.y>=.031&&a.y<=.229)&&isColor(red)){barrelFaces++;assert(vertices.every(a=>Math.hypot(a.x,a.z)<=.143),'red thread is not inset from the flanges')}
  }
 });
 assert(duplicates===0,'repair reel has '+duplicates+' duplicate nondegenerate coincident triangles');
 assert(topCreamArea>.085&&bottomCreamArea>.085&&barrelFaces>=40,'real opaque cream caps or red barrel were lost');
 assert(Math.abs(minY)<1e-6&&Math.abs(maxY-.26)<1e-6&&Math.abs(maxRadius-.175)<1e-6,'reel changes its approved height or diameter');
 assert(v.status().spool.center.every((n,i)=>Math.abs(n-[.65,.13,.03][i])<1e-6),'repair anchor moved');
 const ray=new T.Raycaster(spool.localToWorld(new T.Vector3(.10,.50,0)),new T.Vector3(0,-1,0)),hit=ray.intersectObjects(v.targets,false)[0];
 assert(hit?.object===target&&Math.abs(spool.worldToLocal(hit.point.clone()).y-.26)<1e-6,'closed visible cream cap does not own the actual spool pick');
});
