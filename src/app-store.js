// The App Store, as the page sees it. In the iPhone app TasKit answers through the bridge
// (public/tas-bridge.js, a verbatim copy of tas-engine/web/tas-bridge.js, loaded before the game):
// what is owned, the App Store's own prices, and buy/restore/manage. On the web there is no handler,
// so nothing is for sale and every room is open. Purchases are never written into the save.
import {NATIVE_HANDLER} from './native-app.js';
import {OPEN_ACCESS} from './access.js';

// The names in ios/BaitAlDumiah/BaitConfig.swift (persisted: never renamed).
export const APP_NAMES=Object.freeze({handler:NATIVE_HANDLER,bridge:'baitApp',boot:'__baitAppBoot'});
export const PRODUCTS=Object.freeze({fifthRoom:'fifthRoom',canaryMonthly:'canaryMonthly',canaryYearly:'canaryYearly'});

export function accessFrom(bridge){
 if(!bridge?.inApp)return OPEN_ACCESS;
 return {fifthRoom:bridge.owns(PRODUCTS.fifthRoom),
  canary:bridge.owns(PRODUCTS.canaryMonthly)||bridge.owns(PRODUCTS.canaryYearly)};
}

export function createAppStore(w=globalThis){
 const listeners=new Set();
 const tell=()=>{for(const fn of listeners){try{fn()}catch{/* one listener's fault */}}};
 let bridge=null;
 try{if(typeof w?.createTasBridge==='function')bridge=w.createTasBridge({window:w,handler:APP_NAMES.handler,
  boot:APP_NAMES.boot,defaultProduct:PRODUCTS.fifthRoom,onUpdate:tell,onStatus:tell})}catch{bridge=null}
 // TasKit calls baitApp.update(u); the page bridge must exist under that name.
 if(bridge?.inApp)w[APP_NAMES.bridge]=bridge;
 const inApp=Boolean(bridge?.inApp);
 const store={
  inApp,bridge,
  get status(){return inApp?bridge.status:''},
  access:()=>accessFrom(bridge),
  owns:key=>inApp?bridge.owns(key):true,
  price:key=>inApp?(bridge.prices[key]||''):'',
  canary:()=>accessFrom(bridge).canary,
  buy:key=>inApp&&bridge.buy(key),
  restore:()=>inApp&&bridge.restore(),
  refresh:()=>inApp&&bridge.refresh(),
  openPage:name=>inApp&&bridge.openPage(name),
  // Apple's own sheet for changing or cancelling the plan.
  manage:()=>inApp&&bridge.post('manageSubscriptions'),
  // The app's share sheet takes one PNG (a data URL).
  share:dataURL=>inApp&&bridge.share(dataURL),
  // A stale "buying" (the sheet was dismissed) gives the buttons back when the card opens again.
  clearStatus(){if(inApp&&bridge.status==='buying')bridge.status=''},
  onChange(fn){listeners.add(fn);return ()=>listeners.delete(fn)},
 };
 // Prices sent before this script ran are lost unless the page asks again.
 store.refresh();
 return store;
}

// The page's one store (the bridge global must exist once, before the game asks).
export const appStore=createAppStore();
