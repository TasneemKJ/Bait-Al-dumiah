import {surfaceFinish} from './atelier-surfaces.js';
import * as T from 'three';

// Parametric cloth and hair surfaces. All coordinates are model-space and all
// color/height maps are cached; no per-frame asset construction is required.
export function gridSurface(columns, rows, sample, reverse = false) {
 const positions=[], uv=[], indices=[];
 for(let j=0;j<=rows;j++)for(let i=0;i<=columns;i++){
  positions.push(...sample(i/columns,j/rows));uv.push(i/columns,1-j/rows);
 }
 for(let j=0;j<rows;j++)for(let i=0;i<columns;i++){
  const a=j*(columns+1)+i,b=a+columns+1;
  indices.push(...(reverse?[a,a+1,b,a+1,b+1,b]:[a,b,a+1,a+1,b,b+1]));
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));
 g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();
 g.computeBoundingBox();g.computeBoundingSphere();return g;
}
export function closeSurfaceSeam(g, columns, rows) {
 const p=g.attributes.position,n=g.attributes.normal,a=new T.Vector3(),b=new T.Vector3();
 for(let j=0;j<=rows;j++){
  const start=j*(columns+1),end=start+columns;
  if(a.fromBufferAttribute(p,start).distanceTo(b.fromBufferAttribute(p,end))<1e-5){
   a.fromBufferAttribute(n,start).add(b.fromBufferAttribute(n,end)).normalize();n.setXYZ(start,a.x,a.y,a.z);n.setXYZ(end,a.x,a.y,a.z);
  }
 }
 return g;
}
export function bellRadius(y,id='lina') {
 const t=T.MathUtils.clamp((y-.337)/.398,0,1),noor=id==='noor';
 return (noor?.132:.131)+(noor?.149:.164)*Math.pow(Math.cos(t*Math.PI/2),noor?1.52:1.35)-.033*Math.exp(-Math.pow(t/.065,2));
}
const dresses=new Map();
export function gatheredDressGeometry(id='lina') {
 if(dresses.has(id))return dresses.get(id);
 const g=closeSurfaceSeam(gridSurface(64,24,(u,v)=>{
  const a=u*Math.PI*2,y=.337+v*.398,r=bellRadius(y,id),fold=(id==='noor'?.006:.008)*Math.sin(a*(id==='noor'?12:10)+.12)*(1-v*.75);
  return [Math.cos(a)*(r+fold),y-.75,Math.sin(a)*(r+fold)*.86];
 }),64,24);dresses.set(id,g);return g;
}

// A broad lock with an elliptical section and tapered tip, rather than a tube
// laid across a hemisphere. Geometry retains shared UVs for subtle hair grain.
export function sweptLock(points,width,depth) {
 const path=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),center=new T.Vector3(),tangent=new T.Vector3(),side=new T.Vector3();
 return closeSurfaceSeam(gridSurface(12,24,(u,v)=>{
  path.getPoint(v,center);path.getTangent(v,tangent);side.set(-tangent.y,tangent.x,0).normalize();
  const a=u*Math.PI*2,taper=(.20+.80*Math.pow(Math.sin(Math.PI*v),.65))*(1-.72*v),rib=1+.018*Math.cos(a*6);
  return [center.x+side.x*Math.cos(a)*width*taper,center.y+side.y*Math.cos(a)*width*taper,center.z+Math.sin(a)*depth*taper*rib*.62];
 },true),12,24);
}

