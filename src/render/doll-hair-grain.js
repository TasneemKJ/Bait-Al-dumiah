import * as T from 'three';
let texture=null;const materials=new Map();
function strandRelief(){
 if(texture)return texture;const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const c=canvas.getContext('2d');c.fillStyle='#808080';c.fillRect(0,0,256,256);
 for(let i=0;i<72;i++){const x=i*256/72;c.lineWidth=i%3===0?1.1:.55;c.strokeStyle=i%2?'#acacac':'#606060';c.beginPath();c.moveTo(x,0);c.bezierCurveTo(x-10,85,x+10,170,x,256);c.stroke()}
 texture=new T.CanvasTexture(canvas);texture.name='sculpted-hair-strand-relief';return texture;
}
export function scalpMaterial(color){if(!materials.has(color))materials.set(color,new T.MeshStandardMaterial({color,roughness:.66,bumpMap:strandRelief(),bumpScale:.0025}));return materials.get(color)}
