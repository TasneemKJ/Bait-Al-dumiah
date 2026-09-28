import {rigParts} from '../src/render/doll-rig-batch.js';
import * as T from 'three';
import {createDolls} from '../src/render/dolls.js';
import {createState} from '../src/simulation.js';
const cases=[];
const test=(name,run)=>cases.push({name,run});
const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const fixture=(id='lina')=>{const state=createState(),view=createDolls(new T.Group());return {state,view,doll:view.dolls.find(d=>d.id===id),resident:state.dolls.find(d=>d.id===id)}};
const named=(root,name)=>{const a=[];root.traverse(o=>{if(o.name===name)a.push(o)});return a};
export async function runArtChecks(){const results=[];for(const {name,run} of cases){try{await run();results.push({name,passed:true})}catch(e){results.push({name,passed:false,error:e.message})}}return results}

test("D21: Elbows and hands",()=>{
const {doll}=fixture();for(const arm of doll.arms){assert(arm.forearm?.parent===arm,'elbow is not articulated');assert(arm.hand?.parent===arm.forearm,'hand does not follow forearm');assert(rigParts(arm.hand,'porcelain-thumb')[0],'hand has no thumb');assert(arm.forearm.userData.noBatch,'elbow has been swallowed by static batching')}assert(doll.tea.parent===doll.arms[1].hand,'teacup is not attached to the wrist');
});

test("D22: Grounded footfalls",()=>{
const {view,state,doll}=fixture();state.elapsed=2;view.update(state,.1,'lina');assert(doll.legs.every(l=>l.shin?.parent===l),'knees cannot bend');state.elapsed=3;view.update(state,.1,'lina');assert(doll.legs.some(l=>l.shin.rotation.x>.01),'swing leg does not flex at knee');assert(doll.legs.some(l=>l.position.y>.4001),'walking has no swing-foot lift');for(const leg of doll.legs){assert(leg.shin.rotation.x>=0&&leg.shin.rotation.x<.3,'knee exceeds its safe flexion')}state.settings.reducedMotion=true;view.update(state,.1,'lina');assert(doll.legs.every(l=>l.shin.rotation.x===0&&l.position.y===.4),'still pose retains a lifted foot');
});

test("D23: Roommate spacing",()=>{
const {view,state}=fixture();state.dolls.forEach(d=>d.room='parlor');let minimum=Infinity;for(let i=0;i<100;i++){state.elapsed=i*.5;view.update(state,.1,'lina');const xs=view.dolls.map(v=>v.root.position.x).sort((a,b)=>a-b);minimum=Math.min(minimum,xs[1]-xs[0],xs[2]-xs[1])}assert(minimum>=1.02,'roommates hair/arms overlap during wandering');const positions=view.dolls.map(v=>v.root.position.clone());state.paused=true;view.update(state,.1,'lina');assert(view.dolls.every((v,i)=>v.root.position.equals(positions[i])),'paused room assignment shifts feet');
});

test("D24: Balanced locomotion",()=>{
const {state,view,doll}=fixture();state.elapsed=2;view.update(state,.1,'lina');state.elapsed=3;view.update(state,.1,'lina');assert(doll.arms.some(a=>Math.abs(a.rotation.x)>.002),'walking leaves both arms rigid');assert(doll.arms[0].rotation.x*doll.arms[1].rotation.x<0,'arms do not counter-swing');assert(Math.abs(doll.body.rotation.y)>.001&&Math.abs(doll.body.rotation.y)<.05,'torso has no bounded gait balance');state.settings.reducedMotion=true;view.update(state,.1,'lina');assert(doll.body.rotation.y===0&&doll.arms.every(a=>a.rotation.x===0),'reduced motion still walks');
});

test("D25: Bounded eye gaze",()=>{
const {view,state,doll}=fixture();state.elapsed=2;view.update(state,.1,'lina',.3);const x=doll.eyes[0].iris.position.x;assert(x>.001&&x<.013,'iris does not look toward caretaker');assert(doll.eyes[1].iris.position.x===x,'eyes cross while following');view.update(state,.1,'lina',999);assert(doll.eyes.every(e=>Math.abs(e.iris.position.x)<=.012),'iris leaves socket');state.settings.reducedMotion=true;view.update(state,.1,'lina',-.3);assert(doll.eyes.every(e=>e.iris.position.x===0),'reduced-motion eyes drift');
});

