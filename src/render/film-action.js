import * as T from 'three';
import {carePose,levelCup} from './doll-acting.js';
import {sewingAction,quiltAction} from './film-craft-action.js';
const smooth=x=>{x=T.MathUtils.clamp(x,0,1);return x*x*(3-2*x)};
// Absolute-time posing: seeking, replay and export cannot accumulate transforms.
export function teaActionTime(seconds,still=false){
 if(still)return 1.5;
 const t=seconds-8;
 if(t<0)return 0;
 if(t<2)return t*.425;
 if(t<4)return .85+(t-2)*.85;
 if(t<7)return 2.55+(t-4)*1.3/3;
 return 3.85;
}
export function poseTea(lina,base,seconds,still=false){
   lina.body.position.copy(base);lina.body.rotation.set(0,0,0);
   lina.head.rotation.set(0,0,0);
   for(const [i,arm] of lina.arms.entries()){
    arm.rotation.set(0,0,(i===0?-1:1)*.19);
    arm.forearm.rotation.set(0,0,0);arm.hand.rotation.set(0,0,0);
   }
   const t=teaActionTime(seconds,still);
   carePose(lina,{action:'tea',lastCare:0},t,false);
   // carePose's resting body scale is safe; retain the private floor correction.
   lina.body.position.copy(base);lina.tea.visible=true;levelCup(lina);
   lina.head.rotation.y=-.08*smooth(t/.85);
   lina.steam.update(still?1.5:seconds,true,still);
}
export function createFilmAction(residents){
 const lina=residents.dolls.find(d=>d.id==='lina');
 const base=lina.body.position.clone();
 const sew=sewingAction(residents.dolls.find(d=>d.id==='sami'));
 const fold=quiltAction(residents.dolls.find(d=>d.id==='noor'));
 for(const doll of residents.dolls)doll.root.userData.filmActor=true;
 return {
  update(seconds,still=false){
   sew(still?19:seconds);fold(still?31:seconds);
   poseTea(lina,base,seconds,still);
  },
  inspect(){
   lina.root.updateWorldMatrix(true,true);
   return {residents:residents.dolls.map(d=>({id:d.id,feet:d.legs.map(l=>
     new T.Box3().setFromObject(l.foot).min.y)})),feet:lina.legs.map(leg=>new T.Box3().setFromObject(leg.foot).min.y),
    cup:lina.tea.getWorldPosition(new T.Vector3()).toArray(),
    hand:lina.arms[1].hand.getWorldPosition(new T.Vector3()).toArray()};
  },
 };
}
