import {ROOMS} from '../content.js';

// Front-facing strings remain separated on a 320px phone. Reserve the actual
// work strip, rather than zooming until pendants fall behind interface chrome.
export function chimeFraming(width,height){
 const w=Number.isFinite(width)&&width>0?width:390,h=Number.isFinite(height)&&height>0?height:844;
 const short=h<560&&w>h,top=short?56:72,bottom=short?64:w<700?124:112;
 const usable=Math.max(120,h-top-bottom),aspect=w/h,span=Math.max(3.25/aspect,2.75*h/usable),zoom=1.7;
 const upY=14/Math.hypot(1,14),offset=((top+usable/2)/h-.5)*span/upY;
 const room=ROOMS.find(r=>r.id==='bedroom');
 return {height:span*zoom,zoom,aspect,eyeOffset:[0,1,14],target:[room.x,room.y+.26+.20+1.30+offset,1.35],safeArea:{top,bottom}};
}
