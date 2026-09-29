import * as T from 'three';
import {mat,box,ball,cylinder,ring,batch} from './primitives.js';
import {craftMaterial,reliefTexture} from './textiles.js';
import {crescentGeometry} from './resident-effects.js';
const cloth=new Map();
function embroideredLinen(id){
 if(cloth.has(id))return cloth.get(id);const image=document.createElement('canvas');image.width=256;image.height=384;const c=image.getContext('2d');c.fillStyle='#f3e1c9';c.fillRect(0,0,256,384);
 c.strokeStyle='#d7bfa7';c.lineWidth=1;for(let y=0;y<384;y+=4){c.beginPath();c.moveTo(0,y);c.lineTo(256,y);c.stroke()}
 c.strokeStyle='#b78383';c.lineWidth=2;c.setLineDash([3,5]);c.strokeRect(12,10,232,362);c.setLineDash([]);
 c.strokeStyle='#7c9b83';c.lineWidth=3;c.beginPath();c.moveTo(127,242);c.quadraticCurveTo(147,192,128,165);c.stroke();
 for(const [x,y,a] of [[132,224,-.6],[138,204,.6]]){c.fillStyle='#839d82';c.beginPath();c.ellipse(x+(a<0?-9:9),y,12,4,a,0,Math.PI*2);c.fill()}
 c.fillStyle='#bc7a88';for(let k=0;k<5;k++){const a=k*Math.PI*2/5;c.beginPath();c.ellipse(128+Math.sin(a)*7,165+Math.cos(a)*7,5,9,-a,0,Math.PI*2);c.fill()}c.fillStyle='#d6b471';c.beginPath();c.arc(128,165,4,0,Math.PI*2);c.fill();
 if(id==='noor'){
  c.fillStyle='#f3e1c9';c.fillRect(87,128,84,123);c.fillStyle='#b8a2bb';c.beginPath();c.arc(130,180,24,0,Math.PI*2);c.fill();c.fillStyle='#f3e1c9';c.beginPath();c.arc(141,172,22,0,Math.PI*2);c.fill();
  c.fillStyle='#c3a576';for(const [x,y] of [[100,155],[154,210],[107,222]]){c.beginPath();c.moveTo(x,y-6);c.lineTo(x+2,y-2);c.lineTo(x+6,y);c.lineTo(x+2,y+2);c.lineTo(x,y+6);c.lineTo(x-2,y+2);c.lineTo(x-6,y);c.lineTo(x-2,y-2);c.closePath();c.fill()}
 }
 const map=new T.CanvasTexture(image);map.colorSpace=T.SRGBColorSpace;const material=new T.MeshStandardMaterial({map,roughness:.94,bumpMap:reliefTexture('fabric'),bumpScale:.003,side:T.DoubleSide});material.userData.shared=true;cloth.set(id,material);return material;
}
export function createApron(parent,def){
 const root=new T.Group();root.name='sewn-pinafore';root.userData.noBatch=true;parent.add(root);
 const geometry=new T.PlaneGeometry(2,1,16,16),p=geometry.attributes.position;
 for(let i=0;i<p.count;i++){const u=p.getX(i),v=.5-p.getY(i);p.setXYZ(i,u*(.105+.115*v),.735-.37*v,.14+.13*v-(.025+.08*v)*u*u)}geometry.computeVertexNormals();
 const apron=new T.Mesh(geometry,embroideredLinen(def.id));apron.name='embroidered-apron';apron.castShadow=true;apron.receiveShadow=true;root.add(apron);
 const pocket=new T.Mesh(new T.PlaneGeometry(.115,.092,8,4),craftMaterial(0xe9cfbc));pocket.name='sewn-apron-pocket';pocket.position.set(.055,.483,.232);const a=pocket.geometry.attributes.position;for(let i=0;i<a.count;i++)a.setZ(i,Math.cos(a.getX(i)/.115*Math.PI)*.009);pocket.geometry.computeVertexNormals();root.add(pocket);
 let clasp=null;if(def.id==='noor'){clasp=new T.Mesh(crescentGeometry(.09),mat(0xc59b60));clasp.name='moon-clasp';clasp.scale.setScalar(.25);clasp.position.set(0,.762,.145);root.add(clasp)}
 return {root,apron,pocket,clasp};
}

