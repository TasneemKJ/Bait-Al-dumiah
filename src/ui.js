import {DOLLS,ROOMS,CATALOG,SECRETS,ACTIONS} from './content.js';
import {translate,number} from './i18n.js';
import {isNight,coziness} from './simulation.js';
import {icon} from './icons.js';
const actionIcon={tea:'tea',play:'play',rest:'rest',soothe:'heart'};
const dockIcons={household:'souls',decorate:'leaf',journal:'book',settings:'settings'};
export function createUI(host,getState,dispatch){
 let panel=null,selected='lina',placement=null,placementRoom='kitchen',placementSlot=0,previousFocus=null,toastTimer,resetConfirm=false;
 const t=key=>translate(getState().settings.locale,key),n=value=>number(getState().settings.locale,value);
 const button=(action,label,ico,extra='')=>`<button type="button" data-action="${action}" ${extra}>${ico?icon(ico):''}<span>${label}</span></button>`;
 function avatar(id){return `<span class="avatar ${id}" aria-hidden="true"><span class="hair"></span><span class="face"><i></i><i></i></span><span class="dress"></span></span>`}
 function build(){
  const s=getState();document.documentElement.lang=s.settings.locale;document.documentElement.dir=s.settings.locale==='ar'?'rtl':'ltr';document.title=t('title')+' · '+t('subtitle');document.querySelector('meta[name="theme-color"]').content=isNight(s)?'#302638':'#f1e7dd';
  document.body.classList.toggle('reduced-motion',s.settings.reducedMotion);document.querySelector('#world').setAttribute('aria-label',t('canvasLabel'));
  host.innerHTML=`<header class="brand"><span class="brand-mark">${icon('home')}</span><div><p class="eyebrow">${t('brandArabic')}</p><h1>${t('title')}</h1><p class="tagline">${t('subtitle')}</p></div></header>
   <section class="house-status" aria-label="${t('allWishes')}"><div class="currency" title="${t('buttons')}">${icon('button')}<strong data-value="buttons"></strong><span>${t('buttons')}</span></div><div class="cozy">${icon('heart')}<strong data-value="cozy"></strong><span>${t('cozy')}</span></div></section>
   <aside class="objective"><div class="objective-head"><span class="tiny-star">✦</span><span>${t('objectiveLabel')}</span><span class="wish-count" data-value="wishes"></span></div><p id="objective-copy"></p><button id="objective-action" type="button" data-action="objective"></button></aside>
   <div class="time-tools"><button type="button" data-action="light" id="light-button"></button><div class="clock"><span data-value="day"></span><span class="clock-dot">·</span><span data-value="time"></span></div></div>
   <div class="camera-tools" aria-label="${t('resetCamera')}">${button('zoom-in',t('zoomIn'),'plus',`class="icon-button" title="${t('zoomIn')}"`)}${button('zoom-out',t('zoomOut'),'minus',`class="icon-button" title="${t('zoomOut')}"`)}${button('camera',t('resetCamera'),'home',`class="icon-button" title="${t('resetCamera')}"`)}</div>
   <div class="visitor-hint" hidden><button type="button" data-action="discover">${icon('ghost')}<span>${t('investigate')}</span><span class="notification-dot"></span></button></div>
   <div class="scene-caption"><span class="desktop-hint">${t('hint')}</span><span class="mobile-hint">${t('mobileHint')}</span></div>
   <nav class="dock" aria-label="${t('title')}">${Object.entries(dockIcons).map(([key,ico])=>button('panel-'+key,t(key),ico,`aria-haspopup="dialog"`)).join('')}<span class="dock-divider"></span>${button('sound',t(s.settings.muted?'soundOff':'soundOn'),s.settings.muted?'muted':'volume',`class="icon-button" title="${t('sound')}" aria-pressed="${!s.settings.muted}"`)}${button('pause',t(s.paused?'resume':'pause'),s.paused?'resume':'pause',`class="icon-button" title="${t('pause')}" aria-pressed="${s.paused}"`)}</nav>
   <div class="saved-note">${icon('check')}<span>${t('saved')}</span></div>
   <div class="placement" hidden></div><div id="toast" role="status" aria-live="polite"></div>
   <div class="pause-overlay" hidden><div>${icon('moon')}<h2>${t('paused')}</h2><p>${t('pausedHelp')}</p>${button('pause',t('resume'),'resume','class="primary"')}</div></div>
   <dialog id="sheet" aria-labelledby="sheet-title"><div class="sheet-header"><span class="eyebrow">${t('title')}</span>${button('close',t('close'),'close','class="icon-button"')}</div><div id="sheet-content"></div></dialog>`;
  const sheet=host.querySelector('#sheet');sheet.addEventListener('cancel',event=>{event.preventDefault();close()});sheet.addEventListener('click',event=>{if(event.target===sheet){const r=sheet.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)close()}});
  if(panel){renderPanel();sheet.showModal()}renderPlacement();tick();
 }
 function open(name,id){if(placement){placement=null;dispatch('placement-cancel')}panel=name;resetConfirm=false;if(id)selected=id;previousFocus=document.activeElement;renderPanel();host.querySelector('#sheet').showModal();dispatch('panel-state',name);host.querySelector('#sheet [data-action="close"]').focus()}
 function close(){const sheet=host.querySelector('#sheet');sheet?.close();panel=null;resetConfirm=false;dispatch('panel-state',null);if(previousFocus?.isConnected)previousFocus.focus();else host.querySelector('[data-action="panel-household"]')?.focus()}
 function renderPanel(){
  const s=getState(),root=host.querySelector('#sheet-content');if(!panel)return;
  if(panel==='household'){
   const d=s.dolls.find(x=>x.id===selected),def=DOLLS.find(x=>x.id===selected);
   root.innerHTML=`<h2 id="sheet-title">${t('household')}</h2><p class="sheet-intro">${t('noPunishment')}</p><div class="resident-tabs" role="group" aria-label="${t('household')}">${DOLLS.map(x=>`<button type="button" data-action="select" data-id="${x.id}" class="${x.id===selected?'selected':''}" aria-pressed="${x.id===selected}">${avatar(x.id)}<span>${t(x.id)}</span>${s.wishes.includes(x.id)?icon('check'):''}</button>`).join('')}</div>
    <div class="resident-heading">${avatar(d.id)}<div><h3>${t(d.id)}</h3><p>${t(d.id+'Bio')}</p></div></div>
    <div class="need-list">${['hunger','energy','comfort'].map(key=>`<div class="need"><div><span>${t(key)}</span><span data-need-text="${key}">${n(d[key])}</span></div><meter data-need="${key}" min="0" max="100" value="${d[key]}" aria-label="${t(key)}"></meter></div>`).join('')}</div>
    <div class="wish-note">${icon(s.wishes.includes(d.id)?'check':'spark')}<span>${t(s.wishes.includes(d.id)?'wishDone':d.id+'Wish')}</span>${!s.wishes.includes(d.id)?`<strong>+${n(8)} ${icon('button')}</strong>`:''}</div>
    <div class="care-grid">${Object.entries(ACTIONS).map(([key,action])=>`<button type="button" data-action="care" data-care="${key}" data-id="${d.id}" class="care-button ${key===def.wish&&!s.wishes.includes(d.id)?'wish-action':''}">${icon(actionIcon[key])}<span><strong>${t(key)}</strong><small>${t(key+'Effect')}</small></span><em>${action.cost?n(action.cost)+' '+t('buttons'):t('free')}</em></button>`).join('')}</div>
    <label class="room-select">${t('move')}<select data-field="doll-room" data-id="${d.id}">${ROOMS.map(r=>`<option value="${r.id}" ${r.id===d.room?'selected':''}>${t(r.id)}</option>`).join('')}</select></label>`;
  }
  if(panel==='decorate'){
   root.innerHTML=`<h2 id="sheet-title">${t('decorate')}</h2><p class="sheet-intro">${t('catalogNote')}</p><div class="catalog">${CATALOG.map(c=>`<button type="button" data-action="choose-item" data-id="${c.id}" class="catalog-item" ${s.buttons<c.price?'disabled':''}><span class="item-art ${c.id}">${icon(c.icon)}</span><strong>${t(c.id)}</strong><span class="item-description">${t(c.id+'Desc')}</span><span class="item-price">${icon('button')}${n(c.price)}<small>+${n(c.cozy)} ${t('cozy')}</small></span></button>`).join('')}</div><h3 class="section-heading">${t('yourKeepsakes')}</h3><p class="sheet-intro">${t('refundNote')}</p><div class="inventory">${s.decor.length?s.decor.map(d=>{const c=CATALOG.find(x=>x.id===d.item);return `<div class="inventory-row">${icon(c.icon)}<div><strong>${t(d.item)}</strong><small>${t(d.room)}</small></div><button type="button" data-action="remove" data-id="${d.id}">${t('refund')}<small>+${n(c.price)}</small></button></div>`}).join(''):`<p class="empty-note">${t('emptyDecor')}</p>`}</div>`;
  }
  if(panel==='journal'){
   root.innerHTML=`<h2 id="sheet-title">${t('journal')} <small>${n(s.journal.length)}/${n(SECRETS.length)}</small></h2><p class="sheet-intro">${t('whispersIntro')}</p><div class="journal-illustration">${icon('ghost')}<span>✦</span>${icon('moon')}</div>${!s.journal.length?`<p class="empty-note">${t('noSecrets')}</p>`:''}<div class="journal-entries">${s.journal.map((id,i)=>`<article><span class="entry-number">${n(i+1).padStart(2,'0')}</span><div><h3>${t(id+'Title')}</h3><p>${t(id+'Text')}</p></div></article>`).join('')}</div>${s.journal.length<SECRETS.length?button(isNight(s)?'discover':'light',t(isNight(s)?'investigate':'night'),isNight(s)?'ghost':'moon','class="primary wide"'):`<p class="ending-note">${t('complete')}</p>`}`;
  }
  if(panel==='settings'){
   root.innerHTML=`<h2 id="sheet-title">${t('settings')}</h2><div class="settings-list"><label><span>${t('language')}</span><select data-field="locale"><option value="en" ${s.settings.locale==='en'?'selected':''}>English</option><option value="ar" ${s.settings.locale==='ar'?'selected':''}>العربية</option></select></label><div class="setting-row"><span>${t('sound')}</span>${button('sound',t(s.settings.muted?'soundOff':'soundOn'),s.settings.muted?'muted':'volume',`aria-pressed="${!s.settings.muted}"`)}</div><p>${t('soundHelp')}</p><label><span>${t('motion')}</span><input data-field="motion" type="checkbox" ${s.settings.reducedMotion?'checked':''}></label><p>${t('motionHelp')}</p><label><span>${t('quality')}</span><select data-field="quality">${['auto','low','high'].map(q=>`<option value="${q}" ${s.settings.quality===q?'selected':''}>${t(q)}</option>`).join('')}</select></label><p>${t('qualityHelp')}</p></div><details><summary>${t('helpTitle')}</summary><p>${t('help')}</p><p>${t('controlsHelp')}</p></details><div class="reset-section">${resetConfirm?`<p>${t('resetConfirm')}</p><div class="row">${button('reset-yes',t('resetYes'),null,'class="danger"')}${button('reset-no',t('resetNo'))}</div>`:button('reset-prompt',t('reset'),null,'class="text-button"')}</div>`;
  }
 }
 function renderPlacement(){const root=host.querySelector('.placement');if(!root)return;root.hidden=!placement;if(!placement)return;const entry=CATALOG.find(c=>c.id===placement);root.innerHTML=`<div class="placement-head">${icon(entry.icon)}<div><strong>${t(placement)} · ${n(entry.price)} ${t('buttons')}</strong><p>${t('placeHint')}</p></div>${button('placement-cancel',t('cancel'),'close','class="icon-button"')}</div><div class="placement-fields"><label class="sr-only" for="place-room">${t('room')}</label><select id="place-room" data-field="place-room">${ROOMS.map(r=>`<option value="${r.id}" ${r.id===placementRoom?'selected':''}>${t(r.id)}</option>`).join('')}</select><label class="sr-only" for="place-slot">${t('placeTitle')}</label><select id="place-slot" data-field="place-slot">${['leftSpot','middleSpot','rightSpot'].map((v,i)=>`<option value="${i}" ${placementSlot===i?'selected':''} ${getState().decor.some(d=>d.room===placementRoom&&d.slot===i)?'disabled':''}>${t(v)}</option>`).join('')}</select>${button('place-confirm',t('placeConfirm'),'plus','class="primary"')}</div>`}
 function chooseItem(id){close();placement=id;placementRoom='kitchen';placementSlot=0;dispatch('placement',id);renderPlacement();host.querySelector('#place-room').focus()}
 function clearPlacement(){placement=null;renderPlacement()}
 function tick(){
  const s=getState();document.body.classList.toggle('night',isNight(s));
  const values={buttons:n(s.buttons),cozy:n(coziness(s))+'%',wishes:`${n(s.wishes.length)} / ${n(3)}`,day:t('day')+' '+n(s.day),time:t(isNight(s)?'evening':'morning')};
  for(const [key,value] of Object.entries(values)){const el=host.querySelector(`[data-value="${key}"]`);if(el&&el.textContent!==value)el.textContent=value}
  const wish=DOLLS.find(d=>!s.wishes.includes(d.id));let copy,label,ico;
  if(wish){copy=t(wish.id+'Wish');label=t(DOLLS.find(d=>d.id===wish.id).wish);ico=actionIcon[wish.wish]}
  else if(!s.decor.length){copy=t('objectiveDecorate');label=t('decorate');ico='leaf'}
  else if(s.journal.length<6){copy=t('objectiveNight');label=t(isNight(s)?'investigate':'night');ico=isNight(s)?'ghost':'moon'}
  else{copy=t('objectiveReturn');label=t('household');ico='souls'}
  const objective=host.querySelector('#objective-copy');if(objective.textContent!==copy)objective.textContent=copy;
  const action=host.querySelector('#objective-action');const content=icon(ico)+`<span>${label}</span>`+icon('arrow');if(action.innerHTML!==content)action.innerHTML=content;
  const light=host.querySelector('#light-button'),lightHtml=icon(isNight(s)?'sun':'moon')+`<span>${t(isNight(s)?'dawn':'night')}</span>`;if(light.innerHTML!==lightHtml)light.innerHTML=lightHtml;
  host.querySelector('.visitor-hint').hidden=!isNight(s)||s.lastSecretDay===s.day||s.journal.length===6||Boolean(placement);
  host.querySelector('.pause-overlay').hidden=!s.paused||Boolean(panel);
  const pauseButton=host.querySelector('.dock [data-action="pause"]'),pauseLabel=t(s.paused?'resume':'pause');
  if(pauseButton.getAttribute('aria-pressed')!==String(s.paused)||pauseButton.title!==pauseLabel){
   pauseButton.setAttribute('aria-pressed',String(s.paused));pauseButton.title=pauseLabel;
   pauseButton.innerHTML=icon(s.paused?'resume':'pause')+`<span>${pauseLabel}</span>`;
  }

  for(const el of host.querySelectorAll('[data-need]')){const d=s.dolls.find(v=>v.id===selected);if(d){el.value=d[el.dataset.need];host.querySelector(`[data-need-text="${el.dataset.need}"]`).textContent=n(d[el.dataset.need])}}
 }
 function toast(message){if(panel){let note=host.querySelector('.panel-notice');if(!note){note=document.createElement('p');note.className='panel-notice';note.setAttribute('role','status');host.querySelector('#sheet-content').prepend(note)}note.textContent=message}const el=host.querySelector('#toast');clearTimeout(toastTimer);el.textContent=message;el.classList.add('visible');toastTimer=setTimeout(()=>el.classList.remove('visible'),4500)}
 function refresh(){const wasPanel=panel;if(wasPanel){host.querySelector('#sheet')?.close()}build()}
 const click=event=>{
  const target=event.target.closest('[data-action]');if(!target||target.disabled)return;const action=target.dataset.action;
  if(action.startsWith('panel-'))return open(action.slice(6));
  if(action==='close')return close();
  if(action==='select'){selected=target.dataset.id;dispatch('select',selected);renderPanel();host.querySelector(`[data-action="select"][data-id="${selected}"]`)?.focus();return}
  if(action==='choose-item')return chooseItem(target.dataset.id);
  if(action==='placement-cancel'){clearPlacement();dispatch(action);return}
  if(action==='place-confirm'){dispatch('place',{item:placement,room:placementRoom,slot:placementSlot});return}
  if(action==='care'){dispatch('care',{id:target.dataset.id,action:target.dataset.care});return}
  if(action==='remove'){dispatch('remove',Number(target.dataset.id));renderPanel();return}
  if(action==='reset-prompt'||action==='reset-no'){resetConfirm=action==='reset-prompt';renderPanel();return}
  dispatch(action);
 };
 const change=event=>{const el=event.target;if(!el.dataset.field)return;
  if(el.dataset.field==='place-room'){placementRoom=el.value;placementSlot=[0,1,2].find(i=>!getState().decor.some(d=>d.room===placementRoom&&d.slot===i))??0;renderPlacement();host.querySelector('#place-room').focus();return}
  if(el.dataset.field==='place-slot'){placementSlot=Number(el.value);return}
  if(el.dataset.field==='doll-room'){dispatch('move',{id:el.dataset.id,room:el.value});return}
  dispatch('setting',{key:el.dataset.field,value:el.type==='checkbox'?el.checked:el.value});
 };
 host.addEventListener('click',click);host.addEventListener('change',change);build();
 return {open,close,refresh,tick,toast,clearPlacement,get selected(){return selected},get panel(){return panel},get placement(){return placement},get t(){return t},dispose(){clearTimeout(toastTimer);host.removeEventListener('click',click);host.removeEventListener('change',change)}};
}
