import test from 'node:test';
import assert from 'node:assert/strict';
import {createPlacementFlow} from '../src/placement-flow.js';
import {createState} from '../src/simulation.js';

// Play-through finding (2026-11-13): choosing a second keepsake aimed at the kitchen's first spot even when it was
// taken, so "Place" only answered "That spot already has something lovely".
function flow(state,focusRoom=''){
 const sent=[],host={dataset:{focusRoom},querySelector:()=>null};
 const placer=createPlacementFlow(host,()=>state,(a,v)=>sent.push([a,v]),{t:k=>k,n:String,closeSheet(){}});
 return {placer,sent,last:()=>sent.filter(([a])=>a==='placement-preview').at(-1)?.[1]};
}
test('a chosen keepsake aims at a free spot, never a taken one',()=>{
 const s=createState();s.decor=[{id:1,item:'plant',room:'kitchen',slot:0}];
 const {placer,last}=flow(s);placer.chooseItem('lamp');
 assert.equal(last().room,'kitchen');assert.equal(last().slot,1);
});
test('a full room sends the keepsake to the next room with space; the room in view comes first',()=>{
 const s=createState();s.decor=[0,1,2].map(i=>({id:i+1,item:'plant',room:'kitchen',slot:i}));
 const a=flow(s);a.placer.chooseItem('lamp');assert.notEqual(a.last().room,'kitchen');
 const b=flow(createState(),'bedroom');b.placer.chooseItem('lamp');
 assert.deepEqual([b.last().room,b.last().slot],['bedroom',0]);
});
