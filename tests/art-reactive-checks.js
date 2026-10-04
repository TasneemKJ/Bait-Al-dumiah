import * as T from 'three';
import {createRestoration} from '../src/render/restoration.js';
import {createState} from '../src/simulation.js';
import {makeFurniture} from '../src/render/house.js';
export function runArtChecks(){
 const parent=new T.Group(),view=createRestoration(parent),s=createState(),results=[];
 for(const room of Object.keys(s.restoration))s.restoration[room]=3;view.update(s,1);
 const lamps=[];view.root.traverse(o=>{if(o.isPointLight)lamps.push(o)});
 results.push({name:'earned tier-two lamps create one bounded shadowless practical light per room',passed:lamps.length===4&&lamps.every(l=>l.intensity>0&&l.intensity<=2.5&&!l.castShadow)});
 const kitchenCup=view.root.getObjectByName('restoration-kitchen-3');results.push({name:'kitchen third restoration visibly uses the promised fourth cup',passed:kitchenCup?.userData.item==='cup'});
 const cup=makeFurniture('cup');let faces=0;cup.traverse(o=>{if(o.isMesh)faces+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3});results.push({name:'fourth cup uses actual bounded procedural geometry',passed:faces>20&&faces<2500});
 return results;
}
