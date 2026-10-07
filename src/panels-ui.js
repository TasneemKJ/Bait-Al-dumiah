import {storyMemoriesMarkup} from './story-ui.js';
import {DOLLS,ROOMS,CATALOG,SECRETS,ACTIONS,MILESTONES,DOOR_STEPS,GIFT_COST,VISITOR_GIFTS} from './content.js';
import {isNight,coziness,wishFor,wishReward,bondLevel,nextBond,isContent,contentThreshold,delighted,inFavoriteRoom,currentStreak,secretCozyNeeded,
  doorOpen,nextDoorStep,doorReady} from './simulation.js';
import {giftArt} from './gift-art.js';
import {icon} from './icons.js';
export const actionIcon={tea:'tea',play:'play',rest:'rest',soothe:'heart'};
export const wishKey=(id,action)=>DOLLS.find(d=>d.id===id).wish===action?id+'Wish':id+'Wish_'+action;

export function doorMarkup(s,{t,n,button}){
 const step=nextDoorStep(s),ready=step&&doorReady(s,step);
 const done=DOOR_STEPS.slice(0,s.door).map((d,
   i)=>`<article><span class="entry-number">${icon('check')}</span><div><h3>${t('door_'+d.id+'Title')}</h3><p>${t('door_'+d.id+'Text')}</p></div></article>`).join('');
 const next=step?`<div class="door-next"><div><strong>${t('door_'+step.id+'Title')}</strong><small>${ready?
   '':t('needs_'+step.needs)}</small></div>${button('mend-door',t('mend')+' · '+n(step.cost),'button',`class="primary" ${ready&&s.buttons>=step.cost?
   '':'disabled'}`)}</div><p class="door-progress" aria-hidden="true">${DOOR_STEPS.map((d,i)=>`<span class="${i<s.door?'done':''}"></span>`).join('')}</p>`:'';
 const gifts=doorOpen(s)?
   `<h3 class="section-heading">${t('gifts')} <small>${n(s.gifts.length)}/${n(VISITOR_GIFTS.length)}</small></h3><p
   class="sheet-intro">${t('giftsIntro')}</p>${button('gift',t('leaveGift')+' · '+n(GIFT_COST),'ghost',`class="primary wide" ${isNight(s)&&
   s.lastGiftDay!==s.day&&s.buttons>=GIFT_COST?'':'disabled'}`)}<div class="gift-grid">${VISITOR_GIFTS.map(g=>s.gifts.includes(g)?
   `<div class="gift${s.lastGiftDay===s.day&&g===s.gifts[s.gifts.length-1]?
   ' newest':''}"><span class="gift-picture">${giftArt(g)}</span><strong>${t('gift-'+g+'Title')}</strong><small>${t('gift-'+g+'Text')}</small></div
   >`:`<div class="gift locked"><span class="gift-picture" aria-hidden="true">✦</span><small>${t('giftUnknown')}</small></div>`).join('')}</div>`:'';
 return `<h3 class="section-heading">${t('door')} <small>${n(s.door)}/${n(DOOR_STEPS.length)}</small></h3><p class="sheet-intro">${t(doorOpen(s)?
   'doorOpenedNote':'doorIntro')}</p><div class="journal-entries door-entries">${done}</div>${next}${gifts}`;
}

