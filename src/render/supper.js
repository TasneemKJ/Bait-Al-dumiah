import * as T from 'three';
import {cookedToday} from '../simulation.js';
import {createKettleSteam} from './kettle-steam.js';
import {cylinder,ball,palette as P} from './primitives.js';

// The day's comfort dish waits on the kitchen table; it steams for a while after cooking.
export const SUPPER_STEAM_SECONDS=45;
const COLOURS={kaak:0xc9955c,maamoul:0xd8b27e,mujaddara:0x9b7a55,knafeh:0xe08a3c};
export const supperLook=(state)=>{
 const shown=cookedToday(state)&&Object.hasOwn(COLOURS,state.grove.dish);
 const age=state.elapsed-state.grove.dishAt;
 return {shown,colour:shown?COLOURS[state.grove.dish]:null,steam:shown&&age>=0&&age<SUPPER_STEAM_SECONDS};
};
export function createSupper(parent){
 const root=new T.Group();root.name='kitchen-supper';root.position.set(-2.52,.762,.33);root.visible=false;
 root.userData.noBatch=true;parent.add(root);
 cylinder(root,0,.008,0,.13,.016,P.cream);
 const food=ball(root,0,.04,0,.085,.04,.085,new T.MeshStandardMaterial({color:0xc9955c,roughness:.75}));
 const steam=createKettleSteam(root);steam.root.scale.setScalar(.45);steam.root.position.y=.05;
 const status={shown:false,steam:false};
 return {root,status,update(state){
  const look=supperLook(state);root.visible=look.shown;status.shown=look.shown;status.steam=look.steam;
  if(!look.shown)return;food.material.color.setHex(look.colour);
  steam.update(state.elapsed,look.steam,state.settings.reducedMotion||state.paused);
 }};
}
