import test from 'node:test';
import assert from 'node:assert/strict';
import {installFeedback} from '../src/app-feedback.js';
import {createHomeSession} from '../src/home-session.js';
import {translate} from '../src/i18n.js';

// Main reports a save failure through the persistent warning (ui.setSaveWarning), not a one-off toast.
test('storage recovery retires stale warning and a later failure is announced again',()=>{
 for(const locale of ['en','ar']){
  let blocked=true;const data=new Map(),warnings=[],note={textContent:''};
  const storage={getItem:key=>data.get(key)??null,
   setItem(key,value){if(blocked)throw Error('quota');data.set(key,value)}};
  const session=createHomeSession({storage});session.enter();session.state.settings.locale=locale;
  const app={session,state:session.state,audio:{},host:{querySelector:()=>note},
   ui:{t:key=>translate(locale,key),toast(){},setSaveWarning:message=>warnings.push(message)}};
  installFeedback(app);assert.equal(app.save(),false);assert.equal(app.saveWarning,true);
  assert.equal(warnings.at(-1),translate(locale,'savingFailed'));
  blocked=false;assert.equal(app.save(),true);assert.equal(app.saveWarning,false);
  assert.equal(note.textContent,translate(locale,'saved'));assert.equal(warnings.at(-1),null);
  blocked=true;assert.equal(app.save(),false);assert.equal(app.saveWarning,true);
  assert.equal(warnings.at(-1),translate(locale,'savingFailed'));
  assert.equal(note.textContent,translate(locale,'savingFailed'));
 }
});
