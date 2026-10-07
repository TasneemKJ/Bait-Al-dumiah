import * as T from 'three';
let texture=null;const materials=new Map();
function strandRelief(){
 if(texture)return texture;const canvas=document.createElement('canvas');canvas.width=canvas.height=256;
 const c=canvas.getContext('2d');c.fillStyle='#808080';c.fillRect(0,0,256,256);
 for(let i=0;i<72;i++){const x=i*256/72;c.lineWidth=i%3===0?1.1:.55;
 c.strokeStyle=i%2?'#acacac':'#606060';c.beginPath();c.moveTo(x,0);c.bezierCurveTo(x-10,85,x+10,170,x,256);c.stroke()}
 texture=new T.CanvasTexture(canvas);texture.name='sculpted-hair-strand-relief';return texture;
}
const colorMaps=new Map();
function paintedStrands(color){
 if(colorMaps.has(color))return colorMaps.get(color);
 const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const c=canvas.getContext('2d');
 c.fillStyle='#'+color.toString(16).padStart(6,'0');c.fillRect(0,0,256,256);
 const glaze=c.createLinearGradient(0,0,0,256);
 glaze.addColorStop(0,'rgba(208,155,109,.15)');glaze.addColorStop(.42,'rgba(209,163,130,.08)');
 glaze.addColorStop(1,'rgba(19,13,26,.19)');c.fillStyle=glaze;c.fillRect(0,0,256,256);
 for(let i=0;i<48;i++){const x=i*256/48;
 c.strokeStyle=i%3===0?'rgba(228,182,130,.14)':'rgba(16,10,21,.12)';c.lineWidth=i%3===0?1.3:.8;c.beginPath();
 c.moveTo(x,0);c.bezierCurveTo(x-9,80,x+8,178,x,256);c.stroke()}
 const map=new T.CanvasTexture(canvas);map.name='painted-hair-strands';
 map.colorSpace=T.SRGBColorSpace;colorMaps.set(color,map);return map;
}
export function scalpMaterial(color){if(!materials.has(color))materials.set(color,
  new T.MeshStandardMaterial({color:0xffffff,
  map:paintedStrands(color),roughness:.66,bumpMap:strandRelief(),bumpScale:.0025}));return materials.get(color)}
