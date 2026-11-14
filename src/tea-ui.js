import {teaStatus} from './simulation.js';
import {TEA_TABLE} from './content.js';
import {teaPercent as percent} from './readouts.js';
import {translate} from './i18n.js';
import {setText,setAttribute} from './dom-sync.js';
import {captureCanvas,claimCanvas,releasePointer,surfaceBlocked} from './canvas-aria.js';
import {bindTeaInput} from './tea-input-bindings.js';
import {createTeaGesture,createTeaKeyboard} from './tea-input.js';
import {teaView,mountTeaSurface,paintTeaView} from './tea-view.js';
export {teaView};

const TEA_SHORTCUTS='ArrowLeft ArrowRight Space E Enter Escape';
const TEA_READOUTS=['tea-work-instructions','tea-work-status','tea-cup-readout'];
function markTeaSurface(root,tea,inputMode,holding){
 setAttribute(root,'data-phase',tea.phase);setAttribute(root,'data-mode',tea.mode);
 setAttribute(root,'data-input',inputMode);setAttribute(root,'data-ready',String(tea.ready));
 root.classList.toggle('tea-holding',holding);
}
// Input still advances every frame. Rebuild number formatting and visible
// text only when something a player can read has actually changed.
const teaViewKey=(s,tea,inputMode,feedback)=>JSON.stringify([s.settings.locale,tea.phase,tea.mode,inputMode,
 tea.aimedCup,tea.ready,tea.cups.map(c=>[c.id,percent(c.fill),percent(c.target),c.ready,c.overfilled]),
 tea.result,tea.best,s.activities.mastery.tea,s.restoration,feedback]);
const teaAnnouncementKey=(s,tea,inputMode,feedback)=>JSON.stringify([s.settings.locale,tea.phase,inputMode,
 tea.aimedCup,tea.ready,tea.cups.map(c=>[Math.floor(c.fill*10),c.ready,c.overfilled]),feedback]);

