// Placement cancellation takes precedence over the focused select/button.
// Other Escape handling (including native dialogs) is left untouched.
export function bindPlacementEscape(target,cancel){
 const keydown=event=>{if(event.key==='Escape'&&cancel()){event.preventDefault();event.stopPropagation()}};
 target.addEventListener('keydown',keydown,true);
 return ()=>target.removeEventListener('keydown',keydown,true);
}
