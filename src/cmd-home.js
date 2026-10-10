// Commands: Home screen and entering play, sound and settings.
import * as sim from './simulation.js';
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
// The intro owns the camera and the screen: the HUD is inert and direct camera input is off until it ends.
// A renderer that cannot play it ends the intro at once, through the same 'intro-done' landing.
function startIntro(app){
 if(!app.world||app.fatal||!app.intro||app.intro.active)return false;
 app.host.inert=true;app.world.setEnabled(false);return app.intro.start();
}
// Play begins inside the intro's last motion: the camera is already gliding into the kitchen on the play spring,
// so asking for the kitchen keeps that glide. A skip starts the glide from the live pose and velocity; a grab
// leaves the camera in the player's hands where they caught it.
function finishIntro(app,{skipped=false,grab=false,seconds=0,still=false}={}){
 app.host.inert=false;app.world?.setEnabled(!app.panelOpen&&!app.manualPause&&!app.carrying&&!app.fatal);
 if(grab){app.host.dataset.focusRoom='';app.host.dataset.focusDoll='';app.roomViews?.update()}
 else{if(skipped)app.world?.introSkip(seconds,still);app.dispatch('focus-room','kitchen')}
 app.last=performance.now();if(!grab)app.canvas.focus({preventScroll:true});
}
function enterPlay(app){
 if(app.fatal||!app.world)return;
 if(!app.session.enter()){if(!app.session.entered&&
   app.session.entryIssue)app.homeUI.requireReload(app.session.entryIssue==='changed'?
     'homeEntryChanged':'homeEntryUnreadable');return}
 showPlayShell(app);
 app.last=performance.now();app.lastSave=app.last;app.canvas.focus({preventScroll:true});
 // First launch only: claiming the intro is saved with the entry write below, so a reload never replays it.
 if(!(sim.claimIntro(app.state)&&startIntro(app))&&!app.session.canContinue)app.dispatch('focus-room','kitchen');
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
'intro-done':(app,value)=>finishIntro(app,value),
// Settings: Watch intro. Rituals keep their scene; anything held or being placed is put down first.
'watch-intro':app=>{if(app.intro?.active||app.physicalActivity())return;app.ui.close();
  if(app.ui.placement){app.ui.clearPlacement();app.world?.setPlacement(null)}
  app.storyUI?.clear();app.world?.clearObjectSelection();
  // This tap is the gesture that may unlock sound, so the score can play when sound is on.
  if(!app.state.settings.muted&&!app.audio.enabled)void app.audio.enable();startIntro(app);return;},
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
