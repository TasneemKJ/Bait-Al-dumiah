import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {ROOMS,STITCH_TABLE} from '../src/content.js';
const api=await import('../src/render/stitch-camera.js').catch(()=>({}));
const views=[[320,568],[320,740],[390,844],[667,375],[667,320],[844,390],[1280,900]];

function center(){
 const room=ROOMS.find(r=>r.id===STITCH_TABLE.room);
 return [room.x+STITCH_TABLE.x,room.y+.26+STITCH_TABLE.y,STITCH_TABLE.z];
}
function projection(pose,width,height){
 const camera=new T.OrthographicCamera(-pose.height*pose.aspect/2,pose.height*pose.aspect/2,pose.height/2,-pose.height/2,.1,100);
 camera.zoom=pose.zoom;camera.position.fromArray(pose.target).add(new T.Vector3(...pose.eyeOffset));camera.lookAt(new T.Vector3(...pose.target));camera.updateProjectionMatrix();camera.updateMatrixWorld();
 return point=>{const p=new T.Vector3(...point).project(camera);return {x:(p.x+1)*width/2,y:(1-p.y)*height/2}};
}

test('sewing framing contains the full board and full normalized grip range in both needle poses',()=>{
 assert.equal(typeof api.stitchFraming,'function');
 const [cx,cy,cz]=center(),table=STITCH_TABLE;
 for(const [w,h] of views){
  const pose=api.stitchFraming(w,h),project=projection(pose,w,h),pixels=h*pose.zoom/pose.height;
  const inside=(p,r,label)=>{assert.ok(p.x-r>=-1e-6&&p.x+r<=w+1e-6,`${w}x${h} ${label} horizontal bounds`);assert.ok(p.y-r>=pose.safeArea.top-1e-6&&p.y+r<=h-pose.safeArea.bottom+1e-6,`${w}x${h} ${label} vertical bounds ${p.y-r}..${p.y+r}`)};
  for(const x of [-1,1])for(const z of [-1,1])for(const y of [-1,1]){
   inside(project([cx+x*table.boardSize[0]/2,cy-.041+y*table.boardSize[1]/2,cz+z*table.boardSize[2]/2]),0,'board corner');
  }
  for(const x of [-1,0,1])for(const y of [-1,0,1])for(const lift of [0,.10]){
   const tip=[cx+x*table.clothScale,cy+lift,cz+y*table.clothScale];
   inside(project(tip),0,'actual needle tip');
   inside(project([tip[0],tip[1]+table.gripHeight,tip[2]]),table.gripDiameter/2*pixels,'filled grip');
  }
 }
});

test('sewing targets retain real 44px surfaces, finger clearance and authored board edge padding',()=>{
 assert.equal(typeof api.stitchFraming,'function');
 const [cx,cy,cz]=center(),table=STITCH_TABLE;
 assert.ok(table.boardSize[0]/2-Math.abs(table.spoolOffset[0])-table.spoolDiameter/2>=table.boardEdgePadding-1e-9);
 assert.ok(table.boardSize[0]/2-Math.abs(table.finishOffset[0])-table.finishSize[0]/2>=table.boardEdgePadding-1e-9);
 assert.ok(table.boardSize[2]/2-Math.abs(table.finishOffset[2])-table.finishSize[1]/2>=table.boardEdgePadding-1e-9);
 for(const [w,h] of views){
  const pose=api.stitchFraming(w,h),project=projection(pose,w,h),pixels=h*pose.zoom/pose.height;
  assert.ok(table.gripDiameter*pixels>=44,`${w}x${h} spherical grip diameter`);
  assert.ok(table.spoolDiameter*pixels>=44,`${w}x${h} spool diameter`);
  const tip=project([cx,cy,cz]),grip=project([cx,cy+table.gripHeight,cz]);
  assert.ok(tip.y-grip.y>=36,`${w}x${h} finger clearance ${tip.y-grip.y}`);
  const [ox,oy,oz]=table.finishOffset,[fw,fd]=table.finishSize;
  const corners=[-1,1].flatMap(x=>[-1,1].map(z=>project([cx+ox+x*fw/2,cy+oy,cz+oz+z*fd/2])));
  const xs=corners.map(p=>p.x),ys=corners.map(p=>p.y);
  assert.ok(Math.max(...xs)-Math.min(...xs)>=44,`${w}x${h} flat cloth width`);
  assert.ok(Math.max(...ys)-Math.min(...ys)>=44,`${w}x${h} flat cloth depth`);
  for(const p of corners)assert.ok(p.x>=0&&p.x<=w&&p.y>=pose.safeArea.top&&p.y<=h-pose.safeArea.bottom,`${w}x${h} finished cloth is reachable`);
 }
});

test('sewing camera preserves the elevated studio origin, fixed angle and safe-area policies',()=>{
 assert.equal(typeof api.stitchFraming,'function');
 assert.deepEqual(center(),[-2.75,4.351,.05]);
 for(const [w,h,top,bottom] of [[320,568,90,176],[390,844,90,176],[667,375,68,112],[667,320,60,92],[1280,900,72,132]]){
  const pose=api.stitchFraming(w,h);
  assert.deepEqual(pose.safeArea,{top,bottom});assert.deepEqual(pose.eyeOffset,[0,12,14]);assert.equal(pose.zoom,1.8);
  assert.equal(pose.target[0],center()[0]);assert.equal(pose.target[2],center()[2]);assert.ok(pose.target[1]>4);
 }
 for(const [w,h] of [[0,0],[NaN,Infinity],[-1,-2]]){
  const pose=api.stitchFraming(w,h);assert.ok(pose.height>0);assert.ok(pose.target.every(Number.isFinite));assert.deepEqual(pose.eyeOffset,[0,12,14]);
 }
});
