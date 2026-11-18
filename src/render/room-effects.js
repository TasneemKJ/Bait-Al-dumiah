import * as T from 'three';
import {createKettleSteam} from './kettle-steam.js';
import {createLampPool,poolOpacity} from './lamp-pool.js';
import {duskGlow,roomPoolLook,sunbeamLook,rainCausticPulse,visitorHush} from './visual-policy.js';

export function createRoomEffects(parent){
 const root=new T.Group();root.name='quiet-room-effects';root.userData.noBatch=true;parent.add(root);
 const faceFill=new T.DirectionalLight(0xffdfbe,.18);faceFill.name='caretaker-face-fill';
 faceFill.position.set(0,5,12);faceFill.target.position.set(0,2.7,0);root.add(faceFill,faceFill.target);
 const patches=createWindowPatches(root),beams=createWindowSunbeams(root);
 const curtains=[];parent.traverse(o=>{if(o.name==='draped-curtain')curtains.push(o)});
 const pools=[];parent.traverse(o=>{if(o.name==='lamp-pool-static')pools.push(o)});
 for(const [room,x,y,z,r,c] of [['kitchen',-2.75,.128,-.08,1.55,0xffc27d],
   ['studio',-2.65,3.328,-.38,1.55,0xf2c48f],['bedroom',3.55,3.328,-.58,1.50,0xffd9a8]])
  pools.push(createLampPool(root,x,z,r,{y,stat:true,name:'lamp-pool-static',room,color:c}));
 // An idle stir (src/idle-life.js): one window's pair of curtains lifts and settles over four seconds.
 let gust=-Infinity,pair=-1;const stirOf=(i,t)=>{const k=(t-gust)/4;
  return Math.floor(i/2)===pair&&k>0&&k<1?Math.sin(Math.PI*k)*Math.sin((t-gust)*2.6):0};
 const anchor=(()=>{let a=null;parent.traverse(o=>{if(o.name==='kettle-steam-anchor')a=o});return a})();
 const kettleSteam=anchor?createKettleSteam(anchor):null;
 const flames=[];const silhouette=new T.Shape();silhouette.moveTo(0,0);
 silhouette.bezierCurveTo(-.15,.02,-.10,.21,.01,.35);
 silhouette.bezierCurveTo(-.03,.20,.16,.12,.06,.025);silhouette.quadraticCurveTo(.04,0,0,0);
 const shape=new T.ShapeGeometry(silhouette,14);
 for(let i=0;i<3;i++){
  const flame=new T.Group();flame.name='hearth-flame';
  flame.position.set(1.08+(i-1)*.145,.23,-1.04);root.add(flame);flames.push(flame);
  const outer=new T.Mesh(shape,new T.MeshBasicMaterial({color:0xe38f54,transparent:true,opacity:.90,
    side:T.DoubleSide,depthWrite:false}));flame.add(outer);
  const inner=new T.Mesh(shape,new T.MeshBasicMaterial({color:0xf6d297,transparent:true,
    opacity:.92,side:T.DoubleSide,depthWrite:false}));
  inner.scale.set(.48,.65,1);inner.position.z=.009;flame.add(inner);
 }
 return {root,stir(t){gust=t;pair=(pair+1)%Math.max(1,Math.ceil(curtains.length/2))},
  status(){return {pools:pools.length,poolOpacity:pools[0]?.material.opacity??null,
   sunbeams:beams.length,sunbeamOpacity:beams[0]?.material.opacity??null,
   steam:Boolean(kettleSteam),steamVisible:kettleSteam?.root.visible??false}},
  update(state,mix,{lampFocus=null,rainMix=0}={}){
  const lit=Math.max(0,Math.min(1,mix)),dusk=duskGlow(state.clock)*(1-lit),hush=visitorHush(state);
  pools.forEach(p=>{const look=roomPoolLook(p.userData.room,lit,state.clock,lampFocus?.[p.userData.room]??0);
   p.material.color.setHex(look.color);p.material.opacity=poolOpacity(look.level)*(1-hush)});
  if(kettleSteam){const lina=state.dolls.find(d=>d.id==='lina');
  kettleSteam.update(state.elapsed,Boolean(lina)&&lina.action==='idle',state.settings.reducedMotion||state.paused)}
  faceFill.intensity=.18+lit*.48;
  const hushShadow=1-hush*2.2;
  patches.forEach((p,i)=>{p.material.color.set(0xf0d1a0).lerp(new T.Color(0xffae68),dusk*.75)
   .lerp(new T.Color(0xabc4ef),lit);p.material.opacity=(.15+dusk*.035-lit*.065+
   rainCausticPulse(state.elapsed,rainMix,i,state.settings.reducedMotion||state.paused))*hushShadow});
  const beam=sunbeamLook(lit,state.clock,rainMix),beamOpacity=beam.opacity*(1-hush*2.5);
  beams.forEach(b=>{b.material.color.set(0xffe6be).lerp(new T.Color(0xffb26b),beam.dusk*.82)
   .lerp(new T.Color(0x9cb8ec),beam.night);b.material.opacity=beamOpacity;b.visible=beamOpacity>.005});
  if(!state.paused){curtains.forEach((c,i)=>{const g=stirOf(i,state.elapsed),still=state.settings.reducedMotion;
  c.rotation.x=still?0:Math.sin(state.elapsed*.42+i*.8)*.014+g*.10;
  c.rotation.z=still?0:(Math.sin(state.elapsed*.35+i)*.009+Math.abs(g)*.05)*c.userData.curtainSide});
  const t=state.settings.reducedMotion?0:state.elapsed;
  flames.forEach((f,i)=>{f.scale.y=(1+Math.sin(t*1.7+i*2.2)*.055)*(1-hush*1.5);
  f.rotation.z=Math.sin(t*.9+i)*.025;f.children[0].material.opacity=(.68+lit*.20)*(1-hush*1.8)})}
 }};
}

