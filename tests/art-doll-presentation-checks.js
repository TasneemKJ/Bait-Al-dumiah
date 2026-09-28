import * as T from 'three';
import {createDolls} from '../src/render/dolls.js';
import {createState} from '../src/simulation.js';
const cases=[];
const test=(name,run)=>cases.push({name,run});
const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const fixture=(id='lina')=>{const state=createState(),view=createDolls(new T.Group());return {state,view,doll:view.dolls.find(d=>d.id===id),resident:state.dolls.find(d=>d.id===id)}};
const named=(root,name)=>{const a=[];root.traverse(o=>{if(o.name===name)a.push(o)});return a};
export async function runArtChecks(){const results=[];for(const {name,run} of cases){try{await run();results.push({name,passed:true})}catch(e){results.push({name,passed:false,error:e.message})}}return results}

test("D39: Rigid detail batching",()=>{
const {view,state,doll}=fixture();view.update(state,.1,'lina');let calls=0;for(const d of view.dolls)d.root.traverseVisible(o=>{if(o.isMesh&&o.material.visible)calls++});assert(calls<164,'rigid doll detail needs more than 163 visible mesh submissions');assert(doll.arms[0].hand.parent===doll.arms[0].forearm&&doll.legs[0].shin.parent===doll.legs[0],'batch flattened an animated joint');state.elapsed=2;view.update(state,.1,'lina',.3);assert(doll.eyes[0].iris.position.x>.001,'batch erased eye gaze');assert(doll.hairStyle.tails.every(t=>t.parent===doll.hairStyle.root),'batch lost separate braid pivots');
});
