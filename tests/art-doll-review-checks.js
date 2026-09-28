import * as T from 'three';
import {createDolls} from '../src/render/dolls.js';
export async function runArtChecks(){
 const results=[],v=createDolls(new T.Group()).dolls[0];v.root.updateMatrixWorld(true);
 const clear=(mesh)=>{const p=mesh.geometry.attributes.position;for(let i=0;i<p.count;i++){const point=mesh.localToWorld(new T.Vector3().fromBufferAttribute(p,i));const ray=new T.Raycaster(new T.Vector3(point.x,point.y,point.z+1),new T.Vector3(0,0,-1));const hit=ray.intersectObject(v.faceHull,false)[0];if(hit&&hit.point.z>point.z+.001)return false}return true};
 results.push({name:'Review: both lips sit above the porcelain surface',passed:v.mouth.children.every(clear)});
 results.push({name:'Review: closed eyelid seams remain above the porcelain surface',passed:v.eyes.every(e=>clear(e.closedLid))});return results;
}
