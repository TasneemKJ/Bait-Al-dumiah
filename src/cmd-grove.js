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
'cook':(app,value)=>{
   const result=sim.cook(app.state,value);if(!result.ok){app.say(app.ui.t(result.reason));return}
   app.ui.close();app.say(app.ui.t('dishServed').replace('{dish}',app.ui.t('dish-'+result.dish)));
   for(const r of result.reactions)if(r.taste==='love')app.say(app.ui.t('dishLoved').replace('{name}',app.ui.t(r.id))
     .replace('{dish}',app.ui.t('dish-'+result.dish)));
   app.audio.effect('care:tea');app.save();app.ui.tick();
  },
'tend-lantern':app=>{
   const result=sim.tendLantern(app.state);
   // The sheet folds away so the player sees the flame take the embers.
   if(result.ok){app.ui.close();app.world?.flareLantern();app.say(app.ui.t('lanternTended'));
   app.audio.effect('lantern');app.save();app.ui.tick()}
   else app.say(app.ui.t(result.reason));
  },
};
