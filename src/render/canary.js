import * as T from 'three';
import {ROOMS} from '../content.js';
import {isNight,canaryWatch,CANARY_DUSK,CANARY_SLEEP} from '../simulation.js';
import {palette as P,ball,cylinder,ring,line,mat} from './primitives.js';

// The canary (the app's subscription): a brass cage hanging by the liwan window. It sings by day, more at
// dusk and softly in the first half of the night, when it now and then ruffles or tilts its head at the
// ghost; then a cloth goes over the cage. On a night the midnight visitor will come it falls silent at dusk,
// sleeks its feathers and turns on its perch to face the room the visitor comes to first (sim canaryWatch),
// and keeps that watch, still and uncovered, while the borrowed thing is out. Never picked, saved or counted.
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
 // Yaw first, then the body's lift, so a turned bird raises its beak toward the room it faces.
 const bird=new T.Group();bird.rotation.order='YXZ';bird.position.set(0,.15,0);root.add(bird);
 const body=ball(bird,0,.045,0,.045,.04,.06,BIRD);body.rotation.x=-.35;
 const head=new T.Group();head.position.set(0,.095,.04);bird.add(head);
 ball(head,0,0,0,.032,.03,.032,BIRD);
 const beak=cylinder(head,0,-.002,.04,.009,.022,BEAK,0);beak.rotation.x=Math.PI/2;
 for(const sign of [-1,1]){ball(head,sign*.02,.008,.02,.006,.006,.004,P.ink);
 const wing=ball(bird,sign*.035,.05,-.005,.012,.028,.045,WING);wing.rotation.x=-.4}
 const tail=ball(bird,0,.025,-.075,.018,.008,.04,WING);tail.rotation.x=.5;
 return {bird,head,body};
}
// How the bird stands to face each room from the liwan: the kitchen lies left along the floor, the
// studio up and to the left, the bedroom straight overhead (a slide along the perch, a turn, a lift of the head).
// The kitchen: low and level along the perch. The studio: clinging high on the left bars, body and beak raised.
const WATCH=Object.freeze({kitchen:{x:-.1,y:.15,yaw:-Math.PI/2,pitch:.08,lean:.08},
 studio:{x:-.11,y:.215,yaw:-Math.PI*.42,pitch:-.75,lean:-.55},
 bedroom:{x:.02,y:.15,yaw:Math.PI*.08,pitch:-1.0,lean:-.28},
 parlor:{x:0,y:.15,yaw:0,pitch:.25,lean:0}});
const NOTES=3,NOTE_LIFE=1.7;
// Little gold notes that rise from the cage while it sings (gone when it is silent): the song made visible.
function buildNotes(root){
 return Array.from({length:NOTES},()=>{const g=new T.Group(),m=new T.MeshBasicMaterial({color:0xe8c46a,
  transparent:true,opacity:0,depthWrite:false});
  const head=ball(g,0,0,0,.02,.015,.012,P.gold);head.rotation.z=.5;head.material=m;
  line(g,[.017,.004,0],[.017,.075,0],.004,P.gold).material=m;
  const flag=line(g,[.017,.075,0],[.04,.05,0],.004,P.gold);flag.material=m;
  g.visible=false;root.add(g);return {g,m}});
}
function showNotes(notes,age,soft){
 notes.forEach(({g,m},i)=>{const k=(age-i*.38)/NOTE_LIFE;g.visible=k>0&&k<1;if(!g.visible)return;
  // Out through the bars on the room side, under the ceiling beam, rising a little as they go.
  g.position.set(.1+k*.32+i*.02,.2+k*.2+Math.sin(k*6+i*2)*.025,.12);g.scale.setScalar(soft?1.15:1.5);
  m.opacity=(soft?.55:.9)*Math.sin(k*Math.PI)});
}
// A look the bird gives the ghost now and then on an awake night: a ruffle, or a tilt of the head upward.
function ghostReaction(t){const turn=Math.floor(t/13),age=t-turn*13;
 return age<1.4&&turn%3!==2?{kind:turn%2?'tilt':'ruffle',k:Math.sin(age/1.4*Math.PI)}:null}
export function createCanary(parent){
 const room=ROOMS.find(r=>r.id==='parlor'),root=new T.Group();root.name='canary';root.userData.noBatch=true;
 // By the jasmine window, clear of the lamp; a little larger to read on a phone.
 root.position.set(room.x+.38,room.y+1.72,-1.0);root.scale.setScalar(1.3);root.visible=false;parent.add(root);
 buildCage(root);const {bird,head,body}=buildBird(root),notes=buildNotes(root);
 const cover=ball(root,0,.17,0,.215,.25,.215,CLOTH);cover.material=mat(CLOTH,{roughness:.95});
 root.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=true;o.raycast=()=>{}}});
 let present=false,songAt=-Infinity,soft=false;
 return {root,
  setPresent(on){present=Boolean(on)},
  sing(t,quiet=false){songAt=t;soft=Boolean(quiet)},
  update(state,still){
   root.visible=present;if(!present)return;
   const t=state.elapsed,night=isNight(state),watch=canaryWatch(state),pose=WATCH[watch];
   const asleep=!watch&&night&&state.clock>=CANARY_SLEEP;root.userData.watch=watch;
   cover.visible=asleep;bird.visible=!asleep;
   const age=!watch&&!asleep&&!still?t-songAt:-1,singing=age>=0&&age<1.6;showNotes(notes,age<2.5?age:-1,soft);
   if(pose){// Silent and still, feathers sleeked, facing the room: the warning reads only by looking at it.
    bird.position.set(pose.x,pose.y,0);bird.rotation.set(pose.lean,pose.yaw,0);head.rotation.set(pose.pitch,0,0);
    body.scale.set(.04,.042,.064);root.rotation.z=0;return}
   const react=night&&!still?ghostReaction(t):null,dusk=!night&&state.clock>=CANARY_DUSK;
   bird.position.set(0,.15+(singing?Math.abs(Math.sin(t*14))*.008:0),0);bird.rotation.set(0,0,0);
   const puff=react?.kind==='ruffle'?1+.22*react.k:1;body.scale.set(.045*puff,.04*puff,.06*(1+.08*(puff-1)));
   bird.rotation.z=react?.kind==='ruffle'?Math.sin(t*40)*.06*react.k:0;
   head.rotation.x=singing?-.35+Math.sin(t*28)*.08:still?0:react?.kind==='tilt'?-.55*react.k:Math.sin(t*.9)*.12;
   head.rotation.y=still?0:react?.kind==='tilt'?.5*react.k:Math.sin(t*(dusk?.5:.37))*.5;
   head.rotation.z=react?.kind==='tilt'?.45*react.k:0;
   root.rotation.z=still?0:Math.sin(t*.6)*.02;
  }};
}
