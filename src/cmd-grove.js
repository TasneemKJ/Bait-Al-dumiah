// Commands: Today's errands, the lantern and the other reference-game systems.
import * as sim from './simulation.js';

export const groveCommands={
'collect-errand':(app,value)=>{
   const result=sim.collectErrand(app.state,value);
   if(result.ok){app.say(app.ui.t('errandCollectedNote'));app.audio.effect('place');app.save();app.ui.tick()}
   else app.say(app.ui.t(result.reason));
  },
'tend-lantern':app=>{
   const result=sim.tendLantern(app.state);
   if(result.ok){app.say(app.ui.t('lanternTended'));app.audio.effect('secret');app.save();app.ui.tick()}
   else app.say(app.ui.t(result.reason));
  },
};
