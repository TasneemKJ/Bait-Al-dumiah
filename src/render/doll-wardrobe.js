import {gridSurface,closeSurfaceSeam,bellRadius,dollFabric} from './doll-couture.js';
import * as T from 'three';
import {mat,box,ball,cylinder,ring,batch} from './primitives.js';
import {craftMaterial,reliefTexture} from './textiles.js';
import {crescentGeometry} from './resident-effects.js';
const cloth=new Map();
function embroideredLinen(id){
 if(cloth.has(id))return cloth.get(id);
 const image=document.createElement('canvas');image.width=256;image.height=384;const c=image.getContext('2d');
 const base=id==='noor'?'#e3e7d9':'#f2dfc8',thread=id==='noor'?'#769a94':'#b5687d';
 c.fillStyle=base;c.fillRect(0,0,256,384);
 c.globalAlpha=.12;c.strokeStyle='#ae9584';c.lineWidth=.6;
 for(let y=0;y<384;y+=3){c.beginPath();c.moveTo(0,y);c.lineTo(256,y);c.stroke()}
 c.globalAlpha=1;c.strokeStyle=thread;c.lineWidth=1.7;c.setLineDash([2,4]);
 c.beginPath();c.moveTo(14,0);c.lineTo(14,353);c.quadraticCurveTo(128,371,242,353);c.lineTo(242,0);c.stroke();c.setLineDash([]);
 c.fillStyle=thread;c.fillRect(6,110,244,8);c.strokeStyle='#f8ead7';c.lineWidth=1;c.setLineDash([2,3]);c.strokeRect(7,111,242,6);c.setLineDash([]);
 const flower=(x,y,r)=>{c.fillStyle=id==='noor'?'#f5efdd':'#d4929f';for(let k=0;k<6;k++){const a=k*Math.PI/3;c.beginPath();c.ellipse(x+Math.sin(a)*r*.6,y+Math.cos(a)*r*.6,r*.32,r*.62,-a,0,Math.PI*2);c.fill()}c.fillStyle='#c29a53';c.beginPath();c.arc(x,y,r*.24,0,Math.PI*2);c.fill()};
 for(let i=0;i<7;i++){
  const x=30+i*33,y=314+Math.cos(i*.95)*9;c.strokeStyle='#799786';c.lineWidth=1.8;
  c.beginPath();c.moveTo(x,y+24);c.quadraticCurveTo(x-9,y+6,x,y-10);c.stroke();
  for(const sign of [-1,1]){c.fillStyle='#88a38b';c.beginPath();c.ellipse(x+sign*6,y+12,7,2.6,-sign*.7,0,Math.PI*2);c.fill()}
  flower(x,y,8);flower(x-4,y-15,5);
 }
 if(id==='noor'){
  c.fillStyle='#c5a463';c.beginPath();c.arc(128,59,23,0,Math.PI*2);c.fill();c.fillStyle=base;c.beginPath();c.arc(139,51,22,0,Math.PI*2);c.fill();
  for(const [x,y] of [[95,47],[152,77],[108,89]]){c.fillStyle='#bca471';c.beginPath();c.moveTo(x,y-5);c.lineTo(x+2,y-1);c.lineTo(x+5,y);c.lineTo(x+2,y+2);c.lineTo(x,y+5);c.lineTo(x-2,y+1);c.lineTo(x-5,y);c.lineTo(x-2,y-2);c.closePath();c.fill()}
 }else{flower(128,52,14);flower(113,77,7);flower(145,78,8);c.strokeStyle='#799786';c.beginPath();c.moveTo(128,96);c.quadraticCurveTo(128,76,128,52);c.stroke()}
 const map=new T.CanvasTexture(image);map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;
 const material=new T.MeshStandardMaterial({map,roughness:.92,bumpMap:reliefTexture('fabric'),bumpScale:.002,side:T.DoubleSide});material.userData.shared=true;cloth.set(id,material);return material;
}
export function createApron(parent,def){
 const root=new T.Group();root.name='sewn-pinafore';root.userData.noBatch=true;parent.add(root);
 const geometry=gridSurface(24,24,(u,v)=>{
  const y=.776-.391*v,r=y>.735?.152:bellRadius(y,def.id),roundHem=v>.84?Math.sqrt(Math.max(.025,1-Math.pow((v-.84)/.16,2))):1,width=(v<.23?.080+v*.012:.085+.093*Math.min(1,(v-.23)/.62))*roundHem;
  const x=(u*2-1)*width,round=Math.sqrt(Math.max(.1,1-(x/r)**2));
  const gather=Math.sin((u*2-1)*Math.PI*5)*.004*Math.max(0,v-.22);
  return [x,y-(.003+.007*v)*Math.cos((u*2-1)*Math.PI/2),Math.max(.117,r*.86*round)+.015+gather];
 },true);
 const apron=new T.Mesh(geometry,embroideredLinen(def.id));apron.name='embroidered-apron';apron.castShadow=true;apron.receiveShadow=true;root.add(apron);
 const pocket=new T.Mesh(gridSurface(12,6,(u,v)=>{
  const x=(u-.5)*.108*(1-.38*Math.pow(v,4));return [x,(.5-v)*.080,.006+Math.cos((u-.5)*Math.PI)*.008+Math.sin(v*Math.PI)*.006];
 },true),embroideredLinen(def.id));pocket.name='sewn-apron-pocket';pocket.position.set(def.id==='noor'?-.052:.052,.501,bellRadius(.501,def.id)*.86*Math.sqrt(1-(.052/bellRadius(.501,def.id))**2)+.022);root.add(pocket);
 // Pocket uses an unembroidered portion of the same linen atlas.
 const puv=pocket.geometry.attributes.uv;for(let i=0;i<puv.count;i++)puv.setXY(i,.30+puv.getX(i)*.14,.32+puv.getY(i)*.18);
 const straps=[];
 for(const sign of [-1,1]){
  const path=new T.CatmullRomCurve3([[sign*.096,.751,.157],[sign*.123,.830,.065],[sign*.131,.810,-.064],[sign*.116,.707,-.142]].map(p=>new T.Vector3(...p)));
  const strap=new T.Mesh(gridSurface(4,20,(u,v)=>{const c=path.getPoint(v);return [c.x+(u-.5)*.035,c.y+Math.sin(u*Math.PI)*.003,c.z]},true),embroideredLinen(def.id));
  const uv=strap.geometry.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,.12+uv.getX(i)*.10,.48+uv.getY(i)*.22);
  strap.name='pinafore-shoulder-strap';strap.castShadow=strap.receiveShadow=true;root.add(strap);straps.push(strap);
 }
 let clasp=null;if(def.id==='noor'){clasp=new T.Mesh(crescentGeometry(.09),mat(0xc59b60));clasp.name='moon-clasp';clasp.scale.setScalar(.25);clasp.position.set(0,.762,.145);root.add(clasp)}
 return {root,apron,pocket,clasp,straps};
}

