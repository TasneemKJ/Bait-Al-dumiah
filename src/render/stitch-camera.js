import {ROOMS,STITCH_TABLE} from '../content.js';

// Match the compact work strip while keeping the complete lifted grip and
// supported board visible, including the shortest landscape phone viewport.
export function stitchFraming(width,height){
 const w=Number.isFinite(width)&&width>0?Math.max(320,width):390,h=Number.isFinite(height)&&height>0?Math.max(320,height):844;
 const short=h<560&&w>h,phone=!short&&w<700;
 const top=short?(h<=340?60:68):phone?90:72,bottom=short?(h<=340?92:112):phone?176:132;
 const aspect=w/h,usable=Math.max(140,h-top-bottom),span=Math.max(1.85/aspect,1.32*h/usable),zoom=1.8;
 const upY=14/Math.hypot(12,14),offset=((top+usable/2)/h-.5)*span/upY;
 const room=ROOMS.find(r=>r.id===STITCH_TABLE.room);
 return {height:span*zoom,zoom,aspect,eyeOffset:[0,12,14],target:[room.x+STITCH_TABLE.x,
   room.y+.26+STITCH_TABLE.y+.26+offset,STITCH_TABLE.z],safeArea:{top,bottom}};
}
