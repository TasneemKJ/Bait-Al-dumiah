import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createCameraMove} from '../src/render/camera-motion.js';
import {cameraApi} from '../src/render/world-camera.js';
import {framing} from '../src/render/visual-policy.js';

// A minimal stand-in for OrbitControls: a target, limits and an update that aims the camera.
function rig(){
 const camera=new T.OrthographicCamera(-5,5,5,-5,.1,100);camera.position.set(5.8,5.6,24);
 const controls={target:new T.Vector3(),enabled:true,enableDamping:false,minZoom:.5,maxZoom:4,
  update(){camera.lookAt(this.target)}};
 const cameraMove=createCameraMove(camera,controls);
 const st={requestedEnabled:true,reducedMotion:false};
 const api=cameraApi({st,canvas:{clientWidth:390,clientHeight:844},camera,controls,house:null,residents:null,
  cameraMove,presentation:{value:{}},working:()=>false,focusPose:()=>null});
 return {camera,controls,cameraMove,api};
}

test('disabling input mid-glide (carrying a story item) lets the room glide land',()=>{
 const {controls,cameraMove,api}=rig();
 assert.equal(api.focusRoom('studio'),true);
 cameraMove.tick(.1);assert.equal(cameraMove.active,true,'the glide is under way');
 api.setEnabled(false);
 assert.equal(controls.enabled,false,'direct camera input is off while carrying');
 assert.equal(cameraMove.active,true,'the glide is not frozen between rooms');
 for(let i=0;i<10;i++)cameraMove.tick(.1);
 const goal=framing(390,844,'studio',{}).target;
 assert.deepEqual(controls.target.toArray().map(v=>+v.toFixed(5)),goal.map(v=>+v.toFixed(5)));
});

test('direct camera input still cancels a glide',()=>{
 const {cameraMove,api}=rig();
 api.focusRoom('studio');cameraMove.tick(.1);api.zoom(1.2);
 assert.equal(cameraMove.active,false);
});
