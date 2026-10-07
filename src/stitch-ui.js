import {stitchStatus,stitchSectionProgress} from './simulation.js';
import {stitchCoordinate as coordinate} from './readouts.js';
import {translate} from './i18n.js';
import {setText,setAttribute} from './dom-sync.js';
import {captureCanvas,claimCanvas,releasePointer,surfaceBlocked} from './canvas-aria.js';
import {bindStitchInput} from './stitch-input-bindings.js';
import {createStitchGesture,createStitchKeyboard} from './stitch-input.js';
import {stitchView,mountStitchSurface,paintStitchView,point} from './stitch-view.js';
export {stitchView};

const STITCH_SHORTCUTS='ArrowLeft ArrowRight ArrowUp ArrowDown Space U Enter Escape';
const STITCH_READOUTS=['stitch-work-instructions','stitch-work-status','stitch-needle-readout'];
function markStitchSurface(root,stitch,inputMode,holding){
 setAttribute(root,'data-phase',stitch.phase);setAttribute(root,'data-mode',stitch.mode);
 setAttribute(root,'data-input',inputMode);
 setAttribute(root,'data-ready',String(stitch.ready));setAttribute(root,'data-loose',String(stitch.loose));
 root.classList.toggle('stitch-holding',holding);
}
const stitchViewKey=(s,stitch,inputMode,feedback)=>JSON.stringify([s.settings.locale,stitch.phase,stitch.mode,
 inputMode,stitch.section,stitch.completedSections,stitchSectionProgress(stitch).percent,stitch.loose,stitch.ready,
 [coordinate(stitch.needle.x),coordinate(stitch.needle.y)],stitch.nextGuidePoint,stitch.result,stitch.best,
 s.activities.mastery.stitch,s.restoration,feedback]);
// Needle samples and accepted percentages are intentionally absent here.
// Readers hear meaningful transitions, not a stream of coordinates.
const stitchAnnouncementKey=(s,stitch,inputMode,feedback)=>JSON.stringify([s.settings.locale,stitch.phase,
 stitch.mode,inputMode,stitch.section,stitch.loose,stitch.ready,feedback]);
// The needle is still travelling to a guide point the player released.
const pursuing=stitch=>Boolean(stitch&&point(stitch.target)&&point(stitch.needle)&&
 (stitch.target.x!==stitch.needle.x||stitch.target.y!==stitch.needle.y));

export function createStitchUI(host,canvas,getState,dispatch,{pick,pointAt}){
 const {root,parts}=mountStitchSurface(host);
 const gesture=createStitchGesture(),keyboard=createStitchKeyboard();
 let session=null,previousPhase=null,inputMode='pointer',feedback=null,feedbackAge=0,
   announcementSignature='',viewSignature='',cachedView=null,lost=false,disposed=false;
 const original=captureCanvas(canvas);
 const t=key=>translate(getState().settings.locale,key),active=()=>stitchStatus(getState());
 const blocked=()=>lost||surfaceBlocked(host,getState());
 const stop=e=>{e.preventDefault();e.stopImmediatePropagation()},releaseCapture=id=>releasePointer(canvas,id);
 const finiteEvent=e=>Number.isFinite(e.clientX)&&Number.isFinite(e.clientY);
 const hit=e=>finiteEvent(e)?pick(e.clientX,e.clientY):null;
 const project=e=>finiteEvent(e)?pointAt(e.clientX,e.clientY):null;
 function invoke(action,value){const result=dispatch(action,value);
 if(result?.ok===false&&result.reason)respond(result.reason);return result}
 function cancel(){
  const id=gesture.pointerId,hadKeys=keyboard.active,stitch=active();
  gesture.cancel();keyboard.cancel();root.classList.remove('stitch-holding');releaseCapture(id);
  if(id!==null||hadKeys||stitch?.pressed||stitch?.capture||pursuing(stitch))dispatch('stitch-release');
  canvas.style.cursor='default';if(blocked())root.hidden=true;
 }
 function respond(reason){feedback=reason;feedbackAge=0;update(0)}
 function clearFeedback(){feedback=null;feedbackAge=0}
 function restoreCanvas(){original.restore(t('canvasLabel'))}
 function update(dt=0){
  if(disposed)return;
  let stitch=active();const hasStitch=Boolean(stitch);
  if(host.dataset.stitchActive!==String(hasStitch))host.dataset.stitchActive=String(hasStitch);
  if(!hasStitch){if(session){cancel();session=null;previousPhase=null;restoreCanvas();clearFeedback();
  parts.announcement.textContent=''}root.hidden=true;return}
  const nextSession=getState().activities.active,newSession=session!==nextSession;
  if(newSession){cancel();session=nextSession;previousPhase=null;clearFeedback();
  announcementSignature='';viewSignature=''}
  const unavailable=blocked();root.hidden=unavailable;if(unavailable){cancel();return}
  if(newSession)canvas.focus({preventScroll:true});
  if(previousPhase!==stitch.phase){cancel();clearFeedback();previousPhase=stitch.phase;stitch=active()}
  if(keyboard.active&&gesture.pointerId===null&&stitch.phase==='sew'&&dt>0){invoke('stitch-control',
    keyboard.controls(dt,stitch.target));stitch=active()}
  if(!stitch)return;
  const seconds=Number.isFinite(dt)?Math.max(0,Math.min(dt,.25)):0;feedbackAge+=seconds;
  if(feedbackAge>4)clearFeedback();
  const s=getState();
  markStitchSurface(root,stitch,inputMode,gesture.target==='needle'&&stitch.phase==='sew');
  claimCanvas(canvas,{label:t('stitchCanvasLabel'),shortcuts:STITCH_SHORTCUTS,
   describedBy:[original.description,...STITCH_READOUTS]});
  const nextView=stitchViewKey(s,stitch,inputMode,feedback);
  if(nextView!==viewSignature){cachedView=stitchView(s,stitch,{inputMode,reason:feedback});
   viewSignature=nextView;paintStitchView(parts,cachedView,t)}
  const signature=stitchAnnouncementKey(s,stitch,inputMode,feedback);
  if(signature!==announcementSignature){
   setText(parts.announcement,cachedView.status+' '+cachedView.instructions);announcementSignature=signature;
  }
 }
 const unbindInput=bindStitchInput({root,active,blocked,stop,hit,project,releaseCapture,
   invoke,cancel,clearFeedback,update,gesture,keyboard,canvas,
   dispatch,setInputMode:mode=>{inputMode=mode},setLost:()=>{lost=true},parts});
 update(0);
 return {update,cancel,respond,dispose(){if(disposed)return;cancel();disposed=true;unbindInput();
 host.dataset.stitchActive='false';restoreCanvas();root.remove()}};
}
