import * as T from 'three';
import {ROOMS} from '../content.js';
import {makeFurniture} from './house.js';
import {compactStatic} from './batching.js';

// Earned arrangements reuse the game's authored furniture and material assets.
const arrangements={
 kitchen:[['plant',-1.50,1.11,-1.37,.43],['lamp',.83,1.04,-1.24,.50],['cup',-.52,.79,.08,1.35]],
 parlor:[['plant',1.65,.13,.53,.95],['lamp',-.90,.13,.64,.86],['musicbox',.38,.53,.43,.68]],
 studio:[['plant',1.53,.78,-.64,.55],['lamp',.70,.85,-1.02,.58],['bear',-1.08,.85,-.63,.67]],
 bedroom:[['plant',-.85,1.33,-1.22,.40],['lamp',1.68,.13,.68,.93],['mobile',1.25,.75,-.92,.55]],
};
const smallGeometry=new Map();
function miniatureDetail(asset){
 asset.traverse(mesh=>{
  if(!mesh.isMesh)return;
  const p=mesh.geometry.parameters;let key,make;
  if(mesh.geometry.type==='SphereGeometry'){key='sphere';make=()=>new T.SphereGeometry(1,8,6)}
  if(mesh.geometry.type==='CylinderGeometry'){key=`cylinder:${p.radiusBottom}`;make=()=>new T.CylinderGeometry(1,p.radiusBottom,1,8)}
  if(mesh.geometry.type==='TorusGeometry'){key=`ring:${p.tube}`;make=()=>new T.TorusGeometry(1,p.tube,4,16)}
  if(key){if(!smallGeometry.has(key))smallGeometry.set(key,make());mesh.geometry=smallGeometry.get(key)}
  // These tiny shelf arrangements receive the room's shadows. Keeping them
  // out of the shadow pass leaves the full house within its geometry budget.
  mesh.castShadow=false;
 });
}
export function createRestoration(parent){
 const root=new T.Group();root.name='earned-room-restoration';root.userData.noBatch=true;parent.add(root);
 const stages=[];
 for(const room of ROOMS)arrangements[room.id].forEach(([item,x,y,z,scale],index)=>{
  const group=new T.Group();group.name=`restoration-${room.id}-${index+1}`;group.position.set(room.x,room.y,0);group.visible=false;group.userData.noBatch=true;group.userData.item=item;
  const asset=makeFurniture(item);miniatureDetail(asset);asset.position.set(x,y,z);asset.scale.setScalar(scale);group.add(asset);
  const light=item==='lamp'?new T.PointLight(0xffc27d,0,3.1,2):null;if(light){light.name=`restored-${room.id}-light`;light.position.set(x,y+1.0,z);light.castShadow=false;group.add(light)}
  // Batch while visible; the batching contract skips invisible ancestors.
  group.visible=true;compactStatic(group);group.visible=false;root.add(group);stages.push({group,light,room:room.id,tier:index+1});
 });
 return {root,lights:stages.flatMap(s=>s.light?[s.light]:[]),update(state,
   mix){for(const stage of stages){stage.group.visible=(state.restoration?.[stage.room]??0)>=stage.tier;stage.group.userData.nightMix=mix;
 if(stage.light)stage.light.intensity=stage.group.visible ? .18+Math.max(0,Math.min(1,mix))*1.72 : 0}}};
}
