import {INTERACTIVE_PROPS,CATALOG} from '../content.js';
import {translate} from '../i18n.js';
import {icon} from '../icons.js';
// Accessible equivalent to canvas ray picks. A compact list belongs to the
// focused room, so players can discover what is usable without hunting pixels.
export function createObjectControls(host,getState,onSelect){
 const nav=document.createElement('nav');nav.className='object-controls';let signature='';
 nav.addEventListener('click',e=>{const b=e.target.closest('[data-object]');if(b)onSelect(b.dataset.object)});
 function update(){
  if(!nav.isConnected)host.append(nav);const s=getState(),room=host.dataset.focusRoom;
  nav.hidden=!room||Boolean(host.querySelector('dialog[open]'))||host.querySelector('.placement')?.hidden===false||s.paused;
  const entries=[...INTERACTIVE_PROPS.filter(p=>p.room===room).map(p=>({key:'prop:'+p.id,label:'object-'+p.id,icon:p.icon})),...s.decor.filter(d=>d.room===room).map(d=>({key:'decor:'+d.id,label:d.item,icon:CATALOG.find(c=>c.id===d.item).icon}))];
  const next=JSON.stringify([s.settings.locale,entries]);if(next!==signature){signature=next;const t=k=>translate(s.settings.locale,k);nav.setAttribute('aria-label',t('roomObjects'));nav.innerHTML=`<p>${t('roomObjects')}</p>`+entries.map(e=>`<button type="button" data-object="${e.key}" aria-label="${t('selectObject')} · ${t(e.label)}">${icon(e.icon)}<span>${t(e.label)}</span></button>`).join('')}
 }
 update();return {update,dispose(){nav.remove()}};
}
