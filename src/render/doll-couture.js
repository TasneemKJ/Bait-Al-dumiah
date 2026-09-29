import * as T from 'three';
import {reliefTexture} from './textiles.js';

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
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();return g;
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
export function bellRadius(y) {
 const t=T.MathUtils.clamp((y-.337)/.398,0,1);
 return .126+.177*Math.pow(Math.cos(t*Math.PI/2),.85)-.024*Math.exp(-Math.pow(t/.070,2));
}
export function gatheredDressGeometry() {
 return closeSurfaceSeam(gridSurface(64,24,(u,v)=>{
  const a=u*Math.PI*2,y=.337+v*.398,r=bellRadius(y),fold=.006*Math.sin(a*14+.12)*(1-v*.75);
  return [Math.cos(a)*(r+fold),y-.75,Math.sin(a)*(r+fold)*.86];
 }),64,24);
}

// A broad lock with an elliptical section and tapered tip, rather than a tube
// laid across a hemisphere. Geometry retains shared UVs for subtle hair grain.
export function sweptLock(points,width,depth) {
 const path=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),center=new T.Vector3(),tangent=new T.Vector3(),side=new T.Vector3();
 return closeSurfaceSeam(gridSurface(12,24,(u,v)=>{
  path.getPoint(v,center);path.getTangent(v,tangent);side.set(-tangent.y,tangent.x,0).normalize();
  const a=u*Math.PI*2,taper=.035+.965*Math.pow(Math.sin(Math.PI*v),.56),rib=1+.035*Math.cos(a*6);
  return [center.x+side.x*Math.cos(a)*width*taper,center.y+side.y*Math.cos(a)*width*taper,center.z+Math.sin(a)*depth*taper*rib];
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
 }
 c.globalAlpha=.1;c.strokeStyle='#f8e4cf';c.lineWidth=.6;
 for(let i=1;i<256;i+=4){c.beginPath();c.moveTo(i,0);c.lineTo(i,256);c.moveTo(0,i);c.lineTo(256,i);c.stroke()}
 const map=new T.CanvasTexture(image);map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;
 const m=new T.MeshStandardMaterial({map,roughness:.88,bumpMap:reliefTexture('fabric'),bumpScale:.002,side:T.DoubleSide});m.userData.shared=true;fabrics.set(id,m);return m;
}
