import * as T from 'three';
import {craftMaterial} from './textiles.js';
const materials=new Map();
export function cloth(color){
 if(!materials.has(color)){const m=craftMaterial(color).clone();m.side=T.DoubleSide;
 m.userData.shared=true;materials.set(color,m)}
 return materials.get(color);
}
export function pleatedShade(parent,x,y,z,radius=.36,height=.38,color=0xecd1aa){
 const profile=[new T.Vector2(radius,-height/2),new T.Vector2(radius*.985,-height*.46),
   new T.Vector2(radius*.62,height*.46),new T.Vector2(radius*.61,height/2)];
 const geometry=new T.LatheGeometry(profile,48),p=geometry.attributes.position;
 for(let i=0;i<p.count;i++){const a=Math.atan2(p.getZ(i),p.getX(i)),
   r=1+Math.cos(a*24)*.026;p.setX(i,p.getX(i)*r);p.setZ(i,p.getZ(i)*r)}
 geometry.computeVertexNormals();const mesh=new T.Mesh(geometry,cloth(color));
 mesh.position.set(x,y,z);mesh.name='pleated-lampshade';
 mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
}
export function drapedCurtain(parent,x,y,z,side=1){
 const geometry=new T.PlaneGeometry(.32,1.45,14,18),p=geometry.attributes.position,uv=geometry.attributes.uv;
 for(let i=0;i<p.count;i++){
  const u=uv.getX(i),v=uv.getY(i),tie=Math.pow(Math.sin(v*Math.PI),2);
  p.setX(i,p.getX(i)+side*.10*tie);
  p.setZ(i,.048*Math.cos(u*Math.PI*8)*(1-tie*.48)+.045*Math.sin(v*Math.PI));
  p.setY(i,p.getY(i)-.025*Math.sin(u*Math.PI*4)*(1-v));
 }
 geometry.computeVertexNormals();const mesh=new T.Mesh(geometry,cloth(0xeed8c6));
 mesh.position.set(x,y,z);mesh.name='draped-curtain';
 mesh.userData.noBatch=true;mesh.userData.curtainSide=side;mesh.castShadow=true;
 mesh.receiveShadow=true;parent.add(mesh);return mesh;
}
export function valance(parent,x,y,z){
 const shape=new T.Shape();shape.moveTo(-.76,.10);shape.lineTo(.76,.10);shape.lineTo(.76,-.02);
 for(let i=0;i<5;i++){const a=.76-i*.304;shape.quadraticCurveTo(a-.152,-.20,a-.304,-.02)}shape.closePath();
 const mesh=new T.Mesh(new T.ShapeGeometry(shape,10),cloth(0xe5c4b2));
 mesh.position.set(x,y,z);mesh.name='scalloped-window-valance';
 mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
}
let laceMap=null;
export function doily(parent,x,y,z,width=.68){
 if(!laceMap){
  const image=document.createElement('canvas');image.width=image.height=256;
  const c=image.getContext('2d');c.strokeStyle='#ead8b9';c.lineWidth=2;
  for(const r of [20,28,46,52,75,84,105]){c.beginPath();c.arc(128,128,r,0,Math.PI*2);c.stroke()}
  for(let i=0;i<24;i++){const a=i*Math.PI/12;c.save();c.translate(128,128);c.rotate(a);
  c.beginPath();c.ellipse(0,93,9,22,0,0,Math.PI*2);c.stroke();
  c.beginPath();c.moveTo(0,30);c.lineTo(0,83);c.stroke();c.restore()}
  laceMap=new T.CanvasTexture(image);laceMap.colorSpace=T.SRGBColorSpace;laceMap.userData.shared=true;
 }
 const material=new T.MeshStandardMaterial({map:laceMap,transparent:true,depthWrite:false,
   roughness:1,side:T.DoubleSide});
 const mesh=new T.Mesh(new T.PlaneGeometry(width,width),material);mesh.name='lace-doily';
 mesh.position.set(x,y,z);mesh.rotation.x=-Math.PI/2;mesh.receiveShadow=true;parent.add(mesh);return mesh;
}
let scallopGeometry=null;
export function eaveScallop(parent,x,y,z,angle){
 if(!scallopGeometry){const s=new T.Shape();s.moveTo(-.10,.10);s.lineTo(.10,.10);
 s.lineTo(.10,0);s.absarc(0,0,.10,0,-Math.PI,true);s.closePath();
 scallopGeometry=new T.ExtrudeGeometry(s,{depth:.045,bevelEnabled:true,bevelSize:.006,
   bevelThickness:.005,bevelSegments:1,curveSegments:7})}
 const mesh=new T.Mesh(scallopGeometry,cloth(0xdcc2a6));mesh.name='carved-eave-scallop';
 mesh.position.set(x,y,z);mesh.rotation.z=angle;
 mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
}
