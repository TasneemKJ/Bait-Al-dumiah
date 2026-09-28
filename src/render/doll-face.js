import * as T from 'three';
import {mat} from './primitives.js';
let headGeometry=null;
const faceMaps=new Map(),faceMaterials=new Map();
const bisque=new T.MeshPhysicalMaterial({color:0xf3d6c1,roughness:.49,clearcoat:.23,clearcoatRoughness:.38,metalness:0});
export const bisqueMaterial=()=>bisque;
export function createNeckJoint(parent){const joint=new T.Mesh(new T.TorusGeometry(.059,.0018,4,28),mat(0xc19b8b));joint.name='bisque-neck-joint';joint.userData.noBatch=true;joint.position.y=.848;joint.rotation.x=-Math.PI/2;parent.add(joint);return joint}

export function paintedFace(id){
 if(faceMaps.has(id))return faceMaps.get(id);
 const canvas=document.createElement('canvas');canvas.width=canvas.height=512;const c=canvas.getContext('2d');
 c.fillStyle='#f3d6c1';c.fillRect(0,0,512,512);
 for(const x of [70,186]){const g=c.createRadialGradient(x,284,1,x,284,34);g.addColorStop(0,'rgba(191,99,104,.48)');g.addColorStop(.45,'rgba(214,135,129,.27)');g.addColorStop(1,'rgba(214,135,129,0)');c.fillStyle=g;c.fillRect(x-36,248,72,72)}
 c.fillStyle='rgba(161,99,76,.42)';for(const sign of [-1,1])for(let i=0;i<(id==='lina'?4:2);i++){c.beginPath();c.ellipse(128+sign*(34+i*7),274+(i%2)*5,1.5,1.1,-.3*sign,0,Math.PI*2);c.fill()}
 const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;texture.name='painted-bisque-'+id;faceMaps.set(id,texture);return texture;
}
function faceMaterial(base,id){if(!faceMaterials.has(id)){const m=base.clone();m.color.set(0xffffff);m.map=paintedFace(id);faceMaterials.set(id,m)}return faceMaterials.get(id)}
// A hand-sized bisque head: full cheeks, a small chin and a gently flattened back.
export function createSculptedHead(parent,material,id){
 if(!headGeometry){headGeometry=new T.SphereGeometry(1,32,24);const p=headGeometry.attributes.position;
  for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),jaw=Math.max(0,(-y-.22)/.78),cheek=Math.exp(-Math.pow((y+.22)/.36,2))*.024;
   p.setXYZ(i,x*(.284+cheek)*(1-.18*jaw),y*.278-.008,z*.246+.029+(z>0?cheek*.30:0));
  }headGeometry.computeVertexNormals();headGeometry.computeBoundingSphere();
 }
 const mesh=new T.Mesh(headGeometry,faceMaterial(material,id));mesh.name='porcelain-head';mesh.userData.noBatch=true;mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);return mesh;
}

const whiteMaterial=new T.MeshStandardMaterial({color:0xfff2dc,roughness:.35});
const irises=new Map();
function irisMaterial(id){
 if(irises.has(id))return irises.get(id);const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const c=canvas.getContext('2d');
 const tint={lina:['#986544','#cba276'],noor:['#597c6c','#b1bea0'],sami:['#715e81','#b9a0b7']}[id]||['#80614f','#bbaa88'];
 const g=c.createRadialGradient(64,64,12,64,64,62);g.addColorStop(0,tint[1]);g.addColorStop(.55,tint[0]);g.addColorStop(.88,tint[0]);g.addColorStop(1,'#352833');c.fillStyle=g;c.beginPath();c.arc(64,64,63,0,Math.PI*2);c.fill();
 for(let i=0;i<72;i++){const a=i*Math.PI/36;c.strokeStyle=i%2?'rgba(230,211,168,.35)':'rgba(49,33,44,.25)';c.lineWidth=.8;c.beginPath();c.moveTo(64+Math.cos(a)*28,64+Math.sin(a)*28);c.lineTo(64+Math.cos(a)*56,64+Math.sin(a)*56);c.stroke()}
 c.fillStyle='#2b2230';c.beginPath();c.ellipse(64,66,25,29,0,0,Math.PI*2);c.fill();c.fillStyle='#fff8e8';c.beginPath();c.ellipse(45,38,12,15,-.35,0,Math.PI*2);c.fill();c.globalAlpha=.7;c.beginPath();c.arc(80,83,5,0,Math.PI*2);c.fill();
 const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;const material=new T.MeshPhysicalMaterial({map,transparent:true,alphaTest:.04,roughness:.22,clearcoat:.35,clearcoatRoughness:.18});irises.set(id,material);return material;
}
function almondGeometry(){
 const vertices=[0,0,.010],uv=[.5,.5],indices=[],segments=32,rings=4;
 for(let j=1;j<=rings;j++)for(let i=0;i<segments;i++){const a=i/segments*Math.PI*2,r=j/rings,x=Math.cos(a)*r,y=Math.sin(a)*r*(.8+.2*Math.abs(Math.sin(a)));vertices.push(x*.061,y*.051,.010*(1-r*r));uv.push(x*.5+.5,y*.5+.5)}
 for(let i=0;i<segments;i++)indices.push(0,1+i,1+(i+1)%segments);
 for(let j=1;j<rings;j++)for(let i=0;i<segments;i++){const a=1+(j-1)*segments+i,b=1+(j-1)*segments+(i+1)%segments,c=a+segments,d=b+segments;indices.push(a,c,b,b,c,d)}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g;
}
const almond=almondGeometry(),irisGeometry=new T.CircleGeometry(.040,32);
export function createPortraitEye(parent,sign,id){
 const eye=new T.Group();eye.name='portrait-eye';eye.userData.noBatch=true;eye.position.set(sign*.105,.012,.266);eye.rotation.y=sign*.30;parent.add(eye);
 const aperture=new T.Group();eye.add(aperture);eye.aperture=aperture;
 const white=new T.Mesh(almond,whiteMaterial);white.name='almond-white';aperture.add(white);
 const iris=new T.Mesh(irisGeometry,irisMaterial(id));iris.name='painted-iris';iris.position.set(0,-.003,.013);aperture.add(iris);eye.iris=iris;
 lashFrame(eye);eye.closedLid=faceStroke(eye,'closed-bisque-lid',[[-.053,0,.003],[0,-.012,.014],[.053,0,.003]],.0035,0x8d6064);eye.closedLid.visible=false;return eye;
}

