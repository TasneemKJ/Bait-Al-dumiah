import {teaStatus} from './simulation.js';
import {translate} from './i18n.js';
import {icon} from './icons.js';
import {captureCanvas} from './canvas-aria.js';
import {bindTeaInput} from './tea-input-bindings.js';
import {createTeaGesture,createTeaKeyboard} from './tea-input.js';
import {teaView,mountTeaSurface,percent} from './tea-view.js';
export {teaView};

export function createTeaUI(host,canvas,getState,dispatch,{pick,aimAt}){
 const {root,parts}=mountTeaSurface(host);
 const gesture=createTeaGesture(),keyboard=createTeaKeyboard();
 let session=null,previousPhase=null,inputMode='pointer',feedback=null,feedbackAge=0,announcementAge=Infinity,
   announcementSignature='',viewSignature='',cachedView=null,lost=false,disposed=false;
 const original=captureCanvas(canvas),originalDescription=original.description;
 const t=key=>translate(getState().settings.locale,key);
 const active=()=>teaStatus(getState());
 const blocked=()=>getState().paused||document.hidden||lost||Boolean(host.querySelector('dialog[open],.error-screen'))||host.querySelector('.placement')?.hidden===false;
 const stop=e=>{e.preventDefault();e.stopImmediatePropagation()};
 const setText=(element,value)=>{if(element.textContent!==value)element.textContent=value};
 const setAttribute=(element,name,value)=>{if(element.getAttribute(name)!==value)element.setAttribute(name,value)};
 function releaseCapture(id){if(id!==null){try{if(canvas.hasPointerCapture(id))canvas.releasePointerCapture(id)}catch{}}}
 function invoke(action,value){const result=dispatch(action,value);if(result?.ok===false&&result.reason)respond(result.reason);return result}
 function cancel(){
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
  if(!hasTea){if(session){cancel();session=null;previousPhase=null;restoreCanvas();clearFeedback();parts.announcement.textContent=''}root.hidden=true;return}
  const nextSession=getState().activities.active,newSession=session!==nextSession;
  if(newSession){cancel();session=nextSession;clearFeedback();announcementSignature='';viewSignature='';announcementAge=Infinity}
  const unavailable=blocked();root.hidden=unavailable;
  if(unavailable){cancel();return}
  if(newSession)canvas.focus({preventScroll:true});
  if(previousPhase!==tea.phase){cancel();previousPhase=tea.phase}
  if(keyboard.active&&gesture.pointerId===null&&tea.phase==='pour'&&dt>0){invoke('tea-control',keyboard.controls(dt,tea.aim));tea=active()}
  if(!tea)return;
  const seconds=Number.isFinite(dt)?Math.max(0,Math.min(dt,.25)):0;feedbackAge+=seconds;announcementAge+=seconds;
  if(feedbackAge>4)clearFeedback();
  const s=getState();
  setAttribute(root,'data-phase',tea.phase);setAttribute(root,'data-mode',tea.mode);setAttribute(root,'data-input',inputMode);setAttribute(root,'data-ready',String(tea.ready));
  root.classList.toggle('tea-holding',gesture.target==='pot'&&tea.phase==='pour');
  setAttribute(canvas,'aria-label',t('teaCanvasLabel'));
  setAttribute(canvas,'role','application');
  setAttribute(canvas,'aria-keyshortcuts','ArrowLeft ArrowRight Space E Enter Escape');
  setAttribute(canvas,'aria-describedby',[originalDescription,'tea-work-instructions','tea-work-status','tea-cup-readout'].filter(Boolean).join(' '));
  // Input still advances every frame. Rebuild number formatting and visible
  // text only when something a player can read has actually changed.
  const nextView=JSON.stringify([s.settings.locale,tea.phase,tea.mode,inputMode,tea.aimedCup,tea.ready,tea.cups.map(c=>[c.id,percent(c.fill),
    percent(c.target),c.ready,c.overfilled]),tea.result,tea.best,s.activities.mastery.tea,s.restoration,feedback]);
  if(nextView!==viewSignature){
   const view=cachedView=teaView(s,tea,{inputMode,reason:feedback});viewSignature=nextView;
   setText(parts.title,view.title);setText(parts.progress,view.progress);parts.progress.hidden=!view.progress;
   setText(parts.full,view.instructions);setText(parts.short,view.shortInstructions);setText(parts.status,view.status);
   setText(parts.detail,view.detail);parts.detail.hidden=!view.detail;
   setAttribute(parts.strip,'aria-label',t('teaWorkRegion'));setText(parts.exit.querySelector('span'),t('teaWorkExit'));
   setAttribute(parts.cups,'aria-label',t('teaCupList'));setText(parts.cups,view.cups.join('. '));
  }
  const view=cachedView;
  const signature=JSON.stringify([s.settings.locale,tea.phase,inputMode,tea.aimedCup,tea.ready,tea.cups.map(c=>[Math.floor(c.fill*10),c.ready,c.overfilled]),feedback]);
  if(signature!==announcementSignature&&announcementAge>=1.25){
   setText(parts.announcement,(newSession?view.instructions+' ':'')+view.status+(tea.ready?' '+view.instructions:''));
   announcementSignature=signature;announcementAge=0;
  }
 }
 const unbindInput=bindTeaInput({root,active,blocked,stop,releaseCapture,invoke,cancel,respond,clearFeedback,update,gesture,keyboard,canvas,dispatch,
   pick,aimAt,setInputMode:mode=>{inputMode=mode},setLost:()=>{lost=true},parts});
 update(0);
 return {update,cancel,respond,dispose(){if(disposed)return;cancel();disposed=true;unbindInput();host.dataset.teaActive='false';restoreCanvas();root.remove()}};
}
