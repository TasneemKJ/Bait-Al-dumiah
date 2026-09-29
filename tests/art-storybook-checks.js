import * as T from 'three';
import {createDolls} from '../src/render/dolls.js';
import {createHair} from '../src/render/doll-hair.js';
import {DOLLS} from '../src/content.js';
import {createState} from '../src/simulation.js';
import {rigParts} from '../src/render/doll-rig-batch.js';
const assert=(ok,text)=>{if(!ok)throw Error(text)};
export async function runArtChecks(){
 const out=[];const check=(name,fn)=>{try{fn();out.push({name,passed:true})}catch(e){out.push({name,passed:false,error:e.message})}};
 const view=createDolls(new T.Group());
 check('Storybook: all three residents have distinct sculpted head profiles',()=>{
  const heads=view.dolls.map(d=>d.faceHull.geometry.attributes.position.array);
  assert(heads.every(a=>a.length===heads[0].length),'inconsistent topology');
  for(let a=0;a<3;a++)for(let b=a+1;b<3;b++)assert(heads[a].some((x,i)=>Math.abs(x-heads[b][i])>.002),'shared anonymous face silhouette');
 });
 check('Storybook: every hairstyle has tapered, non-tubular sculpted fringe',()=>{
  for(const d of view.dolls){const locks=rigParts(d.hairStyle.root,'sculpted-fringe');assert(locks.length>=3,d.id+' has a bald helmet edge');
   for(const l of locks){assert(l.geometry.type==='BufferGeometry','fringe is a round noodle');l.geometry.computeBoundingBox();const size=l.geometry.boundingBox.getSize(new T.Vector3());assert(size.x>.06&&size.y>.05&&size.z>.014,'fringe lacks a dimensional swept mass')}}
 });
 check('Storybook: skirt has a rounded return at the hem, not a triangular cone',()=>{
  for(const d of view.dolls.filter(d=>d.skirt)){const skirt=rigParts(d.skirt,'gathered-dress')[0];assert(skirt,'rounded dress shell missing');
   const p=skirt.geometry.attributes.position;let bottom=0,above=0;for(let i=0;i<p.count;i++){const y=p.getY(i)+.75,r=Math.hypot(p.getX(i),p.getZ(i)/.86);if(y<.35)bottom=Math.max(bottom,r);if(y>.37&&y<.43)above=Math.max(above,r)}assert(above>bottom+.012,'hem remains a straight cone edge')}
 });
 check('Storybook: pinafore has dimensional straps and a rounded skirt drape',()=>{
  for(const d of view.dolls.filter(d=>d.skirt)){assert(rigParts(d.garments.root,'pinafore-shoulder-strap').length===2,'missing fitted shoulder straps');
   const p=d.garments.apron.geometry.attributes.position;assert(p.count>=300,'apron has too few folds');d.garments.apron.geometry.computeBoundingBox();assert(d.garments.apron.geometry.boundingBox.max.z>.26,'apron no longer wraps the skirt')}
 });
 check('Storybook: shoes have sculpted toe boxes instead of ellipsoid beads',()=>{
  for(const d of view.dolls)for(const leg of d.legs){assert(leg.foot.upper.geometry.type==='BufferGeometry','shoe upper is still a sphere');assert(leg.foot.upper.geometry.attributes.position.count<900,'shoe exceeds small-model budget')}
 });
 check('Storybook: Sami fringe leaves both spectacle rims intact in front and three-quarter views',()=>{
  const root=new T.Group(),hair=createHair(root,DOLLS.find(d=>d.id==='sami')),meshes=[];
  hair.root.traverse(o=>{if(o.isMesh)meshes.push(o)});
  for(const yaw of [-.4,0,.4]){
   root.rotation.y=yaw;root.updateMatrixWorld(true);
   for(const sign of [-1,1])for(let i=0;i<=16;i++){
    const a=i/16*Math.PI,point=root.localToWorld(new T.Vector3(sign*.105+Math.cos(a)*.071,.007+Math.sin(a)*.071,.304));
    const ray=new T.Raycaster(point.clone().add(new T.Vector3(0,0,2)),new T.Vector3(0,0,-1));
    const hit=ray.intersectObjects(meshes,false)[0];
    assert(!hit||hit.distance>=1.998,`hair obscures rim at yaw ${yaw}, side ${sign}, angle ${i}`);
   }
  }
 });
 check('Storybook: named model surfaces remain finite through every care pose',()=>{
  const state=createState();for(const action of ['idle','tea','rest','soothe','play'])for(const still of [true,false]){state.settings.reducedMotion=still;state.elapsed=1.8;state.dolls.forEach(d=>{d.action=action;d.lastCare=0});view.update(state,.016,'lina',.2);view.dolls.forEach(d=>d.root.traverse(o=>assert([...o.position,...o.quaternion,...o.scale].every(Number.isFinite),'invalid joint')))}
 });
 return out;
}
