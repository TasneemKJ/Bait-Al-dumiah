import * as T from 'three';
import {ROOMS} from '../content.js';
import {palette as P,box,ball,cylinder,ring,line,glaze,batch} from './primitives.js';
import {cloth} from './fabric-shapes.js';
import {reliefTexture} from './textiles.js';
const pieces=[];
const group=name=>{const g=new T.Group();g.name=name;return g};
export function pastryTray(){
 const g=group('pastry-tray');box(g,0,.025,0,.59,.05,.35,P.gold,true);box(g,0,.056,0,.54,.022,.30,0xecd4b6,true);
 for(let i=0;i<5;i++){const p=group('pastry');p.position.set((i%3-1)*.15,.09,(i<3?-.065:.07));g.add(p);
 ball(p,0,.025,0,.065,.037,.055,i%2?0xc78c54:0xdaa968);
  for(let k=-1;k<=1;k++)line(p,[k*.023-.015,.055,-.029],[k*.023+.013,.055,.029],.0045,0xf0d5a5);
 }
 return g;
}
pieces.push({room:'kitchen',at:[-.46,1.04,-.99],build:pastryTray});
export function createKeepsakeDetails(parent){
 const root=group('handmade-room-keepsakes');parent.add(root);
 for(const piece of pieces){const room=ROOMS.find(r=>r.id===piece.room),node=piece.build();
 node.position.set(room.x+piece.at[0],room.y+piece.at[1],piece.at[2]);root.add(node)}
 batch(root);return root;
}
export function spoonCrock(){
 const g=group('spoon-crock');cylinder(g,0,.115,0,.095,.23,glaze(0x94ae9d),.85);ring(g,0,.225,0,.095,.012,P.cream,true);
 cylinder(g,0,.227,0,.077,.008,0x675349);
 for(let i=0;i<3;i++){const spoon=group('wooden-spoon');spoon.position.set((i-1)*.035,.16,0);spoon.rotation.z=(i-1)*-.20;g.add(spoon);
 line(spoon,[0,0,0],[0,.24,0],.009,0xc49c72);ball(spoon,0,.285,0,.032,.053,.012,0xc49c72)}
 return g;
}
pieces.push({room:'kitchen',at:[.58,1.04,-1.18],build:spoonCrock});
let towelMaterial=null;
export function teaTowel(){
 const g=group('kitchen-towel');
 if(!towelMaterial){const c=document.createElement('canvas');c.width=c.height=128;const p=c.getContext('2d');p.fillStyle='#eadbc2';
 p.fillRect(0,0,128,128);p.fillStyle='#829e94';for(const x of [18,25,98,105])p.fillRect(x,0,4,128);const map=new T.CanvasTexture(c);
 map.colorSpace=T.SRGBColorSpace;
 towelMaterial=new T.MeshStandardMaterial({map,bumpMap:reliefTexture('fabric'),bumpScale:.004,roughness:1,side:T.DoubleSide})}
 const geometry=new T.PlaneGeometry(.28,.38,12,10),p=geometry.attributes.position;
 for(let i=0;i<p.count;i++)p.setZ(i,.022*Math.cos(p.getX(i)*65));geometry.computeVertexNormals();
 const mesh=new T.Mesh(geometry,towelMaterial);mesh.name='striped-tea-towel';g.add(mesh);line(g,[-.17,.19,-.015],[.17,.19,-.015],.012,P.gold);
 for(let i=0;i<10;i++)line(g,[-.125+i*.027,-.19,0],[-.125+i*.027,-.215,0],.003,P.cream);return g;
}
pieces.push({room:'kitchen',at:[-1.4,.62,-.654],build:teaTowel});
const labelMaterials=[];
export function pantryJars(){
 const g=group('botanical-pantry-jars');
 for(let i=0;i<4;i++){
  if(!labelMaterials[i]){const c=document.createElement('canvas');c.width=c.height=128;const p=c.getContext('2d');p.fillStyle='#f0dfc5';
  p.fillRect(0,0,128,128);p.strokeStyle='#a78964';p.lineWidth=3;p.strokeRect(7,7,114,114);p.strokeStyle='#7e9674';p.beginPath();p.moveTo(65,99);
  p.quadraticCurveTo(41,61,64,29);p.stroke();p.fillStyle=['#b37a8c','#9785a8','#c29b58','#87a494'][i];for(let k=0;k<4;k++){p.beginPath();
  p.ellipse(58+(k%2?14:-7),37+k*15,12,7,k%2?-.5:.5,0,Math.PI*2);p.fill()}const map=new T.CanvasTexture(c);
  map.colorSpace=T.SRGBColorSpace;labelMaterials[i]=new T.MeshStandardMaterial({map,roughness:1})}
  const label=new T.Mesh(new T.PlaneGeometry(.15,.19),labelMaterials[i]);
  label.name='botanical-jar-label';label.position.set(-.88+i*.36,2.44,-1.196);g.add(label);
 }
 return g;
}
pieces.push({room:'kitchen',at:[0,0,0],build:pantryJars});
let storyMaterial=null;
export function storybook(){
 const g=group('open-storybook');const cover=box(g,0,.009,0,.40,.018,.29,0x8c6979,true);cover.name='storybook-binding';
 if(!storyMaterial){const c=document.createElement('canvas');c.width=256;c.height=128;const p=c.getContext('2d');p.fillStyle='#ead8b8';
 p.fillRect(0,0,256,128);p.strokeStyle='#a38565';p.lineWidth=2;for(let y=24;y<110;y+=12){p.beginPath();p.moveTo(143,y);p.lineTo(235-(y%3)*9,y);
 p.stroke()}p.strokeStyle='#8b9d76';p.beginPath();p.moveTo(62,107);p.quadraticCurveTo(43,66,66,22);p.stroke();
 for(let k=0;k<5;k++){p.fillStyle=k%2?'#b08290':'#9aa884';p.beginPath();p.ellipse(58+(k%2?10:-10),32+k*13,12,5,k%2?-.6:.6,0,Math.PI*2);
 p.fill()}const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;
 storyMaterial=new T.MeshStandardMaterial({map,roughness:1,side:T.DoubleSide})}
 for(const sign of [-1,1]){const geo=new T.PlaneGeometry(.18,.26,10,2);geo.rotateX(-Math.PI/2);const p=geo.attributes.position,uv=geo.attributes.uv;
 for(let i=0;i<p.count;i++){const x=p.getX(i)+sign*.09;p.setX(i,x);p.setY(i,.026+Math.sin(Math.abs(x)/.18*Math.PI)*.025+Math.abs(x)*.10);
 uv.setX(i,(x+.18)/.36)}geo.computeVertexNormals();const page=new T.Mesh(geo,storyMaterial);
 page.name='storybook-page';page.receiveShadow=true;g.add(page)}
 line(g,[0,.034,-.13],[0,.034,.13],.004,P.gold);return g;
}
pieces.push({room:'parlor',at:[.26,.521,.46],build:storybook});
export function cushionEmbroidery(){
 const g=group('embroidered-cushion'),sewn=group('cushion-embroidery');g.add(sewn);
 line(sewn,[0,-.075,.003],[.012,.08,.003],.0035,0x859977);
 for(let i=0;i<5;i++){const a=i*Math.PI*2/5;line(sewn,[.012,.067,.008],[.012+Math.sin(a)*.048,.067+Math.cos(a)*.048,.008],.008,0xb58191)}
 for(let i=0;i<3;i++)line(sewn,[0,-.045+i*.037,.004],[i%2?.035:-.035,-.025+i*.037,.004],.007,0x91a286);
 for(const x of [-.15,.15])for(const y of [-.145,.145]){const tassel=group('cushion-tassel');tassel.position.set(x,y,0);g.add(tassel);
 ball(tassel,0,0,0,.014,.014,.01,P.gold);for(let j=-1;j<=1;j++)line(tassel,[0,-.008,0],[j*.010,-.05,.004],.003,0xc49a83)}
 g.rotation.z=.20;return g;
}
pieces.push({room:'parlor',at:[-.46,.85,-.701],build:cushionEmbroidery});
export function lavenderVase(){
 const g=group('lavender-vase');ball(g,0,.10,0,.10,.10,.095,glaze(0xdfc9b6));cylinder(g,0,.20,0,.055,.10,glaze(0xdfc9b6));
 for(let i=0;i<5;i++){const stem=group('lavender-sprig');stem.rotation.z=(i-2)*.12;stem.rotation.x=Math.sin(i*2.4)*.13;g.add(stem);
 line(stem,[0,.20,0],[0,.60-(i%2)*.05,0],.005,0x7a8e72);for(let j=0;j<5;j++){const s=j%2?-1:1;
 ball(stem,s*.017,.43+j*.035,0,.02,.027,.018,[0xaaa0bc,0x9687a8][i%2])}}
 return g;
}
pieces.push({room:'parlor',at:[1.94,1.65,-.85],build:lavenderVase});
export function embroideryHoop(){
 const g=group('embroidery-hoop');ring(g,0,0,0,.225,.018,0xb8956e);ring(g,0,0,.012,.203,.007,P.gold);
 const linen=new T.Mesh(new T.CircleGeometry(.207,32),cloth(0xe8d8bc));linen.name='hoop-linen';linen.position.z=-.008;g.add(linen);
 const clamp=box(g,0,.242,0,.09,.035,.045,P.gold,true);clamp.name='hoop-clamp';line(g,[0,-.13,.007],[0,.085,.007],.006,0x789272);
 for(let i=0;i<3;i++){const x=(i-1)*.075,y=.06+(i%2)*.06;line(g,[0,-.07,.008],[x,y,.008],.004,0x789272);for(let j=0;j<5;j++){const a=j*1.257;
 line(g,[x,y,.012],[x+Math.cos(a)*.034,y+Math.sin(a)*.034,.012],.007,0xb98296)}ball(g,x,y,.019,.013,.013,.006,P.gold)}return g;
}
pieces.push({room:'studio',at:[1.48,1.83,-1.40],build:embroideryHoop});
let tapeMaterial=null;
export function sewingTools(){
 const g=group('sewing-tools');
 for(const x of [-.041,.041]){const handle=ring(g,x,.015,.075,.036,.006,P.gold,true);handle.name='scissor-handle';
 line(g,[x,.015,.04],[-x*.4,.015,-.08],.007,0xb1b4b0)}ball(g,0,.022,-.005,.012,.008,.012,P.gold);
 if(!tapeMaterial){const c=document.createElement('canvas');c.width=256;c.height=64;const p=c.getContext('2d');p.fillStyle='#e5cc9a';
 p.fillRect(0,0,256,64);p.strokeStyle='#735d57';p.lineWidth=2;for(let i=0;i<24;i++){p.beginPath();p.moveTo(i*11,0);p.lineTo(i*11,i%4?16:30);
 p.stroke()}const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;
 tapeMaterial=new T.MeshStandardMaterial({map,roughness:1,side:T.DoubleSide})}
 const geo=new T.PlaneGeometry(.34,.045,24,1);geo.rotateX(-Math.PI/2);const p=geo.attributes.position;
 for(let i=0;i<p.count;i++){const x=p.getX(i),phase=(x+.17)/.34;p.setZ(i,p.getZ(i)+Math.sin(phase*Math.PI*1.5)*.055);
 p.setY(i,.015+Math.pow(phase,4)*.060)}geo.computeVertexNormals();const tape=new T.Mesh(geo,tapeMaterial);
 tape.name='measuring-tape';tape.position.set(.08,0,-.095);g.add(tape);return g;
}
pieces.push({room:'studio',at:[.55,.85,-.72],build:sewingTools});
let quiltMaterial=null;
export function patchworkQuilt(){
 const g=group('stitched-patchwork-bedding');
 if(!quiltMaterial){const c=document.createElement('canvas');c.width=c.height=384;
 const p=c.getContext('2d'),colors=['#a28f9d','#d4b6ae','#a6b5a1','#ded0b1'];for(let y=0;y<6;y++)for(let x=0;x<6;x++){p.fillStyle=colors[(x+y*3)%4];
 p.fillRect(x*64,y*64,64,64);p.strokeStyle='#eee0c2';p.lineWidth=1.2;p.setLineDash([3,3]);p.strokeRect(x*64+5,y*64+5,54,54);p.setLineDash([]);
 p.beginPath();p.moveTo(x*64+32,y*64+20);p.lineTo(x*64+44,y*64+32);p.lineTo(x*64+32,y*64+44);p.lineTo(x*64+20,y*64+32);p.closePath();
 p.stroke()}const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;
 quiltMaterial=new T.MeshStandardMaterial({map,bumpMap:reliefTexture('fabric'),bumpScale:.0045,roughness:1})}
 const geo=new T.PlaneGeometry(1.68,1.04,24,16);geo.rotateX(-Math.PI/2);const p=geo.attributes.position;
 for(let i=0;i<p.count;i++)p.setY(i,.012+Math.sin(p.getX(i)*9)*Math.sin(p.getZ(i)*11)*.006);geo.computeVertexNormals();
 const quilt=new T.Mesh(geo,quiltMaterial);quilt.name='patchwork-quilt';quilt.receiveShadow=true;g.add(quilt);
 for(const [a,b] of [[[-.84,.012,-.52],[.84,.012,-.52]],[[-.84,.012,.52],[.84,.012,.52]],[[-.84,.012,-.52],[-.84,.012,.52]],[[.84,.012,-.52],[.84,
   .012,.52]]]){const piping=line(g,a,b,.009,0xe0cbae);piping.name='quilt-piping'}return g;
}
pieces.push({room:'bedroom',at:[-.48,.90,-.04],build:patchworkQuilt});
