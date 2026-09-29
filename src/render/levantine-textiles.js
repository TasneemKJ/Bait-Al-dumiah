// Original toy-scale cross-stitch compositions, not replicas of regional dress.
export function paintLevantineLinen(c,id){
 const linen=id==='noor'?'#e6e6d5':'#efe0c5';
 const thread=id==='noor'?'#536852':'#923d4b',accent=id==='noor'?'#914d4e':'#576b52';
 c.save();c.fillStyle=linen;c.fillRect(0,0,256,384);
 c.lineWidth=.55;c.strokeStyle='rgba(113,86,62,.13)';
 for(let y=0;y<384;y+=3){c.beginPath();c.moveTo(0,y);c.lineTo(256,y);c.stroke()}
 c.strokeStyle='rgba(255,251,229,.35)';
 for(let x=1;x<256;x+=4){c.beginPath();c.moveTo(x,0);c.lineTo(x,384);c.stroke()}
 const stitch=(x,y,color=thread)=>{c.lineWidth=1.45;c.lineCap='round';c.strokeStyle=color;c.beginPath();c.moveTo(x-1.7,y-1.7);c.lineTo(x+1.7,y+1.7);c.moveTo(x+1.7,y-1.7);c.lineTo(x-1.7,y+1.7);c.stroke()};
 const diamond=(cx,cy,r)=>{for(let y=-r;y<=r;y++)for(let x=-r;x<=r;x++){const d=Math.abs(x)+Math.abs(y);if(d===r||d===r-1||d<=1)stitch(cx+x*5,cy+y*5)}};
 for(let y=29;y<=104;y+=5)for(const x of [68,73,183,188])stitch(x,y);
 for(let x=78;x<=178;x+=5)for(const y of [29,34,99,104])stitch(x,y);
 for(const x of [98,128,158]){diamond(x,67,4);for(const y of [39,94])stitch(x,y,accent)}
 for(let x=23;x<236;x+=5)for(const y of [282,287,341,346])stitch(x,y);
 for(let x=38;x<235;x+=36){diamond(x,315,4);stitch(x,290,accent);stitch(x,340,accent)}
 for(let y=139;y<278;y+=6)for(const x of [19,24,232,237])stitch(x,y,accent);
 c.strokeStyle='#bb9b64';c.lineWidth=1;c.setLineDash([2,3]);c.beginPath();c.moveTo(12,0);c.lineTo(12,352);c.quadraticCurveTo(128,374,244,352);c.lineTo(244,0);c.stroke();c.restore();
}
