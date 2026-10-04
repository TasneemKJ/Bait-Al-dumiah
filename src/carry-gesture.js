// Only a deliberate, single-pointer drag may use the held story item.
// Rendering and inventory remain outside this small input boundary.
export function createCarryGesture(){
 let pointer=null;
 const valid=e=>Number.isFinite(e.clientX)&&Number.isFinite(e.clientY)&&Number.isFinite(e.pointerId);
 return {
  down(e){
   if(pointer||!valid(e)||(e.button!==undefined&&e.button!==0))return false;
   pointer={id:e.pointerId,x:e.clientX,y:e.clientY,moved:false};return true;
  },
  move(e){
   if(!pointer||e.pointerId!==pointer.id||!valid(e))return false;
   pointer.moved ||= Math.hypot(e.clientX-pointer.x,e.clientY-pointer.y)>8;
   return pointer.moved;
  },
  up(e){
   if(!pointer||e.pointerId!==pointer.id)return null;
   const moved=pointer.moved;pointer=null;
   return moved&&valid(e)?{x:e.clientX,y:e.clientY}:null;
  },
  cancel(){pointer=null},
 };
}
