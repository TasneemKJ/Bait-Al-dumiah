import * as T from 'three';
import {mat} from './primitives.js';

// Painted toy faces, not miniature realistic human faces. The house carries
// the unsettling tone; residents use round cheeks and quiet, friendly marks.
let headGeometry = null;
const faceMaps = new Map(), faceMaterials = new Map(), irises = new Map();
const bisque = new T.MeshPhysicalMaterial({
 color: 0xf5d3b3, roughness: .68, clearcoat: .14,
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
 c.fillStyle = '#f5d3b3'; c.fillRect(0, 0, 512, 512);
 for (const x of [70, 186]) {
  const g = c.createRadialGradient(x, 293, 2, x, 293, 32);
  g.addColorStop(0, 'rgba(211,105,105,.57)');
  g.addColorStop(.45, 'rgba(222,133,118,.30)');
  g.addColorStop(1, 'rgba(222,133,118,0)');
  c.fillStyle = g; c.fillRect(x - 34, 257, 68, 72);
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

export function createSculptedHead(parent, material, id) {
 if (!headGeometry) {
  headGeometry = new T.SphereGeometry(1, 36, 28);
  const p = headGeometry.attributes.position;
  for (let i = 0; i < p.count; i++) {
   const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
   // Keep width low in the cheeks. The old jaw tapered into a sharp wedge.
   const cheek = .065 * Math.exp(-Math.pow((y + .60) / .45, 2));
   p.setXYZ(i, x * (.290 + cheek), y * .258 - .003, z * .247 + .028);
  }
  headGeometry.computeVertexNormals(); headGeometry.computeBoundingSphere();
 }
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
 g.addColorStop(0, '#30272a'); g.addColorStop(.72, '#392d2d'); g.addColorStop(1, tint);
 c.fillStyle = g; c.beginPath(); c.arc(64, 64, 61, 0, Math.PI * 2); c.fill();
 c.fillStyle = '#fff1d9'; c.beginPath(); c.ellipse(45, 38, 8, 9, -.2, 0, Math.PI * 2); c.fill();
 c.fillStyle = 'rgba(255,231,201,.35)'; c.beginPath(); c.arc(82, 85, 3, 0, Math.PI * 2); c.fill();
 const map = new T.CanvasTexture(canvas); map.colorSpace = T.SRGBColorSpace;
 const material = new T.MeshStandardMaterial({map, transparent: true, alphaTest: .04, roughness: .65});
 irises.set(id, material); return material;
}
const irisGeometry = new T.CircleGeometry(.033, 32);
// Follow the cheek surface instead of floating a large flat iris over a socket.
{
 const p = irisGeometry.attributes.position;
 for (let i = 0; i < p.count; i++) {
  const x = p.getX(i), y = p.getY(i);
  p.setXYZ(i, x * .84, y, .002 * (1 - (x*x + y*y) / (.033*.033)));
 }
 irisGeometry.computeVertexNormals();
}
export function createPortraitEye(parent, sign, id) {
 const eye = new T.Group(); eye.name = 'portrait-eye'; eye.userData.noBatch = true;
 eye.position.set(sign * .105, .012, .267); eye.rotation.y = sign * .25; parent.add(eye);
 const aperture = new T.Group(); eye.add(aperture); eye.aperture = aperture;
 const iris = new T.Mesh(irisGeometry, irisMaterial(id)); iris.name = 'painted-iris';
 iris.position.set(0, -.003, .007); aperture.add(iris); eye.iris = iris;
 eye.closedLid = faceStroke(eye, 'closed-bisque-lid', [[-.027,0,.005],[0,-.008,.008],[.027,0,.005]], .0026, 0x795447);
 eye.closedLid.visible = false; return eye;
}
export function faceStroke(parent, name, points, radius, color) {
 const curve = new T.CatmullRomCurve3(points.map(p => new T.Vector3(...p)));
 const mesh = new T.Mesh(new T.TubeGeometry(curve, 16, radius, 4, false), mat(color));
 mesh.name = name; parent.add(mesh); return mesh;
}
export function createBrow(parent, sign, color) {
 const brow = new T.Group(); brow.name = 'expressive-brow'; brow.userData.noBatch = true;
 brow.position.set(sign * .105, .082, .256); parent.add(brow);
 faceStroke(brow, 'brow-hair', [[-.027,0,0],[0,.005,.004],[.025,0,0]], .0034, color);
 return brow;
}
export function closePortraitEye(eye, value) {
 const openness = Number.isFinite(value) ? T.MathUtils.clamp(value, 0, 1) : 1;
 eye.aperture.scale.y = Math.max(.06, openness);
 eye.aperture.visible = openness > .19; eye.closedLid.visible = openness <= .19; eye.scale.y = 1;
}
export function createPortraitMouth(parent) {
 const root = new T.Group(); root.name = 'porcelain-lips'; root.userData.noBatch = true;
 root.position.set(0, -.105, .272); parent.add(root);
 faceStroke(root, 'painted-smile', [[-.027,.003,0],[-.014,-.006,.002],[0,-.009,.003],[.014,-.006,.002],[.027,.003,0]], .0027, 0xa96658);
 return root;
}
let noseGeometry = null;
export function createNose(parent, material) {
 if (!noseGeometry) { noseGeometry = new T.SphereGeometry(1, 16, 12); noseGeometry.scale(.017, .013, .014); }
 const mesh = new T.Mesh(noseGeometry, material); mesh.name = 'sculpted-nose';
 mesh.position.set(0, -.054, .282); parent.add(mesh); return mesh;
}
const earGeometry = new T.SphereGeometry(1, 12, 10);
export function createEar(parent, sign, material) {
 const root = new T.Group(); root.name = 'porcelain-ear'; root.userData.noBatch = true;
 root.position.set(sign * .297, -.034, .020); root.rotation.y = sign * .45; parent.add(root);
 const lobe = new T.Mesh(earGeometry, material); lobe.scale.set(.034, .045, .026); root.add(lobe);
 const inset = new T.Mesh(earGeometry, mat(0xe4b39a, {roughness: .78})); inset.name = 'ear-recess';
 inset.position.set(0, .006, .023); inset.scale.set(.014, .026, .004); root.add(inset); return root;
}
