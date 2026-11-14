import * as T from 'three';
import {palette as P,ball,cylinder,line,ring,mat,batch} from './primitives.js';

// The small things the midnight visitor borrows, and the places they live, in the house's own primitives
// and glazes. Each thing is a little exaggerated so it reads on a phone, like the dolls' teacups.
const silver=()=>mat(0xd9d3cf,{metalness:.62,roughness:.32});
const thread=0xc4566f,buttonBlue=0x6f8fb8,ribbonRose=0xd889a0;

function teaspoon(g){
 line(g,[0,.02,0],[0,-.15,0],.011,silver());ball(g,0,-.19,.004,.034,.048,.014,silver());
 ring(g,0,.035,0,.016,.004,P.gold);
}
function strainer(g){
 line(g,[0,.03,0],[0,-.09,0],.010,P.gold);const rim=ring(g,0,-.15,0,.055,.007,P.gold);rim.rotation.x=0;
 const mesh=cylinder(g,0,-.15,-.003,.052,.004,mat(0xe9dcc6,{transparent:true,opacity:.82}));mesh.rotation.x=Math.PI/2;
 for(let i=-1;i<=1;i++)line(g,[i*.025,-.11,.002],[i*.025,-.19,.002],.0018,P.gold);
}
function thimble(g){
 cylinder(g,0,0,0,.036,.052,silver(),1.18);ball(g,0,.026,0,.031,.016,.031,silver());
 cylinder(g,0,-.022,0,.041,.007,P.gold);
 for(let i=0;i<6;i++){const a=i*Math.PI/3;ball(g,Math.cos(a)*.018,.034,Math.sin(a)*.018,.004,.003,.004,P.dark)}
}
function blueButton(g){
 cylinder(g,0,0,0,.042,.013,buttonBlue);cylinder(g,0,.004,0,.033,.008,0x8eaad0);
 for(const [x,z] of [[-.011,-.011],[.011,-.011],[-.011,.011],[.011,.011]])ball(g,x,.007,z,.0055,.003,.0055,P.ink);
}
function spool(g){
 cylinder(g,0,0,0,.026,.058,thread);for(const y of [-.034,.034])cylinder(g,0,y,0,.038,.012,0x8f6c58);
 line(g,[.026,.0,0],[.06,-.03,.02],.003,thread);
}
function ribbon(g){
 for(const s of [-1,1]){const loop=ball(g,s*.05,0,0,.05,.03,.015,ribbonRose);loop.rotation.z=s*.35;
  line(g,[s*.01,-.015,.004],[s*.04,-.13,.008],.007,ribbonRose)}
 ball(g,0,0,.008,.018,.018,.016,0xc77790);ring(g,0,.025,0,.012,.003,P.gold);
}
function hairpin(g){
 line(g,[0,.03,0],[.012,-.13,0],.0045,P.gold);line(g,[.012,.03,0],[.024,-.11,0],.0045,P.gold);
 ball(g,.006,.04,.008,.016,.016,.012,0xf6eee4);
 for(let i=0;i<5;i++){const a=i*Math.PI*2/5;ball(g,.006+Math.cos(a)*.024,.04+Math.sin(a)*.024,.004,.014,.014,.008,
   0xe2a5b6)}
}
function bell(g){
 ring(g,0,.035,0,.012,.003,P.gold);ball(g,0,-.005,0,.04,.042,.04,P.gold);
 cylinder(g,0,-.03,0,.046,.012,P.gold);ball(g,0,-.048,0,.011,.011,.011,P.dark);
}
export const ITEM_ART={teaspoon,strainer,thimble,'blue-button':blueButton,spool,ribbon,hairpin,bell};
// Things that stand on Sami's tray leave a ring in the dust; things that hang leave their shape on the wall.
export const STANDS=new Set(['thimble','blue-button','spool']);

