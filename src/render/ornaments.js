import * as T from 'three';
import {pleatedShade,eaveScallop} from './fabric-shapes.js';
import {ROOMS} from '../content.js';
import {palette as P,box,ball,cylinder,ring,line,arch,plant,batch} from './primitives.js';
import {craftMaterial,softTexture} from './textiles.js';

function rose(p,x,y,z,scale=1){
 const g=new T.Group();g.position.set(x,y,z);g.scale.setScalar(scale);p.add(g);
 for(let j=0;j<5;j++){const a=j*1.257;ball(g,Math.cos(a)*.038,Math.sin(a)*.038,0,.045,.046,.025,0xd5a0a1)}
 ball(g,0,0,.021,.029,.029,.016,0xb77a88);return g;
}
function rosette(p,x,y,z,r=.1){
 ring(p,x,y,z,r,.009,P.gold);
 for(let k=0;k<5;k++){const a=k*1.257;ball(p,x+Math.cos(a)*r*.5,y+Math.sin(a)*r*.5,z,.022,.035,.016,P.cream)}
 ball(p,x,y,z+.01,.016,.016,.012,P.gold);
}
function vase(p,x,y,z,color){
 const g=new T.Group();g.position.set(x,y,z);p.add(g);
 ball(g,0,.16,0,.12,.16,.12,color);cylinder(g,0,.30,0,.06,.14,color);ring(g,0,.38,0,.062,.014,P.gold,true);
 for(let i=0;i<4;i++){const a=i*2.3;
 line(g,[0,.37,0],[Math.sin(a)*.17,.67+i*.035,Math.cos(a)*.10],.008,0x6e8967);
 rose(g,Math.sin(a)*.17,.67+i*.035,Math.cos(a)*.10,.75)}
}
function borderShade(p){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const c=canvas.getContext('2d');
 for(const [x1,y1,x2,y2] of [[0,0,28,0],[128,0,100,0],[0,0,0,24],[0,128,0,
   100]]){const g=c.createLinearGradient(x1,y1,x2,y2);
 g.addColorStop(0,'rgba(45,26,39,.28)');g.addColorStop(1,'rgba(45,26,39,0)');c.fillStyle=g;c.fillRect(0,0,128,128)}
 const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
 const o=new T.Mesh(new T.PlaneGeometry(4.68,2.93),new T.MeshBasicMaterial({map:texture,transparent:true,
   depthWrite:false}));o.position.set(0,1.61,-1.49);o.userData.noBatch=true;p.add(o);
}
function dressKitchen(g,room,halo){
  vase(g,.30,1.04,-1.13,0xc48488);
  box(g,.60,1.93,-1.44,.48,.57,.04,P.gold);box(g,.60,1.93,-1.40,.39,.48,.02,0xebe1c7);
  rose(g,.60,1.96,-1.38,1.4);line(g,[.60,1.78,-1.38],[.60,1.94,-1.38],.012,0x7a956f);
  for(let i=0;i<5;i++){const x=.02+i*.20;line(g,[x,2.9,-1.41],[x,2.71,-1.40],.007,P.gold);
  for(let j=0;j<4;j++)ball(g,x+Math.sin(j)*.035,2.67-j*.04,-1.38,.055,.045,.025,0x749277)}
  const runner=craftMaterial(0x9bac99);box(g,-.53,.765,.1,.38,.01,.75,runner);
  for(let i=0;i<9;i++)line(g,[-.69+i*.04,.759,.49],[-.69+i*.04,.69,.49],.005,P.cream);
  cylinder(g,2.03,.23,-.05,.23,.37,0xb29570,.85);for(let i=0;i<6;i++){const a=i*1.04;
  ball(g,2.03+Math.cos(a)*.13,.43,-.05+Math.sin(a)*.11,.075,.07,.07,i%2?0xd3a44d:0x99865c)}
}

function dressParlor(g,room,halo,bulb){
  const x=-1.32;
  box(g,x,.62,-1.33,.91,1.12,.28,0xf0d5b6,true);arch(g,x,.15,-1.16,.61,.86,0x493d48,.02);
  box(g,x,1.22,-1.30,1.05,.12,.4,P.cream,true);
  for(let i=0;i<3;i++)line(g,[x-.23,.23+i*.07,-1.1],[x+.23,.25+i*.05,-1.1],.028,0x79624d);
  halo(room.x+x,.44,-.96,1.1,.19);
  ring(g,x,1.93,-1.43,.31,.048,P.gold);
  const mirror=cylinder(g,x,1.93,-1.45,.285,.016,0xa9b4b2);mirror.rotation.x=Math.PI/2;
  vase(g,x+.35,1.29,-1.26,0x9eaba1);cylinder(g,x-.29,1.40,-1.29,.048,.27,0xf3d9b6);
  ball(g,x-.29,1.58,-1.29,.023,.051,.023,bulb);
  const throwMat=craftMaterial(0x78998c);box(g,1.20,.70,-.56,.53,.023,.76,throwMat,true);
  box(g,1.20,.50,-.16,.53,.40,.035,throwMat,true);
  for(let i=0;i<8;i++)line(g,[.98+i*.062,.32,-.13],[.98+i*.062,.25,-.13],.009,0xe2d2b3);
  for(let j=0;j<3;j++)for(let i=0;i<6;i++)ball(g,-.53+i*.37,.79+j*.16,-.911,.018,.018,.015,P.gold);
}

