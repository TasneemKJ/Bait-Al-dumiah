import * as T from 'three';
import {createTeaSteam} from './resident-effects.js';
import {poolOpacity} from './lamp-pool.js';

export function createRoomEffects(parent){
 const root=new T.Group();root.name='quiet-room-effects';root.userData.noBatch=true;parent.add(root);
 const faceFill=new T.DirectionalLight(0xffdfbe,.18);faceFill.name='caretaker-face-fill';faceFill.position.set(0,5,12);faceFill.target.position.set(0,2.7,0);root.add(faceFill,faceFill.target);
 const patches=createWindowPatches(root);
 const curtains=[];parent.traverse(o=>{if(o.name==='draped-curtain')curtains.push(o)});
 const pools=[];parent.traverse(o=>{if(o.name==='lamp-pool-static')pools.push(o)});
 const anchor=(()=>{let a=null;parent.traverse(o=>{if(o.name==='kettle-steam-anchor')a=o});return a})();
 const kettleSteam=anchor?createTeaSteam(anchor,{color:0xd8ccc4,strength:2.2}):null;if(kettleSteam)kettleSteam.root.scale.setScalar(6);
 const flames=[];const silhouette=new T.Shape();silhouette.moveTo(0,0);silhouette.bezierCurveTo(-.15,.02,-.10,.21,.01,.35);silhouette.bezierCurveTo(-.03,.20,.16,.12,.06,.025);silhouette.quadraticCurveTo(.04,0,0,0);
 const shape=new T.ShapeGeometry(silhouette,14);
 for(let i=0;i<3;i++){
  const flame=new T.Group();flame.name='hearth-flame';flame.position.set(1.08+(i-1)*.145,.23,-1.04);root.add(flame);flames.push(flame);
  const outer=new T.Mesh(shape,new T.MeshBasicMaterial({color:0xe38f54,transparent:true,opacity:.90,side:T.DoubleSide,depthWrite:false}));flame.add(outer);
  const inner=new T.Mesh(shape,new T.MeshBasicMaterial({color:0xf6d297,transparent:true,opacity:.92,side:T.DoubleSide,depthWrite:false}));inner.scale.set(.48,.65,1);inner.position.z=.009;flame.add(inner);
 }
 return {root,status(){return {pools:pools.length,poolOpacity:pools[0]?.material.opacity??null,steam:Boolean(kettleSteam),steamVisible:kettleSteam?.root.visible??false}},update(state,mix){
  const lit=Math.max(0,Math.min(1,mix));pools.forEach(p=>{p.material.opacity=poolOpacity(.15+lit*.85)});
  if(kettleSteam){const lina=state.dolls.find(d=>d.id==='lina');kettleSteam.update(state.elapsed,Boolean(lina)&&lina.action==='idle',state.settings.reducedMotion||state.paused)}
  faceFill.intensity=.18+Math.max(0,Math.min(1,mix))*.48;
  patches.forEach(p=>{p.material.color.set(0xf0d1a0).lerp(new T.Color(0xabc4ef),mix);p.material.opacity=.15-mix*.065});
  if(!state.paused){curtains.forEach((c,i)=>{c.rotation.x=state.settings.reducedMotion?0:Math.sin(state.elapsed*.42+i*.8)*.014;c.rotation.z=state.settings.reducedMotion?0:Math.sin(state.elapsed*.35+i)*.009*c.userData.curtainSide});const t=state.settings.reducedMotion?0:state.elapsed;flames.forEach((f,i)=>{f.scale.y=1+Math.sin(t*1.7+i*2.2)*.055;f.rotation.z=Math.sin(t*.9+i)*.025;f.children[0].material.opacity=.68+Math.max(0,Math.min(1,mix))*.20})}
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
  const geometry=new T.PlaneGeometry(1.05,1.72,1,1);geometry.rotateX(-Math.PI/2);const p=geometry.attributes.position;for(let i=0;i<p.count;i++)p.setX(i,p.getX(i)+p.getZ(i)*.18);
  const material=new T.MeshBasicMaterial({map:windowMask,color:0xf0d1a0,transparent:true,opacity:.15,depthWrite:false,blending:T.AdditiveBlending});const mesh=new T.Mesh(geometry,material);mesh.name='window-light-patch';mesh.userData.pattern='arched-lattice';mesh.position.fromArray(at);parent.add(mesh);return mesh;
 });
}
