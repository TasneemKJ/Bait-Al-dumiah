import * as T from 'three';
import {crescentGeometry} from './resident-effects.js';
import {drapedCurtain,valance,doily} from './fabric-shapes.js';
import {ROOMS} from '../content.js';
import {palette as P,box,ball,cylinder,ring,line,arch,mat,texture,texturedPlane,plant,lamp,cup,books,batch} from './primitives.js';
function window(p,x,y,theme,lights){
 valance(p,x,y+1.57,-1.18);
 arch(p,x,y,-1.655,1.05,1.65,P.cream,.10);
 const glass=mat(0xb9cacc,{emissive:0xc3bcbb,emissiveIntensity:.15});
 arch(p,x,y+.085,-1.53,.87,1.47,glass,.025);lights.push(glass);
 box(p,x,y+.75,-1.47,.05,1.35,.05,P.cream);box(p,x,y+.66,-1.47,.9,.045,.05,P.cream);
 box(p,x,y-.025,-1.48,1.3,.09,.4,P.cream,true);
 for(const side of [-1,1]){box(p,x+side*.72,y+.73,-1.53,.28,1.5,.08,theme);for(let j=0;j<7;j++)box(p,x+side*.72,y+.13+j*.18,-1.465,.23,.05,.08,P.cream);drapedCurtain(p,x+side*.53,y+.76,-1.28,side);ring(p,x+side*.5,y+.79,-1.3,.09,.02,P.gold,true)}
 line(p,[x-.75,y+1.67,-1.28],[x+.75,y+1.67,-1.28],.025,P.gold);
}
function chair(p,x,z,color,rot=0){const g=new T.Group();g.position.set(x,0,z);g.rotation.y=rot;p.add(g);box(g,0,.51,0,.48,.11,.48,color,true);box(g,0,.88,-.21,.45,.68,.07,color,true);for(const a of [-1,1])for(const b of [-1,1])box(g,a*.17,.24,b*.16,.045,.5,.045,P.wood);for(let i=0;i<3;i++)box(g,-.12+i*.12,.9,-.162,.025,.4,.03,P.cream)}
function kitchen(p){
 doily(p,-.52,.773,.1,.69);
 for(let i=0;i<3;i++){const x=-1.45+i*.83;box(p,x,.48,-1.1,.81,.92,.71,0x8bac9d,true);box(p,x,.5,-.722,.68,.71,.04,0xa7c5b2,true);ball(p,x+.20,.58,-.674,.035,.035,.025,P.gold)}
 box(p,-.60,.98,-1.08,2.66,.10,.82,P.cream,true);
 const sink=cylinder(p,-1.27,1.035,-1.06,.25,.025,0x839b98);sink.scale.z=.68;ring(p,-1.27,1.05,-1.06,.25,.015,P.cream,true).scale.y=.68;
 line(p,[-1.45,1.06,-1.32],[-1.45,1.36,-1.32],.02,P.gold);line(p,[-1.45,1.36,-1.32],[-1.27,1.36,-1.32],.02,P.gold);
 box(p,1.25,.47,-1.1,.86,.94,.78,0xe9d9c0,true);box(p,1.25,.44,-.68,.62,.50,.04,0x594e59,true);box(p,1.25,.98,-1.1,.89,.06,.81,P.cream);
 for(const x of [1.02,1.48])for(const z of [-1.32,-.91])ring(p,x,1.03,z,.12,.025,0x6a6368,true);
 ball(p,1.40,1.22,-1.13,.17,.18,.17,0xbc969f);cylinder(p,1.40,1.39,-1.13,.13,.035,P.gold);ring(p,1.40,1.38,-1.13,.14,.02,P.gold);line(p,[1.25,1.21,-1.13],[1.11,1.36,-1.13],.036,0xbc969f);
 box(p,-.3,2.26,-1.35,1.65,.085,.50,P.wood);for(let i=0;i<4;i++){cylinder(p,-.88+i*.36,2.44,-1.32,.12,.3,[0xe2baa5,0xb09cbd,0xe3d6af,0x9db9ad][i]);cylinder(p,-.88+i*.36,2.60,-1.32,.13,.04,P.wood)}
 box(p,-.53,.70,.1,1.12,.10,.75,P.wood,true);for(const x of [-.94,-.12])for(const z of [-.15,.36])box(p,x,.34,z,.06,.70,.06,P.wood);
 box(p,-.53,.758,.1,.34,.014,.73,0xe3b6bc);cup(p,-.73,.77,.1);cup(p,-.30,.77,.13,0xa3c3b0);cylinder(p,-.49,.775,.13,.12,.015,P.cream);ball(p,-.49,.807,.13,.06,.026,.06,0xb98d65);
 chair(p,-1.50,.08,0xc1d1b4,Math.PI/2);chair(p,.4,.15,0xc1d1b4,-Math.PI/2);
 window(p,-1.45,1.15,0x8caf9d,[]);
}
function parlor(p){
 doily(p,.15,.511,.45,.66);
 box(p,.42,.36,-.63,2.45,.39,.91,0xc88fa4,true);box(p,.42,.78,-1.04,2.45,.79,.22,0xd5a2b4,true);for(const x of [-.70,1.54])box(p,x,.6,-.55,.25,.61,1.02,0xc88fa4,true);
 for(let i=0;i<3;i++){box(p,-.24+i*.64,.59,-.55,.61,.16,.65,0xe4b8c4,true);ball(p,-.26+i*.66,.92,-.90,.032,.032,.02,P.cream)}
 for(const x of [-.64,1.5])for(const z of [-.88,-.24])cylinder(p,x,.12,z,.045,.24,P.gold);
 box(p,-.46,.85,-.77,.4,.37,.12,0xf1dec8,true).rotation.z=.2;box(p,1.25,.85,-.75,.40,.37,.12,0x91b8aa,true).rotation.z=-.2;
 const table=cylinder(p,.15,.47,.45,.53,.07,P.wood);table.scale.z=.7;for(let i=0;i<3;i++){const a=i*2.1;line(p,[.15+Math.cos(a)*.4,.04,.45+Math.sin(a)*.27],[.15+Math.cos(a)*.25,.45,.45+Math.sin(a)*.18],.035,P.wood)}cup(p,-.18,.51,.38);
 lamp(p,-1.67,0,-.83,1.65);
 box(p,1.94,.82,-.85,.5,1.64,.54,P.wood);for(let i=0;i<3;i++){box(p,1.94,.18+i*.54,-.52,.44,.04,.56,P.cream);books(p,1.74,.2+i*.54,-.62)}
 box(p,.35,2.08,-1.51,.88,1.03,.09,P.gold,true);box(p,.35,2.08,-1.45,.75,.90,.025,0x73616f);ball(p,.35,2.18,-1.413,.18,.22,.008,0xd6b7a6);box(p,.35,1.86,-1.413,.4,.27,.008,0xa09fa4);for(const x of [.28,.42])ball(p,x,2.19,-1.396,.025,.032,.009,0x51434d);
}
function studio(p){
 box(p,-.2,.77,-.8,2.48,.12,.90,P.cream,true);for(const x of [-1.3,.9])for(const z of [-1.07,-.53])box(p,x,.36,z,.08,.73,.08,P.wood);
 box(p,.56,.50,-.8,.52,.58,.65,0xb8a6c8);for(let i=0;i<2;i++){box(p,.56,.33+i*.27,-.45,.44,.23,.04,0xd0bfd8);ball(p,.56,.33+i*.27,-.41,.035,.035,.02,P.gold)}
 box(p,-.35,.89,-.78,.8,.07,.4,0x5d5664,true);box(p,-.15,1.10,-.82,.20,.42,.27,0x5d5664,true);box(p,-.35,1.28,-.82,.55,.16,.26,0x5d5664,true);box(p,-.58,1.07,-.82,.05,.30,.05,P.gold);ring(p,.016,1.16,-.82,.13,.025,P.gold).rotation.y=Math.PI/2;
 for(let i=0;i<3;i++){cylinder(p,-1.10+i*.19,.98,-.93,.06,.20,[0xdaa3ad,0x88b5a9,0xe6d1ad][i]);cylinder(p,-1.10+i*.19,1.09,-.93,.075,.024,P.wood)}
 chair(p,-.38,.28,0xad99bd);
 box(p,1.50,.35,-.63,.65,.68,.76,0xb99a81,true);box(p,1.50,.7,-.63,.70,.09,.8,P.cream);books(p,1.25,.75,-.62);
 window(p,-1.35,1.30,0xb1a2c3,[]);
 box(p,.50,2.04,-1.40,1.30,.73,.04,0xd2bba0);for(let i=0;i<5;i++){line(p,[.02+i*.25,2.33,-1.34],[.02+i*.25,1.90,-1.34],.008,P.wood);cylinder(p,.02+i*.25,2.12,-1.3,.071,.19,[P.rose,P.mint,P.cream,P.lavender,P.gold][i]).rotation.x=Math.PI/2}
}
function bedroom(p){
 box(p,-.48,.35,-.42,1.79,.40,2.12,P.wood,true);arch(p,-.48,.28,-1.51,1.96,1.45,0xc496a0,.12);arch(p,-.48,.31,-1.37,1.69,1.25,0xebc9c7,.03);
 box(p,-.48,.63,-.42,1.73,.25,2.06,P.cream,true);box(p,-.48,.8,-1.03,1.38,.18,.56,0xf8e8d8,true);
 box(p,-.48,.78,-.01,1.78,.15,1.23,0xabafc5,true);for(let i=0;i<6;i++)box(p,-1.25+i*.3,.868,-.02,.04,.006,1.13,0xe8d4d5);
 box(p,-.48,.70,.65,1.86,.75,.13,0xc496a0,true);
 box(p,1.28,.35,-.97,.74,.70,.67,P.cream,true);box(p,1.28,.41,-.613,.62,.26,.035,0xe0c9bc);ball(p,1.28,.41,-.58,.035,.035,.025,P.gold);lamp(p,1.28,.71,-.98,.58);
 window(p,.5,1.23,0xc5a989,[]);
 const mobile=new T.Group();mobile.position.set(-1.7,2.55,-.6);p.add(mobile);line(mobile,[0,.25,0],[0,0,0],.008,P.gold);line(mobile,[-.35,0,0],[.35,0,0],.012,P.gold);for(let i=0;i<3;i++){const x=-.3+i*.3;line(mobile,[x,0,0],[x,-.30-(i%2)*.14,0],.005,P.gold);ball(mobile,x,-.39-(i%2)*.14,0,.09,.11,.02,0xf1d49e)}
}
export function makeFurniture(id){const g=new T.Group();
 if(id==='plant')plant(g,0,0,0,.8);
 if(id==='lamp')lamp(g,0,0,0,.9);
 if(id==='rug')texturedPlane(g,0,.025,0,1.02,.74,texture('rug',['#d4a7b5','#866477']),true);
 if(id==='bear'){const tan=0xc19778;ball(g,0,.33,0,.2,.23,.17,tan);ball(g,0,.62,0,.23,.21,.18,tan);for(const x of [-.17,.17]){ball(g,x,.79,0,.08,.08,.06,tan);ball(g,x,.12,.04,.1,.10,.12,tan);ball(g,x*1.3,.35,.01,.09,.13,.10,tan)}ball(g,0,.56,.16,.10,.08,.045,P.cream);for(const x of [-.073,.073])ball(g,x,.65,.169,.024,.028,.016,P.ink);ball(g,0,.588,.203,.032,.023,.015,P.ink);box(g,0,.42,.164,.19,.06,.015,P.rose)}
 if(id==='musicbox'){box(g,0,.17,0,.55,.30,.44,0xbb94ab,true);box(g,0,.33,-.17,.54,.28,.05,P.gold,true).rotation.x=-.5;box(g,0,.336,0,.5,.04,.39,P.cream);cylinder(g,0,.39,0,.12,.07,P.gold);ball(g,0,.58,0,.08,.10,.08,P.cream);cylinder(g,0,.47,0,.14,.15,P.rose,1.6);line(g,[.29,.21,0],[.39,.21,0],.02,P.gold);ball(g,.40,.23,0,.03,.05,.03,P.cream)}
 if(id==='mobile'){cylinder(g,0,.025,0,.2,.05,P.wood);line(g,[0,0,0],[0,1.10,0],.019,P.gold);line(g,[-.31,1.05,0],[.31,1.05,0],.018,P.gold);for(let i=0;i<3;i++){let x=-.27+i*.27;line(g,[x,1.05,0],[x,.85-(i%2)*.2,0],.007,P.gold);ball(g,x,.75-(i%2)*.2,0,.09,.12,.035,[P.gold,P.cream,P.rose][i])}}
 return g;
}
export function createHouse(scene){
 const root=new T.Group();root.position.y=.26;scene.add(root);const staticRoot=new T.Group();root.add(staticRoot);const lights=[];
 for(let j=0;j<2;j++)box(staticRoot,0,j*3.2,0,9.85,.19,3.65,P.wood);box(staticRoot,0,6.4,-.02,9.85,.16,3.65,P.cream);
 for(const room of ROOMS){const g=new T.Group();g.position.set(room.x,room.y,0);staticRoot.add(g);
 box(g,0,1.57,-1.75,4.76,3.10,.15,room.tint);
 const color={kitchen:'#dfd5b8',parlor:'#d5b99c',studio:'#d6c9b2',bedroom:'#dfcca9'}[room.id];texturedPlane(g,0,1.87,-1.665,4.70,2.45,texture('wall',[color,'#fff0dc']));
 box(g,0,.45,-1.63,4.65,.82,.05,room.tint);for(let i=0;i<10;i++)box(g,-2.25+i*.50,.46,-1.59,.025,.70,.035,P.cream);box(g,0,.92,-1.60,4.72,.047,.055,P.cream);
 box(g,0,.13,-1.55,4.70,.13,.12,P.cream);box(g,0,3.08,-1.59,4.78,.15,.19,P.cream);
 texturedPlane(g,0,.101,0,4.71,3.40,texture('tile',room.id==='kitchen'?['#e7dcc5','#90aba0']:['#dfc6b5','#b0938e']),true);
 if(room.id!=='kitchen')texturedPlane(g,0,.111,.15,3.6,2.6,texture('rug',room.id==='parlor'?['#be8297','#f0d7b7']:room.id==='studio'?['#a798bb','#e5d1ba']:['#a6afbb','#e9d0bc']),true);
 if(room.id==='kitchen')kitchen(g);if(room.id==='parlor')parlor(g);if(room.id==='studio')studio(g);if(room.id==='bedroom')bedroom(g);
 // Warm little pools of light, kept independent of decorative meshes.
 const light=new T.PointLight(0xffd4a0,1.7,5,2);light.position.set(room.x,room.y+2,-.3);root.add(light);lights.push(light);
 }
 for(const x of [-4.84,0,4.84]){box(staticRoot,x,3.2,-1.70,.19,6.4,.28,P.cream);box(staticRoot,x,3.2,1.65,.14,6.4,.20,P.cream);for(const y of [.17,3.3,6.35])box(staticRoot,x,y,1.65,.23,.20,.26,P.cream,true)}
 // Side walls are deliberately cut back: the front and near corners stay open for play.
 for(const x of [-4.83,4.83])box(staticRoot,x,3.2,-.99,.14,6.4,1.35,0xd4c2b0);
 for(const y of [0,3.2,6.4]){box(staticRoot,0,y+.03,1.77,9.91,.15,.10,P.cream);box(staticRoot,0,y-.065,1.80,9.87,.03,.04,P.gold)}
 const roofShape=new T.Shape();roofShape.moveTo(-4.90,6.4);roofShape.lineTo(0,8.20);roofShape.lineTo(4.90,6.4);roofShape.closePath();const gable=new T.Mesh(new T.ExtrudeGeometry(roofShape,{depth:.15,bevelEnabled:false}),mat(0xe8d7c1));gable.position.z=-1.77;staticRoot.add(gable);
 for(const sign of [-1,1]){const roof=box(staticRoot,sign*2.56,7.30,-.05,5.5,.18,3.97,0x8a5d4d);roof.rotation.z=-sign*.355;
 for(let row=0;row<7;row++)for(let col=0;col<13;col++){const x=sign*(.20+col*.40),y=8.40-Math.abs(x)*.3707,z=-1.88+row*.57;const tile=box(staticRoot,x,y,z,.40,.065,.51,[0xa8755d,0x9c644e,0xb18064][(row+col)%3],true);tile.rotation.z=-sign*.355}
 line(staticRoot,[0,8.30,1.99],[sign*5.17,6.37,1.99],.095,P.cream);line(staticRoot,[0,8.36,-2.05],[sign*5.17,6.44,-2.05],.07,P.cream)}
 line(staticRoot,[0,8.31,-2.08],[0,8.31,2.0],.07,P.gold);
 box(staticRoot,-3.02,7.63,-1.06,.52,.86,.60,0xe1ccb4);box(staticRoot,-3.02,8.08,-1.06,.69,.13,.77,P.cream);
 // Hanging moon over the roof's open triangular recess.
 line(staticRoot,[0,8.10,1.72],[0,7.66,1.72],.008,P.gold);const moon=new T.Mesh(crescentGeometry(.29),mat(P.gold));moon.name='hanging-crescent';moon.userData.noBatch=true;moon.position.set(.13,7.42,1.73);moon.rotation.z=-.18;moon.castShadow=true;staticRoot.add(moon);
 plant(staticRoot,-5.37,.045,-.56,1.48);plant(staticRoot,5.34,.045,-.65,1.25);plant(staticRoot,-5.4,.045,.79,.8);
 // Twelve tiny outside steps make the two-storey miniature legible.
 for(let i=0;i<12;i++)box(staticRoot,5.02,.13+i*.266,1.48-i*.23,.52,.20,.31,0xc5ac94);
 line(staticRoot,[5.31,.55,1.62],[5.31,3.60,-1.18],.023,P.cream);for(let i=0;i<6;i++)line(staticRoot,[5.31,.18+i*.53,1.44-i*.46],[5.31,.73+i*.53,1.44-i*.46],.022,P.cream);
 const windows=new Set();staticRoot.traverse(o=>{if(o.material?.color?.getHex()===0xb9cacc)windows.add(o.material)});batch(staticRoot);return {root,lights,windows};
}
