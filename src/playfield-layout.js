// UI-only camera occlusion. Measurements stay outside the renderer and saves.
// Native controls remain the source of truth for locale, text wrapping and
// device safe areas; unopened ribbons reserve no space at all.
export function playfieldInsets(width,height,regions=[]){
 const portrait=width<700&&height>width,short=height<560;
 let top=portrait?64:short?48:96,bottom=portrait?72:short?138:80;
 for(const r of regions){
  if(![r.left,r.right,r.top,r.bottom].every(Number.isFinite))continue;
  // Landscape/desktop notes sit beside the room, not across its center.
  if(!portrait&&(r.right<width*.32||r.left>width*.68))continue;
  if(r.edge==='top')top=Math.max(top,r.bottom+12);
  if(r.edge==='bottom')bottom=Math.max(bottom,height-r.top+12);
 }
 return {top:Math.round(Math.min(height-120,Math.max(0,top))),bottom:Math.round(Math.min(height-120,Math.max(0,bottom)))};
}
const upper='.brand,.house-status,.time-tools,.objective,.visitor-hint,.story-playfield[data-ribbon-edge="top"] .object-ribbon';
const lower='.room-views,.dock,.camera-tools,.object-controls>[data-object-toggle],.object-ribbon,.held-item,.scene-response';
export function createPlayfieldLayout(host,onChange){
 let pending=0,signature='',disposed=false;
 const watched=new Set();
 function schedule(){if(!pending&&!disposed)pending=requestAnimationFrame(measure)}
 const sizes=new ResizeObserver(schedule);
 function measure(){
  pending=0;if(disposed)return;
  // Work surfaces move sound/pause to the top. Never mistake that dock for
  // a house footer or cache its dimensions for the room returned to later.
  if(['teaActive','stitchActive','chimeActive'].some(key=>host.dataset[key]==='true')){signature='';return;}
  const root=host.getBoundingClientRect(),regions=[],nodes=new Set(host.querySelectorAll(upper+','+lower));
  for(const node of watched)if(!nodes.has(node)){sizes.unobserve(node);watched.delete(node)}
  for(const node of nodes){
   if(!watched.has(node)){sizes.observe(node);watched.add(node)}
   if(!node.getClientRects().length)continue;
   const style=getComputedStyle(node);if(style.visibility==='hidden'||style.display==='none')continue;
   const r=node.getBoundingClientRect();if(!r.width||!r.height)continue;
   regions.push({edge:node.matches(upper)?'top':'bottom',left:r.left-root.left,right:r.right-root.left,top:r.top-root.top,bottom:r.bottom-root.top});
  }
  const value=playfieldInsets(root.width,root.height,regions),next=JSON.stringify([root.width,root.height,value]);
  if(next!==signature){signature=next;onChange(value)}
 }
 // Only presentation changes schedule a read; animation and simulation ticks
 // never continually re-center a camera the player has turned by hand.
 const changes=new MutationObserver(records=>{
  if(records.some(record=>{
   const node=record.target;
   if(record.type==='attributes'&&record.oldValue===node.getAttribute(record.attributeName))return false;
   // Residents and inactive ritual adapters update hidden flags every frame.
   // Neither belongs to house-edge layout; avoid even scheduling a DOM read.
   return node===host||Boolean(node.closest?.(upper+','+lower+',.story-playfield,.object-controls'));
  }))schedule();
 });
 changes.observe(host,{subtree:true,childList:true,attributes:true,attributeOldValue:true,attributeFilter:['hidden','data-expanded','data-arrived','data-object-selected','data-ribbon-edge','data-focus-room','data-tea-active','data-stitch-active','data-chime-active','class']});
 sizes.observe(host);window.addEventListener('resize',schedule);window.visualViewport?.addEventListener('resize',schedule);schedule();
 return {measure:schedule,dispose(){disposed=true;cancelAnimationFrame(pending);changes.disconnect();sizes.disconnect();window.removeEventListener('resize',schedule);window.visualViewport?.removeEventListener('resize',schedule)}};
}
