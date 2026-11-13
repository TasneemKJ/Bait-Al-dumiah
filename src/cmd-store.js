// Commands: the App Store card (iPhone app only) and the store's answers reaching the house.
import * as sim from './simulation.js';
import {appStore} from './app-store.js';
import {composeCard,cardLines} from './share-card.js';

export const storeCommands={
'store-buy':(app,value)=>{appStore.buy(value);app.ui.renderPanel?.();return;},
'store-restore':app=>{appStore.restore();app.ui.renderPanel?.();return;},
'store-page':(app,value)=>{appStore.openPage(value);return;},
'store-manage':()=>{appStore.manage();return;},
// A picture of this house at night, made by the renderer, handed to the iOS share sheet.
'share-house':app=>{
 if(!appStore.inApp)return;const {t,n}=app.ui;
 const url=app.world?.picture?.(app.state,canvas=>composeCard(canvas,cardLines(app.state,t,n),undefined,
  app.state.settings.locale==='ar'));
 if(url)appStore.share(url);else app.say(t('shareUnavailable'));return;},
};

// The App Store answered: redraw the open card or door, and let the canary come or go. A purchase
// is never saved; the house only reads it.
export function installStore(app){
 let canary=appStore.canary();
 const sync=()=>{
  const now=appStore.canary();
  app.world?.setCanary?.(now);
  if(now&&!canary&&app.session.entered)app.say(app.ui.t('canaryArrived'));
  canary=now;
  if(app.ui?.panel)app.ui.renderPanel?.();app.ui?.tick?.();
 };
 appStore.onChange(sync);
 // By day the canary sings now and then while the house is open and the sound is on.
 let nextSong=0;
 const song=setInterval(()=>{
  const s=app.state;if(!appStore.canary()||!app.session.entered||s.paused||app.fatal)return;
  if(s.elapsed<nextSong||sim.isNight(s))return;nextSong=s.elapsed+38+Math.random()*30;
  if(app.audio.canary?.())app.world?.canarySing?.(s.elapsed);
 },1000);song?.unref?.();
 app.world?.setCanary?.(canary);
 app.openStore=()=>{appStore.clearStatus();appStore.refresh();app.ui.open('store')};
 // The app's tests (and a debug launch) open the card directly.
 if(appStore.inApp)appStore.bridge.openStore=()=>app.openStore();
}
