// Presentation-only measurements; never stored with the simulation.
export function createRoomPresentation(refit,blocked=()=>false){
 let value={},viewport=null;
 return {
  get value(){return {...value}},
  reset(){value={}},
  update(next,size){
   const measuredSize=size&&Number.isFinite(size.width)&&Number.isFinite(size.height)?{width:size.width,height:size.height}:null;
   const resized=Boolean(viewport&&measuredSize&&(viewport.width!==measuredSize.width||viewport.height!==measuredSize.height));
   if(measuredSize)viewport=measuredSize;
   if(!resized&&value.top===next.top&&value.bottom===next.bottom)return false;
   value={top:next.top,bottom:next.bottom};
   // Keep measurements current, but never move a target during selection
   // or a pointer gesture. Explicit navigation/resize reads the cached value.
   // A real viewport change is explicit navigation of the presentation.
   // Its final measured safe area must replace the old orientation's cache.
   if(resized||!blocked())refit();return true;
  },
 };
}
