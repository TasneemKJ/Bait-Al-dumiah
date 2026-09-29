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

test("D01: Rounded cheek and jaw sculpt (revised after user feedback)",()=>{
const {doll}=fixture();const hull=doll.head.getObjectByName('porcelain-head');assert(hull,'head is missing');const p=hull.geometry.attributes.position;let cheek=0,jaw=0;for(let i=0;i<p.count;i++){const y=p.getY(i),x=Math.abs(p.getX(i));cheek=Math.max(cheek,x);if(y<-.185&&y>-.213)jaw=Math.max(jaw,x)}assert(cheek>.29&&jaw>=cheek*.76,'lower cheeks narrow into the rejected triangular jaw');assert(p.count<1200,'portrait head exceeds its mesh budget');
});

test("D02: Painted porcelain complexion",()=>{
const {doll}=fixture();const m=doll.faceHull.material;assert(m.map?.isCanvasTexture,'complexion has no painted layer');const c=m.map.image.getContext('2d'),sample=(x,y)=>Array.from(c.getImageData(x,y,1,1).data);const a=sample(72,284),b=sample(230,60);assert(a.slice(0,3).some((v,i)=>Math.abs(v-b[i])>8),'painted cheek has no soft color variation');assert(m.map.image.width<=512,'face texture exceeds its budget');
});

test("D03: Small shallow painted eyes (replaces rejected white sockets)",()=>{
const {doll}=fixture();for(const eye of doll.eyes){assert(!eye.getObjectByName('almond-white'),'rejected white socket remains');const painted=eye.iris;painted.geometry.computeBoundingBox();const size=painted.geometry.boundingBox.getSize(new T.Vector3());assert(size.x>.04&&size.x<.075&&size.z<.01,'eye is not a small painted mark');assert(eye.userData.noBatch,'eye lost its independent blink transform')}
});

test("D04: Individually tinted painted eyes",()=>{
const view=createDolls(new T.Group());const maps=view.dolls.map(d=>d.eyes[0].iris.material.map);assert(maps.every(m=>m?.isCanvasTexture),'painted eye maps are missing');assert(new Set(maps).size===3,'residents do not have individual eye colors');for(const m of maps){const c=m.image.getContext('2d'),p=c.getImageData(64,64,1,1).data,h=c.getImageData(45,38,1,1).data;assert(h[0]>p[0]+80,'eye has no hand-painted catchlight')}const repeat=createDolls(new T.Group());assert(repeat.dolls[0].eyes[0].iris.material.map===maps[0],'iris textures are rebuilt on every resident construction');
});

test("D05: Quiet eye marks and independent brows (replaces socket rims)",()=>{
const {doll}=fixture();for(const e of doll.eyes){assert(e.aperture.children.length===1,'heavy eye framing returned');assert(e.closedLid.geometry.type==='TubeGeometry','closed eye is not a soft curved mark')}assert(doll.brows?.length===2&&doll.brows.every(b=>b.userData.noBatch),'eyebrows cannot express emotion independently');
});

test("D06: Actual closed eyelids",()=>{
const {state,view,doll,resident}=fixture();resident.action='rest';state.settings.reducedMotion=true;view.update(state,.1,'lina');for(const eye of doll.eyes){assert(eye.closedLid?.visible&&!eye.aperture.visible,'sleep still shows squeezed eye whites');assert(eye.scale.y===1,'blink compresses the entire eye including its attachment')}resident.action='idle';view.update(state,.1,'lina');assert(doll.eyes.every(e=>!e.closedLid.visible&&e.aperture.visible),'waking leaves eyelid seams visible over open eyes');
});

test("D07: Simple painted smile (replaces realistic lips)",()=>{
const {doll}=fixture();const smile=doll.mouth.getObjectByName('painted-smile');assert(smile?.geometry.type==='TubeGeometry','soft painted smile is missing');smile.geometry.computeBoundingBox();const size=smile.geometry.boundingBox.getSize(new T.Vector3());assert(size.x>.045&&size.x<.07&&size.z<.015,'smile is too large or protruding');assert(!rigParts(doll.mouth,'sculpted-lip').length,'rejected realistic lips returned');assert(doll.mouth.userData.noBatch,'smile expression cannot move independently');
});

test("D08: Low-relief button nose (replaces elongated bridge)",()=>{
const {doll}=fixture();doll.nose.geometry.computeBoundingBox();const size=doll.nose.geometry.boundingBox.getSize(new T.Vector3());assert(size.y<.034&&size.x>=size.y,'nose narrows into a pin');assert(size.z<.036,'nose projects too far from the face');
});

test("D09: Recessed ears",()=>{
const {doll}=fixture();assert(doll.ears?.length===2,'ears have no individually shaped recess');for(const ear of doll.ears){const inset=ear.getObjectByName('ear-recess');assert(inset&&inset.scale.x<.020&&inset.scale.y<.04,'ear shading is not inset within its lobe');assert(ear.position.x!==0,'ears are not located at the head edge')}
});

test("D10: Bisque finish and neck joint",()=>{
const {doll}=fixture();const skin=doll.faceHull.material;assert(skin.isMeshPhysicalMaterial&&skin.clearcoat>.10&&skin.clearcoat<.40,'face has no restrained bisque glaze');assert(skin.roughness>=.45,'porcelain looks wet instead of satin');const joint=doll.root.getObjectByName('bisque-neck-joint');assert(joint?.geometry.type==='TorusGeometry','made-doll neck articulation is missing');assert(joint.geometry.parameters.tube<.003,'neck seam is too heavy');
});
