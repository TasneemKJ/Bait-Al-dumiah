import * as T from 'three';
import {birthdayToday} from '../simulation.js';

// Paper bunting strung across the front of the house on a resident's birthday: one small batch of flags
// in the house's rose, gold, mint and lavender. It sways a little unless motion is reduced.
const FLAGS=17,COLOURS=[0xce91a4,0xc59b60,0x8fb9aa,0xb3a0c8];
export function buntingFlags(){
 const flags=[];for(let i=0;i<FLAGS;i++){const x=-4.3+i*8.6/(FLAGS-1),y=6.32-.22*Math.cos(x*.36);
  flags.push({x,y,colour:COLOURS[i%COLOURS.length]})}return flags;
}
export function createBunting(parent){
 const positions=[],colors=[],c=new T.Color();
 for(const f of buntingFlags()){c.setHex(f.colour);
  positions.push(f.x-.13,f.y,0,f.x+.13,f.y,0,f.x,f.y-.3,0);for(let k=0;k<3;k++)colors.push(c.r,c.g,c.b)}
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));
 geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));
 const flags=new T.Mesh(geometry,new T.MeshBasicMaterial({vertexColors:true,side:T.DoubleSide}));
 flags.name='birthday-bunting';flags.position.z=1.95;flags.visible=false;parent.add(flags);
 const status={birthday:null};
 return {flags,status,update(state){
  const id=birthdayToday(state);flags.visible=Boolean(id);status.birthday=id;
  flags.rotation.x=id&&!(state.settings.reducedMotion||state.paused)?Math.sin(state.elapsed*1.4)*.08:0;
 }};
}
