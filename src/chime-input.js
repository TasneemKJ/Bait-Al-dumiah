// One gesture owns one charm. These screen coordinates are presentation only;
// simulation independently validates ownership, pull strength and completion.
export function createChimeGesture(){
 let held=null;
 const valid=e=>Number.isFinite(e.pointerId)&&Number.isFinite(e.clientX)&&Number.isFinite(e.clientY);
 return {
  get pointerId(){return held?.pointer??null},
  down(e,target,span){
   if(held||!valid(e)||e.isPrimary===false||(e.button!==undefined&&e.button!==0)||
     !Number.isFinite(span)||span<=0||!(Number.isInteger(target)&&target>=0&&target<4||target==='moon'))return false;
   held={pointer:e.pointerId,target,x:e.clientX,y:e.clientY,span,travel:0};return true;
  },
  move(e){
   if(!held||!valid(e)||held.pointer!==e.pointerId)return null;
   held.travel=Math.max(held.travel,Math.hypot(e.clientX-held.x,e.clientY-held.y));
   return {target:held.target,pull:Math.min(1,Math.max(0,(e.clientY-held.y)/held.span))};
  },
  up(e,inside=true){
   if(!held||held.pointer!==e.pointerId)return null;
   const control=this.move(e),last=held;held=null;
   if(!inside||!control)return null;
   return last.target==='moon'?(last.travel<=8?{target:'moon'}:null):control;
  },
  cancel(){held=null},
 };
}
