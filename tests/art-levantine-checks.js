import * as T from 'three';
import {createDolls} from '../src/render/dolls.js';
import {rigParts} from '../src/render/doll-rig-batch.js';
import {createState} from '../src/simulation.js';
export async function runArtChecks(){
 const checks=[], check=(name,passed)=>checks.push({name,passed:Boolean(passed)});
 const view=createDolls(new T.Group());
 for(const id of ['lina','noor']){
  const apron=rigParts(view.dolls.find(d=>d.id===id).root,'embroidered-apron')[0],map=apron.material.map;
  check(`Levantine ${id}: original cross-stitched cloth atlas`,map.name===`levantine-stitched-linen-${id}`);
  const p=map.image.getContext('2d').getImageData(0,0,256,384).data;let dyed=0;
  for(let y=32;y<105;y++)for(let x=70;x<187;x++){const i=(y*256+x)*4;if(p[i]<185&&p[i+1]<155&&p[i+2]<155)dyed++}
  check(`Levantine ${id}: visible chest stitching rather than a token symbol`,dyed>750);
  check(`Levantine ${id}: cloth keeps woven relief`,apron.material.bumpMap&&apron.material.bumpScale>0);
 }
 const module=await import('project/src/render/levantine-setting.js').catch(()=>({}));
 check('Courtyard: environment builder exists',typeof module.createLevantineSetting==='function');
 if(module.createLevantineSetting){
  const root=new T.Group(),v=module.createLevantineSetting(root),s=createState();
  const parts=[];v.staticRoot.traverse(o=>{if(o.bakedParts)parts.push(...o.bakedParts.map(p=>p.source));else parts.push(o)});
  const named=n=>parts.filter(o=>o.name===n);
  check('Courtyard: four shaped arch bands stay above the residents',named('courtyard-arch').length===4&&named('courtyard-arch').every(o=>{o.geometry.computeBoundingBox();return o.geometry.boundingBox.min.y>2.35}));
  check('Courtyard: carved door and octagonal basin are real geometry',named('closed-walnut-door').length===1&&named('octagonal-basin').length===1);
  check('Courtyard: fountain stays outside furniture placement rows',v.water.position.z>2.6&&v.water.position.y<.4);
  let calls=0;root.traverseVisible(o=>{if(o.isMesh&&o.material.visible)calls++});check('Courtyard: detailed scene uses at most twelve visible submissions',calls<=12);
  s.elapsed=19;v.update(s,1);check('Courtyard: night shadow is restrained and does not write depth',v.shadow.material.opacity>0&&v.shadow.material.opacity<=.24&&!v.shadow.material.depthWrite);
  const before=JSON.stringify([v.shadow.position.toArray(),v.shadow.material.opacity,v.doorGlow.material.opacity,v.water.material.opacity]);s.paused=true;v.update(s,1);check('Courtyard: pause holds the exact existing cue pose',before===JSON.stringify([v.shadow.position.toArray(),v.shadow.material.opacity,v.doorGlow.material.opacity,v.water.material.opacity]));
  s.settings.reducedMotion=true;v.update(s,1);check('Courtyard: reduced motion suppresses the passing shadow',!v.shadow.visible);
  v.update(s,0);check('Courtyard: daylight clears the haunting',!v.shadow.visible&&v.doorGlow.material.opacity===0);
 }
 return checks;
}
