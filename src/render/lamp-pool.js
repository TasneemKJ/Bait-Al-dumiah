import * as T from 'three';
import {softTexture} from './textiles.js';
// A soft warm pool of light on the floor under a lamp. One extra additive quad,
// no new light. Opacity is driven by the owner (night mix or the lamp's own level).
export function createLampPool(parent,x,z,radius,{y=.128,name='lamp-pool',stat=false}={}){
 const material=new T.MeshBasicMaterial({map:softTexture(),color:0xffc27d,transparent:true,opacity:0,depthWrite:false,blending:T.AdditiveBlending});
 material.userData.shared=true;
 const mesh=new T.Mesh(new T.PlaneGeometry(radius*2,radius*1.35),material);
 mesh.name=name;mesh.rotation.x=-Math.PI/2;mesh.position.set(x,y,z);mesh.renderOrder=2;
 mesh.userData.noBatch=true;mesh.userData.staticPool=stat;parent.add(mesh);
 return mesh;
}
// Pool strength for a lamp that is lit by `level` in 0..1 (reduced motion changes nothing here: it is static light).
export const poolOpacity=level=>{const l=Number.isFinite(level)?Math.max(0,Math.min(1,level)):0;return .05+.55*l};
