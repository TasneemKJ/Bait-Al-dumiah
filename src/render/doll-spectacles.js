import * as T from 'three';
import {ring,line,mat,palette as P} from './primitives.js';
export function createSpectacles(parent){
 const root=new T.Group();root.name='fitted-spectacles';parent.add(root);const temples=[];
 for(const sign of [-1,1]){
  ring(root,sign*.105,.007,.296,.061,.0065,P.gold);
  const path=new T.CatmullRomCurve3([[sign*.165,.013,.296],[sign*.257,.030,.250],[sign*.309,.025,.086],[sign*.294,-.021,.021]].map(p=>new T.Vector3(...p)));
  const bar=new T.Mesh(new T.TubeGeometry(path,24,.0037,6,false),mat(P.gold));bar.name='spectacle-temple';bar.castShadow=true;root.add(bar);temples.push(bar);
 }
 line(root,[-.041,.010,.295],[.041,.010,.295],.0058,P.gold);return {root,temples};
}
