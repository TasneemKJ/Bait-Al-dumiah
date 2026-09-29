import {dollFabric} from './doll-couture.js';
import * as T from 'three';
import {shapeMouth} from './doll-expression.js';
import {ball,ring} from './primitives.js';
import {craftMaterial} from './textiles.js';
const rotation=new T.Quaternion();
export function createArm(parent,sign,def,skin){
 const arm=new T.Group();arm.name='upper-arm';arm.position.set(sign*.19,.73,0);parent.add(arm);
 ball(arm,0,-.052,0,.073,.095,.075,dollFabric(def.id));
 const elbow=ball(arm,0,-.132,0,.044,.043,.044,skin);elbow.name='bisque-elbow';
 const forearm=new T.Group();forearm.name='articulated-forearm';forearm.userData.noBatch=true;forearm.position.set(0,-.132,0);arm.add(forearm);arm.forearm=forearm;
 ball(forearm,0,-.051,0,.047,.068,.043,skin);ring(forearm,0,-.096,0,.04,.005,0xe6d3bc,true);
 const hand=new T.Group();hand.name='articulated-hand';hand.userData.noBatch=true;hand.position.set(0,-.129,.01);forearm.add(hand);arm.hand=hand;
 const palm=ball(hand,0,.004,0,.039,.037,.027,skin);palm.name='porcelain-palm';
 for(let i=0;i<4;i++){const length=[.012,.016,.014,.010][i],finger=new T.Mesh(new T.CapsuleGeometry(.009,length,3,8),skin);finger.name='porcelain-finger';finger.position.set(-.0225+i*.015,-.028-length/2,0);finger.castShadow=true;hand.add(finger)}
 const thumb=ball(hand,-sign*.030,.008,.006,.015,.026,.013,skin);thumb.name='porcelain-thumb';thumb.rotation.z=-sign*.38;
 arm.rotation.z=sign*.19;return arm;
}
const cupForward=new T.Vector3(),cupPoint=new T.Vector3();
export function levelCup(doll){
 doll.root.updateMatrixWorld(true);
 // Wrist rotation must change neither gravity nor the cup's grip offset.
 doll.body.getWorldQuaternion(rotation);cupForward.set(0,0,1).applyQuaternion(rotation);cupForward.y=0;cupForward.normalize().multiplyScalar(.075);
 doll.tea.parent.getWorldPosition(cupPoint);cupPoint.add(cupForward);cupPoint.y-=.018;
 doll.tea.position.copy(doll.tea.parent.worldToLocal(cupPoint));
 doll.tea.parent.getWorldQuaternion(rotation);doll.tea.quaternion.copy(rotation).invert();
}

export function balanceWalk(v,d,t,index,motion){
 const strength=motion&&d.action==='idle'?Math.min(1,(v.walkSpeed||0)*15):0;
 v.body.rotation.y=Math.sin(t*3.2+index)*.024*strength;
 if(d.action==='idle')v.arms.forEach((arm,j)=>arm.rotation.x=-Math.sin(t*3.2+index+j*Math.PI)*.13*strength);
}

export function gaze(v,selected,yaw,motion,dt){
 const target=motion&&selected===v.id?T.MathUtils.clamp(Number.isFinite(yaw)?yaw:0,-.35,.35)*.014:0;
 for(const eye of v.eyes)eye.iris.position.x=motion?T.MathUtils.damp(eye.iris.position.x,target,8,dt):0;
}

