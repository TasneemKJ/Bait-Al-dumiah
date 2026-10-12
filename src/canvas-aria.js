import {setAttribute} from './dom-sync.js';

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

// Releases a pointer the canvas captured; a pointer that is already gone is not an error.
export function releasePointer(canvas,id){
 if(id===null)return;try{if(canvas.hasPointerCapture(id))canvas.releasePointerCapture(id)}catch{}
}
// A ritual surface steps aside under a dialog, an error screen or the decor placer, and while paused or hidden.
export const surfaceBlocked=(host,state)=>state.paused||document.hidden||
 Boolean(host.querySelector('dialog[open],.error-screen'))||host.querySelector('.placement')?.hidden===false;
// Hands the canvas to a ritual surface: its role, label, shortcuts and the readouts that describe it.
export function claimCanvas(canvas,{label,shortcuts,describedBy}){
 setAttribute(canvas,'aria-label',label);setAttribute(canvas,'role','application');
 setAttribute(canvas,'aria-keyshortcuts',shortcuts);
 setAttribute(canvas,'aria-describedby',describedBy.filter(Boolean).join(' '));
}
