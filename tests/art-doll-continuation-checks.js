import * as T from 'three';
import {createDolls} from '../src/render/dolls.js';
import {createState} from '../src/simulation.js';
const cases=[];
const test=(name,run)=>cases.push({name,run});
const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const fixture=(id='lina')=>{const state=createState(),view=createDolls(new T.Group());return {state,view,doll:view.dolls.find(d=>d.id===id),resident:state.dolls.find(d=>d.id===id)}};
const named=(root,name)=>{const a=[];root.traverse(o=>{if(o.name===name)a.push(o)});return a};
export async function runArtChecks(){const results=[];for(const {name,run} of cases){try{await run();results.push({name,passed:true})}catch(e){results.push({name,passed:false,error:e.message})}}return results}

test("D41: Cup-to-hand attachment",()=>{

const {state,view,doll,resident}=fixture();resident.action='tea';resident.lastCare=0;
for(const t of [.1,.45,1.3,2.6,3.8]){state.elapsed=t;view.update(state,.1,'lina');doll.root.updateMatrixWorld(true);const wrist=doll.tea.parent.getWorldPosition(new T.Vector3()),saucer=doll.tea.getWorldPosition(new T.Vector3()),offset=saucer.clone().sub(wrist);assert(offset.y<-.010&&offset.y>-.026,'saucer floats above wrist');assert(offset.z>.062&&offset.z<.083,'cup is not supported in front of hand');assert(offset.length()<.088,'cup has detached from the hand');const up=new T.Vector3(0,1,0).applyQuaternion(doll.tea.getWorldQuaternion(new T.Quaternion()));assert(up.y>.999,'tea cup is tilted')}
state.elapsed=1.3;view.update(state,.1,'lina');doll.root.updateMatrixWorld(true);const lip=doll.mouth.getWorldPosition(new T.Vector3()),cup=doll.tea.getWorldPosition(new T.Vector3());assert(cup.y+.13*.85<lip.y+.018,'cup rim intersects lips above the sip');assert(cup.z-.075*.85>lip.z-.09,'cup body is buried in the chin');

});
