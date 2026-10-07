import * as T from 'three';
import {ROOMS} from '../content.js';
import {storyStatus} from '../simulation.js';
import {palette as P,box,cylinder,ring,line,mat,cup,batch} from './primitives.js';
import {softTexture} from './textiles.js';

// Authored story landmarks are a view of the save, never an inventory or clock.
// Small painted parts share vertex colour; walnut and brass retain their finish.
const painted=new T.MeshStandardMaterial({vertexColors:true,roughness:.72});
const bead=new T.SphereGeometry(1,10,7);
function ball(parent,x,y,z,rx,ry,rz,color){const mesh=new T.Mesh(bead,mat(color));
mesh.position.set(x,y,z);mesh.scale.set(rx,ry,rz);parent.add(mesh);return mesh}
function finish(group){
 group.traverse(o=>{
  if(!o.isMesh)return;o.castShadow=false;o.receiveShadow=true;
  if(o.material.transparent||o.material.isMeshBasicMaterial||o.material===painted||o.material.map||
    o.material.metalness>.3||o.material.emissive?.getHex())return;
  const geometry=o.geometry.clone(),count=geometry.attributes.position.count,
    color=o.material.color,data=new Float32Array(count*3);
  for(let i=0;i<count;i++)data.set([color.r,color.g,color.b],i*3);
  geometry.setAttribute('color',new T.BufferAttribute(data,3));o.geometry=geometry;o.material=painted;
 });
 batch(group);return group;
}
function anchor(root,name,roomId,position){const g=new T.Group(),room=ROOMS.find(r=>r.id===roomId);g.name=name;
g.position.set(room.x+position[0],room.y+position[1],position[2]);g.userData.noBatch=true;root.add(g);return g}
function group(parent,name){const g=new T.Group();g.name=name;g.userData.noBatch=true;parent.add(g);return g}
const petalGeometry=new T.CircleGeometry(1,8);
function petals(parent,x,y,z,size=.035){for(let i=0;i<5;i++){const a=i*Math.PI*2/5,
  petal=new T.Mesh(petalGeometry,mat(P.cream));
petal.position.set(x+Math.cos(a)*size*.58,y+Math.sin(a)*size*.58,z);petal.scale.set(size*.46,size*.46,1);
parent.add(petal)}ball(parent,x,y,z+.008,.012,.012,.009,P.gold)}

function buildTin(root,staticParts){
 const tin=anchor(root,'story-mint-tin','kitchen',[-.30,1.04,-1.04]);
 cylinder(tin,0,.115,0,.18,.23,P.mint);ring(tin,0,.232,0,.181,.012,P.gold,true);
 cylinder(tin,0,.236,0,.159,.008,P.ink);box(tin,0,.125,.178,.16,.10,.012,P.cream);
 // A large pressed leaf reads at phone scale, without tiny typography.
 const emblem=ball(tin,0,.127,.191,.040,.029,.008,P.mint);emblem.rotation.z=.5;
 staticParts(tin);
 const tinLid=group(tin,'story-mint-tin-lid');tinLid.position.set(0,.25,-.155);
 cylinder(tinLid,0,0,.155,.19,.035,P.mint);ring(tinLid,0,.019,.155,.185,.009,P.gold,true);finish(tinLid);
 return {tinLid};
}

function buildCabinet(root,staticParts){
 const cabinet=anchor(root,'story-music-cabinet','parlor',[1.66,.13,.25]);
 for(const x of [-.29,.29])for(const z of [-.15,.15])box(cabinet,x,.075,z,.08,.15,.08,P.wood);
 box(cabinet,0,.14,0,.75,.10,.50,P.wood);box(cabinet,0,.90,-.20,.72,.09,.08,P.wood);
 for(const x of [-.33,.33])box(cabinet,x,.54,0,.09,.72,.46,P.wood);
 box(cabinet,0,.54,-.22,.68,.68,.07,P.wood);box(cabinet,0,.84,0,.77,.075,.50,P.wood);
 box(cabinet,0,.265,0,.63,.06,.42,P.cream);box(cabinet,0,.27,.21,.57,.022,.022,P.gold);
 staticParts(cabinet);
 const door=group(cabinet,'story-music-cabinet-door');door.position.set(-.325,.20,.25);
 box(door,.325,.30,0,.65,.60,.045,P.wood);box(door,.325,.30,.028,.48,.40,.025,P.wood);finish(door);
 const mechanism=group(cabinet,'story-music-cylinder');mechanism.position.set(0,.48,0);
 const barrel=cylinder(mechanism,0,0,0,.115,.43,P.gold);barrel.rotation.z=Math.PI/2;
 for(let i=0;i<9;i++)box(mechanism,-.18+i*.045,.102,.025,.014,.022,.022,P.gold);
 for(const x of [-.24,.24])cylinder(mechanism,x,0,0,.045,.05,P.gold).rotation.z=Math.PI/2;
 finish(mechanism);
 const dancer=group(cabinet,'story-music-dancer');dancer.position.set(0,.67,.01);
 cylinder(dancer,0,.013,0,.07,.025,P.gold);cylinder(dancer,0,.075,0,.055,.10,P.gold,1.8);
 ball(dancer,0,.154,0,.035,.04,.035,P.gold);
 line(dancer,[-.08,.12,0],[.08,.12,0],.011,P.gold);finish(dancer);
 return {door,mechanism,dancer};
}

