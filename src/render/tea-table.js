import * as T from 'three';
import {ROOMS,TEA_TABLE} from '../content.js';
import {teaStatus} from '../simulation.js';
import {mat,glaze,palette as P,batch} from './primitives.js';
import {softTexture} from './textiles.js';

const amber=new T.MeshPhysicalMaterial({color:0x9f5424,roughness:.24,clearcoat:.28,metalness:0});
const spillMaterial=new T.MeshBasicMaterial({map:softTexture(),color:0x7d3f22,transparent:true,opacity:.65,depthWrite:false});
const innerBottom=.024,liquidSpan=.19;
const fillY=fill=>innerBottom+Math.max(0,Math.min(1,fill))*liquidSpan;
function mesh(parent,geometry,material,position=[0,0,0]){const o=new T.Mesh(geometry,material);o.position.fromArray(position);o.castShadow=false;o.receiveShadow=true;parent.add(o);return o}
function torus(parent,r,tube,material,position,flat=false){const o=mesh(parent,new T.TorusGeometry(r,tube,4,20),material,position);if(flat)o.rotation.x=-Math.PI/2;return o}
function cylinder(parent,r,h,material,position){return mesh(parent,new T.CylinderGeometry(r,r,h,16),material,position)}
function group(parent,name){const o=new T.Group();o.name=name;o.userData.noBatch=true;parent.add(o);return o}

