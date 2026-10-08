// Commands: Home screen and entering play, sound and settings.
import {DOLLS} from './content.js';
import {returnGreeting,waveSchedule,waveRoom} from './return-greeting.js';

// Leaving Home: show the play shell, start sound and greet a returning player.
function showPlayShell(app){
 app.homeUI.hide();document.querySelector('#app').dataset.screen='play';app.host.hidden=false;app.host.inert=false;
 app.canvas.inert=false;app.canvas.removeAttribute('aria-hidden');app.canvas.setAttribute('tabindex','0');
 app.syncPause();app.world.syncViewport();app.world.setEnabled(!app.state.paused);
 app.refreshUI();app.playfieldLayout.measure();
}
function greetReturningPlayer(app){
 const greeting=returnGreeting(app.state);if(!greeting)return;
 app.say(app.ui.t(greeting.key).replace('{count}',app.ui.n(greeting.count)));
 if(!app.state.settings.reducedMotion)app.world?.welcomeBack(waveSchedule(DOLLS.length,app.state.elapsed));
 welcomeGlance(app);
}
function enterPlay(app){
 if(app.fatal||!app.world)return;
 if(!app.session.enter()){if(!app.session.entered&&
   app.session.entryIssue)app.homeUI.requireReload(app.session.entryIssue==='changed'?
     'homeEntryChanged':'homeEntryUnreadable');return}
 showPlayShell(app);
 if(!app.session.canContinue)app.dispatch('focus-room','kitchen');
 app.last=performance.now();app.lastSave=app.last;app.canvas.focus({preventScroll:true});
 let entrySaved=false;
 if(!app.state.settings.muted&&!app.audio.enabled)void app.audio.enable().then(ok=>{if(!ok)app.ui.toast((entrySaved?
   '':app.ui.t('savingFailed')+' ')+app.ui.t('audioUnavailable'));app.audio.setPaused(app.state.paused)});
 entrySaved=app.save();
 if(entrySaved){if(app.session.recovered)app.say(app.ui.t('saveRecovered'));else greetReturningPlayer(app)}
}
function welcomeGlance(app){
 if(app.state.settings.reducedMotion)return;const room=waveRoom(app.state);if(!room)return;
 const listeners=new AbortController();let glanceTimer,returnTimer;
 const cancel=()=>{clearTimeout(glanceTimer);clearTimeout(returnTimer);listeners.abort()};
 for(const target of [app.canvas,app.host])for(const type of ['pointerdown','keydown','wheel','click'])
  target.addEventListener(type,cancel,{capture:true,signal:listeners.signal});
 glanceTimer=setTimeout(()=>{
  if(app.ui.panel||app.state.paused||app.state.settings.reducedMotion){cancel();return}
  app.dispatch('focus-room',room);
  returnTimer=setTimeout(()=>{if(app.host.dataset.focusRoom===room&&!app.ui.panel&&!app.state.paused)
   app.dispatch('camera');cancel()},2600);
 },700);
}
export const homeCommands={
'home-play':app=>enterPlay(app),
'home-reload':(app,value,origin)=>{if(!app.session.entered&&app.session.entryIssue)location.reload();return;},
'home-language':(app,value,origin)=>{if(!app.session.entered&&['en',
  'ar'].includes(value)){app.state.settings.locale=value;app.refreshUI();app.saveSettings()}return;},
'home-sound':async (app,value,origin)=>{if(!app.session.entered)await app.dispatch('sound');return;},
'sound':async (app,value,origin)=>{
   let unavailable=false;if(app.state.settings.muted){if(await app.audio.enable()){app.state.settings.muted=false;
   app.audio.setPaused(app.state.paused)}else unavailable=true}else{
     app.state.settings.muted=true;app.audio.mute()}app.refreshUI();app.saveSettings();
   if(unavailable){if(app.session.entered)app.ui.toast(app.ui.t('audioUnavailable'));
   else app.homeUI?.notify(app.ui.t('audioUnavailable'))}return;
  },
'setting':(app,value,origin)=>{
   if(value.key==='locale'&&['en','ar'].includes(value.value))app.state.settings.locale=value.value;
   if(value.key==='quality'&&['auto','low','high'].includes(value.value))app.state.settings.quality=value.value;
   if(value.key==='motion')app.state.settings.reducedMotion=Boolean(value.value);
   if(value.key==='largeText')app.state.settings.largeText=Boolean(value.value);
   app.refreshUI();app.saveSettings();return;
  },
};
