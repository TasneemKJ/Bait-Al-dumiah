import * as T from 'three';
import {createDolls} from '../src/render/dolls.js';
import {createState} from '../src/simulation.js';
const assert=(x,m)=>{if(!x)throw Error(m)};
const dimensions=g=>{g.computeBoundingBox();return g.boundingBox.getSize(new T.Vector3())};
export async function runArtChecks(){
 const results=[];const check=(name,fn)=>{try{fn();results.push({name,passed:true})}catch(e){results.push({name,passed:false,error:e.message})}};
 const view=createDolls(new T.Group()),state=createState();
 check('Friendly faces: lower cheeks stay rounded instead of narrowing to a triangular chin',()=>{
  for(const d of view.dolls){const p=d.faceHull.geometry.attributes.position;let widest=0,lower=0;
   for(let i=0;i<p.count;i++){widest=Math.max(widest,Math.abs(p.getX(i)));if(p.getY(i)<-.185&&p.getY(i)>-.213)lower=Math.max(lower,Math.abs(p.getX(i)))}
   assert(lower/widest>=.76,`${d.id}: lower-cheek width ratio ${lower/widest}`);
  }
 });
 check('Friendly eyes: small painted ovals have no white sockets or encircling lash rims',()=>{
  for(const d of view.dolls)for(const eye of d.eyes){assert(!eye.getObjectByName('almond-white'),'large white eye socket remains');
   const size=dimensions(eye.iris.geometry);assert(size.x<=.075&&size.y<=.085,'painted eye is too large');
   assert(eye.aperture.children.length===1,'eye still contains a layered staring socket');
  }
 });
 check('Friendly nose: compact button is broader than it is tall',()=>{
  for(const d of view.dolls){const s=dimensions(d.nose.geometry);assert(s.y<=.034&&s.x>=s.y*.9&&s.z<=.036,'pin-like elongated nose remains')}
 });
 check('Friendly mouth: neutral expression already has a gentle curved smile',()=>{
  for(const d of view.dolls){const smile=d.mouth.getObjectByName('painted-smile');assert(smile,'realistic protruding lips remain');
   const p=smile.geometry.attributes.position;let middle=0,edges=0,mc=0,ec=0;for(let i=0;i<p.count;i++){const x=Math.abs(p.getX(i));if(x<.006){middle+=p.getY(i);mc++}if(x>.022){edges+=p.getY(i);ec++}}
   assert(mc&&ec&&edges/ec>middle/mc+.004,'neutral mouth has a flat or downturned expression');
  }
 });
 check('Friendly faces: warm satin skin is not a wet glass surface',()=>{
  for(const d of view.dolls){const m=d.faceHull.material;assert(m.roughness>=.62&&m.clearcoat<=.18,'skin is too glossy for a handmade doll')}
 });
 check('Friendly gaze: repeated night frames cannot accumulate an extreme head turn',()=>{
  state.elapsed=10.9;state.clock=130;for(let i=0;i<240;i++)view.update(state,1/60,'noor',0);
  assert(view.dolls.every(d=>Math.abs(d.head.rotation.y)<.32),'night curiosity accumulates into an unnatural head twist');
 });
 check('Friendly care: all doll actions keep eyes, face and hands finite with motion on or off',()=>{
  for(const reducedMotion of [false,true])for(const action of ['idle','tea','rest','play','soothe']){
   state.settings.reducedMotion=reducedMotion;state.dolls.forEach(d=>{d.action=action;d.lastCare=0});state.elapsed=1.6;view.update(state,1/60,'lina',0);
   view.dolls.forEach(d=>d.root.traverse(o=>assert([...o.position,...o.scale,...o.quaternion].every(Number.isFinite),'invalid pose')));
  }
 });
 return results;
}
