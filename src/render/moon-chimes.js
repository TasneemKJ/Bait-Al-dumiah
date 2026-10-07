import * as T from 'three';
import {ROOMS} from '../content.js';
import {chimeStatus} from '../simulation.js';
import {batch,texture} from './primitives.js';

export const CHIME_LAYOUT={z:1.35,y:.20,pull:.44,diameter:.66,x:[-1.05,-.35,.35,1.05]};
function add(parent,geometry,material,position,name=''){
 const mesh=new T.Mesh(geometry,material);mesh.position.fromArray(position);mesh.name=name;mesh.castShadow=false;mesh.receiveShadow=true;parent.add(mesh);return mesh;
}
function starShape(radius=.30){const shape=new T.Shape();for(let i=0;i<10;i++){const a=Math.PI/2+i*Math.PI/5,r=i%2?radius*.46:radius;
const x=Math.cos(a)*r,y=Math.sin(a)*r;i?shape.lineTo(x,y):shape.moveTo(x,y)}shape.closePath();return shape}
function heartShape(){const s=new T.Shape();s.moveTo(0,-.29);s.bezierCurveTo(-.64,.13,-.22,.48,0,.22);s.bezierCurveTo(.22,.48,.64,.13,0,-.29);return s}
function moonShape(){const s=new T.Shape();s.absarc(0,0,.29,.67,Math.PI*2-.67,false);s.absarc(.13,0,.245,Math.PI*2-.67,.67,true);s.closePath();return s}
const relief=shape=>new T.ExtrudeGeometry(shape,{depth:.065,bevelEnabled:true,bevelSize:.018,bevelThickness:.012,bevelSegments:2,steps:1,curveSegments:20});

