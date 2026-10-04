import * as T from 'three';
import {createObjectInteractions} from '../src/render/object-interactions.js';
import {createState,place,moveDecor,remove} from '../src/simulation.js';
export function runArtChecks(){
 const parent=new T.Group(),v=createObjectInteractions(parent),s=createState(),out=[];
 v.update(s);out.push({name:'four permanent prop pick volumes exist outside art batching',passed:v.targets.length===4&&v.targets.every(t=>t.material.visible===false)});
 place(s,'plant','kitchen',0);v.update(s);v.select('decor:1');v.update(s);const before=v.frame.box.getCenter(new T.Vector3());moveDecor(s,1,'studio',2);v.update(s);
 out.push({name:'selected object frame follows atomic relocation',passed:v.frame.visible&&v.frame.box.getCenter(new T.Vector3()).y>before.y+3});
 remove(s,1);v.update(s);out.push({name:'removed object cannot leave a stale target or selection frame',passed:v.selected===null&&!v.frame.visible&&v.targets.length===4});
 return out;
}
