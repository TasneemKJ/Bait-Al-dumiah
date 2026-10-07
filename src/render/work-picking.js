import * as T from 'three';
import {ROOMS,TEA_TABLE,STITCH_TABLE} from '../content.js';
import {PHYSICAL_ACTIVITIES} from '../simulation.js';
import {CHIME_LAYOUT} from './moon-chimes.js';

// Screen-space picking and projection for the three physical rituals (tea, sewing,
// chimes). The world owns which ritual is active; this module only answers where
// things are on screen and what a touch landed on.

// Picking and screen projection for the moon chimes.
function chimePicking({canvas,camera,ray,moonChimes,isActive,workRay,projectWorkPoint}){
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
  if(!isActive('lullaby'))return [];camera.updateMatrixWorld();
  return moonChimes.points().map(p=>({key:p.key,...projectWorkPoint(p.world),
    bounds:chimeTargetBounds(moonChimes.targets.find(target=>target.userData.chime===p.key))}));
 }
 function chimePullSpan(){
  if(!isActive('lullaby'))return 0;moonChimes.root.updateWorldMatrix(true,true);camera.updateMatrixWorld();
  const p=moonChimes.root.localToWorld(new T.Vector3(0,1.16,0)),q=p.clone();q.y-=CHIME_LAYOUT.pull;
  return Math.abs(projectWorkPoint(p.toArray()).y-projectWorkPoint(q.toArray()).y);
 }
 return {chimeAt,chimePositions,chimePullSpan};
}

// Targets whose whole ancestry is visible: a hidden part never catches a touch.
const visibleTargets=targets=>targets.filter(target=>{for(let p=target;p;p=p.parent)if(!p.visible)return false;
 return true});
// Picking and screen projection for the sewing cloth, needle and spool.
function stitchPicking({camera,house,ray,sewingPlay,isActive,isLost,sections,workRay,projectWorkPoint}){
 const stitchRoom=ROOMS.find(room=>room.id===STITCH_TABLE.room);
 const stitchPlane=new T.Plane(new T.Vector3(0,1,0),
   -(house.root.position.y+stitchRoom.y+STITCH_TABLE.y)),stitchPoint=new T.Vector3();
 function stitchAt(x,y){
  if(!workRay(x,y,'stitch')||!sewingPlay.root.visible)return null;sewingPlay.root.updateWorldMatrix(true,true);
  return ray.intersectObjects(visibleTargets(sewingPlay.targets),false)[0]?.object.userData.stitch??null;
 }
 function stitchPointAt(x,y){
  if(!workRay(x,y,'stitch')||!ray.ray.intersectPlane(stitchPlane,stitchPoint))return null;
  // The elevated grip projects beyond the cloth. Preserve that raw offset;
  // the input adapter clamps only after applying its two-dimensional delta.
  return {x:(stitchPoint.x-stitchRoom.x-STITCH_TABLE.x)/STITCH_TABLE.clothScale,
    y:(stitchPoint.z-STITCH_TABLE.z)/STITCH_TABLE.clothScale};
 }
 function stitchPositions(){
  if(!isActive('stitch'))return [];camera.updateMatrixWorld();sewingPlay.root.updateWorldMatrix(true,true);
  return sewingPlay.points().map(point=>({key:point.key,...projectWorkPoint(point.world)}));
 }
 function projectStitch(x,y,height=0){
  if(!isActive('stitch')||isLost()||![x,y,height].every(Number.isFinite))return null;camera.updateMatrixWorld();
  const point=projectWorkPoint([stitchRoom.x+STITCH_TABLE.x+x*STITCH_TABLE.clothScale,
    house.root.position.y+stitchRoom.y+STITCH_TABLE.y+height,STITCH_TABLE.z+y*STITCH_TABLE.clothScale]);
  return Number.isFinite(point.x)&&Number.isFinite(point.y)?point:null;
 }
 function stitchGuidePositions(){
  if(!isActive('stitch')||isLost())return [];
  return sections().map(section=>section.map(([x,y])=>projectStitch(x,y)));
 }
 return {stitchAt,stitchPointAt,stitchPositions,projectStitch,stitchGuidePositions};
}

export function createWorkPicking({canvas,camera,house,ray,mouse,teaTable,sewingPlay,
  moonChimes,isActive,isLost,sections}){
 function workRay(x,y,id){
  const active=PHYSICAL_ACTIVITIES.includes(id)&&isActive(id),rect=canvas.getBoundingClientRect();
  if(!active||isLost()||!Number.isFinite(x)||!Number.isFinite(y)||x<rect.left||
    x>rect.right||y<rect.top||y>rect.bottom)return false;
  mouse.set((x-rect.left)/rect.width*2-1,-(y-rect.top)/rect.height*2+1);
  camera.updateMatrixWorld();ray.setFromCamera(mouse,camera);return true;
 }
 function teaRay(x,y){return workRay(x,y,'tea')}
 function teaAt(x,y){
  if(!teaRay(x,y)||!teaTable.root.visible)return null;teaTable.root.updateWorldMatrix(true,true);
  return ray.intersectObjects(visibleTargets(teaTable.targets),false)[0]?.object.userData.tea??null;
 }
 const teaPlane=new T.Plane(new T.Vector3(0,1,0),-(house.root.position.y+TEA_TABLE.y+.48)),teaPoint=new T.Vector3();
 function teaAimAt(x,y){
  if(!teaRay(x,y)||!ray.ray.intersectPlane(teaPlane,teaPoint))return null;
  // The grabbed body is offset from the spout. Keep this coordinate unbounded
  // so delta gestures can reach the edge cups; simulation aim is clamped later.
  const room=ROOMS.find(r=>r.id===TEA_TABLE.room);return (teaPoint.x-room.x-TEA_TABLE.x)/TEA_TABLE.aimSpan;
 }
 function projectWorkPoint(point){const p=new T.Vector3(...point).project(camera);
 return {x:(p.x+1)*canvas.clientWidth/2,y:(1-p.y)*canvas.clientHeight/2}}
 function teaPositions(){
  if(!isActive('tea'))return [];camera.updateMatrixWorld();teaTable.root.updateWorldMatrix(true,true);
  return teaTable.points().map(point=>({key:point.key,...projectWorkPoint(point.world)}));
 }
 const {stitchAt,stitchPointAt,stitchPositions,projectStitch,stitchGuidePositions}=stitchPicking({camera,house,
   ray,sewingPlay,isActive,isLost,sections,workRay,projectWorkPoint});
 const {chimeAt,chimePositions,chimePullSpan}=chimePicking({canvas,camera,ray,moonChimes,
   isActive,workRay,projectWorkPoint});
 return {teaAt,teaAimAt,teaPositions,stitchAt,stitchPointAt,stitchPositions,
   stitchGuidePositions,projectStitch,chimeAt,chimePositions,chimePullSpan};
}
