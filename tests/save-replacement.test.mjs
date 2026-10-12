import test from 'node:test';
import assert from 'node:assert/strict';
import {setImmediate as nextTurn} from 'node:timers/promises';
import {saveCommands} from '../src/cmd-save.js';
import {installFeedback} from '../src/app-feedback.js';
import {installView} from '../src/app-view.js';
import {createHomeSession} from '../src/home-session.js';
import {createState} from '../src/simulation.js';
import {SAVE_KEY} from '../src/content.js';

function savedHouse(buttons){const state=createState();state.buttons=buttons;return JSON.stringify(state)}
function fileRead(){
 let resolve,reject;const content=new Promise((yes,no)=>{resolve=yes;reject=no});
 return {file:{size:100,text:()=>content},resolve,reject};
}
function fixture(){
 const data=new Map([[SAVE_KEY,savedHouse(77)]]),messages=[];
 let failWrites=false,warning;
 const storage={getItem:key=>data.get(key)??null,setItem(key,value){if(failWrites)throw Error('quota');data.set(key,value)}};
 const session=createHomeSession({storage});session.enter();
 const app={session,state:session.state,world:null,manualPause:false,panelOpen:'settings',saveWarning:false,
  audio:{},host:{querySelector:()=>null},cancelWorkInput(){},refreshUI(){},dispatch(){},
  syncPause(){this.state.paused=Boolean(this.manualPause||this.panelOpen)},
  ui:{panel:'settings',t:key=>key,toast:message=>messages.push(message),
   setSaveWarning(message){if(message&&message!==warning)messages.push(message);warning=message},
   close(){this.panel=null;app.panelOpen=false},clearPlacement(){},setActivityResult(){}}};
 const viewStubs={cancelWorkInput:app.cancelWorkInput,refreshUI:app.refreshUI,syncPause:app.syncPause};
 // Feedback now uses the production physical-activity detector before showing
 // a notice; keep only DOM/render operations stubbed for this save fixture.
 installView(app);Object.assign(app,viewStubs);installFeedback(app);
 return {app,data,messages,failWrites(value=true){failWrites=value},
  notices:()=>[...messages,...app.notices]};
}

test('the latest chosen import wins when an older file finishes reading last',async()=>{
 const f=fixture(),older=fileRead(),newer=fileRead();
 saveCommands['save-import'](f.app,older.file);saveCommands['save-import'](f.app,newer.file);
 newer.resolve(savedHouse(202));await nextTurn();assert.equal(f.app.state.buttons,202);
 older.resolve(savedHouse(101));await nextTurn();
 assert.equal(f.app.state.buttons,202,'late file reads must not replace the more recent choice');
 assert.equal(JSON.parse(f.data.get(SAVE_KEY)).buttons,202);
 assert.equal(f.notices().filter(message=>message==='saveImported').length,1);
});

test('reset supersedes an import whose file has not finished reading',async()=>{
 const f=fixture(),pending=fileRead();saveCommands['save-import'](f.app,pending.file);
 saveCommands['reset-yes'](f.app);const reset=f.app.state,bytes=f.data.get(SAVE_KEY);
 assert.equal(reset.buttons,36);
 pending.resolve(savedHouse(303));await nextTurn();
 assert.equal(f.app.state,reset,'a completed reset must not resurrect the pending import');
 assert.equal(f.data.get(SAVE_KEY),bytes);assert.equal(f.notices().includes('saveImported'),false);
});

test('a failed latest choice does not revive an older pending import',async()=>{
 const f=fixture(),older=fileRead(),newer=fileRead(),before=f.app.state;
 saveCommands['save-import'](f.app,older.file);saveCommands['save-import'](f.app,newer.file);
 newer.resolve('{invalid');await nextTurn();assert.equal(f.app.state,before);
 older.resolve(savedHouse(404));await nextTurn();assert.equal(f.app.state,before);
 assert.deepEqual(f.notices(),['saveImportFailed']);
});

test('a stale file read failure stays silent after a newer import succeeds',async()=>{
 const f=fixture(),older=fileRead(),newer=fileRead();
 saveCommands['save-import'](f.app,older.file);saveCommands['save-import'](f.app,newer.file);
 newer.resolve(savedHouse(505));await nextTurn();older.reject(Error('file unavailable'));await nextTurn();
 assert.equal(f.app.state.buttons,505);assert.deepEqual(f.notices(),['saveImported']);
});