export function createMoonChimes(parent){
 const room=ROOMS.find(r=>r.id==='bedroom'),root=new T.Group();root.name='moon-chime-instrument';root.position.set(room.x,room.y+CHIME_LAYOUT.y,CHIME_LAYOUT.z);root.visible=false;parent.add(root);
 const brass=new T.MeshStandardMaterial({color:0xb99151,metalness:.55,roughness:.33});
 const wood=new T.MeshStandardMaterial({color:0x76574f,roughness:.77});
 const silk=new T.MeshStandardMaterial({color:0xffffff,map:texture('fabric',['#e7ceaa','#b99877']),roughness:.9});
 const frame=new T.Group();frame.name='chime-carved-arch';root.add(frame);
 const arch=new T.CatmullRomCurve3([new T.Vector3(-1.46,.11,0),new T.Vector3(-1.46,1.88,0),new T.Vector3(-1.13,2.34,0),new T.Vector3(0,2.50,0),
   new T.Vector3(1.13,2.34,0),new T.Vector3(1.46,1.88,0),new T.Vector3(1.46,.11,0)]);
 add(frame,new T.TubeGeometry(arch,48,.035,8,false),wood,[0,0,0]);
 for(const x of [-1.46,1.46]){add(frame,new T.SphereGeometry(.065,12,8),brass,[x,.16,0]);add(frame,new T.BoxGeometry(.22,.07,.25),wood,[x,.07,0])}
 for(const x of [-1.05,-.70,0,.70,1.05]){const y=2.35-Math.abs(x)*.16;const jewel=add(frame,new T.SphereGeometry(.032,10,6),brass,[x,y,.02]);jewel.scale.y=1.8}
 batch(frame);
 const colors=[0xe7c989,0x95b7b3,0xeedac5,0xc78e91],charms=[],targets=[];
 for(let id=0;id<4;id++){
  const x=CHIME_LAYOUT.x[id],rest=1.16+(id%2?.04:0),top=2.30-Math.abs(x)*.15;
  const material=new T.MeshStandardMaterial({color:colors[id],emissive:colors[id],emissiveIntensity:.05,roughness:.39,metalness:.15});
  const string=add(root,new T.CylinderGeometry(.012,.012,1,8),silk,[x,0,0],`chime-string-${id}`);
  const charm=new T.Group();charm.name=`chime-charm-${id}`;charm.position.set(x,rest,0);root.add(charm);
  if(id===2){
   const petals=new T.Group();charm.add(petals);
   for(let k=0;k<5;k++){const a=k*Math.PI*2/5,petal=add(petals,new T.SphereGeometry(.12,14,9),material,[Math.sin(a)*.18,Math.cos(a)*.18,.025]);petal.scale.set(.8,1.24,.34);petal.rotation.z=-a}
   add(petals,new T.SphereGeometry(.085,12,8),brass,[0,0,.05]);batch(petals);
  }else add(charm,relief(id===0?moonShape():id===1?starShape():heartShape()),material,[0,0,0],`chime-silhouette-${id}`);
  const crown=add(charm,new T.TorusGeometry(.036,.010,6,16),brass,[0,.34,.025]);
  const clapper=add(charm,new T.SphereGeometry(.038,12,8),brass,[0,-.35,.035]);
  const halo=add(root,new T.RingGeometry(.32,.35,48),new T.MeshBasicMaterial({color:0xffe3aa,transparent:true,opacity:0,depthWrite:false}),[x,rest,-.07],`chime-note-halo-${id}`);
  const hit=add(charm,new T.SphereGeometry(CHIME_LAYOUT.diameter/2,12,8),new T.MeshBasicMaterial({visible:false}),[0,0,.035],`chime-grab-${id}`);hit.userData.chime=id;targets.push(hit);
  charms.push({charm,string,material,halo,hit,rest,top,clapper,crown});
 }
 const winder=new T.Group();winder.name='chime-wind-up-moon';winder.position.set(0,2.13,.09);root.add(winder);
 const dial=add(winder,new T.CylinderGeometry(.31,.31,.08,32),brass,[0,0,0]);dial.rotation.x=Math.PI/2;dial.userData.chime='moon';targets.push(dial);
 const inset=add(winder,relief(moonShape()),new T.MeshStandardMaterial({color:0xeee0bb,emissive:0xe7c784,emissiveIntensity:.18,roughness:.6}),[0,0,.05]);inset.scale.setScalar(.60);
 const light=new T.PointLight(0xffd7a3,0,3.6,2);light.name='chime-practical-light';light.position.set(0,1.68,.40);root.add(light);
 // This earned object stays in the bedroom after leaving the instrument.
 const constellation=new T.Group();constellation.name='earned-moon-constellation';constellation.position.set(room.x,room.y+2.30,-.95);parent.add(constellation);
 const stars=[];for(let i=0;i<4;i++){
  const star=add(constellation,relief(starShape(.095)),new T.MeshStandardMaterial({color:0xe4c28e,emissive:0xc4a168,emissiveIntensity:.2,
    roughness:.6}),[(i-1.5)*.32,Math.sin(i*Math.PI/3)*.07,0],`earned-moon-star-${i}`);stars.push(star);
 }
 let view={active:false};
 return {root,targets,constellation,update(state,selected=-1){
  const a=chimeStatus(state),earned=[1,3,6,9].filter(n=>state.activities.mastery.lullaby>=n).length;
  stars.forEach((star,i)=>star.visible=i<earned);constellation.visible=earned>0&&!a;
  root.visible=Boolean(a);if(!a){view={active:false,earnedStars:earned};return}
  const finished=a.phase==='finished',still=state.settings.reducedMotion;
  for(let i=0;i<charms.length;i++){
   const c=charms[i],held=a.held===i,y=c.rest-(held?a.pull*CHIME_LAYOUT.pull:0),lit=a.sounding===i||finished;
   c.charm.position.y=y;c.string.scale.y=Math.max(.01,c.top-y-.34);c.string.position.set(CHIME_LAYOUT.x[i],(c.top+y+.34)/2,0);
   const age=Math.max(0,state.elapsed-a.lastPluck),ring=a.lastTone===i&&age<1;
   c.charm.rotation.z=still?0:ring?Math.sin(age*17)*Math.exp(-age*4)*.12:0;
   c.material.emissiveIntensity=lit?.55:held?.20:.05;c.halo.material.opacity=lit?.70:held?.32:a.phase==='echo'&&selected===i?.38:0;c.halo.position.y=y;
  }
  winder.rotation.z=still?0:a.phase==='listen'?Math.sin(a.listenTime*2)*.055:0;
  light.intensity=finished?.9:.36;
  view={active:true,phase:a.phase,held:a.held,pull:a.pull,sounding:a.sounding,earnedStars:earned,allLit:finished,
    turns:charms.map(c=>c.charm.rotation.z),centers:charms.map(c=>c.charm.position.toArray())};
 },points(){if(!root.visible)return [];root.updateWorldMatrix(true,true);
 return targets.map(t=>({key:t.userData.chime,world:t.getWorldPosition(new T.Vector3()).toArray()}))},status(){return structuredClone(view)}};
}
