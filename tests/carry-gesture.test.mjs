import test from 'node:test';
import assert from 'node:assert/strict';
import {createCarryGesture} from '../src/carry-gesture.js';

const point=(x,y,id=1)=>({pointerId:id,clientX:x,clientY:y,button:0});
test('a deliberate item drag returns its destination; a tap never drops an item',()=>{
 const g=createCarryGesture();
 assert.equal(g.down(point(30,40)),true);
 assert.equal(g.move(point(34,43)),false);
 assert.equal(g.up(point(34,43)),null);
 g.down(point(30,40));
 assert.equal(g.move(point(90,100)),true);
 assert.deepEqual(g.up(point(110,120)),{x:110,y:120});
 assert.equal(g.up(point(110,120)),null);
});
test('a second finger cannot replace a carried item drag or release it',()=>{
 const g=createCarryGesture();g.down(point(10,10));
 assert.equal(g.down(point(300,400,2)),false);
 assert.equal(g.move(point(300,400,2)),false);
 assert.equal(g.up(point(300,400,2)),null);
 g.move(point(40,50));assert.deepEqual(g.up(point(80,90)),{x:80,y:90});
});
test('cancel, invalid input, and secondary buttons cannot drop or preserve a stale drag',()=>{
 const g=createCarryGesture();
 assert.equal(g.down({...point(0,0),button:2}),false);
 assert.equal(g.down(point(NaN,10)),false);
 g.down(point(0,0));g.move(point(80,90));g.cancel();
 assert.equal(g.up(point(90,90)),null);
 assert.equal(g.down(point(3,4)),true);
 assert.equal(g.up(point(Infinity,20)),null);
 assert.equal(g.down(point(3,4)),true);
});

test('a non-primary touch cannot start a carried-item drag',()=>{
 const g=createCarryGesture();
 const secondary={...point(20,30,2),isPrimary:false};
 assert.equal(g.down(secondary),false);
 assert.equal(g.move({...secondary,clientX:90,clientY:100}),false);
 assert.equal(g.up({...secondary,clientX:110,clientY:120}),null);
 assert.equal(g.down({...point(20,30,1),isPrimary:true}),true);
});
