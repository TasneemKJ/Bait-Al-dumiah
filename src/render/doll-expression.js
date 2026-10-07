import * as T from 'three';
const contours=new WeakMap();
// Every resident owns their mutable smile; only a changed contour needs a GPU
// upload. Snap a converged transition rather than rewriting microscopic deltas.
export function shapeMouth(mouth,mood,dt,still){
 let record=contours.get(mouth);
 if(!record){record={parts:mouth.children.filter(o=>o.isMesh).map(mesh=>({mesh,base:mesh.geometry.attributes.position.array.slice()})),applied:NaN};contours.set(mouth,record)}
 const target=mood==='delighted'?.010:mood==='worried'?-.004:0;
 let value=still?target:T.MathUtils.damp(mouth.smileValue||0,target,10,Math.max(0,Number.isFinite(dt)?dt:0));
 if(Math.abs(value-target)<1e-6)value=target;
 mouth.smileValue=value;if(record.applied===value)return;record.applied=value;
 for(const {mesh,base} of record.parts){const p=mesh.geometry.attributes.position;
 for(let i=0;i<p.count;i++){const edge=Math.min(1,Math.abs(base[i*3])/.035);p.setY(i,base[i*3+1]+value*edge*edge)}p.needsUpdate=true;mesh.geometry.computeBoundingSphere()}
}
