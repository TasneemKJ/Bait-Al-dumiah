// Transient input only. The simulation decides where tea lands and whether a
// cup is ready; this boundary never accepts cup fills, scores or elapsed time.
export const TEA_INPUT=Object.freeze({
 dragThreshold:8,tiltDeadzone:8,tiltDistance:80,keyboardAimSpeed:.9,keyboardTilt:.64,
});
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const validPointer=e=>Number.isInteger(e.pointerId)&&e.pointerId>=0&&
  Number.isFinite(e.clientX)&&Number.isFinite(e.clientY);
const validTarget=target=>target==='pot'||target==='tray'||/^cup:[0-2]$/.test(target??'');

export function createTeaGesture(){
 let pointer=null;
 return {
  get pointerId(){return pointer?.id??null},
  get target(){return pointer?.target??null},
  down(e,target,tea,projectedAim){
   if(pointer||!validPointer(e)||e.isPrimary===false||(e.button!==undefined&&
     e.button!==0)||!validTarget(target))return false;
   if(!tea||!['pour','served'].includes(tea.phase)||!Number.isFinite(tea.aim)||tea.aim< -1||tea.aim>1)return false;
   if(target==='pot'&&tea.phase==='pour'&&!Number.isFinite(projectedAim))return false;
   pointer={id:e.pointerId,x:e.clientX,y:e.clientY,target,phase:tea.phase,aim:tea.aim,
     originAim:projectedAim,moved:false};
   return true;
  },
  move(e,projectedAim){
   if(!pointer||e.pointerId!==pointer.id||!validPointer(e))return null;
   pointer.moved ||= Math.hypot(e.clientX-pointer.x,e.clientY-pointer.y)>TEA_INPUT.dragThreshold;
   if(pointer.target!=='pot'||pointer.phase!=='pour'||!Number.isFinite(projectedAim))return null;
   return {
    aim:clamp(pointer.aim+(projectedAim-pointer.originAim),-1,1),
    tilt:clamp((e.clientY-pointer.y-TEA_INPUT.tiltDeadzone)/TEA_INPUT.tiltDistance,0,1),pressed:true,
   };
  },
  up(e,target){
   if(!pointer||e.pointerId!==pointer.id)return null;
   const p=pointer;pointer=null;
   if(p.target==='pot'&&p.phase==='pour')return {type:'release'};
   if(!validPointer(e)||p.moved||Math.hypot(e.clientX-p.x,
     e.clientY-p.y)>TEA_INPUT.dragThreshold||target!==p.target)return null;
   return {type:'tap',target:p.target};
  },
  cancel(){const hadPointer=pointer!==null;pointer=null;return hadPointer},
 };
}

const continuous=new Set(['ArrowLeft','ArrowRight','Space']);
const commands=new Map([['KeyE','empty'],['Enter','serve'],['Escape','exit']]);
function keyCode(e){return e.code||(e.key===' '?'Space':e.key==='e'||e.key==='E'?'KeyE':e.key)}

export function createTeaKeyboard(){
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
  controls(dt,aim){
   if(!Number.isFinite(aim))return null;
   const seconds=Number.isFinite(dt)?clamp(dt,0,.1):0;
   const direction=Number(held.has('ArrowRight'))-Number(held.has('ArrowLeft'));
   const pressed=held.has('Space');
   return {aim:clamp(aim+direction*seconds*TEA_INPUT.keyboardAimSpeed,-1,1),tilt:pressed?
     TEA_INPUT.keyboardTilt:0,pressed};
  },
  cancel(){held.clear()},
 };
}
