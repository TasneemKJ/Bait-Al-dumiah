import * as T from 'three';

// A resident whose requests are all done wears the ceremony's gold ribbon at the collar: a fine gilded band
// and a small bow, like a mended seam on porcelain. It shimmers slowly unless motion is reduced.
export const ribbonShine=(t,still)=>still?.55:.45+.2*(.5+.5*Math.sin(t*1.3));
export function createRibbon(body){
 const gold=new T.MeshStandardMaterial({color:0xd4a64e,emissive:0xb88a32,emissiveIntensity:.55,metalness:.6,
   roughness:.35});
 const root=new T.Group();root.name='gold-ribbon';root.userData.noBatch=true;root.visible=false;body.add(root);
 const band=new T.Mesh(new T.TorusGeometry(.078,.009,6,28),gold);band.rotation.x=Math.PI/2;band.position.y=.80;
 root.add(band);
 for(const sign of [-1,1]){const loop=new T.Mesh(new T.SphereGeometry(.026,8,6),gold);
  loop.scale.set(1.3,.75,.5);loop.position.set(sign*.028,.79,.078);root.add(loop)}
 return {root,update(shown,t,still){root.visible=Boolean(shown);if(shown)gold.emissiveIntensity=ribbonShine(t,still)}};
}
