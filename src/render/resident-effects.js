import * as T from 'three';

export function createTeaSteam(parent,{color=0xf7e6ce,strength=1}={}){
 const root=new T.Group();root.name='tea-steam';root.position.y=.15;parent.add(root);
 for(let i=0;i<3;i++){
  const curve=new T.CatmullRomCurve3([new T.Vector3(0,0,0),new T.Vector3(.015,.035,0),
    new T.Vector3(-.013,.075,0),new T.Vector3(.009,.12,0)]);
  const mesh=new T.Mesh(new T.TubeGeometry(curve,12,.0035,4,false),new T.MeshBasicMaterial({color,
    transparent:true,opacity:.26,depthWrite:false}));root.add(mesh);
 }
 return {root,update(time,active,still){root.visible=active;if(!active)return;const t=still?0:time;
 root.children.forEach((o,i)=>{const phase=((t*.32+i/3)%1+1)%1;
 o.position.set((i-1)*.025,phase*.045,0);o.rotation.y=i*1.8;
 o.material.opacity=Math.min(.8,(.17+Math.sin(phase*Math.PI)*.15)*strength)})}};
}
let heartGeometry=null;
export function createComfortHearts(parent){
 if(!heartGeometry){const s=new T.Shape();s.moveTo(0,-.038);s.bezierCurveTo(-.09,.015,-.035,.072,0,.03);
 s.bezierCurveTo(.035,.072,.09,.015,0,-.038);heartGeometry=new T.ShapeGeometry(s,12)}
 const root=new T.Group();root.name='comfort-hearts';root.position.y=1.64;parent.add(root);
 for(let i=0;i<3;i++)root.add(new T.Mesh(heartGeometry,new T.MeshBasicMaterial({color:0xe7b3ad,
   side:T.DoubleSide,transparent:true,opacity:.7,depthWrite:false})));
 return {root,update(time,active,still,started=time){
 const age=time-started;root.visible=active&&Number.isFinite(age)&&age>=0&&age<2;if(!root.visible)return;
 root.children.forEach((o,i)=>{const phase=still?.45:Math.max(0,Math.min(1,(age-i*.18)/1.45));
 o.position.set((i-1)*.16,still?.13:.30*phase,.04);o.rotation.z=Math.sin(i*2.4)*.18;
 o.material.opacity=still?.60:Math.sin(phase*Math.PI)*.75})}};
}
const crescents=new Map();
export function crescentGeometry(radius=.10){
 if(crescents.has(radius))return crescents.get(radius);
 const s=new T.Shape(),r=radius;s.moveTo(0,r);s.bezierCurveTo(-1.22*r,r,-1.22*r,-r,0,-r);
 s.bezierCurveTo(-.55*r,-.53*r,-.55*r,.57*r,0,r);
 const geometry=new T.ExtrudeGeometry(s,{depth:.014,bevelEnabled:true,bevelSize:.004,
   bevelThickness:.003,bevelSegments:1,
   curveSegments:20});crescents.set(radius,geometry);return geometry;
}
export function createSleepCrescent(parent){
 const root=new T.Group();root.name='sleep-crescent';root.position.set(.12,1.68,0);parent.add(root);
 const material=new T.MeshBasicMaterial({color:0xe6cba3,side:T.DoubleSide});
 const moon=new T.Mesh(crescentGeometry(),material);
 moon.name='sleep-moon';moon.rotation.z=-.25;root.add(moon);
 for(let i=0;i<2;i++){const star=new T.Mesh(new T.OctahedronGeometry(.018-i*.003),
   material);star.position.set(.065+i*.08,.045+i*.07,0);root.add(star)}
 return {root,update(time,active,still){root.visible=active;root.position.y=1.68+(still?0:Math.sin(time*.9)*.026)}};
}
