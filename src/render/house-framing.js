import {framing} from './visual-policy.js';
// Phone-portrait whole-house view: widen the orthographic span so the eaves,
// outside stair and garden edge fit between the HUD and room tabs instead of
// cropping the roof. Room, doll and work poses keep their own scale.
export const HOUSE_SPAN=12.8;
export function houseFraming(width,height,roomId=null){
 const pose=framing(width,height,roomId);
 if(roomId||!(pose.height>0))return pose;
 const w=Number.isFinite(width)?Math.max(1,width):390,h=Number.isFinite(height)?Math.max(1,height):844,aspect=w/h;
 return aspect<1?{...pose,height:Math.max(pose.height,HOUSE_SPAN/aspect)}:pose;
}
