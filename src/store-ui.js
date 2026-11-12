// The App Store card, in the iPhone app only: The Fifth Room (paid once) and the canary (monthly or
// yearly). It says what each opens before anything is paid, prints the App Store's own price (never
// one of ours) left to right inside either language, and keeps Restore, Terms and Privacy on the
// card. What was bought lives in the app, never in the save (src/access.js).
import {giftArt} from './gift-art.js';

const STATUS_KEY={buying:'storeBuying',pending:'storePending',failed:'storeFailed',
 unavailable:'storeUnavailable',nothing:'storeNothing'};
const ENTITY={'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'};
const escape=text=>String(text).replace(/[&<>"']/g,c=>ENTITY[c]);
const ltr=price=>`<bdi dir="ltr">${escape(price)}</bdi>`;
// A price inside a sentence of either language.
const priced=(t,key,price)=>escape(t(key)).replace('{price}',ltr(price));
// The canary on its swing, drawn like the visitor's keepsakes (src/gift-art.js).
const CANARY='<svg class="gift-art" viewBox="0 0 48 48" width="44" height="44" aria-hidden="true"'+
 ' focusable="false">'+
 '<path d="M24 4v4M12 22c0-8 5-14 12-14s12 6 12 14v18H12z" fill="none" stroke="#b68d5d" stroke-width="1.4"/>'+
 '<path d="M17 12v28m7-32v32m7-28v28M12 40h24" fill="none" stroke="#c9a876" stroke-width="1"/>'+
 '<path d="M17 33h14" stroke="#8d6a3a" stroke-width="1.4"/>'+
 '<path d="M19 31c0-5 3-8 7-8 2 0 4 1 4 3l3 1-3 1c0 3-3 4-6 4z" fill="#f2cf5b" stroke="#b08a2e" stroke-width="1.1"/>'+
 '<path d="M19 30l-4 2 4 0" fill="#e6bb44" stroke="#b08a2e" stroke-width="1"/>'+
 '<circle cx="27.5" cy="25.5" r=".9" fill="#352b3d"/></svg>';

function card(art,title,note,actions,{owned=false}={}){
 return `<article class="store-card${owned?' owned':''}"><span class="gift-picture">${art}</span><div><h3>`+
  `${escape(title)}`+
  `</h3><p>${escape(note)}</p><div class="store-actions">${actions.join('')}</div></div></article>`;
}
const storeButton=(act,label,{primary=false,enabled=true}={})=>
 `<button type="button" data-action="store-${act.split(':')[0]}" data-id="${escape(act.split(':')[1]??'')}"`+
 ` class="${primary?'primary ':''}store-button"${enabled?'':' disabled'}><span>${label}</span></button>`;

function fifthCard(t,store){
 const owned=store.owns('fifthRoom'),price=store.price('fifthRoom'),busy=store.status==='buying';
 const actions=owned?[`<span class="store-owned">${escape(t('storeOwned'))}</span>`]:
  [storeButton('buy:fifthRoom',price?`${escape(t('storeBuy'))} ${ltr(price)}`:escape(t('storeLoading')),
   {primary:true,enabled:Boolean(price)&&!busy})];
 return card(giftArt('tiny-key'),t('fifthName'),t(owned?'fifthOwned':'fifthNote'),actions,{owned});
}
function canaryCard(t,store){
 const on=store.canary(),monthly=store.price('canaryMonthly'),yearly=store.price('canaryYearly'),
  busy=store.status==='buying';
 const actions=on?[storeButton('manage',escape(t('storeManage')))]:[
  storeButton('buy:canaryMonthly',monthly?priced(t,'storeMonthly',monthly):escape(t('storeLoading')),
   {primary:true,enabled:Boolean(monthly)&&!busy}),
  storeButton('buy:canaryYearly',yearly?priced(t,'storeYearly',yearly):escape(t('storeLoading')),
   {enabled:Boolean(yearly)&&!busy})];
 return card(CANARY,t('canaryName'),t(on?'canaryOwned':'canaryNote'),actions,{owned:on})+
  `<p class="store-small">${escape(t('storeRenews'))}</p>`;
}

export function storeMarkup(store,{t}){
 const status=STATUS_KEY[store.status];
 return `<h2 id="sheet-title">${escape(t('storeTitle'))}</h2><p class="sheet-intro">${escape(t('storeIntro'))}</p>`+
  `<div class="store-cards">${fifthCard(t,store)}${canaryCard(t,store)}</div>`+
  (status?`<p class="store-status" role="status">${escape(t(status))}</p>`:'')+
  `<div class="store-footer">${storeButton('restore',escape(t('storeRestore')))}`+
  `${storeButton('page:terms',escape(t('storeTerms')))}${storeButton('page:privacy',escape(t('storePrivacy')))}</div>`;
}
