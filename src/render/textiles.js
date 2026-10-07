import {surfaceFinish,walnutColor} from './atelier-surfaces.js';
import * as T from 'three';
const cache=new Map();
let radialMask=null;
const seeded=(i)=>{const v=Math.sin(i*127.1+311.7)*43758.5453;return v-Math.floor(v)};
function canvas(size=512){const c=document.createElement('canvas');c.width=c.height=size;return [c,c.getContext('2d')]}
function diamond(c,x,y,r){c.beginPath();c.moveTo(x,y-r);c.lineTo(x+r,y);c.lineTo(x,y+r);c.lineTo(x-r,y);c.closePath()}
function flower(c,x,y,r,ink){c.fillStyle=ink;for(let k=0;k<5;k++){const a=k*Math.PI*2/5;c.beginPath();
c.ellipse(x+Math.sin(a)*r*.55,y+Math.cos(a)*r*.55,r*.33,r*.60,-a,0,Math.PI*2);
c.fill()}c.fillStyle='#e7c181';c.beginPath();c.arc(x,y,r*.22,0,Math.PI*2);c.fill()}

function star8(c,x,y,outer,inner){
 const points=[];for(let i=0;i<16;i++){const a=-Math.PI/2+i*Math.PI/8,r=i%2?inner:outer;
 points.push([x+Math.cos(a)*r,y+Math.sin(a)*r])}
 c.beginPath();points.forEach(([px,py],i)=>i?c.lineTo(px,py):c.moveTo(px,py));c.closePath();
}
function steppedLozenge(c,x,y,rx,ry,steps=4){
 c.beginPath();c.moveTo(x,y-ry);for(let i=1;i<=steps;i++){const t=i/steps;
 c.lineTo(x+rx*t,y-ry*(1-t))}for(let i=1;i<=steps;i++){const t=i/steps;
 c.lineTo(x+rx*(1-t),y+ry*t)}for(let i=1;i<=steps;i++){const t=i/steps;
 c.lineTo(x-rx*t,y+ry*(1-t))}for(let i=1;i<=steps;i++){const t=i/steps;c.lineTo(x-rx*(1-t),y-ry*t)}c.closePath();
}
export function paintedTexture(kind,colors){
 if(kind==='wood')return walnutColor(colors[0]);
 const [image,c]=canvas();c.fillStyle=colors[0];c.fillRect(0,0,512,512);c.lineWidth=1.2;
 if(kind==='wall'){
  // Quiet limewashed field with an original geometric frieze and sparse jasmine.
  // Keep the wall subordinate to residents and furniture at miniature scale.
  c.globalAlpha=.18;c.strokeStyle=colors[1];c.lineWidth=1.1;
  for(const y of [66,446]){
   c.beginPath();c.moveTo(0,y);c.lineTo(512,y);c.stroke();
   c.globalAlpha=.34;c.fillStyle=colors[1];
   for(let x=18;x<512;x+=32){steppedLozenge(c,x,y,7,5,2);c.fill()}
   c.globalAlpha=.18;
  }
  for(const [x,y,flip] of [[92,258,1],[256,218,-1],[416,286,1]]){
   c.strokeStyle=colors[1];c.globalAlpha=.30;c.lineWidth=1.25;
   c.beginPath();c.moveTo(x,y+54);c.bezierCurveTo(x+flip*20,y+28,x-flip*12,y-6,x+flip*5,y-48);c.stroke();
   for(let j=0;j<4;j++){
    const yy=y+34-j*24,xx=x+flip*(j%2?9:-5);c.fillStyle=colors[1];c.globalAlpha=.25;
    c.beginPath();c.ellipse(xx+flip*8,yy,8.5,3.2,flip*.58,0,Math.PI*2);c.fill();
   }
   c.globalAlpha=.52;flower(c,x+flip*4,y-48,5.5,colors[1]);
  }
 }else if(kind==='tile'){
  const size=64;
  for(let y=0;y<512;y+=size)for(let x=0;x<512;x+=size){
   c.globalAlpha=.12;c.fillStyle='#40373a';c.fillRect(x,y,size,size);c.globalAlpha=1;
   c.fillStyle=(x/64+y/64)%2?colors[0]:'#ead8bd';c.fillRect(x+1.5,y+1.5,size-3,size-3);
   c.fillStyle=colors[1];c.globalAlpha=.72;star8(c,x+32,y+32,25,10);c.fill();
   c.fillStyle='#f0dfc5';c.globalAlpha=.92;star8(c,x+32,y+32,14,6);c.fill();
   c.strokeStyle=colors[1];c.globalAlpha=.7;c.lineWidth=1.4;diamond(c,x+32,y+32,29);c.stroke();
   c.fillStyle=colors[1];c.globalAlpha=.65;c.fillRect(x+29,y+29,6,6);
  }
 }else if(kind==='rug'){
  c.fillStyle=colors[1];c.fillRect(5,5,502,502);c.fillStyle=colors[0];c.fillRect(14,14,484,484);
  c.strokeStyle=colors[1];c.lineWidth=3;for(const inset of [22,49,66])c.strokeRect(inset,inset,512-2*inset,512-2*inset);
  c.fillStyle=colors[1];for(let i=0;i<18;i++){const x=36+i*26;
  for(const [a,b] of [[x,35],[x,477],[35,x],[477,x]]){steppedLozenge(c,a,b,7,7,2);c.fill()}}
  c.globalAlpha=.34;for(let y=103;y<430;y+=58)for(let x=101;x<430;x+=58){star8(c,x,y,8,
    3.5);c.fillStyle=colors[1];c.fill()}
  c.globalAlpha=1;for(const [cx,scale] of [[170,.82],[256,1.0],[342,.82]]){
   steppedLozenge(c,cx,256,66*scale,118*scale,5);c.fillStyle=colors[1];c.fill();
   steppedLozenge(c,cx,256,48*scale,86*scale,5);c.fillStyle=colors[0];c.fill();
   star8(c,cx,256,28*scale,11*scale);c.fillStyle=colors[1];c.fill();
  }
  c.strokeStyle=colors[1];c.globalAlpha=.8;c.lineWidth=2;for(const y of [82,430]){c.beginPath();
  for(let x=78;x<=434;x+=18)c.lineTo(x,y+((x/18)%2?7:-7));c.stroke()}
 }else if(kind==='wood'){
  for(let i=0;i<160;i++){c.globalAlpha=.07+seeded(i)*.10;
  c.strokeStyle=i%3?'#50372f':'#f7d0a2';c.lineWidth=.5+seeded(i+2)*2;c.beginPath();
  const y=i*3.3;c.moveTo(0,y);for(let x=0;x<=512;x+=16)c.lineTo(x,y+Math.sin(x*.025+i)*1.5);c.stroke()}
  for(let i=0;i<4;i++){c.globalAlpha=.17;c.strokeStyle='#513c32';c.strokeRect(0,i*128,512,128)}
 }else if(kind==='fabric'){
  c.globalAlpha=.18;c.strokeStyle=colors[1];for(let i=0;i<512;i+=4){c.beginPath();c.moveTo(i,0);
  c.lineTo(i,512);c.moveTo(0,i);c.lineTo(512,i);c.stroke()}
  c.globalAlpha=.2;for(let y=24;y<512;y+=64)for(let x=24;x<512;x+=64)flower(c,x,y,9,colors[1]);
 }
 // Fine paper/fibre variation is baked once rather than animated screen noise.
 for(let i=0;i<4500;i++){c.globalAlpha=.028;c.fillStyle=i%2?'#fff8e6':'#312332';
 c.fillRect(seeded(i)*512,seeded(i+77)*512,1+seeded(i+3)*2,1)}
 c.globalAlpha=1;const tex=new T.CanvasTexture(image);tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=4;
 if(kind==='wall')tex.userData.pattern='limewash-jasmine-frieze';
 if(kind==='rug')tex.userData.pattern='stepped-lozenge-weave';
 if(kind==='tile')tex.userData.pattern='eight-point-stone-star';return tex;
}
// Height data is shared, linear, and independent of the painted color layer.
const reliefCache=new Map();
export function reliefTexture(kind){
 if(reliefCache.has(kind))return reliefCache.get(kind);
 const size=256,data=new Uint8Array(size*size*4);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const grain=Math.sin(y*.51+Math.sin(x*.035)*1.6)*18+Math.sin(y*1.4+x*.008)*7;
  const weave=Math.sin(x*Math.PI/2)*Math.cos(y*Math.PI/2)*18+Math.sin(y*Math.PI/2)*9;
  const value=Math.round(128+(kind==='fabric'?weave:grain));const i=(y*size+x)*4;
  data[i]=data[i+1]=data[i+2]=value;data[i+3]=255;
 }
 const texture=new T.DataTexture(data,size,size);
 texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.magFilter=T.LinearFilter;
 texture.minFilter=T.LinearMipmapLinearFilter;texture.generateMipmaps=true;texture.needsUpdate=true;
 texture.userData.shared=true;reliefCache.set(kind,texture);return texture;
}
export function craftMaterial(color,kind='fabric'){
 const key=`${kind}:${color}`;if(cache.has(key))return cache.get(key);
 const hex='#'+new T.Color(color).getHexString();const map=paintedTexture(kind,[hex,kind==='wood'?'#eccfa5':'#f5dfc4']);
 const m=new T.MeshStandardMaterial({map,roughness:kind==='wood'?.72:.98});
 if(kind==='wood'||kind==='fabric'){m.bumpMap=surfaceFinish(kind);
 m.roughnessMap=m.bumpMap;m.bumpScale=kind==='wood'?.0075:.0025}m.userData.shared=true;cache.set(key,m);return m;
}
export function softTexture(){
 if(radialMask)return radialMask;
 const [image,c]=canvas(128),g=c.createRadialGradient(64,64,0,64,64,64);
 g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.16,'rgba(255,255,255,.65)');
 g.addColorStop(.45,'rgba(255,255,255,.15)');
 g.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=g;c.fillRect(0,0,128,128);
 radialMask=new T.CanvasTexture(image);radialMask.userData.shared=true;return radialMask;
}
