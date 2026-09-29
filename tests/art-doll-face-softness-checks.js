import * as T from 'three';
import {createDolls} from '../src/render/dolls.js';

export function runArtChecks(){
 const checks=[];const check=(name,passed)=>checks.push({name,passed:Boolean(passed)});
 const view=createDolls(new T.Group());
 for(const doll of view.dolls){
  for(const eye of doll.eyes){
   eye.iris.geometry.computeBoundingBox();
   const size=eye.iris.geometry.boundingBox.getSize(new T.Vector3());
   check(`Face softness ${doll.id}: iris stays small and oval rather than bead-like`,size.x<=.066&&size.y<=.072);
   check(`Face softness ${doll.id}: painted iris is matte and opaque`,eye.iris.material.roughness>=.60&&!eye.iris.material.transparent);
   const upper=eye.upperLid?.geometry?.parameters?.radius,closed=eye.closedLid?.geometry?.parameters?.radius;
   check(`Face softness ${doll.id}: eyelid lines stay finer than brows`,upper<=.00135&&closed<=.0023);
  }
  const map=doll.eyes[0].iris.material.map.image,c=map.getContext('2d'),data=c.getImageData(0,0,map.width,map.height).data;
  let bright=0;
  for(let i=0;i<data.length;i+=4)if(data[i]>220&&data[i+1]>210&&data[i+2]>190)bright++;
  check(`Face softness ${doll.id}: catchlight stays a restrained painted fleck`,bright>=60&&bright<=180);
 }
 return checks;
}
