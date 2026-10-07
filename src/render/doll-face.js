import * as T from 'three';
import {gridSurface} from './doll-couture.js';
import {mat} from './primitives.js';

// Painted toy faces, not miniature realistic human faces. The house carries
// the unsettling tone; residents use round cheeks and quiet, friendly marks.
const headGeometries = new Map();
const faceMaps = new Map(), faceMaterials = new Map(), irises = new Map();
const bisque = new T.MeshPhysicalMaterial({
 color: 0xf0cdb3, roughness: .68, clearcoat: .14,
 clearcoatRoughness: .62, metalness: 0,
 emissive: 0x8a4930, emissiveIntensity: .035,
});
export const bisqueMaterial = () => bisque;

export function createNeckJoint(parent) {
 const joint = new T.Mesh(new T.TorusGeometry(.066, .0018, 4, 28), mat(0xcaa38d));
 joint.name = 'bisque-neck-joint'; joint.userData.noBatch = true;
 joint.position.y = .848; joint.rotation.x = -Math.PI / 2; parent.add(joint);
 return joint;
}

export function paintedFace(id) {
 if (faceMaps.has(id)) return faceMaps.get(id);
 const canvas = document.createElement('canvas'); canvas.width = canvas.height = 512;
 const c = canvas.getContext('2d');
 c.fillStyle = {lina:'#f1cfb7',noor:'#eed1ba',sami:'#e9c5aa'}[id]||'#f1cfb7'; c.fillRect(0, 0, 512, 512);
 const wash=c.createLinearGradient(0,80,0,440);
 wash.addColorStop(0,'rgba(255,240,225,.10)');wash.addColorStop(.5,'rgba(255,240,225,0)');
 wash.addColorStop(1,'rgba(212,145,119,.07)');c.fillStyle=wash;c.fillRect(0,0,512,512);
 // Feathered blush remains baked into the ceramic, not separate cheek spheres.
 for (const x of [76, 180]) {
  const g = c.createRadialGradient(x, 282, 2, x, 282, 42);
  g.addColorStop(0, 'rgba(211,112,119,.34)');
  g.addColorStop(.45, 'rgba(222,140,128,.15)');
  g.addColorStop(1, 'rgba(222,133,118,0)');
  c.fillStyle = g; c.fillRect(x - 42, 240, 84, 84);
 }
 c.fillStyle = 'rgba(152,87,63,.35)';
 for (const sign of [-1, 1]) for (let i = 0; i < (id === 'lina' ? 3 : 2); i++) {
  c.beginPath(); c.ellipse(128 + sign * (36 + i * 7), 282 + (i % 2) * 4, 1.2, .9, 0, 0, Math.PI * 2); c.fill();
 }
 const texture = new T.CanvasTexture(canvas); texture.colorSpace = T.SRGBColorSpace;
 texture.name = 'painted-bisque-' + id; faceMaps.set(id, texture); return texture;
}
function faceMaterial(base, id) {
 if (!faceMaterials.has(id)) {
  const m = base.clone(); m.color.set(0xffffff); m.map = paintedFace(id); faceMaterials.set(id, m);
 }
 return faceMaterials.get(id);
}

