import * as T from 'three';
const cache=new Map();
let radialMask=null;
const seeded=(i)=>{const v=Math.sin(i*127.1+311.7)*43758.5453;return v-Math.floor(v)};
function canvas(size=512){const c=document.createElement('canvas');c.width=c.height=size;return [c,c.getContext('2d')]}
function diamond(c,x,y,r){c.beginPath();c.moveTo(x,y-r);c.lineTo(x+r,y);c.lineTo(x,y+r);c.lineTo(x-r,y);c.closePath()}
function flower(c,x,y,r,ink){c.fillStyle=ink;for(let k=0;k<5;k++){const a=k*Math.PI*2/5;c.beginPath();c.ellipse(x+Math.sin(a)*r*.55,y+Math.cos(a)*r*.55,r*.33,r*.60,-a,0,Math.PI*2);c.fill()}c.fillStyle='#e7c181';c.beginPath();c.arc(x,y,r*.22,0,Math.PI*2);c.fill()}
export function paintedTexture(kind,colors){
 const [image,c]=canvas();c.fillStyle=colors[0];c.fillRect(0,0,512,512);c.lineWidth=1.2;
 if(kind==='wall'){
  // Hand-painted branching jasmine, not a generic geometric wallpaper.
  for(let row=-1;row<6;row++)for(let col=-1;col<6;col++){
   const x=col*104+(row%2)*52,y=row*112;c.strokeStyle=colors[1];c.globalAlpha=.42;
   c.beginPath();c.moveTo(x,y+42);c.bezierCurveTo(x+33,y+14,x-18,y-18,x+2,y-44);c.stroke();
   for(let j=0;j<4;j++){const yy=y-30+j*18,xx=x+Math.sin(j*1.8)*9;c.fillStyle=colors[1];c.beginPath();c.ellipse(xx+(j%2?9:-9),yy,10,3.8,j%2?-.6:.6,0,Math.PI*2);c.fill()}
   c.globalAlpha=.82;flower(c,x+1,y-41,7.5,colors[1]);flower(c,x+16,y+6,5,colors[1]);
  }
 }else if(kind==='tile'){
  const size=64;
  for(let y=0;y<512;y+=size)for(let x=0;x<512;x+=size){
   c.globalAlpha=.10;c.fillStyle='#352e31';c.fillRect(x,y,size,size);c.globalAlpha=1;c.fillStyle=(x/64+y/64)%2?colors[0]:'#eddbc2';c.fillRect(x+1.5,y+1.5,size-3,size-3);
   c.strokeStyle=colors[1];c.lineWidth=1.8;diamond(c,x+32,y+32,25);c.stroke();c.globalAlpha=.55;diamond(c,x+32,y+32,12);c.fillStyle=colors[1];c.fill();
   c.globalAlpha=.8;for(let i=0;i<4;i++){const a=i*Math.PI/2;c.beginPath();c.ellipse(x+32+Math.cos(a)*17,y+32+Math.sin(a)*17,6,2.8,a,0,Math.PI*2);c.fill()}
  }
 }else if(kind==='rug'){
  c.fillStyle=colors[1];c.fillRect(5,5,502,502);c.fillStyle=colors[0];c.fillRect(14,14,484,484);
  c.strokeStyle=colors[1];c.lineWidth=3;for(const inset of [22,49,66])c.strokeRect(inset,inset,512-2*inset,512-2*inset);
  for(let i=0;i<18;i++){const x=36+i*26;for(const [a,b] of [[x,35],[x,477],[35,x],[477,x]]){diamond(c,a,b,7);c.fillStyle=colors[1];c.fill()}}
  for(let y=96;y<450;y+=54)for(let x=95;x<450;x+=54){c.globalAlpha=.34;flower(c,x,y,8,colors[1])}
  c.globalAlpha=1;for(const r of [167,153,131,118,85,65,35]){diamond(c,256,256,r);c.fillStyle=[167,131,85,35].includes(r)?colors[1]:colors[0];c.fill()}
  c.fillStyle=colors[1];for(const [x,y] of [[110,110],[402,110],[110,402],[402,402]])flower(c,x,y,18,colors[1]);
 }else if(kind==='wood'){
  for(let i=0;i<160;i++){c.globalAlpha=.07+seeded(i)*.10;c.strokeStyle=i%3?'#50372f':'#f7d0a2';c.lineWidth=.5+seeded(i+2)*2;c.beginPath();const y=i*3.3;c.moveTo(0,y);for(let x=0;x<=512;x+=16)c.lineTo(x,y+Math.sin(x*.025+i)*1.5);c.stroke()}
  for(let i=0;i<4;i++){c.globalAlpha=.17;c.strokeStyle='#513c32';c.strokeRect(0,i*128,512,128)}
 }else if(kind==='fabric'){
  c.globalAlpha=.18;c.strokeStyle=colors[1];for(let i=0;i<512;i+=4){c.beginPath();c.moveTo(i,0);c.lineTo(i,512);c.moveTo(0,i);c.lineTo(512,i);c.stroke()}
  c.globalAlpha=.2;for(let y=24;y<512;y+=64)for(let x=24;x<512;x+=64)flower(c,x,y,9,colors[1]);
 }
 // Fine paper/fibre variation is baked once rather than animated screen noise.
 for(let i=0;i<4500;i++){c.globalAlpha=.028;c.fillStyle=i%2?'#fff8e6':'#312332';c.fillRect(seeded(i)*512,seeded(i+77)*512,1+seeded(i+3)*2,1)}
 c.globalAlpha=1;const tex=new T.CanvasTexture(image);tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=4;return tex;
}
// Height data is shared, linear, and independent of the painted color layer.
const reliefCache=new Map();
export function reliefTexture(kind){
 if(reliefCache.has(kind))return reliefCache.get(kind);
 const size=256,data=new Uint8Array(size*size*4);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const grain=Math.sin(y*.51+Math.sin(x*.035)*1.6)*18+Math.sin(y*1.4+x*.008)*7;
  const weave=Math.sin(x*Math.PI/2)*Math.cos(y*Math.PI/2)*18+Math.sin(y*Math.PI/2)*9;
  const value=Math.round(128+(kind==='fabric'?weave:grain));const i=(y*size+x)*4;data[i]=data[i+1]=data[i+2]=value;data[i+3]=255;
 }
 const texture=new T.DataTexture(data,size,size);texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.magFilter=T.LinearFilter;texture.minFilter=T.LinearMipmapLinearFilter;texture.generateMipmaps=true;texture.needsUpdate=true;texture.userData.shared=true;reliefCache.set(kind,texture);return texture;
}
export function craftMaterial(color,kind='fabric'){
 const key=`${kind}:${color}`;if(cache.has(key))return cache.get(key);
 const hex='#'+new T.Color(color).getHexString();const map=paintedTexture(kind,[hex,kind==='wood'?'#eccfa5':'#f5dfc4']);
 const m=new T.MeshStandardMaterial({map,roughness:kind==='wood'?.64:.96});if(kind==='wood'||kind==='fabric'){m.bumpMap=reliefTexture(kind);m.bumpScale=kind==='wood'?.018:.0045}m.userData.shared=true;cache.set(key,m);return m;
}
export function softTexture(){
 if(radialMask)return radialMask;
 const [image,c]=canvas(128),g=c.createRadialGradient(64,64,0,64,64,64);
 g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.16,'rgba(255,255,255,.65)');g.addColorStop(.45,'rgba(255,255,255,.15)');g.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=g;c.fillRect(0,0,128,128);
 radialMask=new T.CanvasTexture(image);radialMask.userData.shared=true;return radialMask;
}