export function householdMarkup(s,{t,n,button,avatar,selected}){
  const d=s.dolls.find(x=>x.id===selected),def=DOLLS.find(x=>x.id===selected);
  const level=bondLevel(d.bond),next=nextBond(d.bond),wished=wishFor(s,d.id),threshold=contentThreshold(s,d),fav=CATALOG.find(c=>c.id===def.favItem);
  return `<h2 id="sheet-title">${t('household')}</h2><p class="sheet-intro">${t('noPunishment')}</p><div
    class="basket-row">${icon('button')}<span><strong>${t('basket')}</strong><small>${n(s.basket)} ${t('basketCount')}</small></span
    >${button('collect-basket',t('collect')+(s.basket?' +'+n(s.basket):''),null,s.basket?
    '':'disabled')}</div><div class="resident-tabs" role="group" aria-label="${t('household')}">${DOLLS.map(x=>`<button type="button" data-action="select"
    data-id="${x.id}" class="${x.id===selected?
    'selected':''}" aria-pressed="${x.id===selected}">${avatar(x.id)}<span>${t(x.id)}</span><small
    class="bond-tab">${t('bond'+bondLevel(s.dolls.find(v=>v.id===x.id).bond))}</small>${s.wishes.includes(x.id)?icon('check'):''}</button>`).join('')}</div>
   <div class="resident-heading">${avatar(d.id)}<div><h3>${t(d.id)}</h3><p>${t(d.id+'Bio')}</p></div>${button('focus-doll',t('lookCloser'),'plus',
     `class="doll-inspect" data-id="${d.id}" aria-label="${t('lookCloser')} · ${t(d.id)}"`)}</div>
   <div class="bond-row"><div><span>${t('closeness')}</span><strong>${t('bond'+level)}</strong></div><meter min="0" max="100" value="${d.bond}"
     aria-label="${t('closeness')}"></meter><small>${next===null?t('bondMax'):t('nextBondLabel')+' '+n(next)+' / '+n(100)}</small></div>
   <div class="need-list">${['hunger','energy',
     'comfort'].map(key=>`<div class="need"><div><span>${t(key)}</span><span data-need-text="${key}">${n(d[key])}</span></div><meter data-need="${key}"
     min="0" max="100" value="${d[key]}" aria-label="${t(key)}"></meter></div>`).join('')}</div>
   <div class="wish-note">${icon(s.wishes.includes(d.id)?'check':'spark')}<span>${t(s.wishes.includes(d.id)?'wishDone':wishKey(d.id,
     wished))}</span>${!s.wishes.includes(d.id)?`<strong>+${n(wishReward(d))} ${icon('button')}</strong>`:''}</div>
   <div class="care-grid">${Object.entries(ACTIONS).map(([key,
     action])=>`<button type="button" data-action="care" data-care="${key}" data-id="${d.id}" class="care-button ${key===wished&&!s.wishes.includes(d.id)?
     'wish-action':''}">${icon(actionIcon[key])}<span><strong>${t(key)}</strong><small>${t(key+'Effect')}</small></span><em>${action.cost?
     n(action.cost)+' '+t('buttons'):t('free')}</em></button>`).join('')}</div>
   <label class="room-select">${t('move')}<select data-field="doll-room" data-id="${d.id}">${ROOMS.map(r=>`<option value="${r.id}" ${r.id===d.room?
     'selected':''}>${t(r.id)}${r.id===def.favRoom?' ♡':''}</option>`).join('')}</select></label>
   <p class="mood-note ${isContent(s,d)?'content':''}">${icon(isContent(s,d)?'heart':'spark')}<span>${isContent(s,d)?t(s.basket>=BASKET_MAX?
     'basketFull':s.sewnToday>=SEW_DAILY?'sewnDoneNote':'contentNote'):t('notContentNote').replace('{x}',n(threshold))}</span></p>
   <div class="favorites"><p class="${delighted(s,d)?'met':''}">${icon(fav.icon)}<span>${t('loves')}<strong>${t(fav.id)}</strong></span>${delighted(s,
     d)?icon('check'):''}</p><p class="${inFavoriteRoom(d)?'met':''}">${icon('home')}<span>${t('favRoomLabel')}<strong>${t(def.favRoom)}</strong></span>${inFavoriteRoom(d)?icon('check'):''}</p></div>
   <p class="sheet-intro">${delighted(s,d)?t('delightedNote'):''} ${inFavoriteRoom(d)?t('favRoomNote'):''}</p>
   <h3 class="section-heading">${t('memories')}</h3><div class="memories">${[1,2,3].map(i=>level>=i?
     `<p>${t(d.id+'Memory'+i)}</p>`:`<p class="locked">${icon('moon')}<span>${t('memoryLocked')} · ${t('bond'+i)}</span></p>`).join('')}</div>`;
}

export function decorateMarkup(s,{t,n,button}){
  return `<h2 id="sheet-title">${t('decorate')}</h2><p class="sheet-intro">${t('catalogNote')}</p><div class="catalog">${CATALOG.map(c=>`<button
    type="button" data-action="choose-item" data-id="${c.id}" class="catalog-item" ${s.buttons<c.price?
    'disabled':''}><span class="item-art ${c.id}">${icon(c.icon)}</span><strong>${t(c.id)}</strong><span
    class="item-description">${t(c.id+'Desc')}</span><span
    class="item-price">${icon('button')}${n(c.price)}<small>+${n(c.cozy)} ${t('cozy')}</small></span></button>`).join('')}</div><h3
    class="section-heading">${t('yourKeepsakes')}</h3><p class="sheet-intro">${t('refundNote')}</p><div class="inventory">${s.decor.length?
    s.decor.map(d=>{const c=CATALOG.find(x=>x.id===d.item);
  return `<div class="inventory-row">${icon(c.icon)}<div><strong>${t(d.item)}</strong><small>${t(d.room)}</small></div><button type="button"
    data-action="remove" data-id="${d.id}">${t('refund')}<small>+${n(c.price)}</small></button></div>`}).join(''):`<p class="empty-note">${t('emptyDecor')}</p>`}</div>`;
}