export function createOveralls(parent,def){
 const root=new T.Group();root.name='tailored-dungarees';root.userData.noBatch=true;parent.add(root);const material=dollFabric(def.id);
 const bib=new T.Mesh(gridSurface(20,18,(u,v)=>{const x=(u-.5)*.254,w=1-.13*Math.pow(Math.abs(v-.5)*2,5);return [x*w,.77-v*.32,.139+.018*Math.cos((u-.5)*Math.PI)-.025*Math.pow((u-.5)*2,2)]},true),material);bib.name='curved-corduroy-bib';bib.castShadow=bib.receiveShadow=true;root.add(bib);
 const pocket=new T.Mesh(gridSurface(16,10,(u,v)=>[(u-.5)*.113*(1-.35*Math.pow(v,4)),(.5-v)*.087,.004+Math.sin(v*Math.PI)*.005+Math.cos((u-.5)*Math.PI)*.003],true),material),buckles=[];pocket.name='curved-bib-pocket';pocket.position.set(0,.614,.172);pocket.castShadow=true;root.add(pocket);
 for(const sign of [-1,1]){
  box(root,sign*.098,.76,.119,.035,.225,.029,material,true);
  const shape=new T.Shape();shape.moveTo(-.022,-.021);shape.lineTo(.022,-.021);shape.lineTo(.022,.021);shape.lineTo(-.022,.021);shape.closePath();const hole=new T.Path();hole.moveTo(-.012,-.012);hole.lineTo(-.012,.012);hole.lineTo(.012,.012);hole.lineTo(.012,-.012);hole.closePath();shape.holes.push(hole);
  const buckle=new T.Mesh(new T.ExtrudeGeometry(shape,{depth:.005,bevelEnabled:false}),mat(0xc59b60));buckle.name='open-brace-buckle';buckle.position.set(sign*.098,.788,.146);root.add(buckle);buckles.push(buckle);
  for(let j=0;j<8;j++)box(root,sign*.105,.48+j*.033,.15,.003,.012,.003,0xe0c7ad);
 }
 for(let i=0;i<7;i++)box(root,-.046+i*.015,.575,.184,.007,.003,.002,0xe0c7ad);
 return {root,bib,pocket,buckles};
}