const fabrics=new Map();
export function dollFabric(id) {
 if(fabrics.has(id))return fabrics.get(id);
 const image=document.createElement('canvas');image.width=image.height=256;const c=image.getContext('2d');
 const palette={lina:['#b7657c','#e6a8b5'],noor:['#628e85','#94b9a8'],sami:['#67617f','#a49aba']}[id]||['#a38298','#d8b9bd'];
 c.fillStyle=palette[0];c.fillRect(0,0,256,256);
 if(id==='lina'){
  c.fillStyle=palette[1];c.globalAlpha=.25;for(let i=0;i<256;i+=32){c.fillRect(i,0,14,256);c.fillRect(0,i,256,14)}
  c.globalAlpha=.6;c.fillStyle='#f5dcc4';for(let y=24;y<256;y+=64)for(let x=24;x<256;x+=64){c.beginPath();c.arc(x,y,1.6,0,Math.PI*2);c.fill()}
 }else if(id==='noor'){
  c.strokeStyle=palette[1];c.lineWidth=1.1;c.globalAlpha=.32;
  for(let x=3;x<256;x+=8)for(let y=-4;y<256;y+=10){c.beginPath();c.moveTo(x,y);c.lineTo(x+3,y+5);c.lineTo(x,y+10);c.stroke()}
 }else{
  c.strokeStyle=palette[1];c.globalAlpha=.33;c.lineWidth=2;
  for(let x=0;x<256;x+=8){c.beginPath();c.moveTo(x,0);c.lineTo(x,256);c.stroke()}
  // Original woven/stitch band for Sami's bib. It lives in the top atlas zone;
  // trouser UVs are remapped below so one shared material still serves both.
  c.globalAlpha=.92;c.strokeStyle='#c88d68';c.lineWidth=2;c.lineCap='round';
  for(let x=10;x<256;x+=18){
   c.beginPath();c.moveTo(x,18);c.lineTo(x+7,25);c.lineTo(x,32);c.lineTo(x-7,25);c.closePath();c.stroke();
   c.beginPath();c.moveTo(x,48);c.lineTo(x+6,54);c.lineTo(x,60);c.lineTo(x-6,54);c.closePath();c.stroke();
   c.beginPath();c.moveTo(x-5,76);c.lineTo(x+5,86);c.moveTo(x+5,76);c.lineTo(x-5,86);c.stroke();
  }
  c.globalAlpha=.38;c.strokeStyle='#e7c08b';c.lineWidth=1;
  for(const y of [10,39,68,94]){c.beginPath();c.moveTo(0,y);c.lineTo(256,y);c.stroke()}
 }
 c.globalAlpha=.1;c.strokeStyle='#f8e4cf';c.lineWidth=.6;
 for(let i=1;i<256;i+=4){c.beginPath();c.moveTo(i,0);c.lineTo(i,256);c.moveTo(0,i);c.lineTo(256,i);c.stroke()}
 const map=new T.CanvasTexture(image);map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;
 if(id==='sami')map.userData.pattern='sami-woven-bib-band';
 const m=new T.MeshStandardMaterial({map,roughness:.88,bumpMap:surfaceFinish('fabric'),roughnessMap:surfaceFinish('fabric'),bumpScale:.002,
   side:T.DoubleSide});m.userData.shared=true;fabrics.set(id,m);return m;
}

let bodice=null;
export function bodiceGeometry(){
 if(bodice)return bodice;
 const shape=new T.CatmullRomCurve3([[.122,.540,.105],[.133,.627,.109],[.166,.716,.118],[.163,.775,.101],
   [.112,.816,.078],[.069,.838,.060]].map(p=>new T.Vector3(...p)));
 bodice=closeSurfaceSeam(gridSurface(32,24,(u,v)=>{const p=shape.getPoint(v),a=u*Math.PI*2;
 return [Math.cos(a)*p.x,p.y,Math.sin(a)*p.z]}),32,24);return bodice;
}

let sleeve=null;
export function sleeveGeometry(){
 if(!sleeve)sleeve=closeSurfaceSeam(gridSurface(32,16,(u,v)=>{const a=u*Math.PI*2,r=.0385+.013*Math.sin(v*Math.PI)-.0185*Math.pow(v,6),
   fold=1+.020*Math.cos(a*12)*Math.sin(v*Math.PI);return [Math.cos(a)*r*fold,-.112+.124*v,Math.sin(a)*r*fold*.91]}),32,16);
 return sleeve;
}

let forearm=null;
export function forearmGeometry(){
 if(!forearm)forearm=closeSurfaceSeam(gridSurface(24,14,(u,v)=>{const a=u*Math.PI*2,r=.029+.010*Math.pow(Math.sin(v*Math.PI),.7)+.003*v;
 return [Math.cos(a)*r,-.117+.128*v,Math.sin(a)*r*.93+.006*Math.sin(v*Math.PI)]}),24,14);
 return forearm;
}