function dressStudio(g,room,halo){
  for(let i=0;i<7;i++){const x=-.35+i*.22;line(g,[x,2.78,-1.47],[x,2.70-Math.sin(i)*.07,-1.45],.006,P.gold);
  const flag=box(g,x,2.57-Math.sin(i)*.07,-1.42,.15,.23,.018,[0xc894a6,0x94b0a4,
    0xd6bb8f][i%3]);flag.rotation.z=(i-3)*.03}
  box(g,-1.62,.29,-.37,.50,.40,.40,0xb59a81,true);ring(g,-1.62,.5,-.37,.2,.023,P.cream,true);
  for(let i=0;i<3;i++)ball(g,-1.74+i*.12,.53,-.37,.094,.084,.09,[0xbd829e,0xa2b7ad,0xe2c392][i]);
  vase(g,1.54,.75,-.66,0xc391a8);
  for(let i=0;i<6;i++)box(g,-.96+i*.06,.855,-.48,.044,.008,.10,[0xc48b9c,0xc49b76,0x859f97][i%3]);
}

function dressBedroom(g,room,halo){
  const quilt=craftMaterial(0xa17f9e);box(g,-.48,.865,-.04,1.72,.032,1.09,quilt,true);
  for(let j=0;j<4;j++)for(let i=0;i<6;i++){const x=-1.17+i*.275,z=-.44+j*.27;ball(g,x,.889,z,.017,.009,.017,P.cream);}
  for(const x of [-1.43,.47]){cylinder(g,x,.95,.67,.035,1.48,P.wood);
  ball(g,x,1.71,.67,.082,.10,.082,P.gold);rose(g,x,1.56,.70,1)}
  for(let i=0;i<6;i++)rose(g,-1.12+i*.26,1.28+Math.sin(i*.6)*.16,-1.30,.75);
  const pillow=craftMaterial(0xe9c9bb);box(g,-.86,.94,-1.08,.56,.13,.37,pillow,true).rotation.z=.08;
  for(const x of [-.96,-.72])ball(g,x,.99,-.88,.015,.015,.015,P.gold);
}

const ROOM_DRESSING={kitchen:dressKitchen,parlor:dressParlor,studio:dressStudio,bedroom:dressBedroom};

