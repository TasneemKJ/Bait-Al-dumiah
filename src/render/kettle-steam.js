import * as T from 'three';
import {softTexture} from './textiles.js';
// Soft rising puffs above the kitchen kettle. Sprites share the soft texture, so
// this is four small quads, no lights. Pure phase maths is exported for tests.
export const PUFFS=4;
export function puffPhase(time,i,still){return still?(i+.5)/PUFFS*.9:(((time*.22+i/PUFFS)%1)+1)%1}
export function puffLook(phase){const fade=Math.sin(Math.PI*Math.min(1,Math.max(0,phase)));
return {opacity:.55*fade,size:.34+.5*phase,rise:phase*.6,drift:-.5*phase+Math.sin(phase*5)*.05}}
export function createKettleSteam(parent){
 const root=new T.Group();root.name='kettle-steam';parent.add(root);
 const puffs=Array.from({length:PUFFS},()=>{const m=new T.Sprite(new T.SpriteMaterial({map:softTexture(),
   color:0xa9b4c4,transparent:true,opacity:0,depthWrite:false}));root.add(m);return m});
 return {root,update(time,active,still){root.visible=active;if(!active)return;
 puffs.forEach((p,i)=>{const l=puffLook(puffPhase(time,i,still));
 p.material.opacity=l.opacity;p.scale.set(l.size,l.size,1);p.position.set(l.drift,l.rise,.05)})}};
}
