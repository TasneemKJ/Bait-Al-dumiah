import * as T from 'three';
import {createDolls} from '../src/render/dolls.js';
import {rigParts} from '../src/render/doll-rig-batch.js';

export function runArtChecks(){
 const checks=[];const check=(name,passed)=>checks.push({name,passed:Boolean(passed)});
 const view=createDolls(new T.Group());
 for(const doll of view.dolls){
  check(`Proportion ${doll.id}: head no longer dominates the body`,
    doll.head.scale.x<=.81&&doll.head.scale.y<=.90&&doll.head.scale.z<=.88&&doll.head.position.y<=1.13);
  const p=doll.torso.geometry.attributes.position;let upper=0;
  for(let i=0;i<p.count;i++)if(p.getY(i)>.805&&p.getY(i)<.828)upper=Math.max(upper,Math.abs(p.getX(i)));
  check(`Proportion ${doll.id}: upper bodice keeps a visible shoulder line`,upper>=.125);
 }
 const sami=view.dolls.find(d=>d.id==='sami');
 const rims=[];sami.spectacles.root.traverse(o=>{if(o.isMesh&&o.geometry?.type==='TorusGeometry')rims.push(o.geometry)});
 check('Proportion Sami: spectacles frame the eyes instead of dominating the face',
   rims.length===2&&rims.every(g=>g.parameters.radius<=.062&&g.parameters.tube<=.007));
 const eyeSpan=Math.abs(sami.eyes[1].position.x-sami.eyes[0].position.x);
 const rimSpan=Math.abs(rims[1] ? sami.spectacles.root.children.filter(o=>o.geometry?.type==='TorusGeometry')[1].position.x -
   sami.spectacles.root.children.filter(o=>o.geometry?.type==='TorusGeometry')[0].position.x : 1);
 check('Proportion Sami: spectacle centers remain aligned near the painted eyes',Math.abs(rimSpan-eyeSpan)<=.012);
 return checks;
}
