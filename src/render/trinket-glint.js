import * as T from 'three';
import {INTERACTIVE_PROPS,ROOMS} from '../content.js';
import {trinketProp,trinketHere} from '../simulation.js';
import {softTexture} from './textiles.js';

// Today's hidden trinket glints just above its prop: a small gold twinkle, steady under reduced motion.
export const glintLook=(t,still)=>still?{opacity:.75,scale:.22}:
  {opacity:.45+.4*Math.max(0,Math.sin(t*2.6)),scale:.16+.1*Math.max(0,Math.sin(t*2.6))};
export function glintPosition(propId){
 const p=INTERACTIVE_PROPS.find(x=>x.id===propId);if(!p)return null;const r=ROOMS.find(x=>x.id===p.room);
 return [r.x+p.position[0],r.y+p.position[1]+p.size[1]/2+.08,p.position[2]+.1];
}
export function createTrinketGlint(parent){
 const glint=new T.Sprite(new T.SpriteMaterial({map:softTexture(),color:0xffe0a0,transparent:true,opacity:0,
   depthWrite:false,blending:T.AdditiveBlending}));glint.name='trinket-glint';glint.visible=false;parent.add(glint);
 const status={prop:null};
 return {glint,status,update(state){
  const prop=trinketProp(state),shown=trinketHere(state,prop);glint.visible=shown;status.prop=shown?prop:null;
  if(!shown)return;const p=glintPosition(prop);glint.position.set(...p);
  const look=glintLook(state.elapsed,state.settings.reducedMotion||state.paused);
  glint.material.opacity=look.opacity;glint.scale.setScalar(look.scale);
 }};
}
