import * as T from 'three';
import {createDolls} from '../src/render/dolls.js';
import {createState} from '../src/simulation.js';
import {groundFilmResident} from '../src/render/film-scene.js';

// Native canvas textures and the actual rig compaction path, not a substitute rig.
export function checkFilmGrounding(){
 const parent=new T.Group();parent.position.y=.26;
 const residents=createDolls(parent),state=createState();state.settings.reducedMotion=true;
 residents.update(state,0,null,0);
 return residents.dolls.map(doll=>{
  const floorY=(doll.id==='lina'?.101:.111)-.12;
  const expected=doll.root.localToWorld(new T.Vector3(0,floorY,0)).y;
  const minimum=()=>Math.min(...doll.legs.map(leg=>new T.Box3().setFromObject(leg.foot).min.y));
  parent.updateMatrixWorld(true);const before=minimum();
  groundFilmResident(doll,floorY);parent.updateMatrixWorld(true);const after=minimum();
  if(Math.abs(after-expected)>1e-6)throw Error(`${doll.id}: ${after} != ${expected}`);
  if(doll.wishGlow.visible||doll.halo.visible)throw Error(`${doll.id}: gameplay ring visible`);
  return {id:doll.id,before,after,expected};
 });
}
