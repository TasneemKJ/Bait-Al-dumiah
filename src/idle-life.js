// The house breathes while the player only watches: after a quiet stretch one little heart goes to sit in
// another room for a while (drawn there; her room in the save is unchanged) and a curtain stirs. With the
// canary (asked of the App Store at that moment) it sings aloud, by day, what that heart can't say: the
// same lines every player reads beside each doll's memories in her sheet (src/panels-ui.js), so nothing is sold.
// Cosmetic only: no buttons, comfort, bond or save change. Held still under reduced motion.
import * as sim from './simulation.js';
import {DOLLS} from './content.js';
import {appStore} from './app-store.js';

export const IDLE=Object.freeze({after:25,stay:16,rest:40,lines:3});
// The room a heart drifts to: her favourite if she is elsewhere, else the liwan, else the kitchen.
export function visitRoom(s,id){
 const d=s.dolls.find(x=>x.id===id),fav=DOLLS.find(x=>x.id===id)?.favRoom;if(!d)return null;
 // A heart whose thing the midnight visitor took stays home, looking for it.
 if(sim.missing(s)?.doll===id)return null;
 return [fav,'parlor','kitchen'].find(r=>r&&r!==d.room)??null;
}
export function installIdleLife(app,store=appStore){
 // The quiet clock starts at the first watched moment, so a continued save never wakes on entry.
 let quietSince=null,visit=null,nextAt=0,turn=0;const sung={};
 const poke=()=>{quietSince=app.state.elapsed;if(visit)nextAt=app.state.elapsed+IDLE.rest};
 for(const target of [app.canvas,app.host])for(const type of ['pointerdown','keydown','wheel'])
  target?.addEventListener?.(type,poke,{capture:true,passive:true});
 const allowed=()=>{const s=app.state;return app.session?.entered&&!app.fatal&&!s.paused&&!app.ui?.panel&&
  !app.ui?.placement&&!app.physicalActivity?.()&&!app.intro?.active&&!app.filmActive&&!sim.gatherRoom(s)};
 const end=()=>{if(!visit)return;visit=null;app.world?.setVisit?.(null)};
 function sing(id){
  if(!store.canary()||sim.isNight(app.state))return;
  const n=sung[id]=((sung[id]??-1)+1)%IDLE.lines,t=app.ui.t;
  const [open,close]=app.state.settings.locale==='ar'?['«','»']:['“','”'];
  app.say(`${t('canaryFor-'+id)} ${open}${t(`canaryMemory-${id}-${n}`)}${close}`);
  if(app.audio?.canary?.())app.world?.canarySing?.(app.state.elapsed);
 }
 app.idle={poke,get visit(){return visit},tick(){
  const s=app.state;if(!allowed()){end();quietSince=null;return}quietSince??=s.elapsed;
  if(visit&&s.elapsed>=visit.until){end();nextAt=s.elapsed+IDLE.rest;return}
  if(visit||s.elapsed-quietSince<IDLE.after||s.elapsed<nextAt)return;
  const id=DOLLS[turn++%DOLLS.length].id,room=visitRoom(s,id);
  if(!s.settings.reducedMotion&&room){visit={id,room,until:s.elapsed+IDLE.stay};
   app.world?.setVisit?.({id,room});app.world?.stirCurtain?.(s.elapsed)}
  else nextAt=s.elapsed+IDLE.rest;
  sing(id);
 }};
}
