// Settings rows for the iPhone app (studio bar, 2026-11-13): haptics, support and privacy pages, the version and the
// studio's signature. The version is the Xcode project's MARKETING_VERSION (tests/settings-app.test.mjs).
export const APP_VERSION='1.1';
// Kept under the save prefix so the vault carries it with the house.
export const HAPTICS_KEY='bait-al-dumiah.v1.haptics';
const store=()=>{try{return globalThis.localStorage}catch{return null}};
export function hapticsOn(storage=store()){try{return storage?.getItem(HAPTICS_KEY)!=='off'}catch{return true}}
export function setHaptics(on,storage=store()){try{storage?.setItem(HAPTICS_KEY,on?'on':'off')}catch{/* stays on */}}
const page=(button,id,label)=>button('store-page',label,null,`data-id="${id}" class="store-button"`);
export function appInfoMarkup({t,button},{inApp,haptics=hapticsOn()}){
 const rows=inApp?`<label><span>${t('hapticsLabel')}</span><input data-field="haptics" type="checkbox"
  ${haptics?'checked':''}></label><p>${t('hapticsHelp')}</p><div class="setting-row"><span
  >${t('shareLabel')}</span>${button(
  'share-house',t('shareAction'),'heart')}</div><div class="row app-pages">${page(button,'support',
  t('supportLink'))}${page(button,'privacy',t('storePrivacy'))}</div>`:'';
 return `${rows}<p class="app-signature">${t('title')} ${APP_VERSION} · Tas Games · Tasnim Almousa<br
  >${t('creditsLine')}</p>`;
}
