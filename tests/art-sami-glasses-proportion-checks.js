import * as T from 'three';
import {createSpectacles} from '../src/render/doll-spectacles.js';

export function runArtChecks(){
 const checks=[];const check=(name,passed)=>checks.push({name,passed:Boolean(passed)});
 const root=new T.Group(),view=createSpectacles(root);
 const rims=view.root.children.filter(o=>o.geometry?.type==='TorusGeometry');
 check('Sami glasses: exactly two fitted rims remain',rims.length===2);
 for(const [i,rim] of rims.entries()){
  const effectiveRadius=rim.geometry.parameters.radius*rim.scale.x;
  const effectiveTube=rim.geometry.parameters.tube*rim.scale.x;
  check(`Sami glasses rim ${i+1}: diameter no longer dominates the face`,effectiveRadius>=.058&&effectiveRadius<=.064);
  check(`Sami glasses rim ${i+1}: brass line stays delicate`,effectiveTube<=.0055);
 }
 const bridge=view.root.children.find(o=>o.geometry?.type==='CylinderGeometry');
 check('Sami glasses: bridge stays slimmer than the rims',bridge&&bridge.scale.x<=.005);
 check('Sami glasses: temples remain articulated geometry',view.temples.length===2&&view.temples.every(t=>t.geometry.type==='TubeGeometry'));
 return checks;
}
