import * as T from 'three';
import {createDolls} from '../src/render/dolls.js';

export function runArtChecks(){
 const checks=[];const check=(name,passed)=>checks.push({name,passed:Boolean(passed)});
 const dolls=createDolls(new T.Group()).dolls;
 for(const doll of dolls)for(const [i,arm] of doll.arms.entries()){
   const g=arm.sleeve.geometry;g.computeBoundingBox();const size=g.boundingBox.getSize(new T.Vector3());
   check(`Sleeve ${doll.id} ${i}: gathered shoulder stays tailored rather than spherical`,
     size.x<=.108&&size.y>=.118&&size.y<=.132&&size.z<=.102);
   const p=g.attributes.position;let belly=0,cuff=0;
   for(let n=0;n<p.count;n++){
     const y=p.getY(n),r=Math.hypot(p.getX(n),p.getZ(n));
     if(y>-.075&&y<-.025)belly=Math.max(belly,r);
     if(y>.000) cuff=Math.max(cuff,r);
   }
   check(`Sleeve ${doll.id} ${i}: fabric gathers visibly into the upper cuff`,belly>=cuff+.018);
 }
 return checks;
}
