import * as T from 'three';
import {lanternLevel} from '../simulation.js';
import {cylinder,ball,ring,mat,batch,palette as P} from './primitives.js';
import {softTexture} from './textiles.js';
import {createLampPool} from './lamp-pool.js';

// How the courtyard fanous looks at a level (0..5): a cold wick shows no flame; every level adds flame,
// glass warmth and a wider glow, stronger after dark. A small flicker unless motion is reduced.
export function lanternLook(level,night,t,still){
 const l=Math.max(0,Math.min(5,Number.isFinite(level)?level:0)),n=Math.max(0,Math.min(1,Number(night)||0));
 const lit=l>0?1:0,flicker=still||!lit?1:1+.06*Math.sin(t*9.1)+.04*Math.sin(t*13.7);
 return {flame:lit*(.55+.11*l)*flicker,glass:.08+.17*l*(.6+.4*n),glow:lit*(.10+.07*l)*(.45+.55*n),
   glowSize:.6+.22*l,pool:lit*(.06+.05*l)*(.35+.65*n)};
}
// A brass fanous standing on the courtyard tiles, mirroring the fountain. Touching it opens Today.
export function createLantern(parent){
 const root=new T.Group();root.name='courtyard-lantern';root.position.set(3.4,-.17,2.95);
 root.scale.setScalar(1.5);parent.add(root);
 const brass=new T.Group();root.add(brass);
 cylinder(brass,0,.035,0,.15,.07,P.gold);cylinder(brass,0,.10,0,.10,.07,P.gold,1.4);
 ring(brass,0,.13,0,.115,.014,P.gold,true);ring(brass,0,.49,0,.115,.014,P.gold,true);
 for(const a of [0,1,2,3]){const r=a*Math.PI/2+.78;cylinder(brass,Math.cos(r)*.11,.31,Math.sin(r)*.11,.008,.36,P.gold)}
 cylinder(brass,0,.57,0,.025,.15,P.gold,6);ball(brass,0,.66,0,.03,.04,.03,P.gold);
 ring(brass,0,.72,0,.045,.008,P.gold);batch(brass);
 const glass=new T.Mesh(new T.CylinderGeometry(.105,.105,.35,16,1,true),mat(0xf3dcb4,{emissive:0xf2a654,
   emissiveIntensity:.08,transparent:true,opacity:.62,side:T.DoubleSide,depthWrite:false}));
 glass.position.y=.31;glass.userData.noBatch=true;root.add(glass);
 const sprite=(color,opacity)=>new T.Sprite(new T.SpriteMaterial({map:softTexture(),color,transparent:true,
   opacity,depthWrite:false,blending:T.AdditiveBlending}));
 const flame=sprite(0xffd28a,.95);flame.position.y=.29;flame.scale.set(.09,.14,1);root.add(flame);
 const glow=sprite(0xf6b766,.2);glow.position.y=.32;root.add(glow);
 const pool=createLampPool(root,0,0,.75,{y:.012,name:'lantern-pool'});
 const hit=new T.Mesh(new T.BoxGeometry(.5,.9,.5),new T.MeshBasicMaterial({visible:false}));
 hit.position.y=.38;hit.userData={lantern:true};root.add(hit);
 const status={level:-1};
 return {root,hit,status,update(state,night){
  const level=lanternLevel(state),still=state.settings.reducedMotion||state.paused;
  const look=lanternLook(level,night,state.elapsed,still);status.level=level;
  flame.visible=look.flame>0;flame.scale.set(.09*look.flame,.15*look.flame,1);
  glass.material.emissiveIntensity=look.glass;
  glow.visible=look.glow>0;glow.material.opacity=look.glow;glow.scale.setScalar(look.glowSize);
  pool.visible=look.pool>0;pool.material.opacity=look.pool;
 }};
}
