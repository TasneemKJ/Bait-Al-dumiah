// The house for keyboard and VoiceOver (round 5): the canvas cannot be read, so every room, doll and thing the
// house can act on is also a button in a visually hidden list, in the page's tab order. Activating one does what
// a touch on it does (main.js accessPick). It shows only while it holds keyboard focus, so a touch player sees
// nothing new; VoiceOver reads it in either language.
import {INTERACTIVE_PROPS,ROOMS,MUSIC_BOXES} from './content.js';
import {musicStatus} from './simulation.js';

export function accessEntries(s){
 const out=[],music=musicStatus(s);
 for(const r of ROOMS){
  out.push({room:r.id,label:null,pick:{roomTap:r.id}});
  for(const d of s.dolls.filter(x=>x.room===r.id))out.push({room:r.id,label:d.id,pick:{doll:d.id}});
  for(const p of INTERACTIVE_PROPS.filter(x=>x.room===r.id))
   out.push({room:r.id,label:'object-'+p.id,pick:{object:'prop:'+p.id,room:r.id}});
  for(const d of s.decor.filter(x=>x.room===r.id))
   out.push({room:r.id,label:d.item,pick:{object:'decor:'+d.id,room:r.id},n:d.id});
  if(music?.open)for(const b of MUSIC_BOXES.filter(x=>x.room===r.id))
   out.push({room:r.id,label:'musicBox-'+b.doll,pick:{musicBox:b.doll,room:r.id}});
  if(music?.open&&music.key===r.id)out.push({room:r.id,label:'musicKeyName',pick:{musicKey:true}});
 }
 return out;
}
// "The tea kitchen · The shared tea set"; a room alone is its own name. Two keepsakes of a kind are numbered.
export function accessName(e,t){return e.label?`${t(e.room)} · ${t(e.label)}${e.n?' '+e.n:''}`:t(e.room)}
export function accessMarkup(entries,t){
 return `<nav class="house-access" aria-label="${t('houseAccess')}">`+entries.map((e,i)=>`<button type="button"`+
  ` data-access="${i}">${accessName(e,t)}</button>`).join('')+'</nav>';
}
export function createHouseAccess(host,getState,{t,onPick}){
 const holder=host.ownerDocument.createElement('div');let entries=[],signature='';
 holder.addEventListener('click',e=>{const b=e.target.closest?.('[data-access]');
  if(b)onPick(entries[Number(b.dataset.access)]?.pick)});
 function update(){
  if(!holder.isConnected)host.append(holder);const s=getState();entries=accessEntries(s);
  holder.hidden=Boolean(host.querySelector('dialog[open],.error-screen'))||s.paused||Boolean(s.activities.active);
  const next=JSON.stringify([s.settings.locale,entries]);if(next===signature)return;
  const focused=holder.contains(host.ownerDocument.activeElement)?host.ownerDocument.activeElement.dataset.access:null;
  signature=next;holder.innerHTML=accessMarkup(entries,t);
  if(focused!==null)holder.querySelector(`[data-access="${focused}"]`)?.focus();
 }
 update();return {update,dispose(){holder.remove()}};
}
