import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createRoomPresentation} from '../src/render/room-presentation.js';
import {framing} from '../src/render/visual-policy.js';
import {ROOMS,INTERACTIVE_PROPS} from '../src/content.js';

function fixture(width=390,height=844){
 const camera=new T.OrthographicCamera(-10,10,6,-6,.1,100);
 let selected=false,enabled=true,pointerDown=false,refits=0;
 const apply=()=>{
  refits++;const pose=framing(width,height,'kitchen',presentation.value);
  camera.top=pose.height/2;camera.bottom=-pose.height/2;camera.left=-pose.height*width/height/2;camera.right=-camera.left;
  camera.zoom=pose.zoom;camera.position.fromArray(pose.target).add(new T.Vector3(5.8,5.6,24));camera.lookAt(new T.Vector3(...pose.target));camera.updateProjectionMatrix();camera.updateMatrixWorld();
 };
 const presentation=createRoomPresentation(apply,()=>selected||!enabled||pointerDown);
 const point=()=>{const prop=INTERACTIVE_PROPS.find(p=>p.id==='mint-tin'),room=ROOMS.find(r=>r.id===prop.room),p=new T.Vector3(room.x+prop.position[0],room.y+prop.position[1]+.26,prop.position[2]).project(camera);return [(p.x+1)*width/2,(1-p.y)*height/2]};
 presentation.update({top:137,bottom:124},{width,height});
 return {presentation,point,apply,resize(w,h){width=w;height=h;apply()},get refits(){return refits},select(){selected=true},clear(){selected=false},hold(){enabled=false},release(){enabled=true},down(){pointerDown=true},up(){pointerDown=false}};
}

test('selection HUD measurements retain the exact active prop position and cache safe-area insets',()=>{
 for(const [w,h] of [[360,640],[390,844],[412,915],[844,390]]){
  const f=fixture(w,h),before=f.point();f.select();
  f.presentation.update({top:137,bottom:261});
  assert.deepEqual(f.point(),before,`${w}x${h}: second touch must see the original prop`);
  assert.equal(f.refits,1);assert.deepEqual(f.presentation.value,{top:137,bottom:261});
  f.apply();assert.notDeepEqual(f.point(),before,'explicit room navigation or resize can use the newest measured safe area');
 }
});
test('a deferred HUD update cannot restart the camera while an item or scene pointer is held',()=>{
 for(const lock of ['hold','down']){const f=fixture(),before=f.point();f[lock]();f.presentation.update({top:130,bottom:298});assert.deepEqual(f.point(),before);assert.equal(f.refits,1)}
});
test('unselected browsing still refits measured layout and unchanged measurements do nothing',()=>{
 const f=fixture(),before=f.point();assert.equal(f.presentation.update({top:137,bottom:124}),false);assert.equal(f.refits,1);
 f.presentation.update({top:258,bottom:124});assert.notDeepEqual(f.point(),before);assert.equal(f.refits,2);
 f.presentation.reset();assert.deepEqual(f.presentation.value,{});f.presentation.update({top:137,bottom:124});assert.deepEqual(f.point(),before);
});


test('a selected viewport rotation applies its new measured insets once, not stale portrait reservations',()=>{
 const f=fixture();f.select();f.presentation.update({top:281,bottom:188},{width:390,height:844});
 f.resize(844,390);const stale=f.point(),before=f.refits;
 f.presentation.update({top:48,bottom:138},{width:844,height:390});
 const expected=fixture(844,390);expected.presentation.update({top:48,bottom:138},{width:844,height:390});
 assert.deepEqual(f.point(),expected.point(),'rotation must finish with current landscape measurements');
 assert.notDeepEqual(f.point(),stale);assert.equal(f.refits,before+1);
 const settled=f.point();f.presentation.update({top:48,bottom:180},{width:844,height:390});
 assert.deepEqual(f.point(),settled,'ordinary later selection layout stays locked again');
});
