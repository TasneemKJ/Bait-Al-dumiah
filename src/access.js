// What this copy of the game opens. The web, a test, a replay: everything (OPEN_ACCESS). In the iPhone
// app the App Store answers (src/app-store.js), asked at the moment it matters and never saved, so a
// refund, a lapsed plan or a save carried between devices can never leave a save that lies about what
// was bought.
//   fifthRoom  the closed door, its five mendings, the fifth room and the visitor's eight gifts
//   canary     the canary's cage in the liwan (the subscription): company, never buttons or comfort
//   bought     The Fifth Room was paid for in this app (never on the web, where every room is open)
import {DOOR_STEPS,VISITOR_GIFTS} from './content.js';

export const OPEN_ACCESS=Object.freeze({fifthRoom:true,canary:false,bought:false});
export const accessOrOpen=access=>access&&typeof access==='object'?{...OPEN_ACCESS,...access}:OPEN_ACCESS;
// A door already begun in this save stays the player's, wherever it was begun (a web copy opened here).
export const fifthRoomOpen=(s,access)=>accessOrOpen(access).fifthRoom||(s?.door??0)>0;
// The door can be shown as sold only while nothing of it is the player's yet.
export const fifthRoomLocked=(s,access)=>!fifthRoomOpen(s,access)&&(s?.door??0)<DOOR_STEPS.length;
// What a purchase gives at once (idempotent): the door opens a crack, its first mending done, and the
// visitor leaves a gift on the threshold. The web and unbought copies are untouched.
export function welcomeFifthRoom(s,access){
 if(!access?.bought||!s||s.door>0)return false;
 s.door=1;if(!s.gifts.includes(VISITOR_GIFTS[0]))s.gifts.push(VISITOR_GIFTS[0]);return true;
}
// The buyer's remaining mendings cost no buttons; only Sami's closeness and the six whispers remain.
export const doorCost=(step,access)=>accessOrOpen(access).bought?0:step.cost;
// A save imported into the app keeps none of the door unless The Fifth Room is owned here.
const DOOR_MILESTONES=['door-open','all-gifts'];
export function clampImport(s,access){
 if(accessOrOpen(access).fifthRoom)return s;
 s.door=0;s.gifts=[];s.lastGiftDay=0;
 s.achieved=s.achieved.filter(id=>!DOOR_MILESTONES.includes(id));
 s.milestones=s.milestones.filter(id=>!DOOR_MILESTONES.includes(id));return s;
}
