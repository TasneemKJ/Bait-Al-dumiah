import {bellRadius,bodiceFront} from './doll-couture.js';
import * as T from 'three';
import {craftMaterial} from './textiles.js';
import {mat} from './primitives.js';
let lace=null;
function laceMaterial(){
 if(lace)return lace;const canvas=document.createElement('canvas');canvas.width=128;canvas.height=64;const c=canvas.getContext('2d');c.strokeStyle='#f1e3ce';c.lineWidth=4;c.lineCap='round';
 for(const y of [7,15]){c.beginPath();c.moveTo(0,y);c.lineTo(128,y);c.stroke()}
 for(let x=0;x<128;x+=32){c.beginPath();c.moveTo(x,15);c.bezierCurveTo(x+4,60,x+28,60,x+32,15);c.stroke();c.lineWidth=2;for(let i=0;i<3;i++){c.beginPath();c.moveTo(x+16,23);c.lineTo(x+7+i*9,43);c.stroke()}c.lineWidth=4}
 const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;map.wrapS=T.RepeatWrapping;map.repeat.x=12;
 lace=new T.MeshStandardMaterial({map,alphaTest:.22,roughness:.94,side:T.DoubleSide});return lace;
}
const hemGeometries=new Map();
function fittedHemGeometry(id){if(hemGeometries.has(id))return hemGeometries.get(id);const hemGeometry=new T.BufferGeometry();const positions=[],uvs=[],indices=[],segments=96,rows=3;for(let j=0;j<=rows;j++)for(let i=0;i<=segments;i++){const a=i/segments*Math.PI*2,v=j/rows,r=bellRadius(.346,id)+.004-.017*v;positions.push(Math.cos(a)*r,.346-.75-v*(.029+.005*Math.cos(a*24)),Math.sin(a)*r*.86);uvs.push(i/segments,1-v)}for(let j=0;j<rows;j++)for(let i=0;i<segments;i++){const a=j*(segments+1)+i,b=a+segments+1;indices.push(a,b,a+1,a+1,b,b+1)}hemGeometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));hemGeometry.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));hemGeometry.setIndex(indices);hemGeometry.computeVertexNormals();hemGeometries.set(id,hemGeometry);return hemGeometry;}
export function createLaceHem(parent,id='lina'){const hem=new T.Mesh(fittedHemGeometry(id),laceMaterial());hem.name='openwork-cotton-hem';hem.userData.noBatch=true;hem.castShadow=true;hem.receiveShadow=true;parent.add(hem);return hem}

const collarShape=new T.Shape();collarShape.moveTo(.009,.826);collarShape.quadraticCurveTo(.050,.850,.105,.814);collarShape.quadraticCurveTo(.120,.790,.078,.765);collarShape.quadraticCurveTo(.038,.757,.009,.826);
const collarGeometry=new T.ShapeGeometry(collarShape,12);
function fitCollar(g,offset){const p=g.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i)*.88,y=.813+(p.getY(i)-.813)*.80;p.setXYZ(i,x,y,bodiceFront(x,y)+offset)}g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();return g;}
fitCollar(collarGeometry,.008);
const stitchGeometry=new T.TubeGeometry(new T.CatmullRomCurve3([[.021,.817,.144],[.056,.776,.145],[.080,.782,.131],[.101,.803,.116]].map(p=>new T.Vector3(...p))),16,.0014,4,false);
fitCollar(stitchGeometry,.011);
let stitchedLinen=null;
function collarMaterial(){if(!stitchedLinen){stitchedLinen=craftMaterial(0xf1dfc9).clone();stitchedLinen.vertexColors=true;stitchedLinen.userData.shared=true}return stitchedLinen}
for(const [g,color] of [[collarGeometry,0xffffff],[stitchGeometry,0xcab29d]]){const tint=new T.Color(color),data=new Float32Array(g.attributes.position.count*3);for(let i=0;i<data.length;i+=3){data[i]=tint.r;data[i+1]=tint.g;data[i+2]=tint.b}g.setAttribute('color',new T.BufferAttribute(data,3))}
export function createCollar(parent){const root=new T.Group();root.name='sewn-peter-pan-collar';parent.add(root);for(const sign of [-1,1]){const lobe=new T.Mesh(collarGeometry,collarMaterial());lobe.name='linen-collar-lobe';lobe.scale.x=sign;lobe.castShadow=lobe.receiveShadow=true;root.add(lobe);const seam=new T.Mesh(stitchGeometry,collarMaterial());seam.name='collar-topstitch';seam.scale.x=sign;root.add(seam)}return root}
