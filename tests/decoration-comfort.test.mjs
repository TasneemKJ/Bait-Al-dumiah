import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,place,remove,moveDoll,moveDecor,care,step,coziness,isContent,restore} from '../src/simulation.js';

test('moving a resident cannot keep free comfort after packing away a purchase',()=>{
 const state=createState(),lina=state.dolls.find(d=>d.id==='lina');lina.comfort=70;state.buttons=30;
 assert.equal(place(state,'lamp','kitchen',0).ok,true);assert.equal(moveDoll(state,'lina','parlor').ok,true);
 assert.equal(remove(state,state.decor[0].id).refund,10);moveDoll(state,'lina','kitchen');
 assert.equal(lina.comfort,70);assert.equal(state.buttons,30);assert.equal(state.decor.length,0);
});

test('packing a clamped purchase cannot penalize an already comfortable resident',()=>{
 const state=createState(),lina=state.dolls.find(d=>d.id==='lina');lina.comfort=99;
 place(state,'lamp','kitchen',0);remove(state,state.decor[0].id);assert.equal(lina.comfort,99);
});

test('packing moved furniture preserves care earned before and after placement',()=>{
 const state=createState(),lina=state.dolls.find(d=>d.id==='lina');lina.comfort=40;state.buttons=100;
 place(state,'lamp','kitchen',0);assert.equal(care(state,'lina','soothe').ok,true);const earned=lina.comfort;
 moveDecor(state,state.decor[0].id,'parlor',1);moveDoll(state,'noor','kitchen');const noor=state.dolls.find(d=>d.id==='noor'),before=noor.comfort;
 remove(state,state.decor[0].id);assert.equal(lina.comfort,earned);assert.equal(noor.comfort,before);
});

test('older placed items refund fully without guessing which resident received past comfort',()=>{
 const raw=createState();raw.decor=[{id:1,item:'lamp',room:'kitchen',slot:0}];raw.nextId=2;raw.buttons=20;raw.dolls[0].comfort=75;
 const state=restore(JSON.stringify(raw));remove(state,1);assert.equal(state.buttons,30);assert.equal(state.dolls[0].comfort,75);
});

test('placed decoration still raises coziness and slows comfort loss while it remains',()=>{
 const plain=createState(),furnished=createState();place(furnished,'lamp','kitchen',0);
 assert.ok(coziness(furnished)>coziness(plain));
 plain.dolls[0].comfort=70;furnished.dolls[0].comfort=70;step(plain,1);step(furnished,1);
 assert.ok(furnished.dolls[0].comfort>plain.dolls[0].comfort);
});

test('a favorite item still makes its nearby resident content without an instant comfort grant',()=>{
 const state=createState(),lina=state.dolls.find(d=>d.id==='lina');lina.comfort=48;lina.hunger=70;lina.energy=70;
 assert.equal(isContent(state,lina),false);place(state,'musicbox','kitchen',0);
 assert.equal(lina.comfort,48);assert.equal(isContent(state,lina),true);
});
