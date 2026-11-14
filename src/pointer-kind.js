// What kind of pointer touched last. A long press on a phone fires `contextmenu`; only a mouse's
// right click means "cancel", so a held finger (the tea pot, a stitch, a chime) is never dropped by it.
let kind='mouse';
if(typeof window!=='undefined'&&window.addEventListener)
 window.addEventListener('pointerdown',e=>{kind=e.pointerType||'mouse'},true);
export const lastPointerWasMouse=()=>kind==='mouse';
