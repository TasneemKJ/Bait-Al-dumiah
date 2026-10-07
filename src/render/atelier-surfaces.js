import * as T from 'three';

// A finite, shared surface library. Red = height, green = roughness; both are
// linear data. Mipmaps let the close-up craft detail recede at phone distance.
const finishes=new Map(),woodColors=new Map(),SIZE=512,TAU=Math.PI*2;
const byte=x=>Math.max(0,Math.min(255,Math.round(x)));
export function walnutField(u,v){
 const bend=.043*Math.sin(TAU*u)+.018*Math.sin(TAU*u*2);
 const rings=Math.sin(TAU*(v*26+bend*9));
 const fibres=Math.sin(TAU*(v*113+bend*23));
 const pores=Math.pow(Math.max(0,Math.sin(TAU*(v*181+bend*31))),14)
  *(.5+.5*Math.cos(TAU*u*7));
 return {rings,fibres,pores};
}
export function packedFinish(data,width,height,name){
 const map=new T.DataTexture(data,width,height,T.RGBAFormat);
 map.name=name;map.colorSpace=T.NoColorSpace;map.wrapS=map.wrapT=T.RepeatWrapping;
 map.minFilter=T.LinearMipmapLinearFilter;map.magFilter=T.LinearFilter;
 map.generateMipmaps=true;map.anisotropy=4;map.needsUpdate=true;map.userData.shared=true;
 return map;
}
export function surfaceFinish(kind='fabric'){
 const key=['wood','fabric','brass','ceramic'].includes(kind)?kind:'fabric';
 if(finishes.has(key))return finishes.get(key);
 const data=new Uint8Array(SIZE*SIZE*4);
 for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++){
  const u=x/SIZE,v=y/SIZE;let h=128,r=220;
  if(key==='wood'){
   const f=walnutField(u,v);h=128+12*f.rings+3*f.fibres-6*f.pores;
   r=205+18*f.rings+5*f.fibres+11*f.pores;
  }else if(key==='fabric'){
   const warp=Math.cos(TAU*u*128),weft=Math.cos(TAU*v*128);
   const over=Math.cos(TAU*u*64)*Math.cos(TAU*v*64);
   h=128+12*warp+10*weft+7*over;r=235+8*warp+7*weft;
  }else if(key==='brass'){
   // Small, soft hammer depressions and long polishing traces, not glitter.
   const a=Math.sin(TAU*(u*35+.05*Math.sin(TAU*v*11)));
   const b=Math.sin(TAU*(v*37+.07*Math.sin(TAU*u*9)));
   const bowl=(a*a+b*b)*.5,polish=Math.sin(TAU*v*96);
   h=128-8*bowl+1.5*polish;r=181+39*bowl+5*polish;
  }else{
   const turning=Math.sin(TAU*(v*47+.06*Math.sin(TAU*u*3)));
   const glaze=Math.sin(TAU*u*7)*Math.cos(TAU*v*9);
   h=128+2*turning+1.5*glaze;r=203+13*glaze+5*turning;
  }
  const i=(y*SIZE+x)*4;data[i]=byte(h);data[i+1]=byte(r);data[i+2]=0;data[i+3]=255;
 }
 const map=packedFinish(data,SIZE,SIZE,`atelier-${key}-finish`);finishes.set(key,map);return map;
}
export function walnutColor(color){
 const key=new T.Color(color).getHexString();if(woodColors.has(key))return woodColors.get(key);
 const canvas=document.createElement('canvas');canvas.width=canvas.height=SIZE;
 const c=canvas.getContext('2d'),image=c.createImageData(SIZE,SIZE),base=parseInt(key,16);
 const rgb=[base>>16&255,base>>8&255,base&255];
 for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++){
  const f=walnutField(x/SIZE,y/SIZE),tone=1+.072*f.rings+.022*f.fibres-.065*f.pores;
  const i=(y*SIZE+x)*4;for(let k=0;k<3;k++)image.data[i+k]=byte(rgb[k]*tone);image.data[i+3]=255;
 }
 c.putImageData(image,0,0);const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;
 map.name='waxed-walnut-'+key;map.anisotropy=4;map.userData.shared=true;woodColors.set(key,map);return map;
}

const ceramicColors=new Map();
export function ceramicColor(color){
 const key=new T.Color(color).getHexString();if(ceramicColors.has(key))return ceramicColors.get(key);
 const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const c=canvas.getContext('2d');
 c.fillStyle='#'+key;c.fillRect(0,0,256,256);
 // Delicate painted bands belong near a vessel's rim and foot, not a busy field.
 for(const y of [27,34,221,228]){
  c.lineWidth=y===27||y===228?1.6:.7;c.strokeStyle=y===27||y===228?'#77817c':'#b8a07b';
  c.globalAlpha=.68;c.beginPath();
  for(let x=0;x<=256;x+=2){const yy=y+.35*Math.sin(x/256*TAU*3);x?c.lineTo(x,yy):c.moveTo(x,yy)}c.stroke();
 }
 for(const cx of [68,196]){
  c.globalAlpha=.63;c.strokeStyle='#637e75';c.lineWidth=1;c.beginPath();
  c.moveTo(cx-11,158);c.bezierCurveTo(cx+10,143,cx-9,124,cx+4,103);c.stroke();
  for(let i=0;i<4;i++){
   const x=cx+Math.sin(i*1.6)*3+(i%2?6:-6),y=116+i*10;
   c.fillStyle='#6c857a';c.beginPath();c.ellipse(x,y,5.4,2.1,i%2?-.65:.65,0,TAU);c.fill();
  }
  c.globalAlpha=.9;c.fillStyle='#fff1d5';
  for(let i=0;i<5;i++){const a=i*TAU/5;c.beginPath();
  c.ellipse(cx+4+Math.sin(a)*3,103+Math.cos(a)*3,1.5,3,-a,0,TAU);c.fill()}
  c.fillStyle='#bba26b';c.beginPath();c.arc(cx+4,103,1.4,0,TAU);c.fill();
 }
 c.globalAlpha=1;const map=new T.CanvasTexture(canvas);map.name='atelier-ceramic-pigment-'+key;
 map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;map.userData.shared=true;ceramicColors.set(key,map);return map;
}
