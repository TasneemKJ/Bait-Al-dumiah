import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {framing} from '../src/render/visual-policy.js';
import {storyObjective} from '../src/story-ui.js';
import {createState,interactStory} from '../src/simulation.js';
import {translate} from '../src/i18n.js';

function project(pose,width,height,point){
 const c=new T.OrthographicCamera(-pose.height*width/height/2,pose.height*width/height/2,pose.height/2,-pose.height/2,.1,100);
 c.zoom=pose.zoom;c.position.fromArray(pose.target).add(new T.Vector3(5.8,5.6,24));c.lookAt(new T.Vector3(...pose.target));c.updateProjectionMatrix();c.updateMatrixWorld();
 const p=new T.Vector3(...point).project(c);return {x:(p.x+1)*width/2,y:(1-p.y)*height/2};
}
test('short-phone browsing recovers meaningful room scale from an absent ribbon',()=>{
 const idle=framing(360,640,'kitchen',{top:136,bottom:128});
 const occupied=framing(360,640,'kitchen',{top:166,bottom:308});
 assert.ok(idle.zoom>=occupied.zoom*1.45,`idle ${idle.zoom}, occupied ${occupied.zoom}`);
});
test('width-limited phone brings the kitchen down into recovered canvas without cropping its edges',()=>{
 const idle=framing(390,844,'kitchen',{top:136,bottom:128});
 const occupied=framing(390,844,'kitchen',{top:166,bottom:308});
 assert.ok(Math.abs(idle.zoom-occupied.zoom)<.01,'width-bound scene must not gain a careless zoom');
 const point=[-2.5,1.5,0],after=project(idle,390,844,point),before=project(occupied,390,844,point);
 assert.ok(after.y-before.y>=80,`recovered placement only ${after.y-before.y}px`);
});
test('arriving in the clue room points to the real object without completing anything',()=>{
 for(const locale of ['en','ar']){
  const state=createState(),before=JSON.stringify(state),t=key=>translate(locale,key);
  const away=storyObjective(state,t,null),arrived=storyObjective(state,t,'kitchen');
  assert.notEqual(arrived.label,away.label,'arrival must stop repeating Look in the Kitchen');
  assert.ok(arrived.label.includes(t('object-mint-tin')));
  assert.equal(arrived.action,'story-hint');assert.equal(arrived.value,'kitchen');
  assert.equal(arrived.arrived,true);assert.equal(away.arrived,false);
  assert.equal(JSON.stringify(state),before);
  interactStory(state,'prop:mint-tin');
  assert.equal(storyObjective(state,t,'kitchen').arrived,false);
  assert.equal(storyObjective(state,t,'studio').arrived,true);
 }
});

test('whole-house reset ignores transient clue and ribbon reservations',()=>{
 for(const [w,h] of [[360,640],[390,844],[844,390],[1280,800]]){
  assert.deepEqual(framing(w,h,null,{top:250,bottom:340}),framing(w,h));
  assert.deepEqual(framing(w,h,'not-a-room',{top:250,bottom:340}),framing(w,h));
 }
});
