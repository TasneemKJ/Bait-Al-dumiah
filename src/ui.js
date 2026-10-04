import {objectMarkup,objectInfo} from './object-ui.js';
import {portraitMarkup} from './resident-portraits.js';
import {activityMarkup,updateActivityStatus} from './activities-ui.js';
import {DOLLS,ROOMS,CATALOG,SECRETS,ACTIONS,MILESTONES,SEW_DAILY,BASKET_MAX,DOOR_STEPS,GIFT_COST,VISITOR_GIFTS} from './content.js';
import {translate,number} from './i18n.js';
import {isNight,coziness,wishFor,wishReward,bondLevel,nextBond,isContent,contentThreshold,delighted,inFavoriteRoom,currentStreak,unclaimed,secretCozyNeeded,doorOpen,nextDoorStep,doorReady,restorationReady} from './simulation.js';
import {icon} from './icons.js';
const actionIcon={tea:'tea',play:'play',rest:'rest',soothe:'heart'};
const wishKey=(id,action)=>DOLLS.find(d=>d.id===id).wish===action?id+'Wish':id+'Wish_'+action;
const dockIcons={household:'souls',activities:'play',decorate:'leaf',journal:'book',settings:'settings'};
export function createUI(host,getState,dispatch){
 let panel=null,selected='lina',placement=null,placementRoom='kitchen',placementSlot=0,previousFocus=null,toastTimer,resetConfirm=false;
 let portraits={};
 let activityResult=null,selectedObject=null,moveId=null;
 const t=key=>translate(getState().settings.locale,key),n=value=>number(getState().settings.locale,value);
 const button=(action,label,ico,extra='')=>`<button type="button" data-action="${action}" ${extra}>${ico?icon(ico):''}<span>${label}</span></button>`;
 function avatar(id){const portrait=portraitMarkup(id,portraits[id]);if(portrait)return portrait;return `<span class="avatar ${id}" aria-hidden="true"><span class="hair"></span><span class="face"><i></i><i></i></span><span class="dress"></span></span>`}
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
 function open(name,id){if(placement){placement=null;moveId=null;renderPlacement();dispatch('placement-cancel')}panel=name;resetConfirm=false;if(id)selected=id;previousFocus=document.activeElement;renderPanel();host.querySelector('#sheet').showModal();dispatch('panel-state',name);host.querySelector('#sheet [data-action="close"]').focus()}
 function close(){const sheet=host.querySelector('#sheet');sheet?.close();panel=null;renderedPanel=null;resetConfirm=false;dispatch('panel-state',null);if(previousFocus?.isConnected)previousFocus.focus();else host.querySelector('[data-action="panel-household"]')?.focus()}
 let renderedPanel=null;
 function doorMarkup(s){
  const step=nextDoorStep(s),ready=step&&doorReady(s,step);
  const done=DOOR_STEPS.slice(0,s.door).map((d,i)=>`<article><span class="entry-number">${icon('check')}</span><div><h3>${t('door_'+d.id+'Title')}</h3><p>${t('door_'+d.id+'Text')}</p></div></article>`).join('');
  const next=step?`<div class="door-next"><div><strong>${t('door_'+step.id+'Title')}</strong><small>${ready?'':t('needs_'+step.needs)}</small></div>${button('mend-door',t('mend')+' · '+n(step.cost),'button',`class="primary" ${ready&&s.buttons>=step.cost?'':'disabled'}`)}</div><p class="door-progress" aria-hidden="true">${DOOR_STEPS.map((d,i)=>`<span class="${i<s.door?'done':''}"></span>`).join('')}</p>`:'';
  const gifts=doorOpen(s)?`<h3 class="section-heading">${t('gifts')} <small>${n(s.gifts.length)}/${n(VISITOR_GIFTS.length)}</small></h3><p class="sheet-intro">${t('giftsIntro')}</p>${button('gift',t('leaveGift')+' · '+n(GIFT_COST),'ghost',`class="primary wide" ${isNight(s)&&s.lastGiftDay!==s.day&&s.buttons>=GIFT_COST?'':'disabled'}`)}<div class="gift-grid">${VISITOR_GIFTS.map(g=>s.gifts.includes(g)?`<div class="gift"><strong>${t('gift-'+g+'Title')}</strong><small>${t('gift-'+g+'Text')}</small></div>`:`<div class="gift locked"><strong>✦</strong><small>${t('giftUnknown')}</small></div>`).join('')}</div>`:'';
  return `<h3 class="section-heading">${t('door')} <small>${n(s.door)}/${n(DOOR_STEPS.length)}</small></h3><p class="sheet-intro">${t(doorOpen(s)?'doorOpenedNote':'doorIntro')}</p><div class="journal-entries door-entries">${done}</div>${next}${gifts}`;
 }
 function renderPanel(){
  const s=getState(),root=host.querySelector('#sheet-content');if(!panel)return;
  // Re-rendering the same sheet keeps its latest notice, so a collected reward stays visible.
  const notice=renderedPanel===panel?root.querySelector('.panel-notice')?.textContent:null;renderedPanel=panel;
  if(panel==='object')root.innerHTML=objectMarkup(s,selectedObject,t,n,button);
  if(panel==='activities')root.innerHTML=activityMarkup(s,t,n,button,activityResult);
  if(panel==='household'){
   const d=s.dolls.find(x=>x.id===selected),def=DOLLS.find(x=>x.id===selected);
   const level=bondLevel(d.bond),next=nextBond(d.bond),wished=wishFor(s,d.id),threshold=contentThreshold(s,d),fav=CATALOG.find(c=>c.id===def.favItem);
   root.innerHTML=`<h2 id="sheet-title">${t('household')}</h2><p class="sheet-intro">${t('noPunishment')}</p><div class="basket-row">${icon('button')}<span><strong>${t('basket')}</strong><small>${n(s.basket)} ${t('basketCount')}</small></span>${button('collect-basket',t('collect')+(s.basket?' +'+n(s.basket):''),null,s.basket?'':'disabled')}</div><div class="resident-tabs" role="group" aria-label="${t('household')}">${DOLLS.map(x=>`<button type="button" data-action="select" data-id="${x.id}" class="${x.id===selected?'selected':''}" aria-pressed="${x.id===selected}">${avatar(x.id)}<span>${t(x.id)}</span><small class="bond-tab">${t('bond'+bondLevel(s.dolls.find(v=>v.id===x.id).bond))}</small>${s.wishes.includes(x.id)?icon('check'):''}</button>`).join('')}</div>
    <div class="resident-heading">${avatar(d.id)}<div><h3>${t(d.id)}</h3><p>${t(d.id+'Bio')}</p></div>${button('focus-doll',t('lookCloser'),'plus',`class="doll-inspect" data-id="${d.id}" aria-label="${t('lookCloser')} · ${t(d.id)}"`)}</div>
    <div class="bond-row"><div><span>${t('closeness')}</span><strong>${t('bond'+level)}</strong></div><meter min="0" max="100" value="${d.bond}" aria-label="${t('closeness')}"></meter><small>${next===null?t('bondMax'):t('nextBondLabel')+' '+n(next)+' / '+n(100)}</small></div>
    <div class="need-list">${['hunger','energy','comfort'].map(key=>`<div class="need"><div><span>${t(key)}</span><span data-need-text="${key}">${n(d[key])}</span></div><meter data-need="${key}" min="0" max="100" value="${d[key]}" aria-label="${t(key)}"></meter></div>`).join('')}</div>
    <div class="wish-note">${icon(s.wishes.includes(d.id)?'check':'spark')}<span>${t(s.wishes.includes(d.id)?'wishDone':wishKey(d.id,wished))}</span>${!s.wishes.includes(d.id)?`<strong>+${n(wishReward(d))} ${icon('button')}</strong>`:''}</div>
    <div class="care-grid">${Object.entries(ACTIONS).map(([key,action])=>`<button type="button" data-action="care" data-care="${key}" data-id="${d.id}" class="care-button ${key===wished&&!s.wishes.includes(d.id)?'wish-action':''}">${icon(actionIcon[key])}<span><strong>${t(key)}</strong><small>${t(key+'Effect')}</small></span><em>${action.cost?n(action.cost)+' '+t('buttons'):t('free')}</em></button>`).join('')}</div>
    <label class="room-select">${t('move')}<select data-field="doll-room" data-id="${d.id}">${ROOMS.map(r=>`<option value="${r.id}" ${r.id===d.room?'selected':''}>${t(r.id)}${r.id===def.favRoom?' ♡':''}</option>`).join('')}</select></label>
    <p class="mood-note ${isContent(s,d)?'content':''}">${icon(isContent(s,d)?'heart':'spark')}<span>${isContent(s,d)?t(s.basket>=BASKET_MAX?'basketFull':s.sewnToday>=SEW_DAILY?'sewnDoneNote':'contentNote'):t('notContentNote').replace('{x}',n(threshold))}</span></p>
    <div class="favorites"><p class="${delighted(s,d)?'met':''}">${icon(fav.icon)}<span>${t('loves')}<strong>${t(fav.id)}</strong></span>${delighted(s,d)?icon('check'):''}</p><p class="${inFavoriteRoom(d)?'met':''}">${icon('home')}<span>${t('favRoomLabel')}<strong>${t(def.favRoom)}</strong></span>${inFavoriteRoom(d)?icon('check'):''}</p></div>
    <p class="sheet-intro">${delighted(s,d)?t('delightedNote'):''} ${inFavoriteRoom(d)?t('favRoomNote'):''}</p>
    <h3 class="section-heading">${t('memories')}</h3><div class="memories">${[1,2,3].map(i=>level>=i?`<p>${t(d.id+'Memory'+i)}</p>`:`<p class="locked">${icon('moon')}<span>${t('memoryLocked')} · ${t('bond'+i)}</span></p>`).join('')}</div>`;
  }
  if(panel==='decorate'){
   root.innerHTML=`<h2 id="sheet-title">${t('decorate')}</h2><p class="sheet-intro">${t('catalogNote')}</p><div class="catalog">${CATALOG.map(c=>`<button type="button" data-action="choose-item" data-id="${c.id}" class="catalog-item" ${s.buttons<c.price?'disabled':''}><span class="item-art ${c.id}">${icon(c.icon)}</span><strong>${t(c.id)}</strong><span class="item-description">${t(c.id+'Desc')}</span><span class="item-price">${icon('button')}${n(c.price)}<small>+${n(c.cozy)} ${t('cozy')}</small></span></button>`).join('')}</div><h3 class="section-heading">${t('yourKeepsakes')}</h3><p class="sheet-intro">${t('refundNote')}</p><div class="inventory">${s.decor.length?s.decor.map(d=>{const c=CATALOG.find(x=>x.id===d.item);return `<div class="inventory-row">${icon(c.icon)}<div><strong>${t(d.item)}</strong><small>${t(d.room)}</small></div><button type="button" data-action="remove" data-id="${d.id}">${t('refund')}<small>+${n(c.price)}</small></button></div>`}).join(''):`<p class="empty-note">${t('emptyDecor')}</p>`}</div>`;
  }
  if(panel==='journal'){
   root.innerHTML=`<h2 id="sheet-title">${t('journal')} <small>${n(s.journal.length)}/${n(SECRETS.length)}</small></h2><p class="sheet-intro">${t('whispersIntro')}</p><div class="journal-illustration">${icon('ghost')}<span>✦</span>${icon('moon')}</div>${!s.journal.length?`<p class="empty-note">${t('noSecrets')}</p>`:''}<div class="journal-entries">${s.journal.map((id,i)=>`<article><span class="entry-number">${n(i+1).padStart(2,'0')}</span><div><h3>${t(id+'Title')}</h3><p>${t(id+'Text')}</p></div></article>`).join('')}</div>${s.journal.length<SECRETS.length?button(isNight(s)?'discover':'light',t(isNight(s)?'investigate':'night'),isNight(s)?'ghost':'moon','class="primary wide"'):`<p class="ending-note">${t('complete')}</p>`}${isNight(s)&&s.journal.length<SECRETS.length&&coziness(s)<secretCozyNeeded(s)?`<p class="shy-note">${t('shyNeed')} ${n(secretCozyNeeded(s))}% · ${t('cozy')} ${n(coziness(s))}%</p>`:''}
    ${doorMarkup(s)}
    <h3 class="section-heading">${t('milestones')} <small>${n(s.milestones.length)}/${n(MILESTONES.length)}</small></h3><p class="sheet-intro">${t('milestonesIntro')} ${t('streakLabel')}: <strong>${n(currentStreak(s))}</strong></p><div class="milestones">${MILESTONES.map(m=>{const got=s.milestones.includes(m.id),ready=s.achieved.includes(m.id)&&!got;return `<div class="milestone ${got?'claimed':ready?'ready':''}">${icon(got?'check':ready?'spark':'button')}<div><strong>${t('ms-'+m.id+'Title')}</strong><small>${t('ms-'+m.id+'Text')}</small></div>${ready?button('claim',t('collect')+' +'+n(m.reward),null,`data-id="${m.id}" class="primary"`):`<em>${got?t('collected'):'+'+n(m.reward)}</em>`}</div>`}).join('')}</div>`;
  }
  if(panel==='settings'){
   root.innerHTML=`<h2 id="sheet-title">${t('settings')}</h2><div class="settings-list"><label><span>${t('language')}</span><select data-field="locale"><option value="en" ${s.settings.locale==='en'?'selected':''}>English</option><option value="ar" ${s.settings.locale==='ar'?'selected':''}>${t('languageArabic')}</option></select></label><div class="setting-row"><span>${t('sound')}</span>${button('sound',t(s.settings.muted?'soundOff':'soundOn'),s.settings.muted?'muted':'volume',`aria-pressed="${!s.settings.muted}"`)}</div><p>${t('soundHelp')}</p><label><span>${t('motion')}</span><input data-field="motion" type="checkbox" ${s.settings.reducedMotion?'checked':''}></label><p>${t('motionHelp')}</p><label><span>${t('quality')}</span><select data-field="quality">${['auto','low','high'].map(q=>`<option value="${q}" ${s.settings.quality===q?'selected':''}>${t(q)}</option>`).join('')}</select></label><p>${t('qualityHelp')}</p></div><details><summary>${t('helpTitle')}</summary><p>${t('help')}</p><p>${t('controlsHelp')}</p></details><div class="reset-section">${resetConfirm?`<p>${t('resetConfirm')}</p><div class="row">${button('reset-yes',t('resetYes'),null,'class="danger"')}${button('reset-no',t('resetNo'))}</div>`:button('reset-prompt',t('reset'),null,'class="text-button"')}</div>`;
  }
  if(notice){const note=document.createElement('p');note.className='panel-notice';note.setAttribute('role','status');note.textContent=notice;root.prepend(note)}
 }
 function renderPlacement(){const root=host.querySelector('.placement');if(!root)return;root.hidden=!placement;if(!placement)return;const entry=CATALOG.find(c=>c.id===placement);root.innerHTML=`<div class="placement-head">${icon(entry.icon)}<div><strong>${t(placement)} · ${moveId!==null?t('moveObject'):n(entry.price)+' '+t('buttons')}</strong><p>${t('placeHint')}</p></div>${button('placement-cancel',t('cancel'),'close','class="icon-button"')}</div><div class="placement-fields"><label class="sr-only" for="place-room">${t('room')}</label><select id="place-room" data-field="place-room">${ROOMS.map(r=>`<option value="${r.id}" ${r.id===placementRoom?'selected':''}>${t(r.id)}</option>`).join('')}</select><label class="sr-only" for="place-slot">${t('placeTitle')}</label><select id="place-slot" data-field="place-slot">${['leftSpot','middleSpot','rightSpot'].map((v,i)=>`<option value="${i}" ${placementSlot===i?'selected':''} ${getState().decor.some(d=>d.id!==moveId&&d.room===placementRoom&&d.slot===i)?'disabled':''}>${t(v)}</option>`).join('')}</select>${button('place-confirm',t('placeConfirm'),'plus','class="primary"')}</div>`}
 function previewPlacement(){dispatch('placement-preview',{item:placement,room:placementRoom,slot:placementSlot,moveId})}
 function chooseItem(id){close();moveId=null;placement=id;placementRoom='kitchen';placementSlot=0;dispatch('placement',id);previewPlacement();renderPlacement();host.querySelector('#place-room').focus()}
 function clearPlacement(){placement=null;moveId=null;renderPlacement()}
 function beginMove(id){const d=getState().decor.find(d=>d.id===id);if(!d)return false;close();placement=d.item;moveId=id;placementRoom=d.room;placementSlot=d.slot;dispatch('placement',d.item);previewPlacement();renderPlacement();host.querySelector('#place-room').focus();return true}
 // One suggested next step: wishes, first keepsake, rewards to collect, then the night's whisper.
 function nextStep(){
  const s=getState(),wish=DOLLS.find(d=>!s.wishes.includes(d.id));
  if(wish){const action=wishFor(s,wish.id);return {copy:t(wishKey(wish.id,action)),label:t(action),ico:actionIcon[action],action:'care',value:{id:wish.id,action}}}
  if(!s.decor.length)return {copy:t('objectiveDecorate'),label:t('decorate'),ico:'leaf',action:'panel',value:'decorate'};
  const readyRoom=ROOMS.find(r=>{const next=restorationReady(s,r.id);return next.ready&&s.buttons>=next.cost});
  if(readyRoom)return {copy:t('restorationObjective'),label:t('restoreAction'),ico:'home',action:'panel',value:'activities',focus:'#restoration-title'};
  if(Object.values(s.activities.mastery).every(v=>v===0))return {copy:t('activityObjective'),label:t('activities'),ico:'play',action:'panel',value:'activities'};
  if(unclaimed(s).length)return {copy:t('objectiveMilestone'),label:t('collect'),ico:'book',action:'panel',value:'journal',focus:'.milestone.ready'};
  if(s.basket>0)return {copy:t('objectiveBasket'),label:t('collect')+' +'+n(s.basket),ico:'button',action:'collect-basket'};
  const step=nextDoorStep(s);
  if(step&&doorReady(s,step)&&s.buttons>=step.cost)return {copy:t('objectiveDoor'),label:t('mend')+' · '+n(step.cost),ico:'home',action:'panel',value:'journal',focus:'.door-next'};
  if(s.journal.length<SECRETS.length){
   if(isNight(s)&&s.lastSecretDay===s.day)return {copy:t('tomorrow'),label:t('dawn'),ico:'sun',action:'light'};
   if(isNight(s)&&coziness(s)<secretCozyNeeded(s))return {copy:t('objectiveShy'),label:t('decorate'),ico:'leaf',action:'panel',value:'decorate'};
   return {copy:t('objectiveNight'),label:t(isNight(s)?'investigate':'night'),ico:isNight(s)?'ghost':'moon',action:isNight(s)?'discover':'light'};
  }
  if(doorOpen(s)&&isNight(s)&&s.lastGiftDay!==s.day&&s.buttons>=GIFT_COST)return {copy:t('objectiveGift'),label:t('leaveGift')+' · '+n(GIFT_COST),ico:'ghost',action:'gift'};
  return {copy:t('objectiveReturn'),label:t('household'),ico:'souls',action:'panel',value:'household'};
 }
 function tick(){
  const s=getState();document.body.classList.toggle('night',isNight(s));
  if(panel==='activities')updateActivityStatus(host,s,t,n);
  host.style.setProperty('--day-progress',(Number.isFinite(s.clock)?Math.max(0,Math.min(240,s.clock))*1.5:0)+'deg');
  const values={buttons:n(s.buttons),cozy:n(coziness(s))+'%',wishes:`${n(s.wishes.length)} / ${n(3)}`,day:t('day')+' '+n(s.day),time:t(isNight(s)?'evening':'morning')};
  for(const [key,value] of Object.entries(values)){const el=host.querySelector(`[data-value="${key}"]`);if(el&&el.textContent!==value)el.textContent=value}
  const {copy,label,ico}=nextStep();
  const objective=host.querySelector('#objective-copy');if(objective.textContent!==copy)objective.textContent=copy;
  const action=host.querySelector('#objective-action');const content=icon(ico)+`<span>${label}</span>`+icon('arrow');if(action.innerHTML!==content)action.innerHTML=content;
  const light=host.querySelector('#light-button'),lightHtml=icon(isNight(s)?'sun':'moon')+`<span>${t(isNight(s)?'dawn':'night')}</span>`;if(light.innerHTML!==lightHtml)light.innerHTML=lightHtml;
  host.querySelector('.visitor-hint').hidden=!isNight(s)||s.lastSecretDay===s.day||s.journal.length===6||Boolean(placement);
  host.querySelector('.dock [data-action="panel-household"]')?.classList.toggle('has-news',s.basket>0);host.querySelector('.dock [data-action="panel-journal"]')?.classList.toggle('has-news',unclaimed(s).length>0);
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
  if(action==='place-confirm'){dispatch(moveId!==null?'relocate-object':'place',{id:moveId,item:placement,room:placementRoom,slot:placementSlot});return}
  if(action==='focus-doll'){dispatch(action,target.dataset.id);return}
  if(action==='begin-activity'||action==='restore-room'){dispatch(action,target.dataset.id);return}
  if(action==='activity-input'){dispatch(action,Number(target.dataset.choice));return}
  if(['rotate-object','move-object','pack-object'].includes(action)){dispatch(action,Number(target.dataset.id));return}
  if(['recall-ready','activity-hint'].includes(action)){dispatch(action);return}
  if(action==='end-activity'){dispatch(action);return}
  if(action==='care'){dispatch('care',{id:target.dataset.id,action:target.dataset.care});return}
  if(action==='remove'){dispatch('remove',Number(target.dataset.id));renderPanel();return}
  if(action==='claim'||action==='collect-basket'||action==='mend-door'||action==='gift'){dispatch(action,target.dataset.id);if(panel)renderPanel();return}
  if(action==='reset-prompt'||action==='reset-no'){resetConfirm=action==='reset-prompt';renderPanel();return}
  dispatch(action);
 };
 const change=event=>{const el=event.target;if(!el.dataset.field)return;
  if(el.dataset.field==='place-room'){placementRoom=el.value;placementSlot=[0,1,2].find(i=>!getState().decor.some(d=>d.id!==moveId&&d.room===placementRoom&&d.slot===i))??0;previewPlacement();renderPlacement();host.querySelector('#place-room').focus();return}
  if(el.dataset.field==='place-slot'){placementSlot=Number(el.value);previewPlacement();return}
  if(el.dataset.field==='doll-room'){dispatch('move',{id:el.dataset.id,room:el.value});return}
  dispatch('setting',{key:el.dataset.field,value:el.type==='checkbox'?el.checked:el.value});
 };
 host.addEventListener('click',click);host.addEventListener('change',change);build();
 return {openObject(key){if(!objectInfo(getState(),key))return false;selectedObject=key;open('object');return true},clearObject(){selectedObject=null},beginMove,get moveId(){return moveId},open,close,refresh,tick,toast,objective:nextStep,clearPlacement,setActivityResult(result){activityResult=result;const choice=host.querySelector('#sheet [data-choice]:focus')?.dataset.choice;renderPanel();host.querySelector(result?.complete?'.ritual-result button':choice!==undefined?`#sheet [data-choice="${choice}"]`:'#sheet [data-action="recall-ready"], #sheet [data-choice], #sheet [data-action="begin-activity"]')?.focus()},setPortraits(values){portraits=values??{};if(panel==='household')renderPanel()},get selected(){return selected},get panel(){return panel},get placement(){return placement},get t(){return t},get n(){return n},dispose(){clearTimeout(toastTimer);host.removeEventListener('click',click);host.removeEventListener('change',change)}};
}
