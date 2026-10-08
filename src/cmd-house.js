// Commands: Residents, rewards, the door, placement and the day/night light.
import * as sim from './simulation.js';

export const houseCommands={
'select':(app,value,origin)=>{return;},
'care':(app,value,origin)=>{
   const result=sim.care(app.state,value.id,value.action);
   if(result.ok){app.ui.close();
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
   const result=sim.mendDoor(app.state);
   if(result.ok){app.say(app.ui.t(sim.doorOpen(app.state)?
     'doorOpenedNote':'doorStepDone'));app.audio.effect('secret');app.save();
   app.ui.tick()}else app.say(result.needs?app.ui.t('needs_'+result.needs):app.ui.t(result.reason));return;
  },
'gift':(app,value,origin)=>{
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
   for(const id of result.loved)app.say(app.ui.t(id)+' · '+app.ui.t('lovedPlaced'))}return;
  },
'remove':(app,value,origin)=>{app.notify(sim.remove(app.state,value),'packed');return;},
'move':(app,value,origin)=>{const result=sim.moveDoll(app.state,value.id,value.room);
if(app.notify(result,result.favorite?'favoriteMoved':'placed'))app.ui.close();return},
'light':(app,value,origin)=>{
   if(app.ui.panel)app.ui.close();sim.changeLight(app.state);app.save();app.refreshUI();
   if(sim.isNight(app.state))app.say(app.ui.t('nightHint'));return;
  },
'discover':(app,value,origin)=>{
   const result=sim.discover(app.state);if(result.ok){app.save();app.audio.effect('secret');app.ui.open('journal');
   app.say(app.ui.t('newSecret'))}else app.say(app.ui.t(result.reason)+(result.needed?
     ` ${app.ui.t('shyNeed')} ${app.ui.n(result.needed)}%`:''));return;
  },
};
