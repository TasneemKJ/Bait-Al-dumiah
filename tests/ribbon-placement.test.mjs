import test from 'node:test';
import assert from 'node:assert/strict';
import * as storyUI from '../src/story-ui.js';

// Actual 360px native bounds: top controls end at 125px, a crowded bilingual
// ribbon is about 144px tall; held-item and room edges leave its bottom at 450px.
test('the short-phone ribbon yields to the selected prop instead of covering it',()=>{
 assert.equal(typeof storyUI.ribbonEdge,'function');
 assert.equal(storyUI.ribbonEdge(347,137,450,144),'top','held tea stays reachable at its retained camera position');
 assert.equal(storyUI.ribbonEdge(300,137,450,144),'top','a near-midline target needs measured clearance, not a screen-half guess');
 assert.equal(storyUI.ribbonEdge(220,137,450,144),'bottom','upper props retain their direct touch target');
 assert.equal(storyUI.ribbonEdge(526,137,718,144),'top','ordinary tin double-touch never lands in the newly opened ribbon');
});
test('placement is deterministic and invalid targets keep the normal accessible ribbon',()=>{
 assert.equal(typeof storyUI.ribbonEdge,'function');
 assert.equal(storyUI.ribbonEdge(NaN,137,450,144),'bottom');
 for(const y of [220,300,347,526])assert.equal(storyUI.ribbonEdge(y,137,450,144),storyUI.ribbonEdge(y,137,450,144));
});

const landscapePaper={left:256.03125,right:587.96875,height:62};
const landscapeUpper=[
 {left:14,right:140,top:12,bottom:41},
 {left:14,right:190,top:48,bottom:102},
 {left:636,right:830,top:12,bottom:61},
 {left:687,right:830,top:61,bottom:126},
];
test('the native whole-house landscape tin keeps its screen point clear of paper in both directions',()=>{
 assert.equal(typeof storyUI.ribbonPlacement,'function');
 for(const rtl of [false,true]){
  const upper=rtl?landscapeUpper.map(r=>({...r,left:844-r.right,right:844-r.left})):landscapeUpper;
  const result=storyUI.ribbonPlacement({width:844,height:390,y:254.062452616181,rect:landscapePaper,upper,bottom:315});
  assert.deepEqual(result,{edge:'top',top:12},'side controls do not reserve unused top-center space');
  assert.ok(result.top+landscapePaper.height<254.062452616181,'the original point remains below the entire ribbon');
 }
});
test('portrait paper clears intersecting upper controls and device safe areas',()=>{
 assert.equal(typeof storyUI.ribbonPlacement,'function');
 const rect={left:12,right:348,height:144};
 assert.deepEqual(storyUI.ribbonPlacement({width:360,height:640,y:368,rect,upper:[{left:280,right:346,top:64,bottom:125}],bottom:514}),{edge:'top',top:137});
 assert.deepEqual(storyUI.ribbonPlacement({width:844,height:390,y:254,rect:landscapePaper,upper:landscapeUpper,bottom:315,safeTop:30}),{edge:'top',top:30});
 assert.equal(storyUI.ribbonPlacement({width:1280,height:800,y:400,rect:landscapePaper,upper:[],bottom:645}).edge,'bottom','desktop placement remains unchanged');
});
test('landscape paper is checked against the final fitted prop after orientation or explicit room navigation',async()=>{
 assert.equal(typeof storyUI.ribbonPlacement,'function');
 const T=await import('three'),{framing}=await import('../src/render/visual-policy.js'),{INTERACTIVE_PROPS,ROOMS}=await import('../src/content.js');
 for(const key of ['mint-tin','moon-mobile']){
  const prop=INTERACTIVE_PROPS.find(p=>p.id===key),room=ROOMS.find(r=>r.id===prop.room);
  for(const insets of [{top:86,bottom:138},{top:48,bottom:150}]){
   const pose=framing(844,390,room.id,insets),camera=new T.OrthographicCamera(-pose.height*844/390/2,pose.height*844/390/2,pose.height/2,-pose.height/2,.1,100);
   camera.zoom=pose.zoom;camera.position.fromArray(pose.target).add(new T.Vector3(5.8,5.6,24));camera.lookAt(new T.Vector3(...pose.target));camera.updateProjectionMatrix();camera.updateMatrixWorld();
   const p=new T.Vector3(room.x+prop.position[0],room.y+prop.position[1]+.26,prop.position[2]).project(camera),y=(1-p.y)*390/2;
   const placement=storyUI.ribbonPlacement({width:844,height:390,y,rect:landscapePaper,upper:landscapeUpper,bottom:315});
   const top=placement.edge==='top'?placement.top:315-landscapePaper.height;
   assert.ok(y<top||y>top+landscapePaper.height,key+' stays clear in the final fitted viewport');
  }
 }
});
