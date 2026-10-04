import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createRestoration} from '../src/render/restoration.js';
// Canvas drawing is immaterial to geometry cost; use a bounded in-memory stub.
globalThis.document={createElement:()=>({width:256,height:256,getContext:()=>new Proxy({createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),getImageData:(x,y,w,h)=>({data:new Uint8ClampedArray(w*h*4)}),createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]??(()=>{})})})};
test('all earned arrangements add fewer than 10k main and shadow-pass triangles',()=>{
 const view=createRestoration(new T.Group());let triangles=0;
 view.root.traverse(o=>{if(o.isMesh){const count=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;triangles+=count*(o.castShadow?2:1)}});
 assert.ok(triangles<10000,`Restoration submits ${triangles} triangles`);
});
