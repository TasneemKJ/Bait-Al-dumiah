import test from 'node:test';import assert from 'node:assert/strict';
import {createChimeGesture} from '../src/chime-input.js';
const event=(x=100,y=100,more={})=>({pointerId:1,isPrimary:true,button:0,clientX:x,clientY:y,...more});
test('one downward drag produces a bounded pull on the originally grabbed charm',()=>{
 const g=createChimeGesture();assert.equal(g.down(event(),2,80),true);
 assert.deepEqual(g.move(event(180,140)),{target:2,pull:.5});assert.equal(g.move(event(90,50)).pull,0);
 assert.deepEqual(g.up(event(20,500)),{target:2,pull:1});assert.equal(g.pointerId,null);
});
test('secondary pointers cannot steal or finish the primary grab',()=>{
 const g=createChimeGesture();g.down(event(),0,80);assert.equal(g.down(event(1,2,{pointerId:2}),1,80),false);
 assert.equal(g.move(event(100,200,{pointerId:2})),null);assert.equal(g.up(event(100,200,{pointerId:2})),null);assert.equal(g.pointerId,1);
});
test('outside release, cancellation, invalid coordinates and non-primary input never pluck',()=>{
 const g=createChimeGesture();for(const e of [event(0,0,{button:2}),event(0,0,{isPrimary:false}),event(NaN,2)])assert.equal(g.down(e,0,80),false);
 assert.equal(g.down(event(),0,0),false);g.down(event(),0,80);assert.equal(g.up(event(100,160),false),null);
 g.down(event(),1,80);g.cancel();assert.equal(g.up(event(100,160)),null);
 g.down(event(),1,80);assert.equal(g.up(event(NaN,160)),null);assert.equal(g.pointerId,null);
});
test('the physical moon repeats only from a deliberate tap, not a dragged hand',()=>{
 const g=createChimeGesture();g.down(event(),'moon',80);assert.deepEqual(g.up(event(103,104)),{target:'moon'});
 g.down(event(),'moon',80);g.move(event(100,160));assert.equal(g.up(event()),null);
});
