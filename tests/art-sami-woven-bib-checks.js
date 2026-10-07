import * as T from 'three';
import {createDolls} from '../src/render/dolls.js';

export function runArtChecks(){
 const checks=[];const check=(name,passed)=>checks.push({name,passed:Boolean(passed)});
 const sami=createDolls(new T.Group()).dolls.find(d=>d.id==='sami');
 const map=sami.garments.bib.material.map;
 check('Sami textile: overalls use an authored woven-bib atlas',map?.userData?.pattern==='sami-woven-bib-band');
 if(map?.image){
  const c=map.image.getContext('2d'),data=c.getImageData(0,0,map.image.width,96).data;let accent=0;
  for(let i=0;i<data.length;i+=4)if(data[i]>165&&data[i+1]>115&&data[i+1]<185&&data[i+2]<145)accent++;
  check('Sami textile: upper bib band has visible warm geometric stitching',accent>180);
 }
 for(const leg of sami.legs){
  const uv=leg.trousers.geometry.attributes.uv;let max=0;
  for(let i=0;i<uv.count;i++)max=Math.max(max,uv.getY(i));
  check('Sami textile: trouser UVs avoid the decorative bib band',max<=.62);
 }
 let calls=0;sami.root.traverseVisible(o=>{if(o.isMesh&&o.material.visible)calls++});
 check('Sami textile: stitched bib does not add a material draw submission',calls<70);
 return checks;
}
