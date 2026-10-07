import {stitchStatus,stitchSectionProgress,stitchCoordinate as coordinate} from './simulation.js';
import {translate} from './i18n.js';
import {captureCanvas} from './canvas-aria.js';
import {bindStitchInput} from './stitch-input-bindings.js';
import {createStitchGesture,createStitchKeyboard} from './stitch-input.js';
import {stitchView,mountStitchSurface,point} from './stitch-view.js';
export {stitchView};

export function createStitchUI(host,canvas,getState,dispatch,{pick,pointAt}){
 const {root,parts}=mountStitchSurface(host);
 const gesture=createStitchGesture(),keyboard=createStitchKeyboard();
 let session=null,previousPhase=null,inputMode='pointer',feedback=null,feedbackAge=0,announcementSignature='',viewSignature='',cachedView=null,lost=false,disposed=false;
 const original=captureCanvas(canvas),originalDescription=original.description;
 const t=key=>translate(getState().settings.locale,key),active=()=>stitchStatus(getState());
 const blocked=()=>getState().paused||document.hidden||lost||Boolean(host.querySelector('dialog[open],.error-screen'))||host.querySelector('.placement')?.hidden===false;
 const stop=e=>{e.preventDefault();e.stopImmediatePropagation()};
 const setText=(element,value)=>{if(element.textContent!==value)element.textContent=value};
 const setAttribute=(element,name,value)=>{if(element.getAttribute(name)!==value)element.setAttribute(name,value)};
 const finiteEvent=e=>Number.isFinite(e.clientX)&&Number.isFinite(e.clientY);
 const hit=e=>finiteEvent(e)?pick(e.clientX,e.clientY):null;
 const project=e=>finiteEvent(e)?pointAt(e.clientX,e.clientY):null;
 function releaseCapture(id){if(id!==null){try{if(canvas.hasPointerCapture(id))canvas.releasePointerCapture(id)}catch{}}}
 function invoke(action,value){const result=dispatch(action,value);if(result?.ok===false&&result.reason)respond(result.reason);return result}
 function cancel(){
  const id=gesture.pointerId,hadKeys=keyboard.active,stitch=active();
  gesture.cancel();keyboard.cancel();root.classList.remove('stitch-holding');releaseCapture(id);
  const pursuing=stitch&&point(stitch.target)&&point(stitch.needle)&&(stitch.target.x!==stitch.needle.x||stitch.target.y!==stitch.needle.y);
  if(id!==null||hadKeys||stitch?.pressed||stitch?.capture||pursuing)dispatch('stitch-release');
  canvas.style.cursor='default';if(blocked())root.hidden=true;
 }
 function respond(reason){feedback=reason;feedbackAge=0;update(0)}
 function clearFeedback(){feedback=null;feedbackAge=0}
 function restoreCanvas(){original.restore(t('canvasLabel'))}
 function update(dt=0){
  if(disposed)return;
  let stitch=active();const hasStitch=Boolean(stitch);
  if(host.dataset.stitchActive!==String(hasStitch))host.dataset.stitchActive=String(hasStitch);
  if(!hasStitch){if(session){cancel();session=null;previousPhase=null;restoreCanvas();clearFeedback();parts.announcement.textContent=''}root.hidden=true;return}
  const nextSession=getState().activities.active,newSession=session!==nextSession;
  if(newSession){cancel();session=nextSession;previousPhase=null;clearFeedback();announcementSignature='';viewSignature=''}
  const unavailable=blocked();root.hidden=unavailable;if(unavailable){cancel();return}
  if(newSession)canvas.focus({preventScroll:true});
  if(previousPhase!==stitch.phase){cancel();clearFeedback();previousPhase=stitch.phase;stitch=active()}
  if(keyboard.active&&gesture.pointerId===null&&stitch.phase==='sew'&&dt>0){invoke('stitch-control',keyboard.controls(dt,stitch.target));stitch=active()}
  if(!stitch)return;
  const seconds=Number.isFinite(dt)?Math.max(0,Math.min(dt,.25)):0;feedbackAge+=seconds;
  if(feedbackAge>4)clearFeedback();
  const s=getState();
  setAttribute(root,'data-phase',stitch.phase);setAttribute(root,'data-mode',stitch.mode);setAttribute(root,'data-input',inputMode);
  setAttribute(root,'data-ready',String(stitch.ready));setAttribute(root,'data-loose',String(stitch.loose));
  root.classList.toggle('stitch-holding',gesture.target==='needle'&&stitch.phase==='sew');
  setAttribute(canvas,'aria-label',t('stitchCanvasLabel'));setAttribute(canvas,'role','application');
  setAttribute(canvas,'aria-keyshortcuts','ArrowLeft ArrowRight ArrowUp ArrowDown Space U Enter Escape');
  setAttribute(canvas,'aria-describedby',[originalDescription,'stitch-work-instructions','stitch-work-status','stitch-needle-readout'].filter(Boolean).join(' '));
  const progress=stitchSectionProgress(stitch).percent;
  const nextView=JSON.stringify([s.settings.locale,stitch.phase,stitch.mode,inputMode,stitch.section,stitch.completedSections,progress,stitch.loose,
    stitch.ready,[coordinate(stitch.needle.x),coordinate(stitch.needle.y)],stitch.nextGuidePoint,stitch.result,stitch.best,s.activities.mastery.stitch,s.restoration,feedback]);
  if(nextView!==viewSignature){
   const view=cachedView=stitchView(s,stitch,{inputMode,reason:feedback});viewSignature=nextView;
   setText(parts.title,view.title);setText(parts.progress,view.progress);parts.progress.hidden=!view.progress;
   setText(parts.full,view.instructions);setText(parts.short,view.shortInstructions);setText(parts.status,view.status);
   setText(parts.detail,view.detail);parts.detail.hidden=!view.detail;
   setAttribute(parts.strip,'aria-label',t('stitchWorkRegion'));setText(parts.exit.querySelector('span'),t('stitchWorkExit'));
   setAttribute(parts.readout,'aria-label',t('stitchNeedleReadout'));setText(parts.readout,view.readout);
  }
  // Needle samples and accepted percentages are intentionally absent here.
  // Readers hear meaningful transitions, not a stream of coordinates.
  const signature=JSON.stringify([s.settings.locale,stitch.phase,stitch.mode,inputMode,stitch.section,stitch.loose,stitch.ready,feedback]);
  if(signature!==announcementSignature){
   const view=cachedView;
   setText(parts.announcement,view.status+' '+view.instructions);
   announcementSignature=signature;
  }
 }
 const unbindInput=bindStitchInput({root,active,blocked,stop,hit,project,releaseCapture,invoke,cancel,clearFeedback,update,gesture,keyboard,canvas,
   dispatch,setInputMode:mode=>{inputMode=mode},setLost:()=>{lost=true},parts});
 update(0);
 return {update,cancel,respond,dispose(){if(disposed)return;cancel();disposed=true;unbindInput();host.dataset.stitchActive='false';restoreCanvas();root.remove()}};
}