export function journalMarkup(s,{t,n,button}){
  return `<h2 id="sheet-title">${t('journal')} <small>${n(s.journal.length)}/${n(SECRETS.length)}</small></h2><p
    class="sheet-intro">${t('whispersIntro')}</p><div class="journal-illustration">${icon('ghost')}<span>✦</span>${icon('moon')}</div>${!s.journal.length?
    `<p class="empty-note">${t('noSecrets')}</p>`:''}<div class="journal-entries">${s.journal.map((id,
    i)=>`<article><span class="entry-number">${n(i+1).padStart(2,
    '0')}</span><div><h3>${t(id+'Title')}</h3><p>${t(id+'Text')}</p></div></article>`).join('')}</div>${s.journal.length<SECRETS.length?button(isNight(s)?
    'discover':'light',t(isNight(s)?'investigate':'night'),isNight(s)?'ghost':'moon',
    'class="primary wide"'):`<p class="ending-note">${t('complete')}</p>`}${isNight(s)&&s.journal.length<SECRETS.length&&coziness(s)<secretCozyNeeded(s)?
    `<p class="shy-note">${t('shyNeed')} ${n(secretCozyNeeded(s))}% · ${t('cozy')} ${n(coziness(s))}%</p>`:''}
   ${storyMemoriesMarkup(s,t)}${doorMarkup(s,{t,n,button})}
   <h3 class="section-heading">${t('milestones')} <small>${n(s.milestones.length)}/${n(MILESTONES.length)}</small></h3><p
     class="sheet-intro">${t('milestonesIntro')} ${t('streakLabel')}: <strong>${n(currentStreak(s))}</strong></p><div
     class="milestones">${MILESTONES.map(m=>{const got=s.milestones.includes(m.id),ready=s.achieved.includes(m.id)&&!got;
   return `<div class="milestone ${got?'claimed':ready?'ready':''}">${icon(got?'check':ready?
     'spark':'button')}<div><strong>${t('ms-'+m.id+'Title')}</strong><small>${t('ms-'+m.id+'Text')}</small></div>${ready?button('claim',
     t('collect')+' +'+n(m.reward),null,`data-id="${m.id}" class="primary"`):`<em>${got?t('collected'):'+'+n(m.reward)}</em>`}</div>`}).join('')}</div>`;
}

export function settingsMarkup(s,{t,button,resetConfirm}){
  return `<h2 id="sheet-title">${t('settings')}</h2><div class="settings-list"><label><span>${t('language')}</span><select data-field="locale"><option
    value="en" ${s.settings.locale==='en'?'selected':''}>English</option><option value="ar" ${s.settings.locale==='ar'?
    'selected':''}>${t('languageArabic')}</option></select></label><div class="setting-row"><span>${t('sound')}</span>${button('sound',t(s.settings.muted?
    'soundOff':'soundOn'),s.settings.muted?'muted':'volume',
    `aria-pressed="${!s.settings.muted}"`)}</div><p>${t('soundHelp')}</p><label><span>${t('motion')}</span><input data-field="motion" type="checkbox"
    ${s.settings.reducedMotion?
    'checked':''}></label><p>${t('motionHelp')}</p><label><span>${t('largeText')}</span><input data-field="largeText" type="checkbox"
    ${s.settings.largeText?'checked':''}></label><p>${t('largeTextHelp')}</p><label><span>${t('quality')}</span><select data-field="quality">${['auto',
    'low','high'].map(q=>`<option value="${q}" ${s.settings.quality===q?
    'selected':''}>${t(q)}</option>`).join('')}</select></label><p>${t('qualityHelp')}</p></div><details><summary>${t('helpTitle')}</summary><p
    >${t('help')}</p><p>${t('controlsHelp')}</p></details><p class="privacy-note">${t('privacyNote')} <a href="./credits.txt" target="_blank"
    rel="noopener">${t('creditsLink')}</a></p><div class="save-file"><h3>${t('saveFile')}</h3><p>${t('saveFileHelp')}</p><div
    class="row">${button('save-export',t('saveExport'),
    'book')}<label class="file-button"><input type="file" accept="application/json,.json"
    data-field="save-import"><span>${t('saveImport')}</span></label></div></div><div class="reset-section">${resetConfirm?
    `<p>${t('resetConfirm')}</p><div class="row">${button('reset-yes',t('resetYes'),null,'class="danger"')}${button('reset-no',
    t('resetNo'))}</div>`:button('reset-prompt',t('reset'),null,'class="text-button"')}</div>`;
}