test("D26: Need-aware expressions",()=>{
const {view,state,doll,resident}=fixture();resident.comfort=10;state.settings.reducedMotion=true;view.update(state,.1,'lina');assert(doll.expression==='worried','low comfort never reaches the face');assert(doll.brows[0].rotation.z*doll.brows[1].rotation.z<0,'worry does not raise the inner eyebrows');const worried=doll.mouth.scale.x;resident.comfort=80;resident.energy=90;view.update(state,.1,'lina');assert(doll.expression==='content'&&doll.mouth.scale.x>worried,'recovering comfort leaves a worried mouth');resident.action='rest';view.update(state,.1,'lina');assert(doll.expression==='sleepy','nap does not soften the expression');
});

test("D27: Tea sip sequence",()=>{
const {view,state,doll,resident}=fixture();resident.action='tea';resident.lastCare=0;state.elapsed=.02;view.update(state,.1,'lina');const startPose=doll.arms[1].forearm.quaternion.clone();state.elapsed=1.3;view.update(state,.1,'lina');assert(doll.teaPhase>.95&&startPose.angleTo(doll.arms[1].forearm.quaternion)>.3,'tea snaps to one pose rather than lifting');state.elapsed=3.9;view.update(state,.1,'lina');assert(doll.teaPhase<.04,'cup is never lowered');state.settings.reducedMotion=true;view.update(state,.1,'lina');const still=doll.arms[1].forearm.quaternion.clone();state.elapsed=1;view.update(state,.1,'lina');assert(still.angleTo(doll.arms[1].forearm.quaternion)<1e-6,'reduced-motion tea continues sipping');
});

test("D28: Two-handed tea hold",()=>{
const {view,state,doll,resident}=fixture();resident.action='tea';resident.lastCare=0;state.elapsed=1.3;view.update(state,.1,'lina');assert(doll.arms[0].forearm.quaternion.angleTo(new T.Quaternion())>.5,'free hand does not support the tea');doll.root.updateMatrixWorld(true);const a=doll.arms[0].hand.getWorldPosition(new T.Vector3()),b=doll.arms[1].hand.getWorldPosition(new T.Vector3());assert(a.distanceTo(b)<.17&&a.y<b.y,'supporting hand misses the cup');const up=new T.Vector3(0,1,0).applyQuaternion(doll.tea.getWorldQuaternion(new T.Quaternion()));assert(up.y>.999,'cup is no longer level under articulated wrists');resident.action='idle';view.update(state,.1,'lina');assert(doll.arms[0].forearm.quaternion.angleTo(new T.Quaternion())<1e-6,'idle keeps the supporting arm bent');
});

test("D29: Reassurance self-hug",()=>{
const {view,state,doll,resident}=fixture();state.settings.reducedMotion=true;resident.action='soothe';view.update(state,.1,'lina');doll.root.updateMatrixWorld(true);const hands=doll.arms.map(a=>doll.body.worldToLocal(a.hand.getWorldPosition(new T.Vector3())));assert(hands.every(h=>h.y>.69&&h.z>.14),'reassurance leaves hands hanging');assert(hands[0].distanceTo(hands[1])<.18,'hands do not fold toward the heart');assert(doll.head.rotation.x>.04&&doll.head.rotation.x<.15,'reassurance has no gentle nod');assert(doll.expression==='comforted','self-hug lacks a comforted expression');
});

test("D30: Sleeping breath",()=>{
const {view,state,doll,resident}=fixture('noor');resident.action='rest';state.elapsed=1;view.update(state,.1,'noor');const first=doll.body.scale.y;state.elapsed=2;view.update(state,.1,'noor');assert(doll.body.scale.y!==first&&Math.abs(doll.body.scale.y-1)<.007,'sleep has no gentle breathing');doll.root.updateMatrixWorld(true);const hand=doll.body.worldToLocal(doll.arms[1].hand.getWorldPosition(new T.Vector3()));assert(hand.y>.87&&hand.z<.16,'sleeping cheek has no nearby hand');state.settings.reducedMotion=true;view.update(state,.1,'noor');assert(doll.body.scale.y===1,'reduced-motion breath still stretches clothing');state.paused=true;const q=doll.arms[1].hand.getWorldQuaternion(new T.Quaternion());state.elapsed=10;view.update(state,.1,'noor');assert(q.angleTo(doll.arms[1].hand.getWorldQuaternion(new T.Quaternion()))<1e-6,'paused sleeping hand drifts');
});
