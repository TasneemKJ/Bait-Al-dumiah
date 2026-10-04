// Transient input only. The simulation moves the actual needle and judges seam
// coverage. This boundary supplies raw targets, never progress, travel or score.
export const STITCH_INPUT=Object.freeze({dragThreshold:8,keyboardSpeed:.9});
const clamp=value=>Math.max(-1,Math.min(1,value));
const point=value=>Number.isFinite(value?.x)&&Number.isFinite(value?.y);
const bounded=value=>point(value)&&Math.abs(value.x)<=1&&Math.abs(value.y)<=1;
const validPointer=e=>Number.isInteger(e.pointerId)&&e.pointerId>=0&&Number.isFinite(e.clientX)&&Number.isFinite(e.clientY);
const targets=new Set(['needle','spool','cloth']);

export function createStitchGesture(){
 let pointer=null;
 return {
  get pointerId(){return pointer?.id??null},
  get target(){return pointer?.target??null},
  get phase(){return pointer?.phase??null},
  down(e,target,stitch,projected){
   if(pointer||!validPointer(e)||e.isPrimary===false||(e.button!==undefined&&e.button!==0)||!targets.has(target))return false;
   if(!stitch||!['sew','finished'].includes(stitch.phase)||!bounded(stitch.needle))return false;
   if(target==='needle'&&stitch.phase==='sew'&&!point(projected))return false;
   pointer={id:e.pointerId,x:e.clientX,y:e.clientY,target,phase:stitch.phase,
    needle:{...stitch.needle},origin:projected?{...projected}:null,moved:false};
   return true;
  },
  move(e,projected){
   if(!pointer||e.pointerId!==pointer.id||!validPointer(e))return null;
   pointer.moved ||= Math.hypot(e.clientX-pointer.x,e.clientY-pointer.y)>STITCH_INPUT.dragThreshold;
   if(pointer.target!=='needle'||pointer.phase!=='sew'||!point(projected))return null;
   // Projection is deliberately unbounded: clamping it before subtracting the
   // elevated grip offset would make edge positions unreachable.
   return {x:clamp(pointer.needle.x+(projected.x-pointer.origin.x)),
    y:clamp(pointer.needle.y+(projected.y-pointer.origin.y)),pressed:true};
  },
  up(e,target){
   if(!pointer||e.pointerId!==pointer.id)return null;
   const p=pointer;pointer=null;
   if(p.target==='needle'&&p.phase==='sew')return {type:'release'};
   if(!validPointer(e)||p.moved||Math.hypot(e.clientX-p.x,e.clientY-p.y)>STITCH_INPUT.dragThreshold||target!==p.target)return null;
   return {type:'tap',target:p.target};
  },
  cancel(){const hadPointer=pointer!==null;pointer=null;return hadPointer},
 };
}

const continuous=new Set(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space']);
const commands=new Map([['KeyU','unpick'],['Enter','finish'],['Escape','exit']]);
const keyCode=e=>e.code||(e.key===' '?'Space':e.key==='u'||e.key==='U'?'KeyU':e.key);

export function createStitchKeyboard(){
 const held=new Set();
 return {
  get active(){return held.size>0},
  down(e){
   const code=keyCode(e);
   if(e.altKey||e.ctrlKey||e.metaKey||(!continuous.has(code)&&!commands.has(code)))return null;
   if(continuous.has(code)){held.add(code);return {handled:true}}
   return e.repeat?{handled:true}:{handled:true,action:commands.get(code)};
  },
  up(e){return held.delete(keyCode(e))},
  controls(dt,target){
   if(!point(target))return null;
   const seconds=Number.isFinite(dt)?Math.max(0,Math.min(dt,.1)):0;
   const x=Number(held.has('ArrowRight'))-Number(held.has('ArrowLeft'));
   const y=Number(held.has('ArrowDown'))-Number(held.has('ArrowUp'));
   const length=Math.hypot(x,y),scale=length?seconds*STITCH_INPUT.keyboardSpeed/length:0;
   return {x:clamp(target.x+x*scale),y:clamp(target.y+y*scale),pressed:held.has('Space')};
  },
  cancel(){held.clear()},
 };
}
