import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,beginActivity,endActivity} from '../src/simulation.js';
import {installFeedback} from '../src/app-feedback.js';
import {installView} from '../src/app-view.js';
import {createToaster} from '../src/hud-sync.js';
import {translate} from '../src/i18n.js';
import {toastDOM} from './helpers/toast-dom.mjs';

function house(t,locale='en'){
 t.mock.timers.enable({apis:['setTimeout']});
 const dom=toastDOM(),state=createState();state.settings.locale=locale;
 const previousDocument=globalThis.document;globalThis.document=dom.document;
 let saved=false,panel=false;const toaster=createToaster(dom.host,()=>panel);
 const app={state,host:dom.host,session:{entered:true,save:()=>saved},audio:{},
  ui:{t:key=>translate(state.settings.locale,key),n:String,toast:message=>toaster.show(message,panel),
   setSaveWarning:message=>toaster.setWarning(message)}};
 installFeedback(app);installView(app);t.after(()=>{toaster.dispose();globalThis.document=previousDocument});
 return {app,dom,toaster,recover(){saved=true},panel(value){panel=value},advance:ms=>t.mock.timers.tick(ms)};
}

for(const locale of ['en','ar'])for(const activity of ['tea','stitch','lullaby'])
 test(`${locale}: a save failure during ${activity} remains available after ritual exit`,t=>{
  const h=house(t,locale);beginActivity(h.app.state,activity);h.app.save();h.advance(10000);
  endActivity(h.app.state);
  assert.equal(h.dom.toast.classList.contains('visible'),true,'the warning must outlive the hidden ritual toast timeout');
  assert.equal(h.dom.toast.textContent,translate(locale,'savingFailed'));
  h.app.say('A house reward');h.app.showNotice(10000);
  assert.equal(h.dom.toast.textContent,'A house reward','normal notices must still display during storage failure');
  h.advance(4500);assert.equal(h.dom.toast.textContent,translate(locale,'savingFailed'));
  h.recover();h.app.save();h.advance(20000);
  assert.equal(h.dom.toast.classList.contains('visible'),false,'recovered storage must not leave or revive the warning');
 });

test('a new failure waits for an active notice, and recovery preserves that notice',t=>{
 const h=house(t);h.app.ui.toast('A house reward');h.app.save();
 assert.equal(h.dom.toast.textContent,'A house reward');
 h.recover();h.app.save();assert.equal(h.dom.toast.textContent,'A house reward');
 h.advance(4499);assert.equal(h.dom.toast.classList.contains('visible'),true);
 h.advance(1);assert.equal(h.dom.toast.classList.contains('visible'),false);
 h.advance(20000);assert.equal(h.dom.toast.classList.contains('visible'),false);
});

test('a pending failure uses the current language after a rebuild and transient expiry',t=>{
 const h=house(t);h.app.save();h.app.ui.toast('A house reward');
 h.app.state.settings.locale='ar';h.dom.reset();h.app.updateSaveStatus();
 assert.equal(h.dom.toast.textContent,'A house reward');h.advance(4500);
 assert.equal(h.dom.toast.textContent,translate('ar','savingFailed'));
 assert.equal(h.dom.toast.classList.contains('visible'),true);
});

test('opening a new sheet mirrors the current warning and recovery removes only its notice',t=>{
 const h=house(t);h.app.save();h.panel(true);h.dom.newSheet();h.toaster.refresh?.();
 assert.equal(h.dom.note.textContent,translate('en','savingFailed'));
 h.app.ui.toast('An import explanation');h.recover();h.app.save();
 assert.equal(h.dom.note.textContent,'An import explanation');h.advance(4500);
 assert.equal(h.dom.note.textContent,'An import explanation');
});

test('recovery removes a warning owned by an open sheet after a language rebuild',t=>{
 const h=house(t);h.app.save();h.app.state.settings.locale='ar';h.panel(true);h.dom.reset();h.app.updateSaveStatus();
 assert.equal(h.dom.note.textContent,translate('ar','savingFailed'));h.recover();h.app.save();
 assert.equal(h.dom.note,null);h.advance(20000);assert.equal(h.dom.toast.classList.contains('visible'),false);
});

test('repeated failed autosaves and refreshes leave unchanged live status text alone',t=>{
 const h=house(t);h.panel(true);h.app.save();
 const toastWrites=h.dom.toast.textWrites,panelWrites=h.dom.note.textWrites;
 h.app.save();h.app.updateSaveStatus();h.toaster.refresh();
 assert.equal(h.dom.toast.textWrites,toastWrites);
 assert.equal(h.dom.note.textWrites,panelWrites);
});
