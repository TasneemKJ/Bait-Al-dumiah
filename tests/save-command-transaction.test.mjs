import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,beginActivity} from '../src/simulation.js';
import {SAVE_KEY} from '../src/content.js';
import {createHomeSession} from '../src/home-session.js';
import {installFeedback} from '../src/app-feedback.js';
import {installView} from '../src/app-view.js';
import {homeCommands} from '../src/cmd-home.js';
import {shellMarkup,button} from '../src/shell-markup.js';
import {saveCommands} from '../src/cmd-save.js';
import {translate} from '../src/i18n.js';
import {createToaster} from '../src/hud-sync.js';
import {toastDOM} from './helpers/toast-dom.mjs';

const settle=()=>new Promise(resolve=>setImmediate(resolve));
const toasters=[],originalDocument=globalThis.document;
test.afterEach(()=>{for(const toaster of toasters.splice(0))toaster.dispose();globalThis.document=originalDocument});
function savedHouse(){
 const initial=createState();initial.day=4;initial.settings.muted=true;
 const raw=JSON.stringify(initial),storage=new Map([[SAVE_KEY,raw]]),dom=toastDOM(),shown=dom.shown,view=[];
 globalThis.document=dom.document;
 let failWrites=false;
 const session=createHomeSession({storage:{getItem:key=>storage.get(key)??null,setItem(key,value){if(failWrites)throw Error('quota');storage.set(key,value)}}});
 assert.equal(session.enter(),true);
 const note=dom.saved;note.textContent=translate('en','saved');
 const app={state:session.state,session,audio:{},host:dom.host,manualPause:true,
  dispatch:action=>view.push(action),
  world:{setTeaActive:value=>view.push(['tea',value]),setStitchActive:value=>view.push(['stitch',value]),setChimeActive:value=>view.push(['chime',value]),setPlacement:value=>view.push(['placement',value])},
  ui:{panel:'settings',t:key=>translate(app.state.settings.locale,key),n:String,toast:message=>toaster.show(message),
   setSaveWarning:message=>toaster.setWarning(message),
   close(){this.panel=null;view.push('close')},clearPlacement:()=>view.push('clear-placement'),setActivityResult:value=>view.push(['result',value])}};
 const toaster=createToaster(dom.host,()=>Boolean(app.ui.panel));toasters.push(toaster);
 installFeedback(app);installView(app);
 // Keep the real ritual visibility detector; observe only the rendering boundary.
 Object.assign(app,{cancelWorkInput:()=>view.push('cancel'),syncPause(){this.state.paused=this.manualPause},refreshUI:()=>view.push('refresh')});
 return {app,storage,raw,shown,note,view,fail(value){failWrites=value},messages:()=>[...shown,...app.notices]};
}
const houseFile=day=>{const state=createState();state.day=day;state.settings.locale='ar';const text=JSON.stringify(state);return {size:text.length,text:async()=>text}};

test('a successful retry rearms later save failures and clears the stale saved note',()=>{
 const h=savedHouse();h.fail(true);assert.equal(h.app.save(),false);assert.equal(h.app.save(),false);
 assert.equal(h.shown.length,1,'repeat failures in the same interval stay quiet');
 h.fail(false);assert.equal(h.app.save(),true);assert.equal(h.note.textContent,translate('en','saved'));
 h.fail(true);assert.equal(h.app.save(),false);assert.equal(h.shown.length,2,'a later outage is announced again');
});

test('a failed save stays visibly unsaved across language and ordinary UI rebuilds',()=>{
 const h=savedHouse();h.app.roomViews={update(){}};
 h.app.ui.refresh=()=>{
  const html=shellMarkup(h.app.state,{t:h.app.ui.t,n:String,button,clueExpanded:false,toolsExpanded:false});
  h.note.textContent=html.match(/class="saved-note">.*?<span>(.*?)<\/span><\/div>/s)[1];
 };
 installView(h.app);h.fail(true);h.app.save();
 homeCommands.setting(h.app,{key:'locale',value:'ar'});
 assert.equal(h.note.textContent,translate('ar','savingFailed'));
 assert.deepEqual(h.shown,[translate('en','savingFailed'),translate('ar','savingFailed')]);
 h.app.refreshUI();assert.equal(h.note.textContent,translate('ar','savingFailed'),'a rebuild without a new write remains truthful');
 h.fail(false);assert.equal(h.app.save(),true);h.app.refreshUI();
 assert.equal(h.note.textContent,translate('ar','saved'));
});