const trousers=new Map();
export function trouserLegGeometry(sign=1){
 if(trousers.has(sign))return trousers.get(sign);
 const g=closeSurfaceSeam(gridSurface(32,16,(u,v)=>{
  const a=u*Math.PI*2,r=.066+.018*Math.sin(v*Math.PI)-.004*v,seam=1+.012*Math.cos(a*2);
  const t=T.MathUtils.clamp((v-.55)/.45,0,1),inset=-sign*.0315*t*t*(3-2*t);
  return [inset+Math.cos(a)*r*seam,-.085+.365*v,Math.sin(a)*r*.98];
 }),32,16);
 // Reserve the atlas top for the bib's stitched band. Trousers sample only
 // the quieter corduroy field, keeping the shared material/draw submission.
 const uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setY(i,uv.getY(i)*.60);
 trousers.set(sign,g);return g;
}

const shirts=new Map();
export function shirtFabric(id){
 if(shirts.has(id))return shirts.get(id);
 const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const c=canvas.getContext('2d');
 c.fillStyle={lina:'#dbaeb1',noor:'#bbd0bc',sami:'#d8c9ac'}[id]||'#d8c9ac';c.fillRect(0,0,128,128);
 c.lineWidth=.6;c.strokeStyle='rgba(255,245,226,.25)';for(let i=1;i<128;i+=4){c.beginPath();
 c.moveTo(i,0);c.lineTo(i,128);c.moveTo(0,i);c.lineTo(128,i);c.stroke()}
 if(id==='sami'){c.fillStyle='rgba(140,109,87,.15)';for(let y=5;y<128;y+=18)c.fillRect(0,y,128,2)}
 const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;
 const m=new T.MeshStandardMaterial({map,roughness:.91,bumpMap:surfaceFinish('fabric'),roughnessMap:surfaceFinish('fabric'),bumpScale:.0015,
   side:T.DoubleSide});m.userData.shared=true;shirts.set(id,m);return m;
}

// Project sewn details onto the same sampled bodice profile used by the mesh.
export function bodiceFront(x,y){
 const p=bodiceGeometry().attributes.position,stride=33;let row=0;
 while(row<23&&p.getY((row+1)*stride)<y)row++;
 const a=row*stride,b=(row+1)*stride,t=T.MathUtils.clamp((y-p.getY(a))/(p.getY(b)-p.getY(a)),0,1);
 const width=T.MathUtils.lerp(p.getX(a),p.getX(b),t),depth=T.MathUtils.lerp(p.getZ(a+8),p.getZ(b+8),t);
 return depth*Math.sqrt(Math.max(.01,1-(x/width)**2));
}

// Highest point of the existing upper bodice at a shoulder's x/z. Garment
// straps wrap this surface, not an unrelated floating spline above the collar.
export function bodiceTop(x,z){
 const p=bodiceGeometry().attributes.position,stride=33;
 const inside=(row)=>{const w=p.getX(row*stride),d=p.getZ(row*stride+8);return (x/w)**2+(z/d)**2<=1};
 let row=23;while(row>0&&!inside(row))row--;
 let a=0,b=1;for(let i=0;i<12;i++){const t=(a+b)/2,w=T.MathUtils.lerp(p.getX(row*stride),p.getX((row+1)*stride),t),
   d=T.MathUtils.lerp(p.getZ(row*stride+8),p.getZ((row+1)*stride+8),t);if((x/w)**2+(z/d)**2<=1)a=t;else b=t}
 return T.MathUtils.lerp(p.getY(row*stride),p.getY((row+1)*stride),(a+b)/2);
}
const shoulderStraps=new Map();
export function shoulderStrapGeometry(sign){
 if(shoulderStraps.has(sign))return shoulderStraps.get(sign);
 const g=gridSurface(4,28,(u,v)=>{
  const x=sign*(.086+.003*Math.sin(v*Math.PI))+(u-.5)*.027,z=.156-.30*v,edge=.095;
  const surface=bodiceTop(x,T.MathUtils.clamp(z,-edge,edge))+.007;
  const y=z>edge?T.MathUtils.lerp(.757,surface,(.156-z)/(.156-edge)):z<-edge?T.MathUtils.lerp(surface,.714,(-z-edge)/(.144-edge)):surface;
  return [x,y,z];
 },true);shoulderStraps.set(sign,g);return g;
}
