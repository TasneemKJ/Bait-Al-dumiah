import {sweptLock} from './doll-couture.js';
import * as T from 'three';
import {scalpMaterial} from './doll-hair-grain.js';
import {mat,ball,ring,batch} from './primitives.js';
import {craftMaterial} from './textiles.js';
const caps=new Map();
function capGeometry(id){
 if(caps.has(id))return caps.get(id);const vertices=[],uv=[],indices=[],w=40,h=20;
 for(let j=0;j<=h;j++)for(let i=0;i<=w;i++){const phi=i/w*Math.PI*2,front=Math.sin(phi),theta=j/h*(front>0?1.10+.60*(1-front):1.70-.56*front),groove=1+.009*Math.sin(phi*28+theta*3.2)*Math.sin(theta);
  vertices.push(-Math.cos(phi)*Math.sin(theta)*.315*groove,Math.cos(theta)*.300+.006,Math.sin(phi)*Math.sin(theta)*.288*groove+.008);uv.push(i/w,1-j/h);
 }
 for(let j=0;j<h;j++)for(let i=0;i<w;i++){const a=j*(w+1)+i,b=a+w+1;indices.push(a,b,a+1,a+1,b,b+1)}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();caps.set(id,g);return g;
}
export function createHair(parent,def){const root=new T.Group();root.name='sculpted-hairstyle';parent.add(root);const material=scalpMaterial(def.hair);const cap=new T.Mesh(capGeometry(def.id),material);cap.name='swept-hair-cap';cap.userData.noBatch=true;cap.castShadow=true;cap.receiveShadow=true;root.add(cap);const tails=def.id==='lina'?[-1,1].map(sign=>createPlait(root,sign,def)):[];const bun=def.id==='noor'?createBun(root,def):null,temples=def.id==='noor'?templeLocks(root,def):[];const fringe=storybookFringe(root,def);const bows=tails.map((tail,i)=>fabricBow(tail,(i===0?-1:1)*.035,-.32,.043,def.color));bows.forEach(b=>b.scale.setScalar(.72));if(bun){const bow=fabricBow(root,-.245,.178,.164,0xd3ba8b);bow.scale.setScalar(.80);bows.push(bow)}return {root,cap,tails,bun,temples,fringe,bows}}

function hairTube(parent,points,radius,color,name){const path=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));const mesh=new T.Mesh(new T.TubeGeometry(path,32,radius,6,false),mat(color,{roughness:.66}));mesh.name=name;mesh.castShadow=true;parent.add(mesh);return mesh}
function createPlait(parent,sign,def){
 const root=new T.Group();root.name='lina-plait';root.userData.noBatch=true;root.position.set(sign*.307,.085,-.022);parent.add(root);root.strands=[];
 for(let strand=0;strand<2;strand++){const points=[];for(let j=0;j<=30;j++){const t=j/30,a=t*Math.PI*5+strand*Math.PI;points.push([Math.sin(a)*.035+sign*t*.035,-t*.36,Math.cos(a)*.041])}root.strands.push(hairTube(root,points,.031,def.hair,'woven-hair-strand'))}
 const tie=ring(root,sign*.035,-.334,0,.048,.009,def.color,true);tie.scale.y*=.75;return root;
}

function createBun(parent,def){
 const root=new T.Group();root.name='noor-braided-bun';root.userData.noBatch=true;root.position.set(.14,.28,-.145);parent.add(root);ball(root,0,0,0,.098,.09,.092,mat(def.hair,{roughness:.66}));root.strands=[];
 for(let k=0;k<3;k++){const points=[];for(let j=0;j<=48;j++){const a=j/48*Math.PI*2,r=.090+Math.sin(a*7+k*Math.PI*2/3)*.010;points.push([Math.cos(a)*r,Math.sin(a)*r*.80,Math.cos(a*7+k*Math.PI*2/3)*.014+.04])}root.strands.push(hairTube(root,points,.013,def.hair,'bun-braid'))}return root;
}
function templeLocks(parent,def){return [-1,1].map(sign=>hairTube(parent,[[sign*.245,.18,.17],[sign*.29,.11,.12],[sign*.289,-.025,.11],[sign*.27,-.08,.12]],.016,def.hair,'temple-lock'))}

function storybookFringe(parent,def){
 const starts=def.id==='lina'?[
  [[.020,.298,.115],[-.082,.263,.209],[-.185,.166,.255],[-.269,.066,.157]],
  [[.052,.290,.143],[-.013,.228,.273],[-.110,.125,.281],[-.205,.080,.210]],
  [[.078,.290,.136],[.155,.239,.231],[.219,.150,.247],[.282,.046,.122]],
  [[.071,.280,.176],[.116,.205,.279],[.173,.123,.271],[.246,.068,.175]],
 ]:def.id==='noor'?[
  [[-.087,.294,.126],[-.040,.257,.238],[.069,.184,.295],[.227,.076,.198]],
  [[-.124,.282,.142],[-.153,.220,.261],[-.227,.128,.234],[-.275,.026,.125]],
  [[-.080,.280,.174],[-.019,.211,.283],[.105,.120,.285],[.239,.038,.155]],
  [[.018,.294,.124],[.157,.244,.213],[.253,.147,.191],[.291,.036,.089]],
 ]:[
  [[-.143,.270,.131],[-.069,.253,.241],[.071,.210,.281],[.205,.114,.218]],
  [[-.183,.248,.163],[-.104,.206,.277],[.041,.152,.294],[.202,.071,.237]],
  [[-.227,.203,.184],[-.177,.145,.249],[-.085,.088,.290],[.082,.089,.274]],
  [[-.134,.285,.081],[.038,.290,.161],[.177,.229,.217],[.281,.086,.120]],
 ];
 const widths=def.id==='sami'?[.062,.068,.055,.058]:[.058,.060,.057,.052];
 return starts.map((points,i)=>{
  const mesh=new T.Mesh(sweptLock(points,widths[i],.020),scalpMaterial(def.hair));
  mesh.name='sculpted-fringe';mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);return mesh;
 });
}

const bowMaterials=new Map();
function ribbonMaterial(color){if(!bowMaterials.has(color)){const m=craftMaterial(color).clone();m.side=T.DoubleSide;bowMaterials.set(color,m)}return bowMaterials.get(color)}
export function fabricBow(parent,x,y,z,color){
 const root=new T.Group();root.name='cloth-bow';root.userData.noBatch=true;root.position.set(x,y,z);parent.add(root);const material=ribbonMaterial(color);
 for(const sign of [-1,1]){
  const geo=new T.PlaneGeometry(1,1,16,4),p=geo.attributes.position;for(let i=0;i<p.count;i++){const t=p.getX(i)+.5,v=p.getY(i)*2,s=Math.sin(t*Math.PI);p.setXYZ(i,sign*(.012+.105*s),v*.034*s+.009*Math.sin(t*Math.PI*2),.032*Math.sin(t*Math.PI*2)+.012*v*v)}geo.computeVertexNormals();
  const loop=new T.Mesh(geo,material);loop.name='folded-bow-loop';root.add(loop);
  const s=new T.Shape();s.moveTo(-.018,0);s.lineTo(.018,0);s.lineTo(.029,-.104);s.lineTo(.006,-.088);s.lineTo(-.009,-.113);s.closePath();const tail=new T.Mesh(new T.ShapeGeometry(s),material);tail.name='split-ribbon-tail';tail.position.set(sign*.018,-.012,.006);tail.rotation.z=sign*.30;root.add(tail);
 }
 ball(root,0,0,.012,.026,.029,.022,material);return root;
}
