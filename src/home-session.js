import {SAVE_KEY} from './content.js';
import {createState,readSave,step} from './simulation.js';

// Preferences can change before entry without replacing the player's house.
export const HOME_PREFERENCES_KEY=SAVE_KEY+'.preferences';
function preferences(value){
 const result={};if(!value||typeof value!=='object'||Array.isArray(value))return result;
 if(['en','ar'].includes(value.locale))result.locale=value.locale;
 if(typeof value.muted==='boolean')result.muted=value.muted;
 if(typeof value.reducedMotion==='boolean')result.reducedMotion=value.reducedMotion;
 if(typeof value.largeText==='boolean')result.largeText=value.largeText;
 if(['auto','low','high'].includes(value.quality))result.quality=value.quality;
 return result;
}
// The only preference-schema addition is an optional false Larger text flag.
// Accept a pre-addition base only when every original setting still matches.
function samePreferenceBase(left,right){
 if(left===right)return true;
 if(typeof left!=='string'||typeof right!=='string')return false;
 try{const a=JSON.parse(left),b=JSON.parse(right);if(!a||!b||Array.isArray(a)||Array.isArray(b))return false;
  return ['locale','muted','reducedMotion','quality'].every(key=>Object.hasOwn(a,key)&&a[key]===b[key])&&(a.largeText??false)===(b.largeText??false);
 }catch{return false}
}
export function createHomeSession({storage,reducedMotion=false}={}){
 let raw=null,loadStatus='new',entered=false,recovered=false;
 try{raw=storage.getItem(SAVE_KEY)}catch{loadStatus='unavailable'}
 const loaded=readSave(raw),valid=loaded.ok&&!loaded.empty;
 if(raw!==null)loadStatus=valid?'saved':loaded.empty?'new':'invalid';
 const state=loaded.state;
 let backupPending=!loaded.ok,expectedRaw=raw,entryIssue=null;
 const identityKnown=loadStatus!=='unavailable';
 function checkIdentity(){
  if(entryIssue)return false;
  let current;try{current=storage.getItem(SAVE_KEY)}catch{entryIssue='unavailable';return false}
  if(!identityKnown){entryIssue='unavailable';return false}
  if(current!==expectedRaw){entryIssue='changed';return false}
  return true;
 }
 if(!valid)state.settings.reducedMotion=Boolean(reducedMotion);
 const preferenceBase=valid?JSON.stringify(state.settings):null;
 // An overlay applies only to the save settings it was edited against. A
 // newer canonical save remains authoritative after a partial storage failure.
 try{const saved=JSON.parse(storage.getItem(HOME_PREFERENCES_KEY));if(saved&&samePreferenceBase(saved._base,preferenceBase))Object.assign(state.settings,preferences(saved))}catch{}
 return {
  state,canContinue:valid,loadStatus,get recovered(){return recovered},get entryIssue(){return entryIssue},get entered(){return entered},
  enter(){if(entered||!checkIdentity())return false;entered=true;return true},
  advance(current,dt){if(entered)step(current,dt)},
  save(current){
   // A failed read does not prove no save exists. Never overwrite it with a
   // fresh fallback, even if storage later becomes writable in this visit.
   if(!entered||!checkIdentity())return false;
   try{if(backupPending){storage.setItem(SAVE_KEY+'.backup',raw);backupPending=false;recovered=true}const encoded=JSON.stringify(current);storage.setItem(SAVE_KEY,encoded);expectedRaw=encoded;return true}catch{return false}
  },
  savePreferences(settings){try{storage.setItem(HOME_PREFERENCES_KEY,JSON.stringify({...preferences(settings),_base:preferenceBase}));return true}catch{return false}},
 };
}
