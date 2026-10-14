import * as T from 'three';
import {aimArm} from './doll-acting.js';
const ease=x=>{x=T.MathUtils.clamp(x,0,1);return x*x*(3-2*x)};
function patch(parent,width,height,color){
 const mesh=new T.Mesh(new T.BoxGeometry(width,height,.012),new T.MeshPhongMaterial({color,shininess:2}));
 mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);return mesh;
}
function handPoint(doll,index){
 doll.root.updateWorldMatrix(true,true);
 return doll.body.worldToLocal(doll.arms[index].hand.getWorldPosition(new T.Vector3()));
}
function aim(doll,left,right){
 for(const [i,target] of [left,right].entries()){
  const arm=doll.arms[i];arm.rotation.set(0,0,0);arm.forearm.rotation.set(0,0,0);
  arm.hand.rotation.set(0,0,0);aimArm(arm,target);
 }
}
export function sewingAction(doll){
 const cloth=patch(doll.body,.16,.10,0xdbb2bc),needle=patch(doll.arms[1].hand,.006,.085,0xcab078);
 needle.position.y=-.025;
 const geometry=new T.BufferGeometry().setFromPoints([new T.Vector3(),new T.Vector3()]);
 const thread=new T.Line(geometry,new T.LineBasicMaterial({color:0x754651}));doll.body.add(thread);
 return seconds=>{
  const t=T.MathUtils.clamp(seconds-17,0,8),phase=t%4;
  const pull=phase<2?ease(phase/2):1-ease((phase-2)/2);
  aim(doll,[-.075,.75,.17],[.035+.15*pull,.775+.075*pull,.18]);
  cloth.position.copy(handPoint(doll,0)).add(new T.Vector3(.055,-.025,.008));
  const start=cloth.position.clone().add(new T.Vector3(.025,.025,.012));
  const end=handPoint(doll,1);geometry.setFromPoints([start,end]);
  doll.head.rotation.set(.12+.08*(1-pull),-.08*pull,0);
 };
}
export function quiltAction(doll){
 const left=patch(doll.body,.16,.10,0xae7c99),right=patch(doll.body,.16,.10,0xd8b78d);
 left.name='film-quilt-left';right.name='film-quilt-right';
 return seconds=>{
  const fold=ease((seconds-28)/4),angle=fold*.85,span=.16*Math.cos(angle),z=.225;
  aim(doll,[-span,.85,z-.16*Math.sin(angle)],[span,.85,z-.16*Math.sin(angle)]);
  left.position.set(-span/2,.80,z-.08*Math.sin(angle));left.rotation.y=-angle;
  right.position.set(span/2,.80,z-.08*Math.sin(angle));right.rotation.y=angle;
  doll.head.rotation.set(.12+.12*fold,0,-.03*fold);
 };
}