export function faceStroke(parent,name,points,radius,color){const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));const mesh=new T.Mesh(new T.TubeGeometry(curve,16,radius,4,false),mat(color));mesh.name=name;parent.add(mesh);return mesh}
export function createBrow(parent,sign,color){const brow=new T.Group();brow.name='expressive-brow';brow.userData.noBatch=true;brow.position.set(sign*.105,.091,.248);parent.add(brow);faceStroke(brow,'brow-hair',[[-.039,0,0],[0,.011,.008],[.035,.002,0]],.0055,color);return brow}
function lashFrame(eye){
 faceStroke(eye.aperture,'upper-lash',[[-.061,0,.002],[-.038,.036,.007],[0,.050,.010],[.038,.036,.007],[.061,0,.002]],.0034,0x594049);
 faceStroke(eye.aperture,'lower-waterline',[[-.059,-.004,.001],[0,-.049,.007],[.059,-.004,.001]],.0022,0xb78179);
}

export function closePortraitEye(eye,value){const openness=Number.isFinite(value)?T.MathUtils.clamp(value,0,1):1;eye.aperture.scale.y=Math.max(.06,openness);eye.aperture.visible=openness>.19;eye.closedLid.visible=openness<=.19;eye.scale.y=1}

export function createPortraitMouth(parent){
 const root=new T.Group();root.name='porcelain-lips';root.userData.noBatch=true;root.position.set(0,-.115,.274);parent.add(root);
 const upper=new T.Shape();upper.moveTo(-.035,.003);upper.quadraticCurveTo(-.018,.010,0,.003);upper.quadraticCurveTo(.018,.010,.035,.003);upper.quadraticCurveTo(0,-.006,-.035,.003);
 const lower=new T.Shape();lower.moveTo(-.029,0);lower.quadraticCurveTo(0,-.010,.029,0);lower.quadraticCurveTo(0,-.020,-.029,0);
 for(const [shape,color] of [[upper,0xac6c74],[lower,0xc99391]]){const lip=new T.Mesh(new T.ShapeGeometry(shape,16),mat(color,{roughness:.53}));lip.name='sculpted-lip';root.add(lip)}
 return root;
}

let noseGeometry=null;
export function createNose(parent,material){
 if(!noseGeometry){noseGeometry=new T.SphereGeometry(1,16,12);const p=noseGeometry.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);p.setXYZ(i,x*.024*(y>0?1-y*.65:1),y*.043,z*.026*(y>0?1-y*.35:1))}noseGeometry.computeVertexNormals()}
 const mesh=new T.Mesh(noseGeometry,material);mesh.name='sculpted-nose';mesh.position.set(0,-.050,.274);parent.add(mesh);return mesh;
}

const earGeometry=new T.SphereGeometry(1,12,10);
export function createEar(parent,sign,material){
 const root=new T.Group();root.name='porcelain-ear';root.userData.noBatch=true;root.position.set(sign*.282,-.034,.020);root.rotation.y=sign*.45;parent.add(root);
 const lobe=new T.Mesh(earGeometry,material);lobe.scale.set(.037,.058,.031);root.add(lobe);
 const inset=new T.Mesh(earGeometry,mat(0xd7a497,{roughness:.78}));inset.name='ear-recess';inset.position.set(0,.006,.027);inset.scale.set(.016,.033,.005);root.add(inset);return root;
}