// Each thing (and all the keeping places together) bakes into one vertex-painted mesh: one draw each, no shadow
// pass. At this size the painted colours carry the brass, silver and glaze.
const PAINT=new T.MeshStandardMaterial({vertexColors:true,roughness:.45,metalness:.22});
export function bake(root){
 root.updateMatrixWorld(true);const inverse=root.matrixWorld.clone().invert(),meshes=[];
 root.traverse(o=>{if(o.isMesh)meshes.push(o)});
 const position=[],normal=[],color=[],index=[];let offset=0;
 for(const m of meshes){const g=m.geometry.clone().applyMatrix4(inverse.clone().multiply(m.matrixWorld)),
   p=g.attributes.position,n=g.attributes.normal,c=m.material.color;
  for(let i=0;i<p.count;i++){position.push(p.getX(i),p.getY(i),p.getZ(i));normal.push(n.getX(i),n.getY(i),n.getZ(i));
   color.push(c.r,c.g,c.b)}
  const count=g.index?.count??p.count;for(let i=0;i<count;i++)index.push((g.index?g.index.getX(i):i)+offset);
  offset+=p.count;g.dispose();m.removeFromParent()}
 for(const child of [...root.children])if(!child.isMesh&&!child.children.length)child.removeFromParent();
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(position,3));
 geometry.setAttribute('normal',new T.Float32BufferAttribute(normal,3));
 geometry.setAttribute('color',new T.Float32BufferAttribute(color,3));geometry.setIndex(index);
 const mesh=new T.Mesh(geometry,PAINT);mesh.name=root.name+'-baked';root.add(mesh);return mesh;
}
export function buildItem(id){const g=new T.Group();g.name='borrowed-'+id;ITEM_ART[id](g);bake(g);return g}

// The keeping places: Lina's brass hook rail by the stove, Sami's wooden tray on the work table,
// Noor's brass pegs along the top of her headboard. Coordinates are room-local (src/content.js MISCHIEF_ITEMS).
export function keepingPlaces(add){
 const lina=add('kitchen');line(lina,[.82,1.63,-1.43],[1.24,1.63,-1.43],.011,P.gold);
 for(const x of [.82,1.24])ball(lina,x,1.63,-1.43,.019,.019,.019,P.gold);
 for(const x of [.93,1.13]){line(lina,[x,1.63,-1.43],[x,1.58,-1.41],.0055,P.gold);
  line(lina,[x,1.58,-1.41],[x,1.585,-1.38],.0055,P.gold)}
 const sami=add('studio');cylinder(sami,.62,.84,-.62,.19,.026,0x8f6c58);
 ring(sami,.62,.853,-.62,.185,.008,0xb08b6e,true);cylinder(sami,.62,.855,-.62,.17,.003,0xe9d5bd);
 const noor=add('bedroom');line(noor,[-.92,1.64,-1.37],[-.04,1.64,-1.37],.009,P.gold);
 for(const x of [-.78,-.48,-.18]){line(noor,[x,1.64,-1.37],[x,1.62,-1.31],.007,P.gold);
  ball(noor,x,1.62,-1.30,.012,.012,.012,P.gold)}
 return [lina,sami,noor];
}
// A round hatbox with a rose band, left of Noor's bed: one of the visitor's hiding places.
export function hatbox(add){
 const g=add('bedroom');cylinder(g,-1.72,.16,.40,.19,.24,0xd8b3bf);
 cylinder(g,-1.72,.295,.40,.205,.04,P.cream);ring(g,-1.72,.30,.40,.2,.008,P.gold,true);
 ring(g,-1.72,.12,.40,.193,.012,0xb57a8c,true);
 for(const s of [-1,1]){const loop=ball(g,-1.72+s*.05,.33,.40,.05,.022,.02,0xb57a8c);loop.rotation.z=s*.4}
 return g;
}
// Four pairs of small pale footprints walking away from an empty place, toward the front of the room:
// flat painted discs (a sole and three toes), opaque so the whole trail bakes into one draw.
const DISC=new T.CircleGeometry(1,12).rotateX(-Math.PI/2);
export function footprints(parent){
 const g=new T.Group();g.name='visitor-footprints';parent.add(g);
 const m=mat(0x9a80c6,{emissive:0x7d62ad,emissiveIntensity:.4});
 const disc=(x,z,rx,rz,turn=0)=>{const o=new T.Mesh(DISC,m);o.position.set(x,0,z);o.scale.set(rx,1,rz);
  o.rotation.y=turn;g.add(o)};
 for(let i=0;i<4;i++)for(const s of [-1,1]){const z=i*.32+(s>0?.16:0);disc(s*.055,z,.032,.05,s*.12);
  for(let k=0;k<3;k++)disc(s*.055+(k-1)*.017,z+.062,.0095,.0095)}
 batch(g);g.scale.setScalar(1.9);return g;
}