function buildJasmine(root,staticParts){
 const jasmine=anchor(root,'story-jasmine-window','parlor',[-.90,1.03,-1.43]);
 box(jasmine,0,.025,0,.62,.07,.34,P.wood);cylinder(jasmine,0,.145,0,.18,.24,P.rose,.73);
 line(jasmine,[0,.26,0],[-.02,.86,-.015],.012,P.mint);
 for(let i=0;i<6;i++){const y=.31+i*.082,sign=i%2?1:-1;line(jasmine,[0,y,0],[sign*.11,y+.045,0],.009,P.mint);
 const leaf=ball(jasmine,sign*.12,y+.035,.018,.065,.023,.025,P.mint);leaf.rotation.z=sign*.5}
 staticParts(jasmine);
 const blooms=group(jasmine,'story-jasmine-blooms');
 for(const [x,y] of [[-.02,.86],[-.13,.48],[.13,.68]])petals(blooms,x,y,.04);finish(blooms);
 return {blooms};
}

function buildBasin(root,staticParts){
 const basin=anchor(root,'story-basin-details','kitchen',[-1.27,1.08,-1.06]);
 const water=new T.Mesh(new T.CircleGeometry(.185,20),
   new T.MeshStandardMaterial({color:0x568f89,roughness:.22,metalness:.12,transparent:true,
   opacity:.80,depthWrite:false}));water.name='story-basin-water';
   water.rotation.x=-Math.PI/2;water.scale.y=.68;basin.add(water);
 const ripple=new T.Mesh(new T.RingGeometry(.055,.062,24),
   new T.MeshBasicMaterial({color:0xf4dfb8,side:T.DoubleSide,transparent:true,opacity:0,
   depthWrite:false}));ripple.name='story-basin-ripple';ripple.rotation.x=-Math.PI/2;
   ripple.position.y=.003;basin.add(ripple);
 return {water,ripple};
}

function buildBear(root,staticParts){
 const bear=anchor(root,'story-mended-bear','bedroom',[.09,.875,-1.03]);bear.rotation.y=-.22;
 ball(bear,0,.16,0,.115,.15,.085,P.wood);ball(bear,0,.35,0,.14,.12,.095,P.wood);
 for(const x of [-.10,.10]){ball(bear,x,.435,0,.052,.052,.034,P.wood);
 ball(bear,x,.045,.035,.063,.046,.063,P.wood);ball(bear,x*1.40,.19,.01,.038,.075,.04,P.wood)}
 ball(bear,0,.31,.085,.062,.041,.025,P.cream);
 for(const x of [-.043,.043])ball(bear,x,.37,.088,.011,.013,.009,P.ink);
 ball(bear,0,.324,.109,.015,.011,.008,P.ink);
 const earnedPatch=box(bear,.038,.17,.086,.080,.085,.012,P.cream);earnedPatch.name='story-earned-bear-patch';
 // Completed mending leaves actual red thread on the saved household bear.
 for(let i=0;i<3;i++){const stitch=box(bear,.011+i*.027,.208,.096,.009,.022,.006,0xb44946);
 stitch.name='story-earned-red-stitch-'+i;stitch.rotation.z=i%2?.45:-.45}
 for(let i=0;i<4;i++){const stitch=box(bear,-.068+i*.044,.257,.096,.009,.027,.006,0xb44946);
 stitch.name='story-earned-red-seam-'+i;stitch.rotation.z=i%2?.45:-.45}finish(bear);
 return {bear};
}

function buildDoorstep(root,staticParts){
 const doorstep=anchor(root,'story-doorstep','parlor',[.2,.13,1.95]);
 // Thin threshold; the original placement slots remain available.
 box(doorstep,0,.024,0,.86,.048,.35,P.wood);box(doorstep,0,.052,0,.72,.010,.30,P.rose);
 for(const x of [-.34,.34])box(doorstep,x,.059,0,.018,.006,.29,P.gold);
 staticParts(doorstep);
 const tea=group(doorstep,'story-guest-tea');
 cylinder(tea,-.12,.082,0,.19,.022,P.gold);cup(tea,-.12,.098,0,P.cream);
 // A small welcome lantern has a glowing shade, with no additional light.
 cylinder(tea,.27,.085,-.035,.075,.05,P.gold);cylinder(tea,.27,.21,-.035,.012,.24,P.gold);
 const shade=cylinder(tea,.27,.34,-.035,.085,.13,P.cream,.75);
 shade.material=mat(P.cream,{emissive:0xe8a455,emissiveIntensity:.65});
 for(const x of [-.30,.30])for(const z of [.24,.34]){const foot=ball(tea,x,.006,z,.031,
   .004,.052,P.ink);foot.rotation.y=x<0?-.15:.15}
 finish(tea);
 const glow=new T.Mesh(new T.PlaneGeometry(1.15,.90),
   new T.MeshBasicMaterial({map:softTexture(),color:0xf8c385,transparent:true,opacity:.25,
   depthWrite:false,blending:T.AdditiveBlending}));glow.name='story-welcome-light';
   glow.rotation.x=-Math.PI/2;glow.position.set(.1,.005,.15);tea.add(glow);
 const guest=group(tea,'story-shy-guest');guest.position.set(.48,.06,.26);
 const cloth=new T.Mesh(new T.LatheGeometry([new T.Vector2(0,.39),new T.Vector2(.065,.38),
   new T.Vector2(.10,.31),new T.Vector2(.115,.19),new T.Vector2(.15,0)],16),mat(P.cream));guest.add(cloth);
 for(const x of [-.044,.044])ball(guest,x,.245,.105,.016,.022,.008,P.ink);finish(guest);
 return {tea,guest,glow,shade};
}