test('pending imports in two independent houses do not cancel each other',async()=>{
 const a=fixture(),b=fixture(),first=fileRead(),second=fileRead();
 saveCommands['save-import'](a.app,first.file);saveCommands['save-import'](b.app,second.file);
 second.resolve(savedHouse(606));first.resolve(savedHouse(707));await nextTurn();
 assert.equal(a.app.state.buttons,707);assert.equal(b.app.state.buttons,606);
});

test('an import blocked by storage leaves the live house and canonical bytes unchanged',async()=>{
 const f=fixture(),pending=fileRead(),before=f.app.state,snapshot=structuredClone(before),bytes=f.data.get(SAVE_KEY);
 f.failWrites();saveCommands['save-import'](f.app,pending.file);pending.resolve(savedHouse(808));await nextTurn();
 assert.equal(f.app.state,before,'failed persistence must not replace the current state binding');
 assert.deepEqual(f.app.state,snapshot);assert.equal(f.data.get(SAVE_KEY),bytes);
 assert.equal(f.app.ui.panel,'settings');assert.equal(f.notices().includes('saveImported'),false);
 assert.equal(f.notices().includes('savingFailed'),true);
 const retry=fileRead();f.failWrites(false);saveCommands['save-import'](f.app,retry.file);
 retry.resolve(savedHouse(808));await nextTurn();
 assert.equal(f.app.state.buttons,808);assert.equal(JSON.parse(f.data.get(SAVE_KEY)).buttons,808);
 assert.equal(f.app.ui.panel,null);assert.equal(f.notices().includes('saveImported'),true);
});

test('a blocked reset preserves the paused house and its open recovery surface',()=>{
 const f=fixture();f.app.manualPause=true;f.app.state.paused=true;
 const before=f.app.state,snapshot=structuredClone(before),bytes=f.data.get(SAVE_KEY);
 f.failWrites();saveCommands['reset-yes'](f.app);
 assert.equal(f.app.state,before,'reset must commit before discarding the current house');
 assert.deepEqual(f.app.state,snapshot);assert.equal(f.data.get(SAVE_KEY),bytes);
 assert.equal(f.app.manualPause,true);assert.equal(f.app.ui.panel,'settings');
 assert.equal(f.notices().includes('savingFailed'),true);
});

test('a canonical save changed during import stays protected without replacing the live house',async()=>{
 const f=fixture(),pending=fileRead(),before=f.app.state;
 saveCommands['save-import'](f.app,pending.file);
 const newer=savedHouse(909);f.data.set(SAVE_KEY,newer);
 pending.resolve(savedHouse(1010));await nextTurn();
 assert.equal(f.app.state,before);assert.equal(f.data.get(SAVE_KEY),newer);
 assert.equal(f.app.session.entryIssue,'changed');assert.equal(f.notices().includes('saveImported'),false);
});

test('a failed reset still supersedes the import that was pending before it',async()=>{
 const f=fixture(),pending=fileRead(),before=f.app.state;
 saveCommands['save-import'](f.app,pending.file);f.failWrites();saveCommands['reset-yes'](f.app);
 f.failWrites(false);pending.resolve(savedHouse(1111));await nextTurn();
 assert.equal(f.app.state,before);assert.equal(JSON.parse(f.data.get(SAVE_KEY)).buttons,77);
 assert.equal(f.notices().includes('saveImported'),false);
});

test('a committed import preserves current sound intent and remains owned for later saves',async()=>{
 const f=fixture(),pending=fileRead(),imported=createState();
 imported.buttons=246;imported.settings.locale='ar';imported.settings.muted=false;
 saveCommands['save-import'](f.app,pending.file);pending.resolve(JSON.stringify(imported));await nextTurn();
 assert.equal(f.app.state.buttons,246);assert.equal(f.app.state.settings.locale,'ar');
 assert.equal(f.app.state.settings.muted,true);assert.equal(f.app.ui.panel,null);
 assert.equal(f.app.save(),true);assert.deepEqual(JSON.parse(f.data.get(SAVE_KEY)),f.app.state);
 assert.deepEqual(f.notices(),['saveImported']);
});
