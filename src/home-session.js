import {SAVE_KEY} from './content.js';
import {createState,restore,step} from './simulation.js';

// Preferences can change before entry without replacing the player's house.
export const HOME_PREFERENCES_KEY=SAVE_KEY+'.preferences';
function preferences(value){
 const result={};if(!value||typeof value!=='object'||Array.isArray(value))return result;
 if(['en','ar'].includes(value.locale))result.locale=value.locale;
 if(typeof value.muted==='boolean')result.muted=value.muted;
 if(typeof value.reducedMotion==='boolean')result.reducedMotion=value.reducedMotion;
 if(['auto','low','high'].includes(value.quality))result.quality=value.quality;
 return result;
}
export function createHomeSession({storage,reducedMotion=false}={}){
 let raw=null,loadStatus='new',entered=false;
 try{raw=storage.getItem(SAVE_KEY)}catch{loadStatus='unavailable'}
 let valid=false;
 if(raw!==null){try{const saved=JSON.parse(raw);valid=Boolean(saved&&typeof saved==='object'&&!Array.isArray(saved)&&saved.version===1)}catch{}loadStatus=valid?'saved':'invalid'}
 const state=valid?restore(raw):createState();
 if(!valid)state.settings.reducedMotion=Boolean(reducedMotion);
 const preferenceBase=valid?JSON.stringify(state.settings):null;
 // An overlay applies only to the save settings it was edited against. A
 // newer canonical save remains authoritative after a partial storage failure.
 try{const saved=JSON.parse(storage.getItem(HOME_PREFERENCES_KEY));if(saved?._base===preferenceBase)Object.assign(state.settings,preferences(saved))}catch{}
 return {
  state,canContinue:valid,loadStatus,get entered(){return entered},
  enter(){if(entered)return false;entered=true;return true},
  advance(current,dt){if(entered)step(current,dt)},
  save(current){
   // A failed read does not prove no save exists. Never overwrite it with a
   // fresh fallback, even if storage later becomes writable in this visit.
   if(!entered||loadStatus==='unavailable')return false;
   try{storage.setItem(SAVE_KEY,JSON.stringify(current));return true}catch{return false}
  },
  savePreferences(settings){try{storage.setItem(HOME_PREFERENCES_KEY,JSON.stringify({...preferences(settings),_base:preferenceBase}));return true}catch{return false}},
 };
}