export function express(v,d,still,dt){
 const mood=d.action==='rest'?'sleepy':d.action==='play'?'delighted':d.action==='soothe'?'comforted':d.action==='tea'?'content':d.energy<32?'sleepy':Math.min(d.comfort,d.hunger)<25?'worried':'content';
 v.expression=mood;shapeMouth(v.mouth,mood,dt,still);
 const brow=mood==='worried'?.10:mood==='sleepy'?-.09:mood==='delighted'?-.13:0;
 v.brows.forEach((b,i)=>{const z=(i===0?-1:1)*brow;b.rotation.z=still?z:T.MathUtils.damp(b.rotation.z,z,8,dt);b.position.y=mood==='delighted'?.092:.082});
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
 if(d.action==='play'){
  const age=Math.max(0,t-(Number.isFinite(d.lastCare)?d.lastCare:0)),gap=still?.045:.018+.052*(.5+.5*Math.cos(age*Math.PI*3.2));
  v.arms.forEach((arm,i)=>{const sign=i===0?-1:1;aimArm(arm,[sign*gap,.763,.171]);const parent=arm.quaternion.clone().multiply(arm.forearm.quaternion);arm.hand.quaternion.copy(parent.invert()).multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),-sign*Math.PI/2))});
 }
 if(d.action==='rest'){
  aimArm(v.arms[1],[.163,.902,.095]);aimArm(v.arms[0],[-.080,.705,.163]);
  v.head.rotation.x=.23;v.head.rotation.z=.16;v.body.position.y=still?0:.006+Math.sin(t*1.05)*.003;v.body.scale.y=still?1:1+Math.sin(t*1.05)*.004;
 }
 if(d.action==='soothe'){aimArm(v.arms[0],[-.067,.724,.181]);aimArm(v.arms[1],[.067,.714,.189]);v.head.rotation.x=.09+(still?0:Math.sin(t*1.2)*.012)}
 if(d.action==='tea'){
  const age=Math.max(0,t-(Number.isFinite(d.lastCare)?d.lastCare:t)),lift=still?1:age<.85?smooth(age/.85):age<=2.55?1:1-smooth((age-2.55)/1.30);
  v.teaPhase=lift;aimArm(v.arms[1],[.08,.811,.214],lift);aimArm(v.arms[0],[-.030,.778,.185],lift);v.head.rotation.x=.28*lift;
  v.arms.forEach((arm,i)=>{const parent=arm.quaternion.clone().multiply(arm.forearm.quaternion),palm=new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),i===0?-Math.PI/2:-.35);arm.hand.quaternion.slerp(parent.invert().multiply(palm),lift)});
 }
}

export function greeting(v,d,t,still){
 v.greeting=false;if(still||d.action!=='idle')return;
 const age=t-(v.greetedAt??-Infinity);if(age<0||age>1.65)return;
 const weight=smooth(age/.22)*(1-smooth((age-1.25)/.40));v.greeting=weight>.01;
 aimArm(v.arms[1],[.327,.914,.048],weight);v.arms[1].hand.rotation.z=Math.sin(age*12)*.22*weight;
}

export function nightCuriosity(v,d,state,index,still){
 v.curiosity=0;if(still||state.clock<120||d.action!=='idle'||v.greeting)return;
 const phase=((state.elapsed+index*3.7)%16+16)%16;
 const glance=.145*smooth((phase-9.8)/.6)*(1-smooth((phase-11.4)/.8));
 v.curiosity=glance;v.head.rotation.y+=glance*(index%2?-1:1);
 if(glance>.01&&v.expression==='content'){v.brows[0].position.y+=glance*.04;v.expression='curious'}
}

export function hairFollow(v,t,still,dt){
 v.hairStyle.tails.forEach((tail,i)=>{const z=still?0:T.MathUtils.clamp(-v.head.rotation.z*.60+Math.sin(t*1.9+i)*.016,-.075,.075),x=still?0:T.MathUtils.clamp(-v.head.rotation.y*.13,-.055,.055);tail.rotation.z=still?0:T.MathUtils.damp(tail.rotation.z,z,5,dt);tail.rotation.x=still?0:T.MathUtils.damp(tail.rotation.x,x,5,dt)});
 v.hairStyle.bows.forEach((bow,i)=>{bow.rotation.x=still?0:Math.sin(t*1.35+i)*.035});
}

export function clothFollow(v,d,t,still,dt){
 if(!v.skirt)return;const strength=still?0:d.action==='play'?1:Math.min(.55,(v.walkSpeed||0)*10+.10);
 const target=Math.sin(t*2.3)*.037*strength;v.skirt.rotation.z=still?0:T.MathUtils.damp(v.skirt.rotation.z,target,6,dt);v.skirt.rotation.x=still?0:Math.sin(t*1.4)*.016*strength;
}
