import * as T from 'three';
import {softTexture} from './textiles.js';
import {nightSky,duskGlow} from './visual-policy.js';
import {HOME_GLSL,homeUniforms,updateHomeUniforms} from './home-backdrop.js';
const vertex=`varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
const fragment=`varying vec2 vUv;${HOME_GLSL}
 uniform float night; uniform float dusk; 
 uniform vec3 nightBottom; uniform vec3 nightTop; uniform vec3 nightGlow;
 void main(){
 vec3 day=mix(vec3(.74,.64,.64),vec3(.94,.85,.73),smoothstep(0.,.7,vUv.y));
 float stage=exp(-length((vUv-vec2(.5,.44))*vec2(1.55,1.35))*2.2);
 day+=vec3(.045,.032,.018)*stage;
 vec3 nightColor=mix(nightBottom,nightTop,vUv.y);
 float halo=exp(-length((vUv-vec2(.48,.46))*vec2(2.7,2.))*3.);
 vec3 c=mix(day,nightColor,night)+halo*mix(vec3(.02),nightGlow,night);
 float sunsetBand=smoothstep(.66,0.,vUv.y),horizon=smoothstep(.42,.08,vUv.y);
 c+=(vec3(.52,.26,.11)*sunsetBand+vec3(.18,.07,.10)*horizon)*dusk*(1.-night);
 c=homeRoom(c,night);
 gl_FragColor=vec4(c,1.);
 #include <colorspace_fragment>
}`;
export function createAtmosphere(scene){
 const sky=nightSky();
 const backdrop=new T.Mesh(new T.PlaneGeometry(160,90),
   new T.ShaderMaterial({vertexShader:vertex,fragmentShader:fragment,uniforms:{night:{value:0},
   dusk:{value:0},nightBottom:{value:new T.Vector3(...sky.bottom)},nightTop:{value:new T.Vector3(...sky.top)},
   nightGlow:{value:new T.Vector3(...sky.glow)},...homeUniforms()},depthWrite:false}));
   backdrop.position.set(0,18,-28);scene.add(backdrop);
 const soft=softTexture(),starPos=new Float32Array(140*3);
 for(let i=0;i<140;i++){starPos[i*3]=Math.sin(i*127.1)*26;starPos[i*3+1]=4+(i*2.71)%23;
 starPos[i*3+2]=-14-Math.cos(i*11.2)*3}
 const starGeometry=new T.BufferGeometry();starGeometry.setAttribute('position',new T.BufferAttribute(starPos,3));
 const stars=new T.Points(starGeometry,new T.PointsMaterial({map:soft,color:0xffe1b2,size:.13,
   transparent:true,opacity:0,depthWrite:false,blending:T.AdditiveBlending}));scene.add(stars);
 const moon=new T.Group();moon.position.set(-7.4,10,-8);moon.rotation.z=-.2;scene.add(moon);
 const s=new T.Shape();s.moveTo(0,.71);s.bezierCurveTo(-.92,.7,-.98,-.64,0,-.71);
 s.bezierCurveTo(-.45,-.43,-.47,.5,0,.71);
 moon.add(new T.Mesh(new T.ShapeGeometry(s,40),new T.MeshBasicMaterial({color:0xf0d5b0,side:T.DoubleSide,
   transparent:true})));
 const halo=new T.Sprite(new T.SpriteMaterial({map:soft,color:0xebc79c,transparent:true,opacity:.18,
   depthWrite:false,blending:T.AdditiveBlending}));halo.scale.set(5,5,1);moon.add(halo);
 const coords=new Float32Array(56*3);for(let i=0;i<56;i++){coords[i*3]=Math.sin(i*37.19)*6.8;
 coords[i*3+1]=.6+(i*1.731)%7;coords[i*3+2]=1+Math.cos(i*13.33)*3}
 const dustGeo=new T.BufferGeometry();dustGeo.setAttribute('position',new T.BufferAttribute(coords,3));
 const dust=new T.Points(dustGeo,new T.PointsMaterial({map:soft,color:0xffdfb5,size:.055,
   transparent:true,opacity:.38,depthWrite:false,blending:T.AdditiveBlending}));
 dust.name='atmosphere-dust-far';scene.add(dust);
 // Second depth layer of dust motes (docs/visual-40 item 16): closer, fewer, and capped under low quality.
 const nearCoords=new Float32Array(28*3);for(let i=0;i<28;i++){nearCoords[i*3]=Math.cos(i*53.1)*5.4;
 nearCoords[i*3+1]=.8+(i*2.17)%6.2;nearCoords[i*3+2]=2.2+Math.sin(i*19.7)*1.4}
 const nearGeo=new T.BufferGeometry();nearGeo.setAttribute('position',new T.BufferAttribute(nearCoords,3));
 const dustNear=new T.Points(nearGeo,new T.PointsMaterial({map:soft,color:0xffe8c8,size:.072,
   transparent:true,opacity:.28,depthWrite:false,blending:T.AdditiveBlending}));
 dustNear.name='atmosphere-dust-near';scene.add(dustNear);
 // A few night moths gather near the house; they are never full-screen flashes.
 const moths=[];for(let i=0;i<5;i++){const m=new T.Sprite(new T.SpriteMaterial({map:soft,
   color:0xf6d6a1,opacity:.75,transparent:true,depthWrite:false,
   blending:T.AdditiveBlending}));m.name='lantern-firefly';m.scale.set(.07,.07,1);scene.add(m);moths.push(m)}
 return {update(state,mix,level='high',home={}){
  updateHomeUniforms(backdrop.material.uniforms,home);const room=backdrop.material.uniforms.home.value;
  const dusk=duskGlow(state.clock);
  backdrop.material.uniforms.night.value=mix;backdrop.material.uniforms.dusk.value=dusk;
  stars.material.opacity=mix*.78*(1-room);moon.visible=mix>.05&&room<1;
  moon.children[0].material.opacity=1-room;moon.children[1].material.opacity=.18*(1-room);moon.scale.setScalar(.9);
  const still=state.settings.reducedMotion||state.paused,t=state.elapsed;
  dust.visible=!state.settings.reducedMotion;
  dustNear.visible=!state.settings.reducedMotion&&level!=='low';
  dust.material.opacity=.36+dusk*.12*(1-mix);dustNear.material.opacity=.26+dusk*.10*(1-mix);
  if(!still){dust.rotation.y=t*.007;dust.position.y=Math.sin(t*.12)*.09;
   dustNear.rotation.y=-t*.005;dustNear.position.y=Math.cos(t*.15)*.07}
  moths.forEach((m,i)=>{m.visible=mix>.5&&!state.settings.reducedMotion&&i<(level==='low'?
    3:5);if(!still){const a=t*.28+i*2.4;
  m.position.set((i%2?1:-1)*5.62+Math.cos(a)*.34,1.75+Math.sin(a*.73+i)*.22,1.30+Math.sin(a)*.34);
  m.material.opacity=.48+.22*(.5+.5*Math.sin(t*.55+i))}});
 }};
}