test('a failed import preserves the live house, active work, visible sheet and stored bytes',async()=>{
 for(const locale of ['en','ar']){
  const h=savedHouse();h.app.state.settings.locale=locale;beginActivity(h.app.state,'tea');
  const previous=h.app.state,work=previous.activities.active;h.fail(true);
  saveCommands['save-import'](h.app,houseFile(7));await settle();
  assert.equal(h.app.state,previous);assert.equal(previous.activities.active,work);
  assert.equal(h.app.ui.panel,'settings');assert.deepEqual(h.view,[]);assert.equal(h.storage.get(SAVE_KEY),h.raw);
  assert.equal(h.messages().includes(translate(locale,'saveImported')),false);
  assert.ok(h.messages().includes(translate(locale,'saveImportNotSaved')),'the failed storage commit is explained without claiming success');
  assert.equal(h.messages().includes(translate(locale,'saveImportFailed')),false,'a valid file must not be reported as unreadable');
 }
});

test('a successful import persists the replacement and then clears old work once',async()=>{
 const h=savedHouse();saveCommands['save-import'](h.app,houseFile(7));await settle();
 assert.equal(h.app.state.day,7);assert.equal(JSON.parse(h.storage.get(SAVE_KEY)).day,7);
 assert.equal(h.app.state.settings.locale,'ar');assert.equal(h.app.state.settings.muted,true);
 assert.equal(h.app.ui.panel,null);assert.equal(h.view.filter(x=>x==='cancel').length,1);
 assert.deepEqual(h.messages(),[translate('ar','saveImported')]);
});

test('a failed reset keeps the current house and view',()=>{
 const h=savedHouse(),previous=h.app.state;h.fail(true);saveCommands['reset-yes'](h.app);
 assert.equal(h.app.state,previous);assert.equal(h.storage.get(SAVE_KEY),h.raw);
 assert.equal(h.app.ui.panel,'settings');assert.deepEqual(h.view,[]);
});

test('an invalid import leaves the current house alone',async()=>{
 const h=savedHouse(),previous=h.app.state;saveCommands['save-import'](h.app,{size:1,text:async()=>'{'});await settle();
 assert.equal(h.app.state,previous);assert.equal(h.storage.get(SAVE_KEY),h.raw);assert.deepEqual(h.view,[]);
 assert.ok(h.messages().includes(translate('en','saveImportFailed')));
});

function delayedFile(day){
 let resolve,reject;const text=houseFile(day),promise=new Promise((yes,no)=>{resolve=yes;reject=no});
 return {file:{size:1000,text:()=>promise},async finish(){resolve(await text.text())},fail(){reject(Error('read failed'))}};
}

test('reset invalidates an older file read before it can replace the fresh house',async()=>{
 const h=savedHouse(),file=delayedFile(8);saveCommands['save-import'](h.app,file.file);
 saveCommands['reset-yes'](h.app);assert.equal(h.app.state.day,1);
 const fresh=h.app.state,bytes=h.storage.get(SAVE_KEY);await file.finish();await settle();
 assert.equal(h.app.state,fresh);assert.equal(h.storage.get(SAVE_KEY),bytes);
 assert.equal(h.messages().includes(translate('ar','saveImported')),false);
});

test('the latest selected import wins even when older reads finish last',async()=>{
 const h=savedHouse(),older=delayedFile(8),newer=delayedFile(9);
 saveCommands['save-import'](h.app,older.file);saveCommands['save-import'](h.app,newer.file);
 await newer.finish();await settle();assert.equal(h.app.state.day,9);
 await older.finish();await settle();assert.equal(h.app.state.day,9);assert.equal(JSON.parse(h.storage.get(SAVE_KEY)).day,9);
 assert.equal(h.view.filter(x=>x==='cancel').length,1);
});

test('an obsolete import error stays silent after reset',async()=>{
 const h=savedHouse(),file=delayedFile(8);saveCommands['save-import'](h.app,file.file);
 saveCommands['reset-yes'](h.app);file.fail();await settle();
 assert.equal(h.app.state.day,1);assert.deepEqual(h.messages(),[]);
});

test('a failed newer import still supersedes the earlier pending selection',async()=>{
 const h=savedHouse(),file=delayedFile(8),original=h.app.state;saveCommands['save-import'](h.app,file.file);
 saveCommands['save-import'](h.app,{size:1,text:async()=>'{'});await settle();
 await file.finish();await settle();assert.equal(h.app.state,original);assert.equal(h.storage.get(SAVE_KEY),h.raw);
});