export function createOveralls(parent,def){
 const root=new T.Group();root.name='tailored-dungarees';root.userData.noBatch=true;parent.add(root);const material=craftMaterial(0x83768f);
 const bib=box(root,0,.612,.12,.247,.30,.053,material,true),pocket=box(root,0,.616,.152,.115,.101,.012,craftMaterial(0xa194ac),true),buckles=[];
 for(const sign of [-1,1]){
  box(root,sign*.098,.76,.119,.035,.225,.029,material,true);
  const shape=new T.Shape();shape.moveTo(-.022,-.021);shape.lineTo(.022,-.021);shape.lineTo(.022,.021);shape.lineTo(-.022,.021);shape.closePath();const hole=new T.Path();hole.moveTo(-.012,-.012);hole.lineTo(-.012,.012);hole.lineTo(.012,.012);hole.lineTo(.012,-.012);hole.closePath();shape.holes.push(hole);
  const buckle=new T.Mesh(new T.ExtrudeGeometry(shape,{depth:.005,bevelEnabled:false}),mat(0xc59b60));buckle.name='open-brace-buckle';buckle.position.set(sign*.098,.788,.146);root.add(buckle);buckles.push(buckle);
  for(let j=0;j<8;j++)box(root,sign*.105,.48+j*.033,.15,.003,.012,.003,0xe0c7ad);
 }
 for(let i=0;i<7;i++)box(root,-.046+i*.015,.575,.164,.007,.003,.002,0xe0c7ad);
 return {root,bib,pocket,buckles};
}

const shoeGeometry=new T.SphereGeometry(1,16,10);
export function createFoot(parent,def,sign){
 const root=new T.Group();root.name={lina:'rose-mary-jane',noor:'soft-moon-slipper',sami:'laced-tinker-boot'}[def.id];root.userData.noBatch=true;root.position.set(0,-.323,.059);parent.add(root);
 const color={lina:0x9e5e72,noor:0xb1bfaa,sami:0x665065}[def.id],material=def.id==='noor'?craftMaterial(color):mat(color,{roughness:.58});
 const sole=new T.Mesh(shoeGeometry,mat(def.id==='noor'?0xb7a18e:0x513a46));sole.scale.set(.099,.015,.152);sole.position.y=-.062;root.add(sole);root.sole=sole;
 const upper=new T.Mesh(shoeGeometry,material);upper.scale.set(.093,def.id==='noor'?.055:.064,.147);upper.castShadow=true;root.add(upper);root.upper=upper;
 if(def.id==='lina'){const strap=new T.Mesh(new T.TorusGeometry(.086,.008,4,20,Math.PI),mat(0xebcbbd));strap.name='mary-jane-strap';strap.scale.y=.36;strap.position.set(0,.037,.025);root.add(strap);root.strap=strap;ball(root,sign*.082,.045,.03,.012,.012,.008,0xc59b60)}
 if(def.id==='sami'){cylinder(root,0,.059,-.043,.070,.075,material);root.laces=[];for(let i=0;i<3;i++){const lace=box(root,0,.075+i*.012,.017-i*.018,.095,.006,.011,0xd8c3aa,true);lace.rotation.z=(i%2?1:-1)*.14;root.laces.push(lace)}}
 return root;
}

const sockGeometry=new T.CylinderGeometry(.059,.054,.255,48,6);
{const p=sockGeometry.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),a=Math.atan2(z,x),r=1+Math.cos(a*24)*.025;p.setX(i,x*r);p.setZ(i,z*r)}sockGeometry.computeVertexNormals()}
export function createSock(parent,skin){
 const sock=new T.Mesh(sockGeometry,craftMaterial(0xe6d6c0));sock.name='ribbed-knit-sock';sock.position.y=-.19;sock.castShadow=true;parent.add(sock);
 const knee=ball(parent,0,-.038,0,.064,.060,.063,skin);knee.name='bisque-knee';return {sock,knee};
}
