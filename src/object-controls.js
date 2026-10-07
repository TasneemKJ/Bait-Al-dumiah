import {INTERACTIVE_PROPS,CATALOG} from './content.js';
import {translate} from './i18n.js';
import {icon} from './icons.js';
// Optional keyboard discovery. The room itself remains the primary play surface.
export function createObjectControls(host,getState,onSelect){
 const nav=document.createElement('nav');nav.className='object-controls';
 let signature='',expanded=false,lastRoom=null;
 nav.addEventListener('click',e=>{
  const toggle=e.target.closest('[data-object-toggle]');
  if(toggle){expanded=!expanded;signature='';update();nav.querySelector(expanded?'[data-object]':'[data-object-toggle]')?.focus();return}
  const button=e.target.closest('[data-object]');if(button){onSelect(button.dataset.object);collapse()}
 });
 nav.addEventListener('keydown',e=>{if(e.key==='Escape'&&expanded){e.preventDefault();e.stopPropagation();expanded=false;
 signature='';update();nav.querySelector('[data-object-toggle]')?.focus()}});
 function update(){
  if(!nav.isConnected)host.append(nav);const s=getState(),room=host.dataset.focusRoom;
  if(room!==lastRoom){lastRoom=room;expanded=false;signature=''}
  nav.hidden=!room||Boolean(host.querySelector('dialog[open],.error-screen'))||host.querySelector('.placement')?.hidden===false||s.paused;
  const entries=[...INTERACTIVE_PROPS.filter(p=>p.room===room).map(p=>({key:'prop:'+p.id,label:'object-'+p.id,icon:p.icon})),
    ...s.decor.filter(d=>d.room===room).map(d=>({key:'decor:'+d.id,label:d.item,icon:CATALOG.find(c=>c.id===d.item).icon}))];
  const next=JSON.stringify([s.settings.locale,entries,expanded]);
  if(next!==signature){
   const focused=nav.contains(document.activeElement)?document.activeElement.dataset.object:null;
   signature=next;const t=k=>translate(s.settings.locale,k);nav.setAttribute('aria-label',t('roomObjects'));nav.dataset.expanded=String(expanded);
   nav.innerHTML=`<button type="button" data-object-toggle aria-expanded="${expanded}">${icon('spark')}<span>${t('roomObjects')}</span></button><div
     class="object-list" ${expanded?
     '':'hidden'}>${entries.map(e=>`<button type="button" data-object="${e.key}"
       aria-label="${t('selectObject')} · ${t(e.label)}">${icon(e.icon)}<span>${t(e.label)}</span></button>`).join('')}</div>`;
   if(focused&&expanded)nav.querySelector(`[data-object="${focused}"]`)?.focus();
  }
 }
 function collapse(){expanded=false;signature='';update()}
 update();return {update,collapse,dispose(){nav.remove()}};
}
