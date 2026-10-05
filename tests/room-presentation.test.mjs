import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createRoomPresentation} from '../src/render/room-presentation.js';
import {framing} from '../src/render/visual-policy.js';
import {ROOMS,INTERACTIVE_PROPS} from '../src/content.js';
import {createCarryGesture} from '../src/carry-gesture.js';
import {createState,interactStory} from '../src/simulation.js';

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

test('current ribbon placement is owned by measurement before refitting, in either resize callback order',async()=>{
 const {createPlayfieldLayout}=await import('../src/playfield-layout.js');
 const names=['ResizeObserver','MutationObserver','requestAnimationFrame','cancelAnimationFrame','getComputedStyle','window'];
 const previous=Object.fromEntries(names.map(key=>[key,globalThis[key]]));
 try{
  for(const order of ['animation-frame-before-resize-observer','resize-observer-before-animation-frame'])for(const carrying of [false,true]){
   let pending=new Map(),id=0,edge='bottom',size={width:390,height:844},synced={...size};
   const f=fixture();let nodes=[],carryCancellations=0;
   const gesture=createCarryGesture(),state=createState();interactStory(state,'prop:mint-tin');const saved=structuredClone(state);
   const event=(x,y)=>({pointerId:1,clientX:x,clientY:y,button:0});
   const beginCarry=()=>{f.hold();assert.equal(gesture.down(event(50,500)),true);assert.equal(gesture.move(event(150,300)),true)};
   const releaseAfterResize=()=>{const drop=gesture.up(event(150,300));if(drop)interactStory(state,'prop:sewing-machine');assert.equal(drop,null,'resize must never emit a destination');assert.deepEqual(state,saved,'canceled resize preserves inventory, story, rewards and activity state')};
   const host={dataset:{},getBoundingClientRect:()=>({left:0,top:0,...size}),querySelectorAll:()=>nodes};
   const node=(rect,matches)=>({getClientRects:()=>[1],getBoundingClientRect:()=>({...rect,width:rect.right-rect.left,height:rect.bottom-rect.top}),matches});
   const upper=node({left:14,right:294,top:64,bottom:125},selector=>selector.includes('.time-tools'));
   const lower=node({left:12,right:378,top:732,bottom:784},()=>false);
   let ribbonRect={left:12,right:378,top:137,bottom:281};
   const ribbon={getClientRects:()=>[1],getBoundingClientRect:()=>({...ribbonRect,width:ribbonRect.right-ribbonRect.left,height:ribbonRect.bottom-ribbonRect.top}),matches:selector=>edge==='top'&&selector.includes('.story-playfield[data-ribbon-edge="top"] .object-ribbon')};
   globalThis.ResizeObserver=class{observe(){}unobserve(){}disconnect(){}};
   globalThis.MutationObserver=class{constructor(){}observe(){}disconnect(){}};
   globalThis.requestAnimationFrame=callback=>{pending.set(++id,callback);return id};
   globalThis.cancelAnimationFrame=key=>pending.delete(key);
   globalThis.getComputedStyle=()=>({visibility:'visible',display:'block'});
   globalThis.window={addEventListener(){},removeEventListener(){}};
   const flush=()=>{const callbacks=[...pending.values()];pending.clear();callbacks.forEach(callback=>callback())};
   // This is the real coordination contract: update the projection and place
   // current-orientation paper before any measured insets reach the camera.
   const sync=()=>{if(size.width!==synced.width||size.height!==synced.height){f.resize(size.width,size.height);if(carrying){gesture.cancel();f.release();carryCancellations++}synced={...size}};edge=size.height>size.width?'top':'bottom'};
   nodes=[upper,lower];const layout=createPlayfieldLayout(host,(value,viewport)=>f.presentation.update(value,viewport),sync);flush();
   f.select();edge='top';nodes=[upper,lower,ribbon];layout.measure();flush();
   if(carrying)beginCarry();
   size={width:844,height:390};ribbonRect={left:200,right:644,top:240,bottom:315};nodes=[ribbon];
   if(order==='resize-observer-before-animation-frame')sync();
   layout.measure();flush();
   if(order==='animation-frame-before-resize-observer')sync();
   layout.measure();flush();
   assert.deepEqual(f.presentation.value,{top:48,bottom:162},order+' caches actual landscape edges');
   const expected=fixture(844,390);expected.presentation.update({top:48,bottom:162},{width:844,height:390});
   assert.deepEqual(f.point(),expected.point(),order+' final pose matches the current measured layout');
   if(carrying){releaseAfterResize();assert.equal(carryCancellations,1,'one cancellation for one real viewport change')}
   for(const orientation of ['portrait','landscape','portrait']){
    if(carrying)beginCarry();
    size=orientation==='portrait'?{width:390,height:844}:{width:844,height:390};
    ribbonRect=orientation==='portrait'?{left:12,right:378,top:137,bottom:281}:{left:200,right:644,top:240,bottom:315};
    if(order==='resize-observer-before-animation-frame')sync();
    layout.measure();flush();if(order==='animation-frame-before-resize-observer')sync();layout.measure();flush();
    const insets=orientation==='portrait'?{top:293,bottom:72}:{top:48,bottom:162};
    const want=fixture(size.width,size.height);want.presentation.update(insets,size);
    assert.deepEqual(f.point(),want.point(),order+' repeated '+orientation+' uses current placement');
    if(carrying)releaseAfterResize();
    const stable=f.point(),count=f.refits;sync();layout.measure();flush();layout.measure();flush();
    assert.deepEqual(f.point(),stable,'duplicate resize/layout callbacks are idempotent');assert.equal(f.refits,count);
   }
   if(carrying){assert.equal(carryCancellations,4,'each actual rotation releases held input once');beginCarry();assert.deepEqual(gesture.up(event(180,320)),{x:180,y:320},'the same held item can resume a fresh deliberate drag');assert.deepEqual(state,saved)}
   layout.dispose();
  }
 }finally{for(const key of names)if(previous[key]===undefined)delete globalThis[key];else globalThis[key]=previous[key]}
});

test('the final viewport fit is marked immediate so a paused selected house cannot keep a stale pose',()=>{
 let selected=false;const fits=[];
 const presentation=createRoomPresentation(immediate=>fits.push(immediate),()=>selected);
 presentation.update({top:137,bottom:124},{width:390,height:844});selected=true;
 presentation.update({top:48,bottom:138},{width:844,height:390});
 assert.deepEqual(fits,[false,true]);
});
