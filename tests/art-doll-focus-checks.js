import * as T from 'three';
import {createDolls} from '../src/render/dolls.js';
import {createState} from '../src/simulation.js';
const cases=[];
const test=(name,run)=>cases.push({name,run});
const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const fixture=(id='lina')=>{const state=createState(),view=createDolls(new T.Group());return {state,view,doll:view.dolls.find(d=>d.id===id),resident:state.dolls.find(d=>d.id===id)}};
const named=(root,name)=>{const a=[];root.traverse(o=>{if(o.name===name)a.push(o)});return a};
export async function runArtChecks(){const results=[];for(const {name,run} of cases){try{await run();results.push({name,passed:true})}catch(e){results.push({name,passed:false,error:e.message})}}return results}

test("D01: Cheek and jaw sculpt",()=>{
const {doll}=fixture();const hull=doll.head.getObjectByName('porcelain-head');assert(hull,'head is still an anonymous ellipsoid');const p=hull.geometry.attributes.position;let cheek=0,jaw=0;for(let i=0;i<p.count;i++){const y=p.getY(i),x=Math.abs(p.getX(i));if(y>-.1&&y<.02)cheek=Math.max(cheek,x);if(y<-.19)jaw=Math.max(jaw,x)}assert(cheek>.27&&jaw<cheek*.73,'jaw does not taper beneath full cheeks');assert(p.count<1200,'portrait head exceeds its mesh budget');
});

test("D02: Painted porcelain complexion",()=>{
const {doll}=fixture();const m=doll.faceHull.material;assert(m.map?.isCanvasTexture,'complexion has no painted layer');const c=m.map.image.getContext('2d'),sample=(x,y)=>Array.from(c.getImageData(x,y,1,1).data);const a=sample(72,284),b=sample(230,60);assert(a.slice(0,3).some((v,i)=>Math.abs(v-b[i])>8),'painted cheek has no soft color variation');assert(m.map.image.width<=512,'face texture exceeds its budget');
});

test("D03: Almond eye sockets",()=>{
const {doll}=fixture();for(const eye of doll.eyes){const white=eye.getObjectByName('almond-white');assert(white,'eye still uses stacked spherical beads');white.geometry.computeBoundingBox();const size=white.geometry.boundingBox.getSize(new T.Vector3());assert(size.x>.10&&size.x<.14&&size.z<.015,'eye is not shallow and almond-shaped');assert(eye.userData.noBatch,'eye lost its independent blink transform')}
});

test("D04: Individual glass irises",()=>{
const view=createDolls(new T.Group());const maps=view.dolls.map(d=>d.eyes[0].iris.material.map);assert(maps.every(m=>m?.isCanvasTexture),'irises are flat black disks');assert(new Set(maps).size===3,'residents do not have individual eye colors');for(const m of maps){const c=m.image.getContext('2d'),p=c.getImageData(64,64,1,1).data,h=c.getImageData(45,38,1,1).data;assert(h[0]>p[0]+80,'eye has no hand-painted catchlight')}const repeat=createDolls(new T.Group());assert(repeat.dolls[0].eyes[0].iris.material.map===maps[0],'iris textures are rebuilt on every resident construction');
});

test("D05: Lid rims and lashes",()=>{
const {doll}=fixture();for(const e of doll.eyes){assert(e.getObjectByName('upper-lash')?.geometry.type==='TubeGeometry','eye has no curved upper lash line');assert(e.getObjectByName('lower-waterline'),'eye has no delicate lower rim')}assert(doll.brows?.length===2&&doll.brows.every(b=>b.userData.noBatch),'eyebrows cannot express emotion independently');
});

test("D06: Actual closed eyelids",()=>{
const {state,view,doll,resident}=fixture();resident.action='rest';state.settings.reducedMotion=true;view.update(state,.1,'lina');for(const eye of doll.eyes){assert(eye.closedLid?.visible&&!eye.aperture.visible,'sleep still shows squeezed eye whites');assert(eye.scale.y===1,'blink compresses the entire eye including its attachment')}resident.action='idle';view.update(state,.1,'lina');assert(doll.eyes.every(e=>!e.closedLid.visible&&e.aperture.visible),'waking leaves eyelid seams visible over open eyes');
});

test("D07: Sculpted lips",()=>{
const {doll}=fixture();assert(doll.mouth?.children.length===2,'mouth is still a single torus');for(const lip of doll.mouth.children){assert(lip.geometry.type==='ShapeGeometry','lips are not shaped contours');lip.geometry.computeBoundingBox();assert(lip.geometry.boundingBox.getSize(new T.Vector3()).x<.08,'smile overwhelms the face')}assert(doll.mouth.userData.noBatch,'lip expression cannot move independently');
});

test("D08: Soft nose bridge",()=>{
const {doll}=fixture();assert(doll.nose?.geometry,'nose has no sculpted bridge');const p=doll.nose.geometry.attributes.position;let top=0,tip=0;for(let i=0;i<p.count;i++){if(p.getY(i)>.020)top=Math.max(top,Math.abs(p.getX(i)));if(p.getY(i)<0&&p.getY(i)>-.020)tip=Math.max(tip,Math.abs(p.getX(i)))}assert(top<tip*.7,'nose bridge is as broad as its tip');doll.nose.geometry.computeBoundingBox();assert(doll.nose.geometry.boundingBox.getSize(new T.Vector3()).z<.06,'nose projects too far out of the face');
});

test("D09: Recessed ears",()=>{
const {doll}=fixture();assert(doll.ears?.length===2,'ears have no individually shaped recess');for(const ear of doll.ears){const inset=ear.getObjectByName('ear-recess');assert(inset&&inset.scale.x<.020&&inset.scale.y<.04,'ear shading is not inset within its lobe');assert(ear.position.x!==0,'ears are not located at the head edge')}
});

test("D10: Bisque finish and neck joint",()=>{
const {doll}=fixture();const skin=doll.faceHull.material;assert(skin.isMeshPhysicalMaterial&&skin.clearcoat>.10&&skin.clearcoat<.40,'face has no restrained bisque glaze');assert(skin.roughness>=.45,'porcelain looks wet instead of satin');const joint=doll.root.getObjectByName('bisque-neck-joint');assert(joint?.geometry.type==='TorusGeometry','made-doll neck articulation is missing');assert(joint.geometry.parameters.tube<.003,'neck seam is too heavy');
});
