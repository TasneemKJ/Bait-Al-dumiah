import {icon} from './icons.js';

const dockIcons={household:'souls',activities:'play',decorate:'leaf',journal:'book',settings:'settings'};

// The play shell: header, status, clue, time and camera tools, dock, overlays and the sheet dialog.
export function shellMarkup(s,{t,n,button,clueExpanded,toolsExpanded}){
 return `<header class="brand"><span class="brand-mark">${icon('home')}</span><div><p class="eyebrow">${t('brandArabic')}</p><h1>${t('title')}</h1><p
   class="tagline">${t('subtitle')}</p></div></header>
  <section class="house-status" aria-label="${t('allWishes')}"><div class="currency" title="${t('buttons')}">${icon('button')}<strong
    data-value="buttons"></strong><span>${t('buttons')}</span></div><div
      class="cozy">${icon('heart')}<strong data-value="cozy"></strong><span>${t('cozy')}</span></div></section>
  <aside class="objective" data-expanded="${clueExpanded}" data-unread="false"><div id="objective-detail" ${clueExpanded?
    '':'hidden'}><div class="objective-head"><span class="tiny-star">✦</span><span
      data-story-heading>${t('storyTitle')}</span><span class="wish-count"
    data-value="wishes"></span></div><p id="objective-copy"></p></div><div class="clue-edge"><button id="objective-action" type="button"
    data-action="objective"></button><button type="button" class="clue-toggle" data-action="toggle-clue" aria-expanded="${clueExpanded}"
    aria-controls="objective-detail" aria-label="${t(clueExpanded?
      'storyFoldClue':'storyReadClue')}">${icon('book')}<span class="clue-dot" aria-hidden="true"></span></button></div></aside>
  <div class="time-tools"><button type="button" data-action="light" id="light-button"></button><div class="clock"><span data-value="day"></span><span
    class="clock-dot">·</span><span data-value="time"></span></div></div>
  <div class="camera-tools" aria-label="${t('resetCamera')}">${button('zoom-in',t('zoomIn'),'plus',
    `class="icon-button" title="${t('zoomIn')}"`)}${button('zoom-out',t('zoomOut'),'minus',
    `class="icon-button" title="${t('zoomOut')}"`)}${button('camera',t('resetCamera'),'home',`class="icon-button" title="${t('resetCamera')}"`)}</div>
  <div class="visitor-hint" hidden><button type="button"
    data-action="discover">${icon('ghost')}<span>${t('investigate')}</span><span class="notification-dot"></span></button></div>
  <div class="scene-caption"><span class="desktop-hint">${t('hint')}</span><span class="mobile-hint">${t('mobileHint')}</span></div>
  <nav class="dock" data-expanded="${toolsExpanded}" aria-label="${t('title')}">${button('toggle-tools',t('houseTools'),'home',
    `class="tools-toggle" aria-expanded="${toolsExpanded}"`)}${Object.entries(dockIcons).map(([key,ico])=>button('panel-'+key,t(key),ico,
    `aria-haspopup="dialog"`)).join('')}<span class="dock-divider"></span>${button('sound',t(s.settings.muted?'soundOff':'soundOn'),s.settings.muted?
    'muted':'volume',`class="icon-button" title="${t('sound')}" aria-pressed="${!s.settings.muted}"`)}${button('pause',t(s.paused?'resume':'pause'),
    s.paused?'resume':'pause',`class="icon-button" title="${t('pause')}" aria-pressed="${s.paused}"`)}</nav>
  <div class="saved-note">${icon('check')}<span>${t('saved')}</span></div>
  <div class="placement" hidden></div><div id="toast" role="status" aria-live="polite"></div>
  <div class="pause-overlay"
    hidden><div>${icon('moon')}<h2>${t('paused')}</h2><p>${t('pausedHelp')}</p>${button('pause',t('resume'),'resume','class="primary"')}</div></div>
  <dialog id="sheet" aria-labelledby="sheet-title"><div class="sheet-header"><span class="eyebrow">${t('title')}</span>${button('close',t('close'),
    'close','class="icon-button"')}</div><div id="sheet-content"></div></dialog>`;
}
