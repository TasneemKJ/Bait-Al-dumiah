import test from 'node:test';
import assert from 'node:assert/strict';
import {installFeedback} from '../src/app-feedback.js';
import {createHomeSession} from '../src/home-session.js';
import {translate} from '../src/i18n.js';

test('storage recovery retires stale warning and a later failure is announced again',()=>{
 for(const locale of ['en','ar']){
  let blocked=true;const data=new Map(),messages=[],note={textContent:''};
  const storage={getItem:key=>data.get(key)??null,
   setItem(key,value){if(blocked)throw Error('quota');data.set(key,value)}};
  const session=createHomeSession({storage});session.enter();session.state.settings.locale=locale;
  const app={session,state:session.state,audio:{},host:{querySelector:()=>note},
   ui:{t:key=>translate(locale,key),toast:message=>messages.push(message)}};
  installFeedback(app);assert.equal(app.save(),false);assert.equal(app.saveWarning,true);
  blocked=false;assert.equal(app.save(),true);assert.equal(app.saveWarning,false);
  assert.equal(note.textContent,translate(locale,'saved'));
  assert.equal(messages.at(-1),translate(locale,'saved'));
  blocked=true;assert.equal(app.save(),false);
  assert.equal(messages.filter(m=>m===translate(locale,'savingFailed')).length,2);
 }
});