let windowMask=null;
function createWindowPatches(parent){
 if(!windowMask){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const c=canvas.getContext('2d');
  c.shadowColor='white';c.shadowBlur=5;c.strokeStyle='rgba(255,255,255,.78)';c.lineWidth=9;c.lineCap='round';
  // An original arched-lattice light pattern: diagonals plus a softened crown.
  for(let i=-1;i<5;i++){
   c.beginPath();c.moveTo(-20+i*38,128);c.lineTo(70+i*38,0);c.stroke();
   c.beginPath();c.moveTo(148-i*38,128);c.lineTo(58-i*38,0);c.stroke();
  }
  c.beginPath();c.arc(64,44,46,Math.PI,0);c.stroke();
  windowMask=new T.CanvasTexture(canvas);windowMask.userData.shared=true;
 }
 return [[-3.85,.128,-.12],[-3.75,3.328,-.12],[2.90,3.328,-.12]].map(at=>{
  const geometry=new T.PlaneGeometry(1.05,1.72,1,1);geometry.rotateX(-Math.PI/2);
  const p=geometry.attributes.position;for(let i=0;i<p.count;i++)p.setX(i,p.getX(i)+p.getZ(i)*.18);
  const material=new T.MeshBasicMaterial({map:windowMask,color:0xf0d1a0,transparent:true,
    opacity:.15,depthWrite:false,blending:T.AdditiveBlending});
  const mesh=new T.Mesh(geometry,material);mesh.name='window-light-patch';
  mesh.userData.pattern='arched-lattice';mesh.position.fromArray(at);parent.add(mesh);return mesh;
 });
}
let sunbeamMask=null;
function createWindowSunbeams(parent){
 if(!sunbeamMask){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const c=canvas.getContext('2d');
  const v=c.createLinearGradient(0,0,0,128);v.addColorStop(0,'rgba(255,255,255,.72)');
  v.addColorStop(.55,'rgba(255,255,255,.28)');v.addColorStop(1,'rgba(255,255,255,0)');
  c.fillStyle=v;c.fillRect(0,0,128,128);
  c.globalCompositeOperation='destination-in';
  const h=c.createLinearGradient(0,0,128,0);h.addColorStop(0,'rgba(255,255,255,0)');
  h.addColorStop(.22,'rgba(255,255,255,1)');h.addColorStop(.78,'rgba(255,255,255,1)');
  h.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=h;c.fillRect(0,0,128,128);
  sunbeamMask=new T.CanvasTexture(canvas);sunbeamMask.userData.shared=true;
 }
 return [[-3.85,1.38,-.82],[-3.75,4.58,-.82],[2.90,4.58,-.82]].map(at=>{
  const geometry=new T.PlaneGeometry(1.12,2.15,1,1);
  const p=geometry.attributes.position;
  for(let i=0;i<p.count;i++){const drop=.5-p.getY(i)/2.15;
   p.setX(i,p.getX(i)*(1+drop*.28)+drop*.26);p.setZ(i,drop*1.18)}
  const material=new T.MeshBasicMaterial({map:sunbeamMask,color:0xffe6be,transparent:true,
    opacity:.085,side:T.DoubleSide,depthWrite:false,blending:T.AdditiveBlending});
  const mesh=new T.Mesh(geometry,material);mesh.name='window-sunbeam';
  mesh.position.fromArray(at);mesh.raycast=()=>{};parent.add(mesh);return mesh;
 });
}
