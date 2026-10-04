import * as T from 'three';
import {createRestoration} from '../src/render/restoration.js';
import {createState} from '../src/simulation.js';
export function runArtChecks(){
 const parent=new T.Group(),view=createRestoration(parent),s=createState(),result=[];
 view.update(s,0);
 result.push({name:'restoration keeps earned arrangements hidden in a new house',passed:view.root.children.every(c=>!c.visible)});
 s.restoration.kitchen=2;view.update(s,.7);
 result.push({name:'restoration reveals only earned tiers and never alters simulation state',passed:view.root.children.filter(c=>c.visible).length===2&&s.restoration.kitchen===2});
 s.restoration.kitchen=0;view.update(s,0);
 result.push({name:'restoration view resets when a new house replaces state',passed:view.root.children.every(c=>!c.visible)});
 return result;
}
