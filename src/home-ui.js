import {translate,number} from './i18n.js';
import {isNight} from './simulation.js';

// Home owns only entry and preferences. Gameplay HUD and commands stay separate.
export function createHomeUI(root,getState,dispatch,{canContinue=false,loadStatus='new'}={}){
 const doc=root.ownerDocument;
 const element=(tag,className)=>{const node=doc.createElement(tag);node.className=className;return node};
 const title=element('h1','home-title');title.id='home-title';
 // Both names, the current language's large, and one line of promise in the game's voice.
 const name=element('span','home-name'),altName=element('span','home-name-alt'),promise=element('span','home-promise');
 title.append(name,altName,promise);
 const actions=element('div','home-actions'),preferences=element('section','home-preferences');
 const heading=element('h2','home-preferences-title');heading.id='home-preferences-title';
 const notice=element('p','home-notice');notice.setAttribute('role','status');
 function button(action,fn){const node=element('button','home-'+action);node.type='button';
 node.setAttribute('data-home-action',action);node.addEventListener('click',fn);return node}
 const play=button('play',()=>dispatch(reloadRequired?'home-reload':'home-play')),
   options=button('preferences',()=>showPreferences(true));
 const sound=button('sound',()=>dispatch('home-sound'));
 const language=button('language',()=>dispatch('home-language',getState().settings.locale==='ar'?'en':'ar'));
 const back=button('back',()=>showPreferences(false));
 play.disabled=true;play.className+=' primary';
 actions.append(play,options);preferences.append(heading,sound,language,back);
 root.append(title,actions,preferences,notice);
 let preferencesOpen=false,reloadRequired=false,recoveryMessage='';
 function showPreferences(open){preferencesOpen=open;
 root.dataset.view=open?'preferences':'home';title.hidden=open;actions.hidden=open;
 preferences.hidden=!open;root.setAttribute('aria-labelledby',open?heading.id:title.id);
 if(open)sound.focus();else options.focus()}
 function refresh(){
  const locale=getState().settings.locale,t=key=>translate(locale,key);
  name.textContent=t('title');altName.textContent=translate(locale==='ar'?'en':'ar','title');
  altName.setAttribute('lang',locale==='ar'?'en':'ar');promise.textContent=homeLine(getState(),canContinue,t);
  promise.dataset.kind=canContinue?'day':'promise';
  heading.textContent=t('homePreferences');
  play.textContent=t(reloadRequired?'reload':canContinue?'homeContinue':'homePlay');
  options.textContent=t('homePreferences');
  sound.textContent=t(getState().settings.muted?'homeSoundOff':'homeSoundOn');
  sound.setAttribute('aria-pressed',!getState().settings.muted);
  language.textContent=locale==='ar'?'English':'العربية';language.setAttribute('lang',locale==='ar'?'en':'ar');
  language.setAttribute('dir',locale==='ar'?'ltr':'rtl');
  language.setAttribute('aria-label',t('language')+': '+language.textContent);back.textContent=t('homeBack');
  notice.textContent=(recoveryMessage?t(recoveryMessage):'')||(loadStatus==='unavailable'?
    t('homeReadFailed'):loadStatus==='invalid'?t('homeInvalidSave'):'');notice.hidden=!notice.textContent;
 }
 // The house is the invitation: a touch anywhere on Home but its buttons opens the door, as Play does.
 root.addEventListener('click',event=>{const target=event.target;
  if(preferencesOpen||play.disabled||target?.closest?.('button,a,input,select,label'))return;
  dispatch(reloadRequired?'home-reload':'home-play')});
 root.addEventListener('keydown',event=>{if(event.key==='Escape'&&
   preferencesOpen){event.preventDefault();showPreferences(false)}});
 root.dataset.view='home';preferences.hidden=true;root.setAttribute('aria-labelledby',title.id);refresh();
 return {get previewVisible(){return !preferencesOpen&&!root.hidden},refresh,
   requireReload(message){reloadRequired=true;recoveryMessage=message;
 play.setAttribute('data-home-action','reload');refresh();
 play.focus({preventScroll:true})},ready(){play.disabled=false},hide(){root.hidden=true;
 root.inert=true},notify(message){notice.textContent=message;notice.hidden=false}};
}
// A returning player's Home says where their own house stands (the HUD's own day and hour words); a new player
// reads the promise.
export function homeLine(state,canContinue,t){
 if(!canContinue)return t('homePromise');
 return t('day')+' '+number(state.settings.locale,state.day)+' · '+t(isNight(state)?'evening':'morning');
}
