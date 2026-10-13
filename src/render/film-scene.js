import * as T from 'three';
import {wideCamera,composeWide} from './film-wide.js';
import {createLevantineSetting} from './levantine-setting.js';
import {compactStatic} from './batching.js';
import {createHouse} from './house.js';
import {createDolls} from './dolls.js';
import {createCraftDetails,createGarden} from './ornaments.js';
import {createState} from '../simulation.js';
import {translate} from '../i18n.js';
import {softTexture} from './textiles.js';

export const FILM_SECONDS=60;
const SHOTS=[
 {start:0,end:8,target:[0,4,0],eye:[-3,6,29],to:[1,5.5,28]},
 {start:8,end:17,target:[-1.95,1.3,.2],eye:[-2.7,2.6,6.8],to:[-1.5,2.3,6.4]},
 {start:17,end:26,target:[-2.1,4.55,-.15],eye:[-3,5.4,7],to:[-1.9,5.2,6.5]},
 {start:26,end:35,target:[3.4,4.65,.4],eye:[4.1,5.2,7.2],to:[3.1,5,6.8]},
 {start:35,end:44,target:[.1,7.5,1.7],eye:[-.7,7.9,5.3],to:[.7,7.7,5.1]},
 {start:44,end:52,target:[0,1.55,-1.3],eye:[2.7,2.3,5.2],to:[2,2.1,4.7]},
 {start:52,end:60,target:[0,4,0],eye:[2,5.6,28],to:[-.9,5.8,29]},
];
export function filmShot(seconds,still=false){
 const time=Math.max(0,Math.min(59.999,Number(seconds)||0));
 const index=SHOTS.findIndex(s=>time<s.end),shot=SHOTS[index];
 const u=still?.5:(time-shot.start)/(shot.end-shot.start),p=u*u*(3-2*u);
 return {...shot,index,time,eye:shot.eye.map((v,i)=>v+(shot.to[i]-v)*p)};
}
function lights(scene){
 scene.add(new T.HemisphereLight(0xf6e5d2,0x604e69,2));
 const key=new T.DirectionalLight(0xffdec0,3.2);key.position.set(-5,12,10);scene.add(key);
 const rim=new T.DirectionalLight(0x9ebbd8,2.8);rim.position.set(7,6,-4);scene.add(rim);
 const floor=new T.Mesh(new T.PlaneGeometry(200,200),
  new T.MeshStandardMaterial({color:0x403444,roughness:.95}));
 floor.rotation.x=-Math.PI/2;floor.position.y=-.2;scene.add(floor);
 return {key,rim};
}
function steam(parent){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=64;
 const ctx=canvas.getContext('2d'),g=ctx.createRadialGradient(32,32,1,32,32,30);
 g.addColorStop(0,'#fff9');g.addColorStop(1,'#fff0');ctx.fillStyle=g;ctx.fillRect(0,0,64,64);
 const map=new T.CanvasTexture(canvas),puffs=[];
 for(let i=0;i<10;i++){
  const puff=new T.Sprite(new T.SpriteMaterial({map,transparent:true,depthWrite:false,opacity:.25}));
  parent.add(puff);puffs.push(puff);
 }
 return time=>puffs.forEach((p,i)=>{const u=(time*.18+i/10)%1;
  p.position.set(-1+Math.sin(u*8+i)*.07,1.43+u*.9,-1.13);
  p.scale.setScalar(.16+u*.28);p.material.opacity=Math.sin(u*Math.PI)*.14;});
}
function caption(ctx,text,width,y,size,font){
 ctx.font=`${size}px ${font}`;const words=text.split(' '),lines=[];let line='';
 for(const word of words){const next=line?line+' '+word:word;
  if(ctx.measureText(next).width>width&&line){lines.push(line);line=word}else line=next;}
 lines.push(line);for(const [i,value] of lines.entries())ctx.fillText(value,540,y+i*size*1.5);
}
function compose(ctx,canvas,shot,locale){
 const ar=locale==='ar',font=ar?'"Noto Naskh Arabic", serif':'Georgia, serif';
 ctx.clearRect(0,0,1080,1920);ctx.drawImage(canvas,0,0,1080,1920);
 const g=ctx.createLinearGradient(0,1110,0,1920);g.addColorStop(0,'#251c2e00');
 g.addColorStop(.57,'#251c2edf');g.addColorStop(1,'#251c2e');ctx.fillStyle=g;ctx.fillRect(0,1110,1080,810);
 const edge=ctx.createRadialGradient(540,840,320,540,870,1160);
 edge.addColorStop(0,'#150f2000');edge.addColorStop(1,'#150f2080');ctx.fillStyle=edge;
 ctx.fillRect(0,0,1080,1920);ctx.textAlign='center';ctx.direction=ar?'rtl':'ltr';

 ctx.strokeStyle='#c5a575';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(500,1450);ctx.lineTo(580,1450);ctx.stroke();
 ctx.fillStyle='#fbf4e9';caption(ctx,translate(locale,'filmLine'+shot.index),880,1540,ar?66:57,font);
 if(shot.index===6){ctx.fillStyle='#d1b589';ctx.font=`${ar?86:78}px ${font}`;
  ctx.fillText(translate(locale,'title'),540,1740);
  ctx.font=`${ar?38:32}px ${font}`;
  ctx.fillText(translate(locale,'filmEnd'),540,1820);}

 const fade=Math.max(0,1-shot.time/1.2,(shot.time-59)/1);
 if(fade>0){ctx.fillStyle=`rgba(28,21,34,${Math.min(1,fade)})`;ctx.fillRect(0,0,1080,1920);}
}
// A film uses broad studio illumination: retain source colour/texture/geometry,
// and bake no mutable game lights into the mobile screening's shader budget.
function studioMaterials(scene){
 const cache=new Map(),remove=[];
 scene.traverse(o=>{if(o.isPointLight)remove.push(o);
  if(!o.isMesh||!o.material)return;
  const convert=m=>{if(!m.isMeshStandardMaterial)return m;
   if(!cache.has(m))cache.set(m,new T.MeshPhongMaterial({color:m.color,map:m.map,
    vertexColors:m.vertexColors,transparent:m.transparent,opacity:m.opacity,side:m.side,
    shininess:m.metalness>.3?45:12,specular:0x423544,emissive:m.emissive,
    emissiveIntensity:m.emissiveIntensity}));return cache.get(m);};
  o.material=Array.isArray(o.material)?o.material.map(convert):convert(o.material);
 });
 for(const light of remove)light.removeFromParent();
}
// Porcelain residents hold their portrait pose; batch the still miniature's paint
// into vertex colours so a phone spends its budget on the camera, not tiny mesh submissions.
function bakeTableau(root){
 const paints=new Map();
 root.traverse(o=>{o.userData.noBatch=false;const m=o.material;
  if(!o.isMesh||!m?.isMeshPhongMaterial||m.map||m.transparent||m.emissive.getHex())return;
  const key=[m.shininess,m.side].join(':');
  if(!paints.has(key))paints.set(key,new T.MeshPhongMaterial({vertexColors:true,
   shininess:m.shininess,specular:m.specular,side:m.side}));
  const g=o.geometry.clone(),count=g.attributes.position.count,colours=new Float32Array(count*3);
  const old=m.vertexColors?g.attributes.color:null;
  for(let i=0;i<count;i++)colours.set([m.color.r*(old?old.getX(i):1),
   m.color.g*(old?old.getY(i):1),m.color.b*(old?old.getZ(i):1)],i*3);
  g.setAttribute('color',new T.BufferAttribute(colours,3));o.geometry=g;o.material=paints.get(key);
 });
 compactStatic(root);
}
// Ground only the private screening tableau; play retains its authored rig and props.
export function groundFilmResident(doll,floorY){
 doll.root.updateWorldMatrix(true,true);
 const minimum=Math.min(...doll.legs.map(leg=>new T.Box3().setFromObject(leg.foot).min.y));
 const floor=doll.root.localToWorld(new T.Vector3(0,floorY,0)).y;
 doll.body.position.y+=(floor-minimum)/doll.root.getWorldScale(new T.Vector3()).y;
 doll.wishGlow.visible=false;doll.halo.visible=false;
}
function groundTableau(house,residents){
 const map=softTexture();
 function contact(x,y,z,w,d,opacity=.4){
  const pad=new T.Mesh(new T.PlaneGeometry(w,d),new T.MeshBasicMaterial({
   map,color:0x30232d,transparent:true,opacity,depthWrite:false}));
  pad.rotation.x=-Math.PI/2;pad.position.set(x,y,z);house.root.add(pad);
 }
 function base(x,y,z,r,h,color){
  const mesh=new T.Mesh(new T.CylinderGeometry(r,r,h,32),new T.MeshPhongMaterial({color,shininess:18}));
  mesh.position.set(x,y,z);house.root.add(mesh);
 }
 // The kettle's rounded bowl meets a flat foot on a burner directly beneath it.
 base(-1,1.029,-1.13,.15,.028,0x51454d);
 base(-1,1.061,-1.13,.088,.042,0x987782);
 contact(-1,1.046,-1.13,.41,.36,.55);
 // Flat ceramic feet meet the counter, mantel and sewing cabinet.
 for(const [x,y,z,color] of [[-2.1,1.03,-1.13,0xc48488],
   [1.43,1.28,-1.26,0x9eaba1],[-.86,3.945,-.66,0xc391a8]]){
  base(x,y+.018,z,.067,.036,color);contact(x,y+.002,z,.32,.27,.4);
 }
 for(const doll of residents.dolls){
  const floor=doll.id==='lina'?.101:.111;
  groundFilmResident(doll,floor-.12);
  contact(doll.root.position.x,doll.root.position.y-.12+floor+.003,.94,.62,.42,.55);
 }
}
export function createFilmScene(output,{width=1080,height=1920,outputWidth=1080,landscape=false}={}){
 const canvas=document.createElement('canvas');
 const renderer=new T.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true});
 canvas.addEventListener('webglcontextlost',event=>event.preventDefault());
 renderer.setSize(width,height);renderer.setPixelRatio(1);renderer.outputColorSpace=T.SRGBColorSpace;
 renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
 const scene=new T.Scene();scene.background=new T.Color(0x49394b);scene.fog=new T.FogExp2(0x49394b,.012);
 const camera=new T.PerspectiveCamera(38,landscape?16/9:9/16,.1,100),light=lights(scene);
 const house=createHouse(scene),residents=createDolls(house.root),state=createState();
 createCraftDetails(house.root);createGarden(house.root);createLevantineSetting(house.root);
 const mist=steam(house.root);
 state.settings.reducedMotion=true;residents.update(state,0,null,0);
 groundTableau(house,residents);
 studioMaterials(scene);bakeTableau(house.root);
 output.width=outputWidth;output.height=Math.round(outputWidth*(landscape?9/16:16/9));
 const ctx=output.getContext('2d');ctx.scale(output.width/(landscape?1920:1080),output.height/(landscape?1080:1920));
 const compositor=landscape?composeWide:compose;let lastShot=null;
 return {
  render(seconds,locale='en',still=false){
   if(renderer.getContext().isContextLost())throw new Error('Film graphics context lost');
   const shot=filmShot(seconds,still),time=still?shot.start+2:shot.time;
   mist(time);
   const moon=T.MathUtils.smoothstep(shot.time,25,42);
   light.key.intensity=3.2-moon*1.4;light.rim.intensity=2.8+moon;
   for(const lamp of house.lights)lamp.intensity=.7+moon*1.4;
   const pose=landscape?wideCamera(shot):shot;
   camera.position.fromArray(pose.eye);camera.lookAt(new T.Vector3(...pose.target));
   renderer.render(scene,camera);lastShot=shot;compositor(ctx,canvas,shot,locale);return shot;
  },
  stats(){return {...renderer.info.render};},
  compose(locale){if(lastShot)compositor(ctx,canvas,lastShot,locale);},
  poster(locale){if(lastShot&&landscape)composeWide(ctx,canvas,lastShot,locale,{poster:true});},
  // Source meshes share cached materials/textures with play; only retire this renderer's GPU context.
  dispose(){renderer.dispose();renderer.forceContextLoss();},
 };
}
