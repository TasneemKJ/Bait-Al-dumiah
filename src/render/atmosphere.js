import * as T from 'three';
import {softTexture} from './textiles.js';
import {nightSky} from './visual-policy.js';
const vertex=`varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
const fragment=`varying vec2 vUv; uniform float night; uniform vec3 nightBottom; uniform vec3 nightTop; uniform vec3 nightGlow; void main(){
 vec3 day=mix(vec3(.74,.64,.64),vec3(.94,.85,.73),smoothstep(0.,.7,vUv.y));
 vec3 dusk=mix(nightBottom,nightTop,vUv.y);
 float halo=exp(-length((vUv-vec2(.48,.46))*vec2(2.7,2.))*3.);
 vec3 c=mix(day,dusk,night)+halo*mix(vec3(.02),nightGlow,night);
 gl_FragColor=vec4(c,1.);
 #include <colorspace_fragment>
}`;
export function createAtmosphere(scene){
 const sky=nightSky();
 const backdrop=new T.Mesh(new T.PlaneGeometry(160,90),new T.ShaderMaterial({vertexShader:vertex,fragmentShader:fragment,uniforms:{night:{value:0},nightBottom:{value:new T.Vector3(...sky.bottom)},nightTop:{value:new T.Vector3(...sky.top)},nightGlow:{value:new T.Vector3(...sky.glow)}},depthWrite:false}));backdrop.position.set(0,18,-28);scene.add(backdrop);
 const soft=softTexture(),starPos=new Float32Array(140*3);
 for(let i=0;i<140;i++){starPos[i*3]=Math.sin(i*127.1)*26;starPos[i*3+1]=4+(i*2.71)%23;starPos[i*3+2]=-14-Math.cos(i*11.2)*3}
 const starGeometry=new T.BufferGeometry();starGeometry.setAttribute('position',new T.BufferAttribute(starPos,3));
 const stars=new T.Points(starGeometry,new T.PointsMaterial({map:soft,color:0xffe1b2,size:.13,transparent:true,opacity:0,depthWrite:false,blending:T.AdditiveBlending}));scene.add(stars);
 const moon=new T.Group();moon.position.set(-7.4,10,-8);moon.rotation.z=-.2;scene.add(moon);
 const s=new T.Shape();s.moveTo(0,.71);s.bezierCurveTo(-.92,.7,-.98,-.64,0,-.71);s.bezierCurveTo(-.45,-.43,-.47,.5,0,.71);
 moon.add(new T.Mesh(new T.ShapeGeometry(s,40),new T.MeshBasicMaterial({color:0xf0d5b0,side:T.DoubleSide})));
 const halo=new T.Sprite(new T.SpriteMaterial({map:soft,color:0xebc79c,transparent:true,opacity:.18,depthWrite:false,blending:T.AdditiveBlending}));halo.scale.set(5,5,1);moon.add(halo);
 const coords=new Float32Array(56*3);for(let i=0;i<56;i++){coords[i*3]=Math.sin(i*37.19)*6.8;coords[i*3+1]=.6+(i*1.731)%7;coords[i*3+2]=1+Math.cos(i*13.33)*3}
 const dustGeo=new T.BufferGeometry();dustGeo.setAttribute('position',new T.BufferAttribute(coords,3));
 const dust=new T.Points(dustGeo,new T.PointsMaterial({map:soft,color:0xffdfb5,size:.055,transparent:true,opacity:.38,depthWrite:false,blending:T.AdditiveBlending}));scene.add(dust);
 // A few night moths gather near the house; they are never full-screen flashes.
 const moths=[];for(let i=0;i<5;i++){const m=new T.Sprite(new T.SpriteMaterial({map:soft,color:0xf6d6a1,opacity:.75,transparent:true,depthWrite:false,blending:T.AdditiveBlending}));m.scale.set(.07,.07,1);scene.add(m);moths.push(m)}
 return {update(state,mix){
  backdrop.material.uniforms.night.value=mix;stars.material.opacity=mix*.78;moon.visible=mix>.05;moon.scale.setScalar(.9);
  const still=state.settings.reducedMotion||state.paused,t=state.elapsed;dust.visible=!state.settings.reducedMotion;
  if(!still){dust.rotation.y=t*.007;dust.position.y=Math.sin(t*.12)*.09}
  moths.forEach((m,i)=>{m.visible=mix>.5&&!state.settings.reducedMotion;if(!still)m.position.set(Math.cos(t*.35+i*2.4)*(3+i*.25),1.5+i*.74+Math.sin(t*.65+i)*.16,2.15+Math.sin(t*.3+i)*.20)});
 }};
}
