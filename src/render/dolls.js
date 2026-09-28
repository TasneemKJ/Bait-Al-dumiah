import * as T from 'three';
import {DOLLS,ROOMS} from '../content.js';
import {palette as P,box,ball,cylinder,ring,line,mat} from './primitives.js';

// Handmade porcelain-and-cloth silhouettes. All residents face the open house.
function makeDoll(def){
 const root=new T.Group(),body=new T.Group();root.add(body);
 const skin=mat(0xf1d8c4,{roughness:.44});
 for(const x of [-.12,.12]){cylinder(body,x,.20,0,.057,.28,skin);ball(body,x,.065,.07,.10,.065,.15,0x665166);ring(body,x,.18,0,.06,.011,P.cream,true)}
 const dress=cylinder(body,0,.53,0,.15,.45,def.color,1.8);dress.scale.z=.8;
 ring(body,0,.31,0,.27,.016,P.cream,true).scale.y=.8;
 box(body,0,.49,.192,.17,.22,.025,0xe9d7c5,true);
 for(const y of [.66,.56])ball(body,0,y,.173,.018,.018,.016,P.gold);
 cylinder(body,0,.79,0,.064,.09,skin);
 const arms=[];
 for(const sign of [-1,1]){const arm=new T.Group();arm.position.set(sign*.20,.69,0);body.add(arm);ball(arm,0,-.055,0,.087,.095,.08,def.color);cylinder(arm,0,-.16,0,.038,.20,skin);ball(arm,0,-.275,0,.056,.064,.052,skin);arm.rotation.z=sign*.14;arms.push(arm)}
 const head=new T.Group();head.position.y=1.05;body.add(head);
 ball(head,0,0,0,.29,.30,.25,skin);
 // Sculpted hair cap, individual fringe curls and distinct hairstyles.
 ball(head,0,.09,-.06,.303,.251,.23,def.hair);
 for(let i=0;i<5;i++){const x=-.21+i*.103;const curl=ball(head,x,.18-Math.abs(x)*.14,.17,.083,.125,.085,def.hair);curl.rotation.z=(i-2)*-.12}
 if(def.id==='lina'){for(const sign of [-1,1]){ball(head,sign*.31,-.07,-.01,.105,.19,.10,def.hair);ball(head,sign*.31,.075,.03,.086,.034,.042,P.rose);ball(head,sign*.25,.075,.03,.086,.034,.042,P.rose)}}
 if(def.id==='noor'){ball(head,.21,.24,-.08,.13,.13,.12,def.hair);for(let i=0;i<4;i++)ball(head,-.16+i*.09,.253,.14,.035,.032,.035,0xe8d6b4)}
 const eyes=[];
 for(const sign of [-1,1]){
  const eye=ball(head,sign*.103,-.014,.235,.047,.057,.023,0x3e303d);eyes.push(eye);
  ball(head,sign*.103-.01,.005,.256,.013,.016,.008,P.cream);
  ball(head,sign*.20,-.082,.183,.056,.032,.012,0xdb9e9e).rotation.y=sign*.3;
  line(head,[sign*.128,.067,.221],[sign*.084,.069,.241],.010,def.hair);
 }
 ball(head,0,-.067,.26,.025,.02,.028,skin);
 const smile=new T.Mesh(new T.TorusGeometry(.042,.006,5,16,Math.PI*.70),mat(0x9a626e));smile.position.set(.018,-.12,.243);smile.rotation.z=Math.PI*1.16;head.add(smile);
 if(def.id==='sami'){for(const sign of [-1,1])ring(head,sign*.106,-.014,.265,.070,.009,P.gold);line(head,[-.034,-.008,.269],[.034,-.008,.269],.008,P.gold)}
 // Invisible raycast target is intentionally more forgiving than the tiny silhouette.
 const hit=new T.Mesh(new T.CapsuleGeometry(.37,.70,3,6),new T.MeshBasicMaterial({visible:false}));hit.position.y=.70;hit.userData.doll=def.id;root.add(hit);
 const halo=new T.Mesh(new T.RingGeometry(.38,.44,40),new T.MeshBasicMaterial({color:0xe4bf83,transparent:true,opacity:.9,side:T.DoubleSide,depthWrite:false}));halo.rotation.x=-Math.PI/2;halo.position.y=.12;halo.visible=false;root.add(halo);
 return {root,body,head,arms,eyes,hit,halo,room:def.room};
}
export function createDolls(parent){
 const dolls=DOLLS.map((def,i)=>{const doll=makeDoll(def);parent.add(doll.root);const room=ROOMS.find(r=>r.id===def.room);doll.root.position.set(room.x+(i===1?1.40:.84),room.y+.12,.75);doll.id=def.id;return doll});
 return {
  dolls,targets:dolls.map(d=>d.hit),
  update(state,dt,selected){
   const motion=!state.settings.reducedMotion&&!state.paused;
   dolls.forEach((v,i)=>{
    const d=state.dolls.find(x=>x.id===v.id),room=ROOMS.find(r=>r.id===d.room),t=state.elapsed;
    const roommates=state.dolls.filter(x=>x.room===d.room),order=roommates.indexOf(d);
    // Arrival through a soft fade avoids flying through upper floors during reassignment.
    if(v.room!==d.room){v.root.position.set(room.x+(roommates.length>1?(order-1)*.73:1.35),room.y+.12,.76);v.room=d.room}
    const wandering=d.action==='idle'&&motion?Math.sin(t*.13+i*2)*.34:0;
    const tx=room.x+(roommates.length>1?(order-(roommates.length-1)/2)*.9:(i===1?1.35:.80))+wandering;
    v.root.position.x=T.MathUtils.damp(v.root.position.x,tx,3,dt);
    v.halo.visible=selected===d.id;v.halo.rotation.z=motion?t*.2:0;
    v.body.position.y=motion?(d.action==='play'?Math.abs(Math.sin(t*5))*.09:Math.sin(t*1.7+i)*.012):0;
    v.body.rotation.z=motion&&d.action==='play'?Math.sin(t*4)*.08:0;
    v.head.rotation.z=motion?Math.sin(t*.65+i)*.045:0;
    v.head.rotation.y=motion?Math.sin(t*.38+i)*.12:0;
    v.eyes.forEach(e=>e.scale.y=d.action==='rest'?.014:(motion&&Math.sin(t*.84+i)> .996?.013:.057));
    v.arms.forEach((a,j)=>{const sign=j===0?-1:1;a.rotation.z=sign*(d.action==='play'?.85+Math.sin(t*4)*.25:d.action==='soothe'?.55:.14);a.rotation.x=d.action==='tea'?-.9:d.action==='rest'?-.38:0});
   });
  },
  position(id){return dolls.find(d=>d.id===id)?.root.position.clone()}
 };
}
export function createGhost(parent){
 const root=new T.Group();parent.add(root);
 const m=new T.MeshStandardMaterial({color:0xf5e6dd,roughness:.7,transparent:true,opacity:.88,emissive:0xad91b8,emissiveIntensity:.13,side:T.DoubleSide});
 const points=[new T.Vector2(0,.74),new T.Vector2(.17,.68),new T.Vector2(.27,.50),new T.Vector2(.28,.22),new T.Vector2(.39,0)];
 const body=new T.Mesh(new T.LatheGeometry(points,28),m);root.add(body);for(let i=0;i<7;i++){const a=i*Math.PI*2/7;ball(root,Math.cos(a)*.29,.025,Math.sin(a)*.29,.09,.07,.10,m)}
 for(const x of [-.095,.095])ball(root,x,.43,.235,.045,.07,.019,P.ink);
 ball(root,0,.31,.272,.027,.032,.012,P.rose);
 const hit=new T.Mesh(new T.SphereGeometry(.60,8,6),new T.MeshBasicMaterial({visible:false}));hit.position.y=.35;hit.userData.ghost=true;root.add(hit);
 root.position.set(3.15,5.38,2.4);root.visible=false;
 return {root,hit,update(t,night,reduced){root.visible=night;root.position.y=5.38+(reduced?0:Math.sin(t*1.4)*.15);root.rotation.z=reduced?0:Math.sin(t*.8)*.045}};
}
