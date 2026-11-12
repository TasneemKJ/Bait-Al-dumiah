// What this copy of the game opens. The web, a test, a replay: everything (OPEN_ACCESS). In the iPhone
// app the App Store answers (src/app-store.js), asked at the moment it matters and never saved, so a
// refund, a lapsed plan or a save carried between devices can never leave a save that lies about what
// was bought.
//   fifthRoom  the closed door, its five mendings, the fifth room and the visitor's eight gifts
//   canary     the canary's cage in the liwan (the subscription): company, never buttons or comfort
import {DOOR_STEPS} from './content.js';

export const OPEN_ACCESS=Object.freeze({fifthRoom:true,canary:false});
export const accessOrOpen=access=>access&&typeof access==='object'?{...OPEN_ACCESS,...access}:OPEN_ACCESS;
// A door already begun in this save stays the player's, wherever it was begun (a web copy opened here).
export const fifthRoomOpen=(s,access)=>accessOrOpen(access).fifthRoom||(s?.door??0)>0;
// The door can be shown as sold only while nothing of it is the player's yet.
export const fifthRoomLocked=(s,access)=>!fifthRoomOpen(s,access)&&(s?.door??0)<DOOR_STEPS.length;