const shoeGeometry=closeSurfaceSeam(gridSurface(40,4,(u,v)=>{const a=u*Math.PI*2,r=.955+.045*Math.sin(v*Math.PI),power=x=>Math.sign(x)*Math.pow(Math.abs(x),.78);return [power(Math.cos(a))*r,-1+2*v,power(Math.sin(a))*r]}),40,4);
const vamps=new Map();
function vampGeometry(id){
 if(vamps.has(id))return vamps.get(id);
 const g=closeSurfaceSeam(gridSurface(32,16,(u,v)=>{
  const a=u*Math.PI*2,slipper=id==='noor',boot=id==='sami';
  const width=1-(slipper?.55:.43)*Math.pow(v,3),length=1-(boot?.57:.64)*Math.pow(v,2.2),back=-.35*Math.pow(v,2);
  const power=x=>Math.sign(x)*Math.pow(Math.abs(x),boot?.70:slipper?.90:.80);
  return [power(Math.cos(a))*width,-.76+(slipper?1.48:boot?1.77:1.66)*v,power(Math.sin(a))*length+back];
 }),32,16);vamps.set(id,g);return g;
}
export function createFoot(parent,def,sign){
 const root=new T.Group();root.name={lina:'rose-mary-jane',noor:'soft-moon-slipper',sami:'laced-tinker-boot'}[def.id];root.userData.noBatch=true;root.position.set(0,-.323,.059);parent.add(root);
 const color={lina:0x9e5e72,noor:0xb1bfaa,sami:0x665065}[def.id],material=def.id==='noor'?craftMaterial(color):mat(color,{roughness:.58});
 const sole=new T.Mesh(shoeGeometry,mat(def.id==='noor'?0xb7a18e:0x513a46));sole.scale.set(.099,.015,.152);sole.position.y=-.062;root.add(sole);root.sole=sole;
 const upper=new T.Mesh(vampGeometry(def.id),material);upper.scale.set(.093,def.id==='noor'?.055:.064,.147);upper.castShadow=true;root.add(upper);root.upper=upper;
 if(def.id==='lina'){const strap=new T.Mesh(new T.TorusGeometry(.086,.008,4,20,Math.PI),mat(0xebcbbd));strap.name='mary-jane-strap';strap.scale.y=.36;strap.position.set(0,.037,.025);root.add(strap);root.strap=strap;ball(root,sign*.082,.045,.03,.012,.012,.008,0xc59b60)}
 if(def.id==='sami'){cylinder(root,0,.059,-.043,.070,.075,material);root.laces=[];for(let i=0;i<3;i++){const lace=box(root,0,.075+i*.012,.017-i*.018,.095,.006,.011,0xd8c3aa,true);lace.rotation.z=(i%2?1:-1)*.14;root.laces.push(lace)}}
 return root;
}

const sockGeometry=new T.CylinderGeometry(.059,.054,.255,48,6);
{const p=sockGeometry.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),a=Math.atan2(z,x),t=(p.getY(i)+.1275)/.255,r=(.88+.14*Math.pow(t,3)+.025*Math.sin(t*Math.PI*3))*(1+Math.cos(a*24)*.025);p.setX(i,x*r);p.setZ(i,z*r)}sockGeometry.computeVertexNormals()}
export function createSock(parent,skin){
 const sock=new T.Mesh(sockGeometry,craftMaterial(0xe6d6c0));sock.name='ribbed-knit-sock';sock.position.y=-.19;sock.castShadow=true;parent.add(sock);
 const knee=ball(parent,0,-.038,0,.064,.060,.063,skin);knee.name='bisque-knee';return {sock,knee};
}
