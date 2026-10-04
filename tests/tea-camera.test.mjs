import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createCameraMove} from '../src/render/camera-motion.js';
const api=await import('../src/render/tea-camera.js').catch(()=>({}));

function project(pose,point,width,height){
 const camera=new T.OrthographicCamera(-pose.height*pose.aspect/2,pose.height*pose.aspect/2,pose.height/2,-pose.height/2,.1,100);
 camera.zoom=pose.zoom;camera.position.fromArray(pose.target).add(new T.Vector3(...pose.eyeOffset));camera.lookAt(new T.Vector3(...pose.target));camera.updateProjectionMatrix();camera.updateMatrixWorld();
 const p=new T.Vector3(...point).project(camera);return {x:(p.x+1)*width/2,y:(1-p.y)*height/2};
}

test('tea work view keeps the pot, fill lines and serving edge inside usable phone and desktop space',()=>{
 assert.equal(typeof api.teaFraming,'function');
 for(const [w,h] of [[320,740],[390,844],[667,375],[844,390],[844,320],[1280,900]]){
  const pose=api.teaFraming(w,h),{top,bottom}=pose.safeArea;
  const anchors=[];
  for(const x of [-.33,0,.33])for(const y of [0,.24])anchors.push([x,y,.14]);
  for(const aim of [-.45,.45])anchors.push([aim,.48,.14],[aim-.22,.70,.10]);
  anchors.push([-.50,.015,.44],[.50,.015,.44]);
  for(const [x,y,z] of anchors){const p=project(pose,[-2.93+x,1.039+y,.1+z],w,h);assert.ok(p.x>=8&&p.x<=w-8,`${w}x${h} x=${p.x}`);assert.ok(p.y>=top&&p.y<=h-bottom,`${w}x${h} y=${p.y}, safe ${top}–${h-bottom}`)}
  const a=project(pose,[-3.07,1.16,.24],w,h),b=project(pose,[-2.79,1.16,.24],w,h);
  assert.ok(b.x-a.x>=44,`${w}x${h} cup width ${b.x-a.x}`);
 }
});

test('tea camera sanitizes bad viewport input and never changes the authored eye direction',()=>{
 assert.equal(typeof api.teaFraming,'function');
 for(const [w,h] of [[0,0],[NaN,Infinity],[-1,-2]]){const pose=api.teaFraming(w,h);assert.ok(pose.height>0);assert.ok(pose.target.every(Number.isFinite));assert.deepEqual(pose.eyeOffset,[0,12,14])}
});

test('camera flights accept a validated work angle and preserve the ordinary house angle',()=>{
 const camera=new T.OrthographicCamera(-5,5,5,-5,.1,100),controls={target:new T.Vector3(),enableDamping:false,minZoom:.8,maxZoom:3.5,update(){camera.lookAt(this.target)}};
 const move=createCameraMove(camera,controls),target=[1,2,3];
 assert.equal(move.moveTo({target,zoom:1,eyeOffset:[0,12,14]},true),true);assert.deepEqual(camera.position.toArray(),[1,14,17]);
 assert.equal(move.moveTo({target,zoom:1},true),true);assert.deepEqual(camera.position.toArray(),[6.8,7.6,27]);
 const before=camera.position.clone();
 for(const eyeOffset of [[0,0,0],[NaN,12,14],[1,2],null,'high']){assert.equal(move.moveTo({target,zoom:1,eyeOffset},true),false);assert.deepEqual(camera.position,before)}
});
