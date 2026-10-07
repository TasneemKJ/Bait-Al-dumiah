import {chimeStatus} from './simulation.js';
import {translate,number} from './i18n.js';
import {createChimeGesture} from './chime-input.js';
import {bindChimeInput} from './chime-input-bindings.js';
import {mountChimeSurface,renderChimeStrip,pointOnCanvas} from './chime-view.js';
const stop=e=>{e.preventDefault();e.stopImmediatePropagation()};
const text=(el,value)=>{if(el.textContent!==value)el.textContent=value};

// The only visible button is Exit. All notes and replay live in the 3D room.
export function createChimeUI(host,canvas,getState,dispatch,{pick,pullSpan}){
 const {root,parts}=mountChimeSurface(host);
 const original=Object.fromEntries(['role','aria-label','aria-describedby','aria-keyshortcuts'].map(k=>[k,canvas.getAttribute(k)]));
 const gesture=createChimeGesture(),mode={keyboard:false,selection:0,input:'pointer'};let session=null,signature='',disposed=false,lost=false;
 const state=()=>getState(),active=()=>chimeStatus(state()),t=k=>translate(state().settings.locale,k),n=v=>number(state().settings.locale,v);
 const blocked=()=>state().paused||document.hidden||lost||Boolean(host.querySelector('dialog[open],.error-screen'));
 const inside=e=>pointOnCanvas(canvas,e);
 const releaseCapture=id=>{if(id!==null){try{if(canvas.hasPointerCapture(id))canvas.releasePointerCapture(id)}catch{}}};
 function cancel(){
  const id=gesture.pointerId;gesture.cancel();mode.keyboard=false;releaseCapture(id);
  if(active()?.held!==null&&active())dispatch('chime-cancel');
  canvas.style.cursor='default';
 }
 function restoreCanvas(){for(const [key,
   value] of Object.entries(original)){if(value===null)canvas.removeAttribute(key);
 else canvas.setAttribute(key,key==='aria-label'?t('canvasLabel'):value)}}
 function update(dt=0){
  if(disposed)return;if(!root.isConnected)host.append(root);
  let a=active();host.dataset.chimeActive=String(Boolean(a));
  if(!a){if(session){cancel();restoreCanvas();session=null;signature=''}root.hidden=true;return}
  if(session!==state().activities.active){cancel();session=state().activities.active;mode.selection=0;signature='';a=active()}
  root.hidden=blocked();if(root.hidden){cancel();return}
  if(mode.keyboard&&a.phase==='echo'&&a.held!==null){dispatch('chime-pull',Math.min(1,a.pull+Math.max(0,
    Math.min(.1,Number.isFinite(dt)?dt:0))*1.4));a=active()}
  root.dataset.phase=a.phase;root.dataset.input=mode.input;
  canvas.setAttribute('role','application');canvas.setAttribute('aria-label',t('chimeCanvas'));
  canvas.setAttribute('aria-keyshortcuts','ArrowLeft ArrowRight Space R Escape');
  canvas.setAttribute('aria-describedby','chime-instructions chime-status chime-readout chime-demonstration');
  const {status,full,selected}=renderChimeStrip(parts,a,{t,n,input:mode.input,selection:mode.selection});
  const next=JSON.stringify([state().settings.locale,a.phase,a.cursor,a.mistakes,a.round,mode.input,mode.selection]);
  if(next!==signature){text(parts.announcement,status+' '+full+(mode.input==='keyboard'?' '+selected:''));signature=next}
 }
 const unbind=bindChimeInput({canvas,gesture,mode,parts,active,blocked,stop,inside,pick,pullSpan,
   dispatch,cancel,update,releaseCapture,setLost:()=>{lost=true}});
 update(0);
 return {update,cancel,dispose(){if(disposed)return;cancel();disposed=true; unbind();restoreCanvas();host.dataset.chimeActive='false';root.remove()}};
}
