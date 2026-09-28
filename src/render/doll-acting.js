import * as T from 'three';
import {ball,ring} from './primitives.js';
import {craftMaterial} from './textiles.js';
const rotation=new T.Quaternion();
export function createArm(parent,sign,def,skin){
 const arm=new T.Group();arm.name='upper-arm';arm.position.set(sign*.19,.73,0);parent.add(arm);
 ball(arm,0,-.052,0,.073,.095,.075,craftMaterial(def.color));
 const elbow=ball(arm,0,-.132,0,.044,.043,.044,skin);elbow.name='bisque-elbow';
 const forearm=new T.Group();forearm.name='articulated-forearm';forearm.userData.noBatch=true;forearm.position.set(0,-.132,0);arm.add(forearm);arm.forearm=forearm;
 ball(forearm,0,-.051,0,.038,.068,.038,skin);ring(forearm,0,-.096,0,.04,.005,0xe6d3bc,true);
 const hand=new T.Group();hand.name='articulated-hand';hand.userData.noBatch=true;hand.position.set(0,-.129,.01);forearm.add(hand);arm.hand=hand;
 const palm=ball(hand,0,-.006,0,.039,.048,.021,skin);palm.name='porcelain-palm';
 const thumb=ball(hand,-sign*.030,.008,.006,.015,.026,.013,skin);thumb.name='porcelain-thumb';thumb.rotation.z=-sign*.38;
 arm.rotation.z=sign*.19;return arm;
}
export function levelCup(doll){doll.root.updateMatrixWorld(true);doll.tea.parent.getWorldQuaternion(rotation);doll.tea.quaternion.copy(rotation).invert()}

export function balanceWalk(v,d,t,index,motion){
 const strength=motion&&d.action==='idle'?Math.min(1,(v.walkSpeed||0)*15):0;
 v.body.rotation.y=Math.sin(t*3.2+index)*.024*strength;
 if(d.action==='idle')v.arms.forEach((arm,j)=>arm.rotation.x=-Math.sin(t*3.2+index+j*Math.PI)*.13*strength);
}

export function gaze(v,selected,yaw,motion,dt){
 const target=motion&&selected===v.id?T.MathUtils.clamp(Number.isFinite(yaw)?yaw:0,-.35,.35)*.032:0;
 for(const eye of v.eyes)eye.iris.position.x=motion?T.MathUtils.damp(eye.iris.position.x,target,8,dt):0;
}

export function express(v,d,still,dt){
 const mood=d.action==='rest'||d.energy<32?'sleepy':d.action==='play'?'delighted':d.action==='soothe'?'comforted':Math.min(d.comfort,d.hunger)<25?'worried':'content';
 v.expression=mood;
 const brow=mood==='worried'?.19:mood==='sleepy'?-.09:mood==='delighted'?-.13:0;
 v.brows.forEach((b,i)=>{const z=(i===0?-1:1)*brow;b.rotation.z=still?z:T.MathUtils.damp(b.rotation.z,z,8,dt);b.position.y=mood==='delighted'?.103:.091});
 const width=mood==='worried'?.79:mood==='delighted'?1.18:mood==='sleepy'?.90:1.03;
 v.mouth.scale.x=still?width:T.MathUtils.damp(v.mouth.scale.x,width,8,dt);
 v.mouth.scale.y=mood==='delighted'?1.12:mood==='sleepy'?.84:1;
}

const down=new T.Vector3(0,-1,0),forearmAxis=new T.Vector3(0,-.129,.01).normalize();
// Solve a two-link arm in body-local coordinates, preserving the wrist hierarchy.
function aimArm(arm,target,weight=1){
 const shoulder=arm.position,delta=new T.Vector3(...target).sub(shoulder),l1=.132,l2=Math.hypot(.129,.01),distance=T.MathUtils.clamp(delta.length(),.01,l1+l2-.001);
 const direction=delta.normalize(),pole=new T.Vector3(Math.sign(shoulder.x)*.3,-.22,-.01);pole.addScaledVector(direction,-pole.dot(direction)).normalize();
 const along=(l1*l1-l2*l2+distance*distance)/(2*distance),height=Math.sqrt(Math.max(0,l1*l1-along*along));
 const elbow=direction.clone().multiplyScalar(along).addScaledVector(pole,height),upper=new T.Quaternion().setFromUnitVectors(down,elbow.clone().normalize());
 const lower=direction.clone().multiplyScalar(distance).sub(elbow).normalize().applyQuaternion(upper.clone().invert());
 const bend=new T.Quaternion().setFromUnitVectors(forearmAxis,lower);
 arm.quaternion.slerp(upper,weight);arm.forearm.quaternion.slerp(bend,weight);
}
const smooth=x=>{x=T.MathUtils.clamp(x,0,1);return x*x*(3-2*x)};
export function carePose(v,d,t,still){
 for(const arm of v.arms){arm.forearm.rotation.set(0,0,0);arm.hand.rotation.set(0,0,0)}
 v.teaPhase=0;v.body.scale.y=1;
 if(d.action==='rest'){
  aimArm(v.arms[1],[.163,.902,.095]);aimArm(v.arms[0],[-.080,.705,.163]);
  v.head.rotation.x=.23;v.head.rotation.z=.16;v.body.position.y=still?0:.006+Math.sin(t*1.05)*.003;v.body.scale.y=still?1:1+Math.sin(t*1.05)*.004;
 }
 if(d.action==='soothe'){aimArm(v.arms[0],[-.067,.724,.181]);aimArm(v.arms[1],[.067,.714,.189]);v.head.rotation.x=.09+(still?0:Math.sin(t*1.2)*.012)}
 if(d.action==='tea'){
  const age=Math.max(0,t-(Number.isFinite(d.lastCare)?d.lastCare:t)),lift=still?1:age<.85?smooth(age/.85):age<=2.55?1:1-smooth((age-2.55)/1.30);
  v.teaPhase=lift;aimArm(v.arms[1],[.075,.820,.198],lift);aimArm(v.arms[0],[-.055,.790,.205],lift);v.head.rotation.x=.18*lift;
 }
}
