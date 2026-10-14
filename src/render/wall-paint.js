import * as T from 'three';
import {ROOMS} from '../content.js';
import {WALL_PAINTS} from '../content-grove.js';
import {wallPaint} from '../simulation.js';
import {texture} from './primitives.js';

// A chosen wall paper hangs just in front of the house's own: the same pattern in the new colour. Built lazily,
// one plane per painted room; the original paper (paint 0) needs no extra draw.
export function createWallPaint(parent){
 const papers=new Map(),status={};
 function paper(room,paint){
  const key=room.id+':'+paint;if(papers.has(key))return papers.get(key);
  const plane=new T.Mesh(new T.PlaneGeometry(4.70,2.45),new T.MeshStandardMaterial({roughness:.92,
    map:texture('wall',[WALL_PAINTS[room.id][paint],'#fff0dc'])}));
  plane.name='wall-paint-'+key;plane.position.set(room.x,room.y+1.87,-1.66);plane.receiveShadow=true;
  plane.userData.noBatch=true;parent.add(plane);papers.set(key,plane);return plane;
 }
 return {status,update(state){
  for(const room of ROOMS){const paint=wallPaint(state,room.id);status[room.id]=paint;
   for(const [key,plane] of papers)if(key.startsWith(room.id+':'))plane.visible=key===room.id+':'+paint;
   if(paint>0)paper(room,paint).visible=true}
 }};
}