export function createStoryProps(parent){
 const root=new T.Group();root.name='hidden-house-stories';root.userData.noBatch=true;parent.add(root);
 const staticArt=new T.Group();staticArt.name='story-static-furnishings';root.add(staticArt);
 const staticParts=landmark=>{finish(landmark);root.updateWorldMatrix(true,true);
 for(const mesh of [...landmark.children])staticArt.attach(mesh)};
 const {tinLid}=buildTin(root,staticParts),{door,mechanism,dancer}=buildCabinet(root,
   staticParts),{blooms}=buildJasmine(root,staticParts);
 const {water,ripple}=buildBasin(root,staticParts),{bear}=buildBear(root,staticParts);
 const {tea,guest,glow,shade}=buildDoorstep(root,staticParts);
 finish(staticArt);
 const all=[tinLid,door,mechanism,dancer,blooms,bear,tea,guest];all.forEach(g=>g.userData.noBatch=true);
 let snapshot={tinOpen:false,cabinetOpen:false,bearVisible:false,musicRepaired:false,
   jasmineBloomed:false,guestVisible:false};
 let visualTime=null;
 return {root,update(state,nightMix=0){
  const story=storyStatus(state),still=state.settings.reducedMotion,mix=Math.max(0,Math.min(1,nightMix));
  // Initialize from the save even when the first frame is paused. Reduced
  // motion changes poses, never the age of a deliberate story interaction.
  if(visualTime===null||!state.paused)visualTime=state.elapsed;
  snapshot={tinOpen:story.index>0||story.step>=1,cabinetOpen:story.index>1||story.index===1&&story.step>=2,
    bearVisible:story.completed.includes('mended-friend'),
      musicRepaired:story.completed.includes('lost-song'),jasmineBloomed:story.index>2||
        story.index===2&&story.step>=2,guestVisible:story.finished};
  // Fold nearly flat beside the case; a shallow swing would enter the owned
  // right-hand keepsake slot even though the cabinet body itself is clear.
  door.rotation.y=snapshot.cabinetOpen?-3.05:0;
  bear.visible=snapshot.bearVisible;blooms.visible=snapshot.jasmineBloomed;tea.visible=snapshot.guestVisible;
  dancer.visible=snapshot.musicRepaired;mechanism.visible=snapshot.musicRepaired;
  const phase=Math.max(0,visualTime-(state.story?.lastActionAt??-10)),active=phase<2.2&&!still;
  const musicPlaying=snapshot.musicRepaired&&state.story?.lastAction==='prop:music-cabinet'&&phase<6&&!still;
  // The repaired cabinet is a replayable keepsake. Two cylinder turns and one
  // dancer turn ease into their resting orientation, then stop completely.
  if(!state.paused){
   const turn=musicPlaying?Math.PI*2*T.MathUtils.smoothstep(phase,0,6):0;
   mechanism.rotation.x=snapshot.musicRepaired?.22+turn*2:-.24;dancer.rotation.y=turn;
   const greeting=active&&state.story?.lastAction==='prop:doorstep'?Math.sin(phase/2.2*Math.PI)*.12:0;
   guest.rotation.z=still?0:Math.sin(visualTime*.8)*.028+greeting;
   guest.position.y=.06+(still?0:Math.sin(visualTime*.7)*.012);
  }
  ripple.visible=active&&state.story?.lastAction==='prop:wash-basin';ripple.scale.setScalar(.8+phase*.8);
  ripple.material.opacity=Math.max(0,.4*(1-phase/2.2));
  water.material.opacity=.78+.04*mix;glow.material.opacity=.16+.19*mix;shade.material.emissiveIntensity=.38+.65*mix;
  // Story input leaves a physical response as well as the lasting earned pose.
  const response=active?Math.sin(phase/2.2*Math.PI)*.04:0;
  tinLid.rotation.x=(snapshot.tinOpen?-2.1:0)-(state.story?.lastAction==='prop:mint-tin'?response:0);
  blooms.rotation.z=state.story?.lastAction==='prop:jasmine-window'?response:0;
  bear.rotation.z=state.story?.lastAction==='prop:moon-bed'?response:0;
 },status(){return {...snapshot}}};
}
