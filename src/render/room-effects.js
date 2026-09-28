import * as T from 'three';

export function createRoomEffects(parent){
 const root=new T.Group();root.name='quiet-room-effects';root.userData.noBatch=true;parent.add(root);
 const curtains=[];parent.traverse(o=>{if(o.name==='draped-curtain')curtains.push(o)});
 const flames=[];const silhouette=new T.Shape();silhouette.moveTo(0,0);silhouette.bezierCurveTo(-.15,.02,-.10,.21,.01,.35);silhouette.bezierCurveTo(-.03,.20,.16,.12,.06,.025);silhouette.quadraticCurveTo(.04,0,0,0);
 const shape=new T.ShapeGeometry(silhouette,14);
 for(let i=0;i<3;i++){
  const flame=new T.Group();flame.name='hearth-flame';flame.position.set(1.08+(i-1)*.145,.23,-1.04);root.add(flame);flames.push(flame);
  const outer=new T.Mesh(shape,new T.MeshBasicMaterial({color:0xe38f54,transparent:true,opacity:.90,side:T.DoubleSide,depthWrite:false}));flame.add(outer);
  const inner=new T.Mesh(shape,new T.MeshBasicMaterial({color:0xf6d297,transparent:true,opacity:.92,side:T.DoubleSide,depthWrite:false}));inner.scale.set(.48,.65,1);inner.position.z=.009;flame.add(inner);
 }
 return {root,update(state,mix){
  if(!state.paused){curtains.forEach((c,i)=>{c.rotation.x=state.settings.reducedMotion?0:Math.sin(state.elapsed*.42+i*.8)*.014;c.rotation.z=state.settings.reducedMotion?0:Math.sin(state.elapsed*.35+i)*.009*c.userData.curtainSide});const t=state.settings.reducedMotion?0:state.elapsed;flames.forEach((f,i)=>{f.scale.y=1+Math.sin(t*1.7+i*2.2)*.055;f.rotation.z=Math.sin(t*.9+i)*.025;f.children[0].material.opacity=.68+Math.max(0,Math.min(1,mix))*.20})}
 }};
}
