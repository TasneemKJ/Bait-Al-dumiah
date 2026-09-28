import {ROOMS} from '../content.js';
import {icon} from '../icons.js';
import {translate} from '../i18n.js';
// A small independent DOM surface. Reattach after the existing HUD rebuilds;
// preserve button identity and keyboard focus during normal simulation ticks.
export function createRoomViews(host,getState,onFocus){
 const nav=document.createElement('nav');nav.className='room-views';
 const buttons=ROOMS.map((room,i)=>{
  const button=document.createElement('button');button.type='button';button.dataset.room=room.id;
  button.innerHTML=icon(['tea','heart','play','rest'][i])+'<span></span>';
  button.addEventListener('click',()=>onFocus(room.id));nav.append(button);return button;
 });
 let locale=null;
 function update(){
  if(!nav.isConnected)host.append(nav);
  nav.hidden=host.querySelector('.placement')?.hidden===false;
  const language=getState().settings.locale;
  if(language!==locale){locale=language;nav.setAttribute('aria-label',translate(locale,'room'));
   buttons.forEach((b,i)=>{const label=translate(locale,ROOMS[i].id);b.title=label;b.setAttribute('aria-label',label);b.querySelector('span').textContent=label});
  }
  buttons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.room===host.dataset.focusRoom)));
 }
 update();return {update,dispose(){nav.remove()}};
}
