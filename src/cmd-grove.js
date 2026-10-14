// Commands: Today's errands, the lantern and the other reference-game systems.
import * as sim from './simulation.js';

export const groveCommands={
'collect-errand':(app,value)=>{
   const result=sim.collectErrand(app.state,value);
   if(result.ok){app.say(app.ui.t('errandCollectedNote'));app.audio.effect('place');app.save();app.ui.tick()}
   else app.say(app.ui.t(result.reason));
  },
'hug':(app,value)=>{
   const result=sim.hug(app.state,value);
   if(result.ok){app.ui.close();app.say(app.ui.t('hugged').replace('{name}',app.ui.t(value)));
   app.audio.effect('hug');app.save();app.ui.tick()}else app.say(app.ui.t(result.reason));
  },
'tend-lantern':app=>{
   const result=sim.tendLantern(app.state);
   // The sheet folds away so the player sees the flame take the embers.
   if(result.ok){app.ui.close();app.world?.flareLantern();app.say(app.ui.t('lanternTended'));
   app.audio.effect('lantern');app.save();app.ui.tick()}
   else app.say(app.ui.t(result.reason));
  },
};
