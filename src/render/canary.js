import * as T from 'three';
import {ROOMS} from '../content.js';
import {palette as P,ball,cylinder,ring,line,mat} from './primitives.js';

// The canary (the app's subscription): a brass cage hanging by the liwan window, a yellow bird on its
// perch by day, a cloth over the cage at night. Company only: it is never picked, saved or counted.
const BIRD=0xf2cf5b,WING=0xe0b33f,BEAK=0xe59a4c,CLOTH=0xd9b6b0;
function buildCage(root){
 const bars=10,radius=.17,height=.30;
 cylinder(root,0,.015,0,radius+.02,.03,P.gold);ring(root,0,.03,0,radius,.008,P.gold,true);
 for(let i=0;i<bars;i++){const a=i/bars*Math.PI*2,x=Math.cos(a)*radius,z=Math.sin(a)*radius;
 line(root,[x,.03,z],[x,height,z],.0045,P.gold);line(root,[x,height,z],[x*.25,height+.12,z*.25],.0045,P.gold)}
 ring(root,0,height,0,radius,.007,P.gold,true);ring(root,0,height*.55,0,radius,.005,P.gold,true);
 ball(root,0,height+.13,0,.025,.025,.025,P.gold);
 const hook=ring(root,0,height+.18,0,.035,.006,P.gold);hook.rotation.y=Math.PI/2;
 line(root,[0,height+.21,0],[0,.9,0],.004,P.dark);
 line(root,[-radius*.9,.13,0],[radius*.9,.13,0],.007,P.wood);
 cylinder(root,radius*.55,.07,radius*.3,.035,.03,P.cream);
}
function buildBird(root){
 const bird=new T.Group();bird.position.set(0,.15,0);root.add(bird);
 const body=ball(bird,0,.045,0,.045,.04,.06,BIRD);body.rotation.x=-.35;
 const head=new T.Group();head.position.set(0,.095,.04);bird.add(head);
 ball(head,0,0,0,.032,.03,.032,BIRD);
 const beak=cylinder(head,0,-.002,.04,.009,.022,BEAK,0);beak.rotation.x=Math.PI/2;
 for(const sign of [-1,1]){ball(head,sign*.02,.008,.02,.006,.006,.004,P.ink);
 const wing=ball(bird,sign*.035,.05,-.005,.012,.028,.045,WING);wing.rotation.x=-.4}
 const tail=ball(bird,0,.025,-.075,.018,.008,.04,WING);tail.rotation.x=.5;
 return {bird,head};
}
export function createCanary(parent){
 const room=ROOMS.find(r=>r.id==='parlor'),root=new T.Group();root.name='canary';root.userData.noBatch=true;
 // By the jasmine window, clear of the lamp; a little larger to read on a phone.
 root.position.set(room.x+.38,room.y+1.72,-1.0);root.scale.setScalar(1.3);root.visible=false;parent.add(root);
 buildCage(root);const {bird,head}=buildBird(root);
 const cover=ball(root,0,.17,0,.215,.25,.215,CLOTH);cover.material=mat(CLOTH,{roughness:.95});
 root.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=true;o.raycast=()=>{}}});
 let present=false,songAt=-Infinity;
 return {root,
  setPresent(on){present=Boolean(on)},
  sing(t){songAt=t},
  update(t,night,still){
   root.visible=present;if(!present)return;
   cover.visible=night;bird.visible=!night;
   const singing=!still&&t-songAt<1.6;
   head.rotation.x=singing?-.35+Math.sin(t*28)*.08:still?0:Math.sin(t*.9)*.12;
   head.rotation.y=still?0:Math.sin(t*.37)*.5;
   bird.position.y=.15+(singing?Math.abs(Math.sin(t*14))*.008:0);
   root.rotation.z=still?0:Math.sin(t*.6)*.02;
  }};
}
