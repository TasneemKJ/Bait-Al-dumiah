import * as T from 'three';
import {ROOMS} from '../content.js';

// Four fine corner marks identify the focused room without a filled overlay.
export function createRoomFrame(parent){
 const root=new T.Group();root.name='focused-room-corners';root.visible=false;parent.add(root);
 const vertices=[];
 for(const x of [-2.25,2.25])for(const y of [0,2.85]){
  vertices.push(x,y,0,x-Math.sign(x)*.27,y,0,x,y,0,x,y+(y===0?.23:-.23),0);
 }
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));
 const material=new T.LineBasicMaterial({color:0xe9c18d,transparent:true,opacity:.62,depthWrite:false});
 root.add(new T.LineSegments(geometry,material));
 // The neighbours recede behind a soft paper veil while one room is the subject (they peek, not share the screen).
 const day=new T.Color(0xf1e7dd),night=new T.Color(0x30233a);
 const veils=ROOMS.map(r=>{const m=new T.Mesh(new T.PlaneGeometry(4.75,3.2),new T.MeshBasicMaterial({color:day.clone(),
  transparent:true,opacity:0,depthWrite:false}));m.name='room-veil-'+r.id;m.position.set(r.x,r.y+1.55,1.9);
  m.renderOrder=2;m.visible=false;m.raycast=()=>{};parent.add(m);return {id:r.id,m}});
 let focus=null;
 return {root,veils,show(id){const room=ROOMS.find(r=>r.id===id);root.visible=Boolean(room);focus=room?id:null;
 if(room)root.position.set(room.x,room.y+.20,1.84);return root.visible},
 tint(nightMix=0,dt=1/60,still=false){for(const {id,m} of veils){const goal=focus&&id!==focus?.42:0;
  const o=m.material.opacity;m.material.opacity=still?goal:o+(goal-o)*Math.min(1,dt*4);m.visible=m.material.opacity>.01;
  m.material.color.copy(day).lerp(night,nightMix)}}};
}
