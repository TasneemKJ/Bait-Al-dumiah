import * as T from 'three';
import {createDolls} from '../src/render/dolls.js';
import {createState} from '../src/simulation.js';
import {groundFilmResident} from '../src/render/film-scene.js';
import {createFilmAction} from '../src/render/film-action.js';
import {introAction} from '../src/render/intro-action.js';
const assert=(value,message)=>{if(!value)throw Error(message)};
export function checkFilmAction(){
 const root=new T.Group(),residents=createDolls(root),state=createState(),saved=JSON.stringify(state);
 residents.update(state,0,null,0);
 for(const doll of residents.dolls)groundFilmResident(doll,(doll.id==='lina'?.101:.111)-.12);
 const action=createFilmAction(residents),poses=[];
 for(const time of [8,10,16,17,19,21,28,30,32,10]){
  action.update(time);root.updateMatrixWorld(true);
  const noor=residents.dolls.find(d=>d.id==='noor');
  for(const [i,name] of ['film-quilt-left','film-quilt-right'].entries()){
   const corner=root.getObjectByName(name).localToWorld(new T.Vector3(i===0?-.08:.08,.05,0));
   assert(corner.distanceTo(noor.arms[i].hand.getWorldPosition(new T.Vector3()))<1e-6,
    'quilt corner left the holding hand');
  }
  poses.push({time,...action.inspect(),hands:Object.fromEntries(residents.dolls.map(d=>[d.id,d.arms.map(a=>
   a.hand.getWorldPosition(new T.Vector3()).toArray())]))});
 }
 assert(poses[1].cup[1]-poses[0].cup[1]>.3,'cup must lift visibly');
 assert(JSON.stringify(poses[1].cup)===JSON.stringify(poses.at(-1).cup),'reverse seek cup drift');
 for(const pose of poses)assert(JSON.stringify(pose.residents)===JSON.stringify(poses[0].residents),
  'feet moved during action');
 assert(new T.Vector3(...poses[4].hands.sami[1]).distanceTo(new T.Vector3(...poses[3].hands.sami[1]))>.1,
  'sewing hand must draw the thread');
 assert(new T.Vector3(...poses[8].hands.noor[1]).distanceTo(new T.Vector3(...poses[6].hands.noor[1]))>.1,
  'quilt hand must fold');
 action.update(8,true);const held=JSON.stringify(action.inspect());
 action.update(32,true);assert(held===JSON.stringify(action.inspect()),'reduced motion changed pose');
 assert(JSON.stringify(state)===saved,'film changed canonical state');
 const doll=residents.dolls[0],before=doll.tea.getWorldPosition(new T.Vector3()).toArray();
 const opening=introAction(residents);opening.update(0,false);opening.update(10,false);opening.restore();
 root.updateMatrixWorld(true);
 assert(JSON.stringify(before)===JSON.stringify(doll.tea.getWorldPosition(new T.Vector3()).toArray()),
  'intro exit did not restore pose');
 return {checks:9,poses};
}
