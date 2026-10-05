// Presentation-only measurements; never stored with the simulation.
export function createRoomPresentation(refit,blocked=()=>false){
 let value={};
 return {
  get value(){return {...value}},
  reset(){value={}},
  update(next){
   if(value.top===next.top&&value.bottom===next.bottom)return false;
   value={top:next.top,bottom:next.bottom};
   // Keep measurements current, but never move a target during selection
   // or a pointer gesture. Explicit navigation/resize reads the cached value.
   if(!blocked())refit();return true;
  },
 };
}