const profiles={lina:[.290,.282,.025],noor:[.281,.285,.022],sami:[.302,.278,.020]};
// Match the sculpt's front surface in head-local coordinates; painted features
// retain a sub-centimetre clearance instead of floating off the smaller head.
function faceSurface(id,x,y){
 const f=profiles[id]||profiles.lina,ny=(y+.003)/f[1];
 const cheek=f[2]*Math.exp(-Math.pow((ny+.32)/.42,2)),nx=x/(f[0]+cheek);
 const nz=Math.sqrt(Math.max(0,1-nx*nx-ny*ny));
 return .028+.247*nz+.012*Math.exp(-Math.pow((Math.abs(x)-.16)/.085,2)-Math.pow((y+.085)/.09,2))*nz;
}
export function createSculptedHead(parent, material, id) {
 const key=id||'lina';
 if (!headGeometries.has(key)) {
  const headGeometry = new T.SphereGeometry(1, 36, 28);
  const p = headGeometry.attributes.position;
  const form=profiles[key]||profiles.lina;
  for (let i = 0; i < p.count; i++) {
   const x=p.getX(i),y=p.getY(i),z=p.getZ(i);
   const cheek=form[2]*Math.exp(-Math.pow((y+.32)/.42,2));
   const px=x*(form[0]+cheek),py=y*form[1]-.003;
   const cheekRelief=.012*Math.exp(-Math.pow((Math.abs(px)-.16)/.085,2)-Math.pow((py+.085)/.09,2))*Math.max(0,z);
   p.setXYZ(i,px,py,z*.247+.028+cheekRelief);
  }
  headGeometry.computeVertexNormals();headGeometry.computeBoundingSphere();headGeometries.set(key,headGeometry);
 }
 const headGeometry=headGeometries.get(key);
 const mesh = new T.Mesh(headGeometry, faceMaterial(material, id));
 mesh.name = 'porcelain-head'; mesh.userData.noBatch = true;
 mesh.castShadow = mesh.receiveShadow = true; parent.add(mesh); return mesh;
}

