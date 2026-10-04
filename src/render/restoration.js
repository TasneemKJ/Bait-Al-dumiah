import * as T from 'three';
import {ROOMS} from '../content.js';
import {makeFurniture} from './house.js';
import {compactStatic} from './batching.js';

// Earned arrangements reuse the game's authored furniture and material assets.
const arrangements={
 kitchen:[['plant',-1.50,1.11,-1.37,.43],['lamp',.83,1.04,-1.24,.50],['musicbox',-.52,.79,.08,.48]],
 parlor:[['plant',1.65,.13,.53,.95],['lamp',-.90,.13,.64,.86],['musicbox',.38,.53,.43,.68]],
 studio:[['plant',1.53,.78,-.64,.55],['lamp',.70,.85,-1.02,.58],['bear',-1.08,.85,-.63,.67]],
 bedroom:[['plant',-.85,1.33,-1.22,.40],['lamp',1.68,.13,.68,.93],['mobile',1.25,.75,-.92,.55]],
};
export function createRestoration(parent){
 const root=new T.Group();root.name='earned-room-restoration';root.userData.noBatch=true;parent.add(root);
 const stages=[];
 for(const room of ROOMS)arrangements[room.id].forEach(([item,x,y,z,scale],index)=>{
  const group=new T.Group();group.name=`restoration-${room.id}-${index+1}`;group.position.set(room.x,room.y,0);group.visible=false;group.userData.noBatch=true;
  const asset=makeFurniture(item);asset.position.set(x,y,z);asset.scale.setScalar(scale);group.add(asset);
  // Batch while visible; the batching contract skips invisible ancestors.
  group.visible=true;compactStatic(group);group.visible=false;root.add(group);stages.push({group,room:room.id,tier:index+1});
 });
 return {root,update(state,mix){for(const stage of stages){stage.group.visible=(state.restoration?.[stage.room]??0)>=stage.tier;stage.group.userData.nightMix=mix}}};
}
