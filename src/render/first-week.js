import * as T from 'three';
import {ROOMS} from '../content.js';
import {palette as P,ball,line,batch,mat} from './primitives.js';
import {garlands,raining} from '../simulation.js';

// The first week's arc in the house (src/sim-arc.js), built from the house's own brass thread,
// cream jasmine buds and rose ribbon. Jasmine thread strands appear in the liwan night by night;
// on the rain night, beads of water run down the window glass and rain falls past the house.
const LIWAN=ROOMS.find(r=>r.id==='parlor');
// Each strand hangs across the liwan's back wall: [from x, to x, height, sag].
const STRANDS=[[-1.95,1.95,2.52,.2],[-1.95,-.2,2.30,.14],[.95,1.95,2.26,.12]];
// Window glass in the rooms that have one: [room, x, sill y, half width, height] (src/render/house.js).
const PANES=[['kitchen',-1.45,1.15],['studio',-1.35,1.30],['bedroom',.5,1.23]];
const BEADS=28,STREAKS=150;

function strand(root,[a,b,y,sag]){
 const g=new T.Group();root.add(g);const points=[];
 for(let i=0;i<=10;i++){const t=i/10;points.push([a+(b-a)*t,y-sag*4*t*(1-t),-1.36])}
 for(let i=0;i<10;i++)line(g,points[i],points[i+1],.006,P.gold);
 points.forEach((p,i)=>{if(i===0||i===10)return;ball(g,p[0],p[1]-.035,p[2]+.01,.046,.04,.04,P.cream);
  ball(g,p[0],p[1]-.035,p[2]+.05,.014,.014,.01,P.gold)});
 batch(g);g.visible=false;return g;
}
// Noor's ribbon, tied round the jasmine pot (src/render/story-props.js) on Noor's night.
function ribbon(root){
 const g=new T.Group();g.position.set(-.90,1.24,-1.22);root.add(g);
 for(const s of [-1,1]){const loop=ball(g,s*.07,0,0,.07,.04,.02,P.cream);loop.rotation.z=s*.35;
  line(g,[s*.015,-.02,0],[s*.06,-.2,.01],.008,P.cream)}
 ball(g,0,0,.01,.025,.025,.02,P.gold);batch(g);g.visible=false;return g;
}
function beads(parent){
 const glass=mat(0xdfe9ee,{transparent:true,opacity:.62,roughness:.08,metalness:0,emissive:0x8baaca,
  emissiveIntensity:.18,depthWrite:false});
 const mesh=new T.InstancedMesh(new T.SphereGeometry(1,8,6),glass,PANES.length*BEADS);
 mesh.name='rain-beads';mesh.userData.noBatch=true;mesh.frustumCulled=false;parent.add(mesh);
 const seeds=[];let k=0;
 for(const [room,x,y] of PANES){const r=ROOMS.find(q=>q.id===room);
  for(let i=0;i<BEADS;i++,k++){const u=((i*37)%BEADS)/BEADS,v=((i*53+7)%BEADS)/BEADS;
   seeds.push({x:r.x+x+(u-.5)*.72,top:r.y+y+1.25,bottom:r.y+y+.16,phase:v,speed:.05+((i*13)%7)*.012,
    size:.011+((i*29)%5)*.003})}}
 return {mesh,seeds};
}
function streaks(parent){
 const pos=new Float32Array(STREAKS*6),geo=new T.BufferGeometry();
 geo.setAttribute('position',new T.BufferAttribute(pos,3));
 const lines=new T.LineSegments(geo,new T.LineBasicMaterial({color:0xb7c6dc,transparent:true,opacity:.0,
  depthWrite:false,fog:false}));lines.name='rain-streaks';lines.userData.noBatch=true;lines.frustumCulled=false;
 parent.add(lines);
 const drops=Array.from({length:STREAKS},(_,i)=>({x:-7.5+((i*71)%150)/10,z:-2.4-((i*17)%9)*.25,
  y:((i*43)%110)/10-1,speed:5+((i*11)%5)}));
 return {lines,pos,drops};
}

export function createFirstWeek(parent){
 const root=new T.Group();root.name='first-week';root.userData.noBatch=true;parent.add(root);
 const liwan=new T.Group();liwan.position.set(LIWAN.x,LIWAN.y,0);root.add(liwan);
 const strands=STRANDS.map(s=>strand(liwan,s)),bow=ribbon(liwan);
 const water=beads(root),rain=streaks(root),m=new T.Matrix4(),q=new T.Quaternion(),v=new T.Vector3(),
   sc=new T.Vector3();
 let mix=0;
 return {root,get rainMix(){return mix},
  update(state,dt,reduced){
   const shown=garlands(state);strands.forEach((g,i)=>{g.visible=i<shown});bow.visible=state.arc?.keepsake===true;
   const want=Number(raining(state));mix=reduced?want:T.MathUtils.damp(mix,want,1.4,dt);
   water.mesh.visible=rain.lines.visible=mix>.01;if(!water.mesh.visible)return;
   const t=state.elapsed;
   water.seeds.forEach((s,i)=>{const f=reduced?s.phase:(s.phase+t*s.speed)%1;
    v.set(s.x+Math.sin(i*1.7+f*3)*.012,s.top-(s.top-s.bottom)*f,-1.49);
    sc.set(s.size*mix,s.size*1.5*mix,s.size*.45);m.compose(v,q,sc);water.mesh.setMatrixAt(i,m)});
   water.mesh.instanceMatrix.needsUpdate=true;
   rain.lines.material.opacity=.42*mix;
   rain.drops.forEach((d,i)=>{const y=reduced?d.y:((d.y-t*d.speed)%11+11)%11-1,o=i*6;
    rain.pos.set([d.x,y,d.z,d.x-.05,y+.38,d.z],o)});
   rain.lines.geometry.attributes.position.needsUpdate=true;
  }};
}