// Tap-to-pour: the spout goes over the cup and tilts fully, and is lifted when the tea reaches the cup's line.
// The simulation still judges where the tea lands and whether the cup is ready.
// A list of cups is poured in turn; when the last is at its line and every cup is ready, the tea is served.
export function createTapPour(active,dispatch){
 let pouring=null,queue=[];
 function next(){const tea=active();pouring=null;
  while(queue.length){const id=queue.shift(),cup=tea?.cups.find(c=>c.id===id);
   if(!cup||tea.phase!=='pour'||cup.ready||cup.overfilled)continue;
   pouring={id,age:0};dispatch('tea-control',{aim:cup.x/TEA_TABLE.aimSpan,tilt:1,pressed:true});return true}
  return false}
 return {get cup(){return pouring?.id??null},
  start(ids){queue=[...(Array.isArray(ids)?ids:[ids])];return next()},
  stop(){pouring=null;queue=[]},
  // True when it lifted the pot this frame.
  tick(tea,dt){if(!pouring)return false;const cup=tea.cups.find(c=>c.id===pouring.id);
   pouring.age+=Number.isFinite(dt)?dt:0;
   if(tea.phase==='pour'&&cup&&cup.fill<cup.target-.012&&pouring.age<=6)return false;
   dispatch('tea-release');if(next())return true;
   if(tea.phase==='pour'&&active()?.ready)dispatch('tea-serve');return true}};
}
export function createTeaUI(host,canvas,getState,dispatch,{pick,aimAt}){
 const {root,parts}=mountTeaSurface(host);
 const gesture=createTeaGesture(),keyboard=createTeaKeyboard();
 let session=null,previousPhase=null,inputMode='pointer',feedback=null,feedbackAge=0,announcementAge=Infinity,
   announcementSignature='',viewSignature='',cachedView=null,lost=false,disposed=false;
 const original=captureCanvas(canvas);
 const t=key=>translate(getState().settings.locale,key),active=()=>teaStatus(getState());
 const blocked=()=>lost||surfaceBlocked(host,getState());
 const stop=e=>{e.preventDefault();e.stopImmediatePropagation()},releaseCapture=id=>releasePointer(canvas,id);
 function invoke(action,value){const result=dispatch(action,value);
 if(result?.ok===false&&result.reason)respond(result.reason);return result}
 const tapPour=createTapPour(active,dispatch),startPour=id=>tapPour.start(id);
 function cancel(){tapPour.stop();
  const id=gesture.pointerId,hadKeys=keyboard.active,tea=active();
  gesture.cancel();keyboard.cancel();root.classList.remove('tea-holding');releaseCapture(id);
  if(id!==null||hadKeys||tea?.pressed||tea?.tilt)dispatch('tea-release');
  if(blocked())root.hidden=true;
 }
 function respond(reason){feedback=reason;feedbackAge=0;announcementAge=Infinity;update(0)}
 function clearFeedback(){feedback=null;feedbackAge=0}
 function restoreCanvas(){original.restore(t('canvasLabel'))}
 function update(dt=0){
  if(disposed)return;
  let tea=active();const hasTea=Boolean(tea);
  if(host.dataset.teaActive!==String(hasTea))host.dataset.teaActive=String(hasTea);
  if(!hasTea){if(session){cancel();session=null;previousPhase=null;restoreCanvas();clearFeedback();
  parts.announcement.textContent=''}root.hidden=true;return}
  const nextSession=getState().activities.active,newSession=session!==nextSession;
  if(newSession){cancel();session=nextSession;previousPhase=null;clearFeedback();announcementSignature='';
  viewSignature='';announcementAge=Infinity}
  const unavailable=blocked();root.hidden=unavailable;
  if(unavailable){cancel();return}
  if(newSession)canvas.focus({preventScroll:true});
  if(previousPhase!==tea.phase){cancel();previousPhase=tea.phase}
  if(keyboard.active&&gesture.pointerId===null&&tea.phase==='pour'&&
    dt>0){invoke('tea-control',keyboard.controls(dt,tea.aim));tea=active()}
  if(!tea)return;
  if(tapPour.tick(tea,dt)){tea=active();if(!tea)return}
  const seconds=Number.isFinite(dt)?Math.max(0,Math.min(dt,.25)):0;feedbackAge+=seconds;announcementAge+=seconds;
  if(feedbackAge>4)clearFeedback();
  const s=getState();
  markTeaSurface(root,tea,inputMode,gesture.target==='pot'&&tea.phase==='pour');
  claimCanvas(canvas,{label:t('teaCanvasLabel'),shortcuts:TEA_SHORTCUTS,
   describedBy:[original.description,...TEA_READOUTS]});
  const nextView=teaViewKey(s,tea,inputMode,feedback);
  if(nextView!==viewSignature){cachedView=teaView(s,tea,{inputMode,reason:feedback});viewSignature=nextView;
   paintTeaView(parts,cachedView,t)}
  const view=cachedView,signature=teaAnnouncementKey(s,tea,inputMode,feedback);
  if(signature!==announcementSignature&&announcementAge>=1.25){
   setText(parts.announcement,(newSession?view.instructions+' ':'')+view.status+(tea.ready?' '+view.instructions:''));
   announcementSignature=signature;announcementAge=0;
  }
 }
 const unbindInput=bindTeaInput({root,active,blocked,stop,releaseCapture,invoke,cancel,
   respond,clearFeedback,update,gesture,keyboard,canvas,dispatch,startPour,
   pick,aimAt,setInputMode:mode=>{inputMode=mode},setLost:()=>{lost=true},parts});
 update(0);
 return {update,cancel,respond,dispose(){if(disposed)return;cancel();disposed=true;unbindInput();
 host.dataset.teaActive='false';restoreCanvas();root.remove()}};
}
