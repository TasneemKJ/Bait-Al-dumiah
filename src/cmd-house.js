// Commands: Residents, rewards, the door, placement and the day/night light.
import * as sim from './simulation.js';
import {appStore} from './app-store.js';
import {fifthRoomOpen,fifthRoomLocked} from './access.js';

// The door and its gifts need The Fifth Room in the app (asked now, never saved); the card says what it opens.
function doorClosedHere(app){
 if(fifthRoomOpen(app.state,appStore.access()))return false;
 app.say(app.ui.t('doorLocked'));app.ui.open('store');return true;
}

// After the sixth whisper, in the app, the closed door is offered once (never again; closing returns home).
function offerFifthRoom(app){
 const s=app.state;if(!appStore.inApp||s.hints.fifthOffer||!fifthRoomLocked(s,appStore.access())||
  s.journal.length<sim.SECRET_COUNT)return false;
 s.hints.fifthOffer=true;app.save();if(app.openStore)app.openStore();else app.ui.open('store');
 return true;
}
export const houseCommands={
'select':(app,value,origin)=>{return;},
'care':(app,value,origin)=>{
   const result=sim.care(app.state,value.id,value.action);
   if(result.ok){app.ui.close();
   for(const mate of result.company??[])app.world?.greet?.(mate);
   app.say(app.ui.t(value.action+'Success')+(result.reward?
     ` +${app.ui.n(result.reward)} ${app.ui.t('reward')}`:''));app.audio.effect('care:'+value.action);
   app.save();app.ui.tick()}else app.say(app.ui.t(result.reason));return;
  },
'objective':(app,value,origin)=>{
   const next=app.ui.objective();
   // Land on the section the suggestion is about, not the top of a long sheet.
   if(next.action==='panel'){app.ui.open(next.value);
   if(next.focus)app.host.querySelector('#sheet '+next.focus)?.scrollIntoView({
     block:'center'})}else app.dispatch(next.action,next.value);return;
  },
'claim':(app,value,origin)=>{
   const result=sim.claim(app.state,value);
   if(result.ok){app.say(app.ui.t('milestoneCollected')+` +${app.ui.n(result.reward)} ${app.ui.t('buttons')}`);
   app.audio.effect('place');app.save();app.ui.tick()}else app.say(app.ui.t(result.reason));return;
  },
'mend-door':(app,value,origin)=>{
   if(doorClosedHere(app))return;
   const result=sim.mendDoor(app.state,{free:appStore.access().bought===true});
   if(result.ok){app.say(app.ui.t(result.opened?'doorOpenedNote':'doorStepDone'));app.audio.effect('secret');app.save();
   app.ui.tick()}else app.say(result.needs?app.ui.t('needs_'+result.needs):app.ui.t(result.reason));return;
  },
'gift':(app,value,origin)=>{
   if(doorClosedHere(app))return;
   const result=sim.leaveGift(app.state);
   if(result.ok){app.say(`${app.ui.t('giftReceived')} ${app.ui.t('gift-'+result.gift+'Title')}`);
   app.audio.effect('secret');
   app.save();app.ui.tick();if(!app.ui.panel)app.ui.open('journal')}else app.say(app.ui.t(result.reason));return;
  },
'collect-basket':(app,value,origin)=>{
   const result=sim.collectBasket(app.state);
   if(result.ok){app.say(app.ui.t('basketCollected')+` +${app.ui.n(result.reward)}`);
   app.audio.effect('place');app.save();app.ui.tick()}else app.say(app.ui.t(result.reason));return;
  },
'placement':(app,value,origin)=>{app.world?.setPlacement(value);return;},
'placement-preview':(app,value,origin)=>{app.world?.setPreview(value);return;},
'placement-cancel':(app,value,origin)=>{app.world?.setPlacement(null);return;},
'place':(app,value,origin)=>{
   const result=sim.place(app.state,value.item,value.room,value.slot);
   if(app.notify(result,'placed')){app.ui.clearPlacement();app.world?.setPlacement(null);app.audio.effect('place');
   app.dispatch('focus-room',value.room);
   for(const id of result.loved)app.say(app.ui.t(id)+' · '+app.ui.t('lovedPlaced'));
   if(result.wish)app.say(app.ui.t(result.wish)+' · '+app.ui.t('keepsakeWishGranted'))}return;
  },
'remove':(app,value,origin)=>{app.notify(sim.remove(app.state,value),'packed');return;},
'move':(app,value,origin)=>{const result=sim.moveDoll(app.state,value.id,value.room);
if(app.notify(result,result.favorite?'favoriteMoved':'placed'))app.ui.close();return},
'light':(app,value,origin)=>{
   if(app.ui.panel)app.ui.close();sim.changeLight(app.state);app.save();app.refreshUI();
   if(sim.isNight(app.state))app.say(app.ui.t('nightHint'));return;
  },
'search':(app,value)=>{app.mischief?.search(value);return;},
'hold-key':app=>{app.keyHeld=!app.keyHeld;app.world?.holdKey?.(app.keyHeld);app.audio.effect('care');return;},
'move-key':(app,room)=>{const r=sim.moveKey(app.state,room);if(!r.ok)return;
   app.keyHeld=false;app.world?.holdKey?.(false);
   if(r.from!==room)app.audio.effect('care');app.save();return;},
'turn-key':(app,value)=>{const r=sim.turnKey(app.state,value?.doll,value?.turns);
   if(!r.ok){if(r.reason==='keyElsewhere')app.say(app.ui.t('musicKeyElsewhere'));return}if(r.already)return;
   const now=performance.now();
   if(r.wound){app.audio.effect('musicbox');app.say(app.ui.t('musicWound-'+r.doll));app.save()}
   else if(!(now-(app.windSoundAt??-1e9)<350)){app.windSoundAt=now;app.audio.effect('mobile')}return;},
// The porter's bell: leave a finished ritual or a sheet, turn to the room that called, and its doll looks up.
'answer-bell':(app,call)=>{if(!call?.room)return;if(app.physicalActivity())app.leaveWork();
   if(app.ui.panel)app.ui.close();
   app.dispatch('focus-room',call.room);if(call.doll)app.world?.greet?.(call.doll);return;},
'greet-doll':(app,value)=>{app.world?.greet?.(value);app.audio.effect('mobile');
   app.ui.setSelected?.(value);return;},
'discover':(app,value,origin)=>{
   const result=sim.discover(app.state);if(result.ok){app.save();app.audio.effect('secret');
   if(!offerFifthRoom(app))app.ui.open('journal');
   const {t,n}=app.ui;app.say(`${t('newSecret')} · ${n(app.state.journal.length)}/${n(sim.SECRET_COUNT)}`)}
   else app.say(app.ui.t(result.reason)+(result.needed?
     ` ${app.ui.t('shyNeed')} ${app.ui.n(result.needed)}%`:''));return;
  },
};
