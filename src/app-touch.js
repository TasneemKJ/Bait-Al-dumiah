// Every press on a control answers with a soft wooden tap and one short buzz (the app turns navigator.vibrate into
// the Taptic Engine), and wakes sound an interruption suspended. Touches on the house itself have their own sounds.
import {hapticsOn} from './app-info.js';
export function pressFeedback(app,event,nav=globalThis.navigator,storage){
 const control=event?.target?.closest?.('button');if(!control||control.disabled)return;
 app.audio?.wake?.();app.audio?.press?.();
 if(hapticsOn(storage))try{nav?.vibrate?.(8)}catch{/* no haptics here */}
}
export function installTouchFeedback(app){
 app.host?.addEventListener?.('click',event=>pressFeedback(app,event),true);
 document.querySelector?.('#home')?.addEventListener?.('click',event=>pressFeedback(app,event),true);
}
