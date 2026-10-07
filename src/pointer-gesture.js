/** Remember the whole gesture, not only its final displacement. */
export function createTapGesture(threshold=7){
 let start=null;
 return {
  down(event){start=event.isPrimary?{id:event.pointerId,x:event.clientX,y:event.clientY,moved:false}:null},
  move(event){if(start&&event.pointerId===start.id&&Math.hypot(event.clientX-start.x,event.clientY-start.y)>threshold)start.moved=true},
  up(event){const previous=start;start=null;
  return Boolean(previous&&previous.id===event.pointerId&&!previous.moved&&Math.hypot(event.clientX-previous.x,event.clientY-previous.y)<=threshold)},
  cancel(){start=null},
 };
}
