import test from 'node:test';
import assert from 'node:assert/strict';
import {playfieldInsets} from '../src/playfield-layout.js';

test('only visible edges reserve canvas, including the real selection and safe-area offset',()=>{
 const idle=[{edge:'top',left:14,right:282,top:64,bottom:118},{edge:'bottom',left:12,right:378,top:730,bottom:788}];
 assert.deepEqual(playfieldInsets(390,844,idle),{top:130,bottom:126});
 assert.deepEqual(playfieldInsets(390,844,[...idle,{edge:'bottom',left:12,right:378,top:610,bottom:716}]),{top:130,bottom:246});
 assert.deepEqual(playfieldInsets(390,844,[...idle,{edge:'bottom',left:12,right:378,top:580,bottom:686}]),{top:130,bottom:276});
});
test('wide layouts keep side notes out of the center camera reserve',()=>{
 const regions=[{edge:'top',left:14,right:190,top:48,bottom:210},{edge:'bottom',left:314,right:530,top:324,bottom:378}];
 assert.deepEqual(playfieldInsets(844,390,regions),{top:48,bottom:138});
});
test('malformed bounds cannot send the camera outside the viewport',()=>{
 const insets=playfieldInsets(390,844,[{edge:'top',left:0,right:390,bottom:Infinity},{edge:'bottom',left:0,right:390,top:NaN}]);
 assert.ok(Number.isFinite(insets.top)&&Number.isFinite(insets.bottom));
});

test('layout lifecycle ignores ritual HUDs, remeasures exit, and never repeats unchanged poses',async()=>{
 const {createPlayfieldLayout}=await import('../src/playfield-layout.js');
 const names=['ResizeObserver','MutationObserver','requestAnimationFrame','cancelAnimationFrame','getComputedStyle','window'];
 const previous=Object.fromEntries(names.map(key=>[key,globalThis[key]]));
 let pending=new Map(),id=0,mutation;
 const node=(edge,left,top,right,bottom)=>({edge,getClientRects:()=>[1],getBoundingClientRect:()=>({left,top,right,bottom,width:right-left,height:bottom-top}),matches:()=>edge==='top'});
 const upper=node('top',14,64,294,118),lower=node('bottom',12,730,378,782);
 let nodes=[upper,lower];const host={dataset:{},getBoundingClientRect:()=>({left:0,top:0,width:390,height:844}),querySelectorAll:()=>nodes,getAttribute:name=>name==='data-chime-active'?'false':null};
 const change=()=>mutation([{type:'childList',target:host}]);
 try{
  globalThis.ResizeObserver=class{observe(){}unobserve(){}disconnect(){}};
  globalThis.MutationObserver=class{constructor(callback){mutation=callback}observe(){}disconnect(){}};
  globalThis.requestAnimationFrame=callback=>{pending.set(++id,callback);return id};
  globalThis.cancelAnimationFrame=key=>pending.delete(key);
  globalThis.getComputedStyle=()=>({visibility:'visible',display:'block'});
  globalThis.window={addEventListener(){},removeEventListener(){}};
  const flush=()=>{const callbacks=[...pending.values()];pending.clear();callbacks.forEach(callback=>callback())};
  const values=[],layout=createPlayfieldLayout(host,value=>values.push(value));flush();
  assert.deepEqual(values,[{top:130,bottom:126}]);
  const unrelated={closest:()=>null,getAttribute:()=>''};
  for(let i=0;i<10;i++)mutation([{type:'attributes',target:unrelated,attributeName:'hidden',oldValue:''},{type:'attributes',target:host,attributeName:'data-chime-active',oldValue:'false'}]);
  assert.equal(pending.size,0,'unchanged activity flags and unrelated resident updates do not even schedule layout reads');
  change();change();flush();assert.equal(values.length,1,'unchanged DOM never re-centers manual camera input');
  const ribbon=node('ribbon',12,137,378,281);
  ribbon.matches=selector=>selector.includes('.story-playfield[data-ribbon-edge="top"] .object-ribbon');
  nodes=[upper,lower,ribbon];change();flush();
  assert.deepEqual(values.at(-1),{top:293,bottom:126},'a top ribbon never poisons the cached footer reservation');
  nodes=[upper,lower];change();flush();
  for(const activity of ['teaActive','stitchActive','chimeActive']){
   host.dataset[activity]='true';nodes=[node('bottom',282,12,378,64)];change();flush();
   assert.deepEqual(values.at(-1),{top:130,bottom:126},'top-mounted work dock must not poison room framing');
   const count=values.length;host.dataset[activity]='false';nodes=[upper,lower];change();flush();
   assert.equal(values.length,count+1,'work exit refreshes the ordinary house pose even at identical dimensions');
  }
  layout.measure();layout.dispose();flush();assert.equal(pending.size,0);
 }finally{for(const key of names)if(previous[key]===undefined)delete globalThis[key];else globalThis[key]=previous[key]}
});
