import {packedFinish} from './atelier-surfaces.js';
const atlasCache=new Map();
// Original toy-scale compositions, not replicas of a named regional dress.
// One layout drives pigment, thread relief and roughness at identical UVs.
function layout(stitch){
 const diamond=(cx,cy,r)=>{for(let y=-r;y<=r;y++)for(let x=-r;x<=r;x++){
  const d=Math.abs(x)+Math.abs(y);if(d===r||d===r-1||d<=1)stitch(cx+x*5,cy+y*5);
 }};
 for(let y=29;y<=104;y+=5)for(const x of [68,73,183,188])stitch(x,y);
 for(let x=78;x<=178;x+=5)for(const y of [29,34,99,104])stitch(x,y);
 for(const x of [98,128,158]){diamond(x,67,4);for(const y of [39,94])stitch(x,y,true)}
 for(let x=23;x<236;x+=5)for(const y of [282,287,341,346])stitch(x,y);
 for(let x=38;x<235;x+=36){diamond(x,315,4);stitch(x,290,true);stitch(x,340,true)}
 for(let y=139;y<278;y+=6)for(const x of [19,24,232,237])stitch(x,y,true);
}
function segment(c,x,y,up,width,color,offset=0){
 c.strokeStyle=color;c.lineWidth=width;c.beginPath();
 c.moveTo(x-1.7,y+(up?1.7:-1.7)+offset);c.lineTo(x+1.7,y+(up?-1.7:1.7)+offset);c.stroke();
}
export function paintLevantineLinen(c,id,layer='color'){
 const height=layer==='height',rough=layer==='roughness',data=height||rough;
 const linen=id==='noor'?'#e6e6d5':'#efe0c5';
 const thread=id==='noor'?'#536852':'#923d4b',accent=id==='noor'?'#914d4e':'#576b52';
 c.save();c.scale(c.canvas.width/256,c.canvas.height/384);
 c.fillStyle=height?'#707070':rough?'#efefef':linen;c.fillRect(0,0,256,384);
 c.lineWidth=.45;c.strokeStyle=data?(height?'#818181':'#e3e3e3'):'rgba(113,86,62,.11)';
 for(let y=0;y<384;y+=3){c.beginPath();c.moveTo(0,y);c.lineTo(256,y);c.stroke()}
 c.strokeStyle=data?(height?'#787878':'#ededed'):'rgba(255,251,229,.32)';
 for(let x=1;x<256;x+=4){c.beginPath();c.moveTo(x,0);c.lineTo(x,384);c.stroke()}
 c.lineCap='round';
 layout((x,y,isAccent=false)=>{
  const ink=isAccent?accent:thread;
  if(!data){
   // A short under-thread shadow; crossed strands have separate highlights.
   segment(c,x,y,false,1.8,'rgba(81,50,39,.18)',.5);
   segment(c,x,y,true,1.8,'rgba(81,50,39,.18)',.5);
  }
  segment(c,x,y,false,1.45,height?'#b8b8b8':rough?'#bcbcbc':ink);
  segment(c,x,y,true,1.45,height?'#d3d3d3':rough?'#b3b3b3':ink);
  if(!data){
   segment(c,x,y,false,.26,'rgba(255,227,184,.32)',-.30);
   segment(c,x,y,true,.28,'rgba(255,240,204,.46)',-.28);
   c.fillStyle='rgba(72,46,36,.16)';for(const a of [-1,1]){c.beginPath();c.arc(x+a*1.95,y+a*1.95,.28,0,Math.PI*2);c.fill()}
  }
 });
 c.strokeStyle=height?'#aaaaaa':rough?'#bfbfbf':'#bb9b64';c.lineWidth=.8;c.setLineDash([2,3]);
 c.beginPath();c.moveTo(12,0);c.lineTo(12,352);c.quadraticCurveTo(128,374,244,352);c.lineTo(244,0);c.stroke();c.restore();
}
export function embroideryFinish(id){
 if(atlasCache.has(id))return atlasCache.get(id);
 const channels=['height','roughness'].map(layer=>{
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=768;
  const c=canvas.getContext('2d');paintLevantineLinen(c,id,layer);return c.getImageData(0,0,512,768).data;
 });
 const data=new Uint8Array(512*768*4);
 for(let i=0;i<data.length;i+=4){data[i]=channels[0][i];data[i+1]=channels[1][i];data[i+2]=0;data[i+3]=255}
 const map=packedFinish(data,512,768,`stitched-finish-${id}`);map.flipY=true;atlasCache.set(id,map);return map;
}