export function createTeaTable(parent){
 const root=new T.Group();root.name='physical-tea-table';root.visible=false;const room=ROOMS.find(r=>r.id===TEA_TABLE.room);root.position.set(room.x+TEA_TABLE.x,room.y+TEA_TABLE.y,TEA_TABLE.z);parent.add(root);
 const brass=mat(P.gold),cream=glaze(P.cream),mint=glaze(P.mint);
 const tray=group(root,'tea-serving-tray');
 const trayShape=new T.Shape();trayShape.absellipse(0,0,.525,.25,0,Math.PI*2,false,0);
 const plate=mesh(tray,new T.ExtrudeGeometry(trayShape,{depth:.012,bevelEnabled:false,curveSegments:20}),brass,[0,.014,.18]);plate.rotation.x=-Math.PI/2;
 const lip=torus(tray,.51,.009,brass,[0,.029,.18],true);lip.scale.y=.49;
 // A projecting brass handle is a distinct serving affordance in front of cups.
 const tab=mesh(tray,new T.BoxGeometry(.64,.018,.20),brass,[0,.024,.42]);
 const insert=mesh(tray,new T.PlaneGeometry(.88,.32),mat(P.mint),[0,.028,.16]);insert.rotation.x=-Math.PI/2;
 batch(tray);
 const cupViews=[];
 for(let i=0;i<3;i++){
  const cup=group(root,`tea-cup-${i}`);
  const r=TEA_TABLE.cupOuterRadius,inner=TEA_TABLE.cupRadius,h=TEA_TABLE.cupHeight;
  const profile=[[.09,0],[.105,.015],[r,h-.02],[r,h],[inner,h],[inner-.008,.03],[.08,.018],[0,.018]].map(([x,y])=>new T.Vector2(x,y));
  const vessel=mesh(cup,new T.LatheGeometry(profile,20),cream);vessel.name='tea-open-cup';
  const handle=torus(cup,.058,.010,brass,[i===0?-.16:.16,.13,0]);handle.scale.y=1.18;
  torus(cup,r-.004,.006,brass,[0,h-.006,0],true);
  // A second interior engraving remains legible where the surface meets it.
  const band=torus(cup,inner-.005,.0028,brass.clone(),[0,fillY(.7),0],true);band.name='tea-target-band';
  const liquid=cylinder(cup,inner-.009,.008,amber,[0,fillY(0)-.004,0]);liquid.name='tea-liquid-surface';
  cupViews.push({root:cup,vessel,band,liquid,handle});
 }
 const pot=group(root,'tea-aiming-pot');
 const body=mesh(pot,new T.LatheGeometry([new T.Vector2(.08,-.13),new T.Vector2(.145,-.11),new T.Vector2(.16,-.02),new T.Vector2(.145,.105),new T.Vector2(.105,.14)],20),mint);
 cylinder(pot,.11,.018,mint,[0,.145,0]);torus(pot,.108,.006,brass,[0,.155,0],true);
 cylinder(pot,.025,.030,brass,[0,.17,0]);
 const handle=torus(pot,.074,.010,brass,[-.17,.005,-.015]);handle.rotation.y=.55;
 const tipOffset=new T.Vector3(.22,.035,0),spoutCurve=new T.CatmullRomCurve3([new T.Vector3(.13,.02,0),new T.Vector3(.18,.025,0),tipOffset]);
 mesh(pot,new T.TubeGeometry(spoutCurve,6,.025,6,false),brass);
 const motif=mesh(pot,new T.CircleGeometry(.033,5),cream,[0,.015,.153]);motif.rotation.z=.18;
 batch(pot);
 const spout=new T.Object3D();spout.name='tea-spout-anchor';spout.position.copy(tipOffset);pot.add(spout);
 const stream=mesh(root,new T.CylinderGeometry(.007,.012,1,8),amber);stream.name='tea-pouring-stream';stream.visible=false;stream.receiveShadow=false;
 const spill=mesh(root,new T.PlaneGeometry(.54,.30),spillMaterial,[.10,.035,.23]);spill.rotation.x=-Math.PI/2;spill.name='tea-spill-patch';spill.receiveShadow=false;
 const servedGlow=mesh(root,new T.PlaneGeometry(1.04,.55),new T.MeshBasicMaterial({map:softTexture(),color:0xf7cd8c,transparent:true,opacity:.22,depthWrite:false,blending:T.AdditiveBlending}),[0,.006,.24]);servedGlow.rotation.x=-Math.PI/2;servedGlow.receiveShadow=false;
 const hitMaterial=new T.MeshBasicMaterial({visible:false}),targets=[];
 function hit(parent,key,size,position){const target=mesh(parent,new T.BoxGeometry(...size),hitMaterial,position);target.name=`tea-hit-${key}`;target.userData.tea=key;targets.push(target);return target}
 const potHit=hit(pot,'pot',[.36,.39,.32],[0,.035,0]);
 const cupHits=cupViews.map((v,i)=>hit(v.root,`cup:${i}`,[.30,.29,.30],[0,.13,0]));
 const trayHit=hit(root,'tray',[.92,.14,.28],[0,.078,.42]);
 let actual={active:false,served:false,pot:null,stream:{visible:false,start:[0,0,0],end:[0,0,0]},cups:[],spillVisible:false};
 function localPoint(o){root.updateWorldMatrix(true,true);return root.worldToLocal(o.getWorldPosition(new T.Vector3()))}
 return {root,targets,update(state){
  const tea=teaStatus(state);root.visible=Boolean(tea);if(!tea){stream.visible=false;actual={...actual,active:false,served:false,cups:[],spillVisible:false,stream:{...actual.stream,visible:false}};return}
  const served=tea.phase==='served',tilt=served?0:tea.tilt*.75;pot.rotation.z=-tilt;
  const aimPoint=new T.Vector3(tea.aim*TEA_TABLE.aimSpan,.48,TEA_TABLE.cupZ),rotated=tipOffset.clone().applyQuaternion(pot.quaternion);pot.position.copy(aimPoint).sub(rotated);
  cupViews.forEach((v,i)=>{const c=tea.cups[i];v.root.visible=Boolean(c);cupHits[i].visible=Boolean(c);if(!c)return;v.root.position.set(c.x,0,TEA_TABLE.cupZ);v.band.position.y=fillY(c.target);v.liquid.position.y=fillY(c.fill)-.004;v.liquid.visible=c.fill>0;v.band.material.color.set(c.ready?0xc9b57a:P.gold)});
  const start=localPoint(spout),cup=tea.cups.find(c=>c.id===tea.aimedCup),surface=cup?fillY(cup.fill):.035,end=new T.Vector3(start.x,surface,start.z);
  stream.visible=!served&&tea.flow>0;const length=start.distanceTo(end);stream.position.copy(start).add(end).multiplyScalar(.5);stream.scale.y=length;
  spill.visible=tea.spills>0;spill.scale.setScalar(Math.min(1.2,.35+tea.spills*.7));servedGlow.visible=served;
  potHit.visible=true;trayHit.visible=true;
  actual={active:true,served,pot:{position:pot.position.toArray(),rotation:pot.rotation.z,spout:start.toArray()},stream:{visible:stream.visible,start:start.toArray(),end:end.toArray()},cups:tea.cups.map((c,i)=>({id:c.id,x:cupViews[i].root.position.x,surfaceY:cupViews[i].liquid.position.y+.004,bandY:cupViews[i].band.position.y,visible:cupViews[i].root.visible})),spillVisible:spill.visible};
 },status(){return structuredClone(actual)},points(){if(!root.visible)return [];root.updateWorldMatrix(true,true);const result=targets.filter(t=>t.visible).map(t=>({key:t.userData.tea,local:localPoint(t).toArray(),world:t.getWorldPosition(new T.Vector3()).toArray()}));result.push({key:'spout',local:localPoint(spout).toArray(),world:spout.getWorldPosition(new T.Vector3()).toArray()});return result}};
}
