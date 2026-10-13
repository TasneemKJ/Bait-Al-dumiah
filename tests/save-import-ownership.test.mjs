import test from 'node:test';
import assert from 'node:assert/strict';
import {saveCommands} from '../src/cmd-save.js';
import {createState} from '../src/simulation.js';

function house(){
 const messages=[];const app={state:createState(),notices:[],audio:{},
  cancelWorkInput(){},syncPause(){},dispatch(){},save(){return true},refreshUI(){},
  ui:{close(){},clearPlacement(){},setActivityResult(){},t:key=>key},say:m=>messages.push(m)};
 return {app,messages};
}
function delayedHouse(buttons){let resolve;
 const file={size:1000,text:()=>new Promise(done=>{resolve=done})};
 const state=createState();state.buttons=buttons;
 return {file,finish:()=>resolve(JSON.stringify(state))};
}
const settle=async()=>{for(let i=0;i<8;i++)await Promise.resolve()};
test('a delayed older import cannot replace the latest file choice',async()=>{
 const {app,messages}=house(),first=delayedHouse(101),second=delayedHouse(202);
 saveCommands['save-import'](app,first.file);saveCommands['save-import'](app,second.file);
 second.finish();await settle();assert.equal(app.state.buttons,202);
 first.finish();await settle();assert.equal(app.state.buttons,202);
 assert.equal(messages.filter(m=>m==='saveImported').length,1);
});
test('a confirmed reset owns the house ahead of an older pending import',async()=>{
 const {app,messages}=house(),pending=delayedHouse(303);
 saveCommands['save-import'](app,pending.file);saveCommands['reset-yes'](app);
 pending.finish();await settle();assert.equal(app.state.buttons,36);
 assert.equal(messages.includes('saveImported'),false);
});