export function createCraftDetails(parent){
 const root=new T.Group();parent.add(root);const halos=[];const glow=softTexture();
 const bulb=new T.MeshStandardMaterial({color:0xffebbf,emissive:0xffbd67,emissiveIntensity:1.5,roughness:.2});
 function halo(x,y,z,size,opacity=.24){const m=new T.SpriteMaterial({map:glow,
   color:0xffcb88,transparent:true,opacity,depthWrite:false,
   blending:T.AdditiveBlending});const s=new T.Sprite(m);s.position.set(x,y,z);
   s.scale.set(size,size,1);parent.add(s);halos.push({s,opacity});}
 function sconce(p,x,y,z,room){
  ball(p,x,y,z,.10,.20,.055,P.gold);line(p,[x,y-.06,z],[x,y-.10,z+.23],.025,P.gold);
  cylinder(p,x,y-.10,z+.23,.085,.04,P.gold);ball(p,x,y+.045,z+.23,.085,.14,.085,bulb);
  pleatedShade(p,x,y+.075,z+.23,.24,.22);ring(p,x,y-.04,z+.23,.24,.018,P.gold,true);
  halo(room.x+x,room.y+y+.07,z+.32,1.5,.25);
 }
 for(const room of ROOMS){
  const g=new T.Group();g.position.set(room.x,room.y,0);root.add(g);borderShade(g);
  // Recessed wainscoting, miniature moulding and nail-head trim.
  for(let i=0;i<6;i++){const x=-1.94+i*.77;
  for(const side of [-1,1])box(g,x+side*.30,.47,-1.555,.02,.55,.024,P.cream);
  for(const y of [.20,.75])box(g,x,y,-1.555,.62,.018,.024,P.cream)}
  box(g,0,1.01,-1.54,4.68,.023,.025,P.gold);box(g,0,3.00,-1.48,4.72,.04,.10,P.gold);
  // Small floral carving along the open floor edge never hides the playfield.
  for(let j=0;j<12;j++){const x=-2.19+j*.4;ball(g,x,-.017,1.845,.025,.025,.018,P.gold)}
  for(const x of [-2.3,2.3]){box(g,x,1.57,-1.54,.10,2.95,.12,P.cream);rosette(g,x,2.83,-1.45,.065)}
  sconce(g,room.id==='parlor'?-1.82:1.94,2.35,-1.43,room);
  // Contact shadows remain available even in battery-friendly shadowless mode.
  const shadow=new T.Mesh(new T.PlaneGeometry(3.7,2.75),new T.MeshBasicMaterial({map:glow,
    color:0x422535,transparent:true,opacity:.17,
    depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.set(0,.118,-.10);
    shadow.userData.noBatch=true;g.add(shadow);
  ROOM_DRESSING[room.id]?.(g,room,halo,bulb);
 }
 // Carved scalloped eaves and corbels: the silhouette reads as a handmade miniature.
 for(const sign of [-1,1]){
  for(let i=0;i<17;i++){const x=sign*(.23+i*.29),y=8.14-Math.abs(x)*.367;eaveScallop(root,x,y-.04,1.975,-sign*.35)}
  for(const y of [.19,3.39,6.54])for(const x of [0,sign*4.84]){const support=box(root,x,y-.18,1.62,.25,
    .35,.27,P.cream,true);support.rotation.z=sign*.10;rosette(root,x,y-.13,1.80,.074)}
 }
 // Attic dial and a strand of steady fairy lights (no strobing).
 const dial=cylinder(root,0,7.15,-1.52,.45,.05,0xf1ddbd);dial.rotation.x=Math.PI/2;
 ring(root,0,7.15,-1.47,.47,.037,P.gold);
 for(let i=0;i<12;i++){const a=i*Math.PI/6;
 ball(root,Math.sin(a)*.36,7.15+Math.cos(a)*.36,-1.425,.018,.018,.012,0x795b63)}
 line(root,[0,7.15,-1.41],[.16,7.37,-1.41],.015,P.dark);line(root,[0,7.15,-1.41],[-.20,7.09,-1.41],.012,P.dark);
 for(let i=0;i<19;i++){const x=-4.46+i*.495,y=6.72-.18*Math.cos(x*.66);
 if(i)line(root,[x-.495,6.72-.18*Math.cos((x-.495)*.66),1.84],[x,y,1.84],.01,P.gold);
 ball(root,x,y-.06,1.84,.035,.058,.035,bulb);if(i%3===0)halo(x,y-.06,1.87,.66,.15)}
 // Winding jasmine and roses follow the two outer posts, not the room centres.
 for(const sign of [-1,1]){
  for(let i=0;i<34;i++){const y=.22+i*.175,x=sign*(4.95+Math.sin(i*.53)*.10),z=1.70+Math.cos(i*.53)*.08;
   if(i)line(root,[x,y,z],[sign*(4.95+Math.sin((i-1)*.53)*.10),y-.175,1.70+Math.cos((i-1)*.53)*.08],.015,0x6d8863);
   const leaf=ball(root,x+sign*.10,y+.025,z,.11,.045,.04,i%2?0x78947a:0x95aa83);leaf.rotation.z=sign*.6;
   if(i%4===0)rose(root,x-sign*.04,y,z+.065,1.1);
  }
 }
 batch(root);
 return {update(mix){bulb.emissiveIntensity=1.2+mix*2.1;
 for(const h of halos){h.s.material.opacity=h.opacity*(.3+mix*.7)}},root};
}

export function createGarden(parent){
 const g=new T.Group();parent.add(g);
 // A dark walnut plinth with a moss-and-stone garden, instead of a floating slab.
 const wood=craftMaterial(0x745343,'wood');box(g,0,-.49,.08,12.8,.42,5.0,wood,true);
 box(g,0,-.27,.08,12.82,.05,5.03,P.gold,true);box(g,0,-.20,.08,12.75,.11,4.94,0x849081,true);
 for(let i=0;i<18;i++){const x=-5.95+i*.70;
 box(g,x,-.123,2.18,.62,.055,.51,[0xcab7a1,0xe0cbb0,0xbba68f][i%3],true).rotation.y=Math.sin(i)*.08}
 for(const x of [-6.0,6.0])for(let i=0;i<5;i++)box(g,x,-.12,-1.78+i*.77,.54,.06,.65,0xd5c3a6,true);
 for(let sign of [-1,1]){
  for(let i=0;i<9;i++){const x=sign*(5.17+(i%3)*.36),z=-1.55+Math.floor(i/3)*1.13;
  ball(g,x,-.035,z,.34,.13,.28,i%2?0x7b977a:0x9ba782);if(i%2===0)plant(g,x,.02,z,.50)}
  for(let i=0;i<20;i++){const x=sign*(5.10+(i%4)*.27),z=-1.65+Math.floor(i/4)*.68;rose(g,x,.16+(i%3)*.04,z,.7)}
  const lampX=sign*5.62;line(g,[lampX,-.12,1.22],[lampX,1.3,1.22],.03,P.gold);
  box(g,lampX,1.34,1.22,.29,.39,.29,0xd9b76b,true);
  box(g,lampX,1.57,1.22,.39,.06,.39,P.dark,true);ball(g,lampX,1.65,1.22,.05,.07,.05,P.gold);
 }
 // Front feet and miniature brass corner plates anchor the whole toy in space.
 for(const x of [-5.6,5.6])for(const z of [-1.75,1.9])ball(g,x,-.73,z,.19,.22,.18,wood);
 for(const x of [-5.5,5.5]){box(g,x,-.48,2.60,.58,.20,.025,P.gold,true);
 for(const dx of [-.2,.2])ball(g,x+dx,-.48,2.62,.025,.025,.01,P.dark)}
 batch(g);return g;
}
