import {framing} from './visual-policy.js';
// Phone-portrait whole-house view: widen the orthographic span so the eaves,
// outside stair and garden edge fit between the HUD and room tabs instead of
// cropping the roof. Room, doll and work poses keep their own scale.
export const HOUSE_SPAN=12.8;
export function houseFraming(width,height,roomId=null,presentation={}){
 const pose=framing(width,height,roomId,presentation);
 if(roomId||!(pose.height>0))return pose;
 const w=Number.isFinite(width)?Math.max(1,width):390,h=Number.isFinite(height)?Math.max(1,height):844,aspect=w/h;
 return aspect<1?{...pose,height:Math.max(pose.height,HOUSE_SPAN/aspect)}:pose;
}
// Home (2026-11-24): the title and buttons need their own side of a wide screen, so in landscape the whole
// house stands on the reading-start side (left in English, right in Arabic) and the words take the other.
// Visible width = height * aspect; the house (about 13 units with its garden) fills ~56% of it.
export const HOME_SIDE_ASPECT=1.1;
export function homeFraming(width,height,{rtl=false}={}){
 const w=Number.isFinite(width)?Math.max(1,width):390,h=Number.isFinite(height)?Math.max(1,height):844,aspect=w/h;
 if(aspect<HOME_SIDE_ASPECT)return w<700?houseFraming(w,h):tabletPortrait(houseFraming(w,h));
 const span=Math.max(13.5,13/(.56*aspect)),shift=.21*span*aspect;
 return {height:span,zoom:1,target:[rtl?-shift:shift,4,0]};
}
// iPad portrait: the house is smaller and lower, its roof below the words' third of the screen (roof top about
// y 9.7) and its plinth above the buttons.
function tabletPortrait(pose){const span=Math.max(pose.height,23.5);
 return {...pose,height:span,target:[0,9.7-.19*span,0]}}
