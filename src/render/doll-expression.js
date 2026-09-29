import * as T from 'three';
const contours=new WeakMap();
// Baked lip vertices belong to one resident. Curve them in place; keep shared
// materials and the original single draw submission for both colored lips.
export function shapeMouth(mouth,mood,dt,still){
 let record=contours.get(mouth);
 if(!record){record=mouth.children.filter(o=>o.isMesh).map(mesh=>({mesh,base:mesh.geometry.attributes.position.array.slice()}));contours.set(mouth,record)}
 const target=mood==='delighted'?.010:mood==='worried'?-.004:0;
 mouth.smileValue=still?target:T.MathUtils.damp(mouth.smileValue||0,target,10,Math.max(0,Number.isFinite(dt)?dt:0));
 for(const {mesh,base} of record){const p=mesh.geometry.attributes.position;for(let i=0;i<p.count;i++){const edge=Math.min(1,Math.abs(base[i*3])/.035);p.setY(i,base[i*3+1]+mouth.smileValue*edge*edge)}p.needsUpdate=true;mesh.geometry.computeBoundingSphere()}
}
