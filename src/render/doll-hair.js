import {sweptLock,gridSurface} from './doll-couture.js';
import * as T from 'three';
import {scalpMaterial} from './doll-hair-grain.js';
import {mat,ball,ring} from './primitives.js';
import {craftMaterial} from './textiles.js';
const caps=new Map();
function capGeometry(id){
 if(caps.has(id))return caps.get(id);const vertices=[],uv=[],indices=[],w=40,h=20;
 for(let j=0;j<=h;j++)for(let i=0;i<=w;i++){const phi=i/w*Math.PI*2,front=Math.sin(phi),
   theta=j/h*(front>0?1.10+.60*(1-front):1.70-.56*front),groove=1+.009*Math.sin(phi*28+theta*3.2)*Math.sin(theta);
  vertices.push(-Math.cos(phi)*Math.sin(theta)*.307*groove,Math.cos(theta)*({lina:.290,noor:.286,
    sami:.294}[id]||.290)+.006,Math.sin(phi)*Math.sin(theta)*.288*groove+.008);uv.push(i/w,1-j/h);
 }
 for(let j=0;j<h;j++)for(let i=0;i<w;i++){const a=j*(w+1)+i,b=a+w+1;indices.push(a,b,a+1,a+1,b,b+1)}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));
 g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();caps.set(id,g);return g;
}
export function createHair(parent,def){const root=new T.Group();root.name='sculpted-hairstyle';parent.add(root);
const material=scalpMaterial(def.hair);const cap=new T.Mesh(capGeometry(def.id),material);cap.name='swept-hair-cap';cap.userData.noBatch=true;
cap.castShadow=true;cap.receiveShadow=true;root.add(cap);const tails=def.id==='lina'?[-1,1].map(sign=>createPlait(root,sign,def)):[];
const bun=def.id==='noor'?createBun(root,def):null,temples=templeLocks(root,def);const fringe=storybookFringe(root,def);
const bows=tails.map((tail,i)=>fabricBow(tail,(i===0?-1:1)*.035,-.32,.043,def.color));bows.forEach(b=>b.scale.setScalar(.56));
if(bun){const bow=fabricBow(root,-.245,.178,.164,0xd3ba8b);bow.scale.setScalar(.62);bows.push(bow)}return {root,cap,tails,bun,temples,fringe,bows}}

function hairTube(parent,points,radius,color,name,taper=0){const path=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),
  g=new T.TubeGeometry(path,32,radius,6,false);if(taper){const p=g.attributes.position,center=new T.Vector3(),point=new T.Vector3();
for(let i=0;i<p.count;i++){const t=Math.floor(i/7)/32;path.getPointAt(t,center);
point.fromBufferAttribute(p,i).sub(center).multiplyScalar(1-taper*t).add(center);
p.setXYZ(i,point.x,point.y,point.z)}g.computeVertexNormals()}const mesh=new T.Mesh(g,mat(color,
  {roughness:.66}));mesh.name=name;mesh.castShadow=true;parent.add(mesh);return mesh}
function createPlait(parent,sign,def){
 const root=new T.Group();root.name='lina-plait';root.userData.noBatch=true;root.position.set(sign*.293,.075,-.022);parent.add(root);root.strands=[];
 for(let strand=0;strand<3;strand++){const points=[];for(let j=0;j<=30;j++){const t=j/30,a=t*Math.PI*5+strand*Math.PI*2/3;
 points.push([Math.sin(a)*.035+sign*t*.035,-t*.36,Math.cos(a)*.041])}root.strands.push(hairTube(root,points,.027,def.hair,'woven-hair-strand',.48))}
 const tie=ring(root,sign*.035,-.334,0,.048,.009,def.color,true);tie.scale.y*=.75;return root;
}

function createBun(parent,def){
 const root=new T.Group();root.name='noor-braided-bun';root.userData.noBatch=true;root.position.set(.139,.252,-.149);parent.add(root);
 ball(root,0,0,0,.080,.064,.076,mat(def.hair,{roughness:.66}));root.strands=[];
 for(let k=0;k<3;k++){const points=[];for(let j=0;j<=48;j++){const a=j/48*Math.PI*2,r=.073+Math.sin(a*7+k*Math.PI*2/3)*.008;
 points.push([Math.cos(a)*r,Math.sin(a)*r*.80,
   Math.cos(a*7+k*Math.PI*2/3)*.014+.04])}root.strands.push(hairTube(root,points,.011,def.hair,'bun-braid'))}return root;
}
function templeLocks(parent,def){return [-1,1].map(sign=>{const paths={lina:[[sign*.255,.176,.164],[sign*.288,.080,.136],[sign*.291,-.022,.119],
  [sign*.268,-.100,.109]],noor:[[sign*.247,.174,.164],[sign*.280,.077,.134],[sign*.282,-.031,.122],
    [sign*.265,-.114,.130]],sami:[[sign*.260,.169,.147],
  [sign*.292,.072,.098],[sign*.298,-.014,.087],[sign*.276,-.070,.084]]};
const mesh=new T.Mesh(sweptLock(paths[def.id],.020,.012),scalpMaterial(def.hair));
mesh.name='temple-lock';mesh.castShadow=true;parent.add(mesh);return mesh})}

