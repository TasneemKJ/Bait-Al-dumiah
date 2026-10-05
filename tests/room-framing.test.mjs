import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {framing} from '../src/render/visual-policy.js';
import {ROOMS} from '../src/content.js';

test('focused rooms fit between phone controls with their edge objects in view',()=>{
 for(const [w,h,top,bottom] of [
  [320,740,136,128],[360,640,136,128],[390,844,136,128],[412,915,136,128],
  [360,640,136,260],[390,844,136,324],[390,844,258,128],
  [667,375,48,138],[844,390,48,138],[1280,900,112,160],
 ]){
  for(const room of ROOMS){
   const pose=framing(w,h,room.id,{top,bottom}),camera=new T.OrthographicCamera(-pose.height*w/h/2,pose.height*w/h/2,pose.height/2,-pose.height/2,.1,100);
   camera.zoom=pose.zoom;camera.position.fromArray(pose.target).add(new T.Vector3(5.8,5.6,24));camera.lookAt(new T.Vector3(...pose.target));camera.updateProjectionMatrix();camera.updateMatrixWorld();
   for(const x of [-2.38,2.38])for(const y of [.13,3.1])for(const z of [-1.6,2.25]){
    const p=new T.Vector3(room.x+x,room.y+y+.26,z).project(camera),px=(p.x+1)*w/2,py=(1-p.y)*h/2;
    assert.ok(px>=10&&px<=w-10,`${w}×${h} ${room.id}: edge x=${px}`);
    assert.ok(py>=top&&py<=h-bottom,`${w}×${h} ${room.id}: object y=${py} outside ${top}…${h-bottom}`);
   }
  }
 }
});
