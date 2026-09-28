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
 return {root,show(id){const room=ROOMS.find(r=>r.id===id);root.visible=Boolean(room);if(room)root.position.set(room.x,room.y+.20,1.84);return root.visible}};
}