function storybookFringe(parent,def){
 const starts=def.id==='lina'?[
  [[-.020,.284,.134],[-.107,.251,.225],[-.209,.151,.236],[-.270,.055,.142]],
  [[-.009,.278,.173],[-.071,.226,.272],[-.156,.151,.265],[-.239,.085,.190]],
  [[.012,.269,.206],[-.010,.213,.285],[-.083,.150,.278],[-.174,.112,.232]],
  [[.032,.285,.137],[.136,.243,.222],[.224,.150,.239],[.277,.056,.140]],
  [[.028,.276,.179],[.084,.221,.270],[.173,.144,.270],[.247,.086,.187]],
  [[.026,.267,.216],[.058,.209,.288],[.110,.151,.282],[.192,.109,.230]],
  ]:def.id==='noor'?[
  [[-.094,.283,.126],[-.037,.249,.239],[.092,.187,.284],[.247,.087,.182]],
  [[-.119,.274,.151],[-.148,.218,.253],[-.231,.139,.224],[-.282,.037,.117]],
  [[-.092,.273,.183],[-.024,.211,.285],[.108,.142,.277],[.247,.068,.160]],
  [[-.050,.268,.210],[.018,.222,.286],[.138,.169,.270],[.265,.077,.132]],
  [[.011,.283,.125],[.152,.240,.211],[.257,.148,.180],[.295,.047,.077]],
 ]:[
  [[-.150,.269,.134],[-.074,.251,.240],[.080,.225,.280],[.222,.150,.211]],
  [[-.184,.254,.166],[-.107,.231,.274],[.038,.194,.288],[.203,.146,.230]],
  [[-.222,.231,.186],[-.174,.207,.249],[-.082,.177,.286],[.090,.153,.270]],
  [[-.134,.283,.084],[.038,.280,.210],[.180,.223,.253],[.281,.093,.117]],
  [[-.169,.258,.183],[-.092,.220,.273],[.071,.190,.284],[.246,.128,.191]],
  [[-.070,.285,.143],[.044,.250,.230],[.168,.202,.250],[.277,.107,.151]],

 ];
 const widths={lina:[.046,.049,.037,.046,.047,.036],noor:[.046,.046,.041,.035,.037],sami:[.043,.045,.036,.037,.031,.033]}[def.id];
 // Join the outer sweep to the core mass. A front-only view hid the daylight
 // gap between these two locks; the inset bridge also closes oblique views.
 if(def.id==='noor'||def.id==='sami'){
  const pair=def.id==='noor'?[0,4]:[1,3];
  const inner=new T.CatmullRomCurve3(starts[pair[0]].map(p=>new T.Vector3(...p))),
    outer=new T.CatmullRomCurve3(starts[pair[1]].map(p=>new T.Vector3(...p)));
  const g=gridSurface(8,20,(u,v)=>{const t=.06+.93*v,a=inner.getPoint(t),b=outer.getPoint(t),p=a.lerp(b,u);
  return [p.x,p.y-(def.id==='sami'?.035*Math.sin(u*Math.PI)*v*v:0),p.z-.005*Math.sin(u*Math.PI)]});
  const join=new T.Mesh(g,scalpMaterial(def.hair));join.name='joined-side-sweep';join.castShadow=join.receiveShadow=true;parent.add(join);
 }

 return starts.map((points,i)=>{
  const mesh=new T.Mesh(sweptLock(points,widths[i],.020),scalpMaterial(def.hair));
  mesh.name='sculpted-fringe';mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);return mesh;
 });
}

const bowMaterials=new Map();
function ribbonMaterial(color){if(!bowMaterials.has(color)){const m=craftMaterial(color).clone();
m.side=T.DoubleSide;bowMaterials.set(color,m)}return bowMaterials.get(color)}
export function fabricBow(parent,x,y,z,color){
 const root=new T.Group();root.name='cloth-bow';root.userData.noBatch=true;root.position.set(x,y,z);
 parent.add(root);const material=ribbonMaterial(color);
 for(const sign of [-1,1]){
  const geo=new T.PlaneGeometry(1,1,16,4),p=geo.attributes.position;
  for(let i=0;i<p.count;i++){const t=p.getX(i)+.5,v=p.getY(i)*2,s=Math.sin(t*Math.PI);
  p.setXYZ(i,sign*(.012+.105*s),v*.034*s+.009*Math.sin(t*Math.PI*2),.032*Math.sin(t*Math.PI*2)+.012*v*v)}geo.computeVertexNormals();
  const loop=new T.Mesh(geo,material);loop.name='folded-bow-loop';root.add(loop);
  const s=new T.Shape();s.moveTo(-.018,0);s.lineTo(.018,0);s.lineTo(.029,-.104);s.lineTo(.006,-.088);s.lineTo(-.009,-.113);s.closePath();
  const tail=new T.Mesh(new T.ShapeGeometry(s),material);tail.name='split-ribbon-tail';
  tail.position.set(sign*.018,-.012,.006);tail.rotation.z=sign*.30;root.add(tail);
 }
 ball(root,0,0,.012,.026,.029,.022,material);return root;
}
