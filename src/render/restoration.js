import * as T from 'three';
import {ROOMS} from '../content.js';
import {makeFurniture} from './house.js';
import {compactStatic} from './batching.js';

// Earned arrangements reuse the game's authored furniture and material assets,
// placed on clear surfaces and corners away from SLOTS, dolls, and existing lamps.
const arrangements={
 kitchen:[['plant',-1.82,1.03,-1.05,.38],['lamp',1.98,.13,-1.05,.68],['cup',-.92,.77,.28,1.05]],
 parlor:[['plant',-1.96,.13,-.18,.70],['lamp',-.72,.13,.55,.60],['musicbox',.98,.13,.42,.54]],
 studio:[['plant',1.98,.13,-.15,.62],['lamp',.68,.83,-.92,.52],['bear',-1.14,.83,-.56,.58]],
 bedroom:[['plant',.86,1.25,-1.36,.35],['lamp',-1.90,.13,-.15,.74],['mobile',-1.90,.13,-1.15,.60]],
};
const smallGeometry=new Map();
function miniatureDetail(asset){
 asset.traverse(mesh=>{
  if(!mesh.isMesh)return;
  const p=mesh.geometry.parameters;let key,make;
  if(mesh.geometry.type==='SphereGeometry'){key='sphere';make=()=>new T.SphereGeometry(1,8,6)}
  if(mesh.geometry.type==='CylinderGeometry'){key=`cylinder:${p.radiusBottom}`;
  make=()=>new T.CylinderGeometry(1,p.radiusBottom,1,8)}
  if(mesh.geometry.type==='TorusGeometry'){key=`ring:${p.tube}`;make=()=>new T.TorusGeometry(1,p.tube,4,16)}
  if(key){if(!smallGeometry.has(key))smallGeometry.set(key,make());mesh.geometry=smallGeometry.get(key)}
  // These tiny shelf arrangements receive the room's shadows. Keeping them
  // out of the shadow pass leaves the full house within its geometry budget.
  mesh.castShadow=false;
 });
}
function starDoilyGeometry(){
 const shape=new T.Shape();
 for(let i=0;i<16;i++){
  const a=i*Math.PI/8,r=i%2===0?.24:.185;
  const x=Math.cos(a)*r,y=Math.sin(a)*r;
  if(i===0)shape.moveTo(x,y);else shape.lineTo(x,y);
 }
 shape.closePath();
 const g=new T.ShapeGeometry(shape);g.rotateX(-Math.PI/2);return g;
}
export function createRestoration(parent){
 const root=new T.Group();root.name='earned-room-restoration';root.userData.noBatch=true;parent.add(root);
 const stages=[],doilyGeo=starDoilyGeometry(),doilyMat=new T.MeshStandardMaterial({
   color:0xf3e5d0,roughness:.88,metalness:0,side:T.DoubleSide});
 for(const room of ROOMS)arrangements[room.id].forEach(([item,x,y,z,scale],index)=>{
  const group=new T.Group();group.name=`restoration-${room.id}-${index+1}`;
  group.position.set(room.x,room.y,0);group.visible=false;group.userData.noBatch=true;group.userData.item=item;
  const asset=makeFurniture(item);miniatureDetail(asset);asset.position.set(x,y,z);
  asset.scale.setScalar(scale);group.add(asset);
  const doily=new T.Mesh(doilyGeo,doilyMat);doily.name='levantine-star-doily';
  doily.scale.setScalar(scale);doily.position.set(x,y+.005,z);doily.castShadow=false;group.add(doily);
  const light=item==='lamp'?new T.PointLight(0xffc27d,0,3.1,2):null;
  if(light){light.name=`restored-${room.id}-light`;light.position.set(x,y+1.0,z);
  light.castShadow=false;group.add(light)}
  // Batch while visible; the batching contract skips invisible ancestors.
  group.visible=true;compactStatic(group);group.visible=false;root.add(group);
  stages.push({group,light,room:room.id,tier:index+1});
 });
 return {root,lights:stages.flatMap(s=>s.light?[s.light]:[]),update(state,
   mix){for(const stage of stages){stage.group.visible=(state.restoration?.[stage.room]??
     0)>=stage.tier;stage.group.userData.nightMix=mix;
 if(stage.light)stage.light.intensity=stage.group.visible ? .18+Math.max(0,Math.min(1,mix))*1.72 : 0}}};
}
