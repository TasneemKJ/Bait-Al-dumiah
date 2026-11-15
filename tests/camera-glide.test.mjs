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

// Round 7: "the camera never settles on night one". Logged cause: the night-one pose is inside every limit (below);
// the glide was frozen, not lost: renderFrame ticked the camera only while the game was unpaused, and any sheet
// pauses the game, so a glide caught by a sheet stayed "moving" until the sheet closed.
test('the night-one tea-set pose lies inside the camera\'s angle and zoom limits',async()=>{
 const {TEA_TABLE}=await import('../src/content.js');
 const pose=framing(390,844,'kitchen',{subject:[TEA_TABLE.x,.85]}),eye=[5.8,5.6,24],r=Math.hypot(...eye);
 const polar=Math.acos(eye[1]/r),azimuth=Math.atan2(eye[0],eye[2]);
 assert.ok(polar>=1.10&&polar<=1.50,`polar ${polar}`);assert.ok(Math.abs(azimuth)<=.48,`azimuth ${azimuth}`);
 assert.ok(pose.zoom>=.8&&pose.zoom<=3.5,`zoom ${pose.zoom}`);
});
test('the night-one glide settles within two seconds of frames, and a sheet never freezes it',async()=>{
 const {readFileSync}=await import('node:fs');const {TEA_TABLE}=await import('../src/content.js');
 const {camera,cameraMove}=rig();camera.zoom=1;
 cameraMove.moveTo(framing(390,844,'kitchen',{subject:[TEA_TABLE.x,.85]}));let t=0;
 while(cameraMove.active&&t<10){cameraMove.tick(1/60);t+=1/60}
 assert.ok(t<2,`settled after ${t.toFixed(2)} s`);
 const frame=readFileSync(new URL('../src/render/world-frame.js',import.meta.url),'utf8');
 assert.match(frame,/\n cameraMove\.tick\(dt,st\.reducedMotion\);/,'the camera glides on while a sheet pauses the game');
 assert.doesNotMatch(frame,/if\(!state\.paused\)cameraMove\.tick/);
});