function irisMaterial(id) {
 if (irises.has(id)) return irises.get(id);
 const canvas = document.createElement('canvas'); canvas.width = canvas.height = 128;
 const c = canvas.getContext('2d');
 const tint = {lina: '#65452f', noor: '#475c49', sami: '#554259'}[id] || '#584134';
 // A nearly-black painted bead with just a little individual eye color.
 // No white sclera, radial iris spokes, or encircling socket outlines.
 c.fillStyle = tint; c.beginPath(); c.arc(64, 64, 62, 0, Math.PI * 2); c.fill();
 const g = c.createRadialGradient(64, 58, 5, 64, 60, 60);
 g.addColorStop(0, '#291f23'); g.addColorStop(.43, '#39292a'); g.addColorStop(.76, tint); g.addColorStop(1, tint);
 c.fillStyle = g; c.beginPath(); c.arc(64, 64, 61, 0, Math.PI * 2); c.fill();
 c.fillStyle = '#fff1d9'; c.beginPath(); c.ellipse(45, 38, 5.2, 6, -.2, 0, Math.PI * 2); c.fill();
 c.fillStyle = 'rgba(255,231,201,.35)'; c.beginPath(); c.arc(82, 85, 3, 0, Math.PI * 2); c.fill();
 const map = new T.CanvasTexture(canvas); map.colorSpace = T.SRGBColorSpace;
 const material = new T.MeshStandardMaterial({map, transparent: false, roughness: .64});
 irises.set(id, material); return material;
}
const irisGeometry = new T.CircleGeometry(.030, 32);
// Follow the cheek surface instead of floating a large flat iris over a socket.
{
 const p = irisGeometry.attributes.position;
 for (let i = 0; i < p.count; i++) {
  const x = p.getX(i), y = p.getY(i);
  p.setXYZ(i, x * 1.03, y * 1.12, .0038 * (1 - (x*x + y*y) / (.030*.030)));
 }
 irisGeometry.computeVertexNormals();
}
export function createPortraitEye(parent, sign, id) {
 const eye = new T.Group(); eye.name = 'portrait-eye'; eye.userData.noBatch = true;
 eye.position.set(sign * .105, .012, faceSurface(id,sign*.105,.012)+.003); eye.rotation.y = sign * .25; parent.add(eye);
 const aperture = new T.Group(); eye.add(aperture); eye.aperture = aperture;
 const iris = new T.Mesh(irisGeometry, irisMaterial(id)); iris.name = 'painted-iris';
 iris.position.set(0, -.003, .002); aperture.add(iris); eye.iris = iris;
 eye.closedLid = faceStroke(eye, 'closed-bisque-lid', [[-.027,0,.005],[0,-.007,.007],[.027,0,.005]], .0022, 0x795447);
 eye.closedLid.visible = false;
 eye.upperLid=faceStroke(eye,'painted-upper-lid',[[-.030,.012,.005],[-.016,.024,.006],[0,.028,.006],
   [.017,.023,.006],[.030,.011,.005]],.00125,0x70574f);
 eye.upperLid.userData.noBatch=true;return eye;
}
export function faceStroke(parent, name, points, radius, color) {
 const curve = new T.CatmullRomCurve3(points.map(p => new T.Vector3(...p)));
 const mesh = new T.Mesh(new T.TubeGeometry(curve, 16, radius, 4, false), mat(color));
 mesh.name = name; parent.add(mesh); return mesh;
}
export function createBrow(parent, sign, color, id='lina') {
 const brow = new T.Group(); brow.name = 'expressive-brow'; brow.userData.noBatch = true;
 brow.position.set(sign * .105, .082, faceSurface(id,sign*.105,.082)+.008); parent.add(brow);
 faceStroke(brow, 'brow-hair', [[-.027,0,0],[0,.005,.004],[.025,0,0]], .0034, color);
 return brow;
}
export function closePortraitEye(eye, value) {
 const openness = Number.isFinite(value) ? T.MathUtils.clamp(value, 0, 1) : 1;
 eye.aperture.scale.y = Math.max(.06, openness);
 eye.aperture.visible = openness > .19; eye.closedLid.visible = openness <= .19; eye.scale.y = 1;
 if(eye.upperLid){eye.upperLid.visible=openness>.19;eye.upperLid.scale.y=Math.max(.1,openness);}
}
export function createPortraitMouth(parent, id='lina') {
 const root = new T.Group(); root.name = 'porcelain-lips'; root.userData.noBatch = true;
 root.position.set(0, -.105, faceSurface(id,0,-.105)+.006); parent.add(root);
 const smile=faceStroke(root, 'painted-smile', [[-.027,.003,0],[-.014,-.006,.002],[0,
   -.009,.003],[.014,-.006,.002],[.027,.003,0]], .0027, 0xa96658);
 const width={lina:1,noor:.92,sami:1.06}[id]||1,p=smile.geometry.attributes.position;
 for(let i=0;i<p.count;i++){const x=p.getX(i);p.setX(i,x*width);
 p.setY(i,p.getY(i)+(id==='lina'?x*.045:id==='noor'?-x*.035:0));}
 smile.geometry.computeVertexNormals();
 return root;
}
let noseGeometry = null;
export function createNose(parent, material, id='lina') {
 if (!noseGeometry) noseGeometry=gridSurface(24,8,(u,v)=>{const a=u*Math.PI*2;
 return [.020*v*Math.cos(a),.014*v*Math.sin(a),.013*(1-v*v)*(1-.12*Math.sin(a))]});
 const mesh = new T.Mesh(noseGeometry, material); mesh.name = 'sculpted-nose';
 mesh.position.set(0, -.054, faceSurface(id,0,-.054)+.001); parent.add(mesh); return mesh;
}
const earGeometry = new T.SphereGeometry(1, 12, 10);
export function createEar(parent, sign, material, id='lina') {
 const root = new T.Group(); root.name = 'porcelain-ear'; root.userData.noBatch = true;
 root.position.set(sign*((profiles[id]||profiles.lina)[0]+.009), -.039, .010);
 root.rotation.y = sign * .45; parent.add(root);
 const lobe = new T.Mesh(earGeometry, material); lobe.scale.set(.028, .039, .024); root.add(lobe);
 const inset = new T.Mesh(earGeometry, mat(0xe4b39a, {roughness: .78})); inset.name = 'ear-recess';
 inset.position.set(0, .006, .021); inset.scale.set(.012, .023, .003); root.add(inset); return root;
}
