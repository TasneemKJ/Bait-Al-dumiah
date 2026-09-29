import * as T from 'three';
import {createDolls} from '../src/render/dolls.js';
import {rigParts} from '../src/render/doll-rig-batch.js';

export function runArtChecks(){
 const checks=[], parent=new T.Group(), view=createDolls(parent);
 function check(name,ok){checks.push({name,passed:Boolean(ok)})}
 for(const id of ['lina','noor']){
  const doll=view.dolls.find(d=>d.id===id),apron=rigParts(doll.root,'embroidered-apron')[0],map=apron.material.map;
  check(`Levantine ${id}: embroidered linen replaces the floral apron atlas`,map.name===`levantine-stitched-linen-${id}`);
  const image=map.image,c=image.getContext('2d'),pixels=c.getImageData(0,0,image.width,image.height).data;
  let dyed=0;for(let y=32;y<105;y++)for(let x=70;x<187;x++){let i=(y*image.width+x)*4;if(pixels[i]<185&&pixels[i+1]<150&&pixels[i+2]<150)dyed++}
  check(`Levantine ${id}: chest cross-stitch panel is legible rather than a few tiny flowers`,dyed>750);
  check(`Levantine ${id}: fabric retains its woven relief`,apron.material.bumpMap&&apron.material.bumpScale>0);
 }
 check('Levantine cloth change preserves all three articulated residents',view.dolls.length===3&&view.dolls.every(d=>d.arms.length===2&&d.legs.length===2));
 return checks;
}
