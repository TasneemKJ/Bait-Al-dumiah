import {ROOMS,TEA_TABLE} from '../content.js';

// A fixed working camera exposes the inside of each cup. The safe rectangle
// is shared with the compact tea strip, independent of the ordinary house HUD.
export function teaFraming(width,height){
 const w=Number.isFinite(width)&&width>0?Math.max(320,width):390,h=Number.isFinite(height)&&height>0?Math.max(320,height):844;
 const short=h<560&&w>h,phone=!short&&w<700;
 const top=short?(h<=340?60:68):phone?90:72,bottom=short?(h<=340?92:112):phone?176:132;
 const aspect=w/h,usable=Math.max(140,h-top-bottom),span=Math.max(2/aspect,1.02*h/usable),zoom=1.8;
 const upY=14/Math.hypot(12,14),offset=((top+usable/2)/h-.5)*span/upY;
 const room=ROOMS.find(r=>r.id===TEA_TABLE.room);
 return {height:span*zoom,zoom,aspect,eyeOffset:[0,12,14],target:[room.x+TEA_TABLE.x,room.y+.26+TEA_TABLE.y+.34+offset,TEA_TABLE.z+TEA_TABLE.cupZ],safeArea:{top,bottom}};
}
