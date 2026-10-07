// Remembers a canvas's cursor and accessibility attributes so a ritual surface
// can take them over and hand them back exactly as it found them.
export function captureCanvas(canvas){
 const cursor=canvas.style.cursor,shortcuts=canvas.getAttribute('aria-keyshortcuts');
 const description=canvas.getAttribute('aria-describedby'),role=canvas.getAttribute('role');
 const put=(name,value)=>{if(value===null)canvas.removeAttribute(name);else canvas.setAttribute(name,value)};
 return {
  description,
  restore(label){
   canvas.style.cursor=cursor;canvas.setAttribute('aria-label',label);
   put('aria-keyshortcuts',shortcuts);put('aria-describedby',description);put('role',role);
  },
 };
}
