// The key ring by the front door (DESIGN.md #67, D7): the bottom bar folded into the house. Each tool is a key to
// a real place: the hall key hangs the others up (back to the whole house), the fuse box under the stairs holds the
// settings, sound and pause, the hall dresser drawer the keepsakes, the frame on the stair the album, and the locked
// fifth room Full House, its tag on the lock. Rooms are reached by touching the room itself. A key is added only when
// the house first needs it, so a first evening meets two keys, never nine choices.
import {unclaimed} from './simulation.js';
export const RING_KEYS=Object.freeze([
 {id:'house',action:'camera',has:()=>true},
 {id:'fuse',action:'panel-settings',has:()=>true},
 // The first keepsake: once the day's three wishes are granted (the objective then asks for one), or the next day.
 {id:'drawer',action:'panel-decorate',has:s=>s.lastFullDay>0||s.decor.length>0||s.day>=2},
 // Something to read or collect: a reward waiting (the greeting points here), the first whisper, or day two.
 {id:'album',action:'panel-journal',has:s=>unclaimed(s).length>0||s.milestones.length>0||s.journal.length>0||s.day>=2},
 // Full House is sold only where there is a store, and only from the second day.
 {id:'fifth',action:'panel-store',has:(s,o)=>Boolean(o.store)&&(s.day>=2||s.door>0)},
]);
export const ringKeys=(s,options={})=>RING_KEYS.filter(k=>k.has(s,options)).map(({id,action})=>({id,action}));

// A brass key drawn in code: bow, shaft and bit, in the house's gold.
const keyArt=`<svg class="ring-key-art" viewBox="0 0 24 48" aria-hidden="true"><circle cx="12" cy="9" r="6.5"
 fill="none" stroke="currentColor" stroke-width="3"/><path d="M12 15.5V42M12 34h6M12 40h4" fill="none"
 stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>`;
export function keyRingMarkup(keys,t){
 return `<nav class="key-ring" aria-label="${t('keyRing')}"><span class="ring-hook" aria-hidden="true"></span>`+
  `<span class="ring-loop" aria-hidden="true"></span>`+keys.map((k,i)=>`<button type="button" class="ring-key"`+
  ` data-key="${k.id}" data-action="${k.action}" style="--i:${i}" aria-label="${t('key-'+k.id)}">${keyArt}`+
  `<span class="ring-tag">${t('key-'+k.id)}</span></button>`).join('')+'</nav>';
}
// A thin DOM surface with the same update() as the room buttons it replaces. `say` announces a newly added key.
export function createKeyRing(host,getState,{t,say=()=>{},store=()=>false}={}){
 const holder=host.ownerDocument.createElement('div');holder.className='key-ring-holder';
 let known=null,signature='',toldFirst=false;
 function update(){
  if(!holder.isConnected)host.append(holder);
  // Like the room buttons it replaced, the ring steps aside while a keepsake is being placed.
  holder.hidden=host.querySelector('.placement')?.hidden===false;
  const s=getState(),keys=ringKeys(s,{store:store()}),ids=keys.map(k=>k.id),next=ids.join(',')+'|'+s.settings.locale;
  // The first time the ring grows past its two night-one keys, the house says what the ring is.
  if(known)for(const id of ids)if(!known.includes(id)){
   if(known.length===2&&!toldFirst){toldFirst=true;say(t('ringFirst'))}
   say(t('ringNewKey').replace('{key}',t('key-'+id)))}
  known=ids;if(next===signature)return;signature=next;holder.innerHTML=keyRingMarkup(keys,t);
 }
 update();return {update,holder,dispose(){holder.remove?.()}};
}
