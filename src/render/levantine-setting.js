import * as T from 'three';
import {nightFrame} from '../night-score.js';
import {box,ball,cylinder,ring,arch,mat,batch,palette as P} from './primitives.js';
import {softTexture} from './textiles.js';

// A fictional courtyard miniature: polychrome stone, walnut joinery and water.
// Original geometry; no cultural collection imagery is shipped as an asset.
function courtyardArch(material){
 const shape=new T.Shape();shape.moveTo(-2.24,2.44);shape.quadraticCurveTo(0,3.62,2.24,2.44);
 shape.lineTo(2.24,2.61);shape.quadraticCurveTo(0,3.77,-2.24,2.61);shape.closePath();
 const geometry=new T.ExtrudeGeometry(shape,{depth:.09,bevelEnabled:false,curveSegments:32});
 const p=geometry.attributes.position,colors=[];
 for(let i=0;i<p.count;i++){const stripe=Math.floor((p.getX(i)+2.24)/.31)%2;const c=new T.Color(stripe?0x857666:0xe4ceb0);colors.push(c.r,c.g,c.b)}
 geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));
 const mesh=new T.Mesh(geometry,material);mesh.name='courtyard-arch';mesh.castShadow=mesh.receiveShadow=true;return mesh;
}
function floorMap(){
 const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');
 x.fillStyle='#c6b293';x.fillRect(0,0,256,256);
 for(let y=0;y<256;y+=64)for(let a=0;a<256;a+=64){x.fillStyle=(a+y)%128?'#ede0c4':'#aaa393';x.fillRect(a+2,y+2,60,60);x.strokeStyle='#687c79';
 x.lineWidth=3;x.beginPath();x.moveTo(a+32,y+8);x.lineTo(a+56,y+32);x.lineTo(a+32,y+56);
 x.lineTo(a+8,y+32);x.closePath();x.stroke();x.fillStyle='#b28b54';x.fillRect(a+28,y+28,8,8)}
 const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;map.wrapS=map.wrapT=T.RepeatWrapping;map.repeat.set(7,1.5);return map;
}
function passingShadow(){
 const c=document.createElement('canvas');c.width=128;c.height=256;const x=c.getContext('2d');
 // Ambiguous lattice and jasmine leaves: enough movement to suggest a presence
 // without drawing a person or changing a resident's face.
 x.filter='blur(6px)';x.strokeStyle='rgba(255,255,255,.78)';x.lineWidth=7;x.lineCap='round';
 for(let i=-1;i<5;i++){
  x.beginPath();x.moveTo(-22+i*36,256);x.lineTo(96+i*36,0);x.stroke();
  x.beginPath();x.moveTo(150-i*36,256);x.lineTo(32-i*36,0);x.stroke();
 }
 x.fillStyle='rgba(255,255,255,.72)';
 for(let i=0;i<7;i++){
  const y=34+i*29,side=i%2?1:-1,cx=64+side*(17+(i%3)*5);
  x.beginPath();x.ellipse(cx,y,10,5,side*.55,0,Math.PI*2);x.fill();
 }
 return new T.CanvasTexture(c);
}
export function createLevantineSetting(parent){
 const root=new T.Group();root.name='levantine-courtyard';parent.add(root);
 const staticRoot=new T.Group();root.add(staticRoot);
 const stone=mat(0xe4ceb0),dark=mat(0x857666),wood=mat(P.wood),brass=mat(P.gold);
 const band=new T.MeshStandardMaterial({vertexColors:true,roughness:.91});
 let studioArch=null;
 for(const x of [-2.4,2.4])for(const y of [0,3.2]){const a=courtyardArch(band);a.position.set(x,y,1.64);staticRoot.add(a);
  // This original front arch crosses the raised needle's work-camera rays.
  // Preserve its complete geometry and finish while keeping it independently hideable.
  if(x===-2.4&&y===3.2){a.userData.noBatch=true;studioArch=a}
 }
 for(const x of [-4.68,0,4.68])for(let i=0;i<20;i++){const b=box(staticRoot,x,.18+i*.305,1.69,.24,.295,
   .18,i%3===0?dark:stone);b.name='coursed-stone-pier'}
 // A small, closed door between the two ground-floor rooms echoes the journal.
 const door=arch(staticRoot,0,.14,-1.40,.80,2.15,wood,.07);door.name='closed-walnut-door';
 for(const x of [-.22,.22])for(const y of [.57,1.19,1.81])box(staticRoot,x,y,-1.31,.26,.41,.035,dark,true);
 for(const x of [-.11,.11])ring(staticRoot,x,1.20,-1.265,.044,.009,brass);
 // Extend the display's front edge into a narrow courtyard, outside room slots.
 box(staticRoot,0,-.37,2.93,10.2,.32,1.64,wood,true);
 box(staticRoot,0,-.20,2.93,10.24,.055,1.67,stone,true);
 const tile=new T.Mesh(new T.PlaneGeometry(9.92,1.45),new T.MeshStandardMaterial({map:floorMap(),roughness:.86}));tile.rotation.x=-Math.PI/2;
 tile.position.set(0,-.167,2.93);tile.receiveShadow=true;staticRoot.add(tile);
 const shape=new T.Shape();
 for(let i=0;i<8;i++){const a=(i+.5)*Math.PI/4;shape[i?'lineTo':'moveTo'](Math.cos(a)*.69,Math.sin(a)*.69)}shape.closePath();
 const hole=new T.Path();for(let i=7;i>=0;i--){const a=(i+.5)*Math.PI/4;
 hole[i===7?'moveTo':'lineTo'](Math.cos(a)*.55,Math.sin(a)*.55)}hole.closePath();shape.holes.push(hole);
 const basin=new T.Mesh(new T.ExtrudeGeometry(shape,{depth:.21,bevelEnabled:false}),stone);basin.name='octagonal-basin';basin.rotation.x=-Math.PI/2;
 basin.position.set(0,-.14,2.92);basin.castShadow=basin.receiveShadow=true;staticRoot.add(basin);
 const water=new T.Mesh(new T.CircleGeometry(.55,8),new T.MeshStandardMaterial({color:0x467b78,roughness:.24,metalness:.12,transparent:true,
   opacity:.82,depthWrite:false}));water.name='courtyard-water';water.rotation.x=-Math.PI/2;water.position.set(0,.026,2.92);root.add(water);
 const stem=cylinder(staticRoot,0,.14,2.92,.085,.22,brass),spout=ball(staticRoot,0,.275,2.92,.06,.065,.06,brass);
 const ripple=new T.Mesh(new T.RingGeometry(.18,.191,48),new T.MeshBasicMaterial({color:0xddcba6,transparent:true,opacity:.25,side:T.DoubleSide,
   depthWrite:false}));ripple.name='fountain-ripple';ripple.rotation.x=-Math.PI/2;ripple.position.set(0,.03,2.92);root.add(ripple);
 // Walnut lattice above the roof recess; its light gaps are real open geometry.
 for(let i=0;i<17;i++){const x=-1.8+i*.225;box(staticRoot,x,6.89,1.05,.028,.52,.045,wood);}
 for(const y of [6.63,6.80,6.97,7.15])box(staticRoot,0,y,1.05,3.70,.034,.048,wood);
 const shadow=new T.Mesh(new T.PlaneGeometry(.42,.95),new T.MeshBasicMaterial({map:passingShadow(),color:0x172031,transparent:true,opacity:0,
   depthWrite:false}));shadow.name='shutter-passing-shadow';shadow.userData.motif='jasmine-lattice';
   shadow.position.set(-3.75,5.34,-1.497);root.add(shadow);
 const doorGlow=new T.Mesh(new T.PlaneGeometry(.72,1.05),new T.MeshBasicMaterial({map:softTexture(),color:0xf0ae5d,transparent:true,opacity:0,
   depthWrite:false,blending:T.AdditiveBlending}));doorGlow.name='closed-door-light';
   doorGlow.rotation.x=-Math.PI/2;doorGlow.position.set(0,.12,-.94);root.add(doorGlow);
 // Keep the fountain clear of the centered room toolbar in whole-house views.
 for(const part of [basin,water,ripple,stem,spout])part.position.x=-3.4;
 // Preserve both masonry colors in vertex data, using one matte draw batch.
 staticRoot.traverse(mesh=>{
  if(!mesh.isMesh||![stone,dark].includes(mesh.material))return;
  mesh.geometry=mesh.geometry.clone();const count=mesh.geometry.attributes.position.count,colors=[];
  for(let i=0;i<count;i++)colors.push(mesh.material.color.r,mesh.material.color.g,mesh.material.color.b);
  mesh.geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));mesh.material=band;
 });
 batch(staticRoot);
 return {root,staticRoot,studioArch,water,shadow,doorGlow,ripple,update(state,mix){
  const f=nightFrame(state.elapsed,mix,state.settings.reducedMotion);
  shadow.visible=f.shadow>.001;shadow.material.opacity=f.shadow;shadow.position.x=-3.75+f.shadowX;
  doorGlow.material.opacity=f.door;doorGlow.visible=f.door>0;
  water.material.opacity=.80+.025*f.ripple;
  ripple.scale.setScalar(state.settings.reducedMotion?1:.70+f.ripple*1.50);
  ripple.material.opacity=state.settings.reducedMotion?.12:.09+.12*(1-f.ripple);
  root.userData.nightCue={shadow:f.shadow,door:f.door,lamp:f.lamp};return f;
 }};
}
