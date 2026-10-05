import {stitchStatus,restorationReady} from './simulation.js';
import {translate,number} from './i18n.js';
import {icon} from './icons.js';
import {createStitchGesture,createStitchKeyboard} from './stitch-input.js';

const fill=(text,values)=>text.replace(/\{(\w+)\}/g,(_,key)=>values[key]??'');
const coordinate=value=>Math.round(value*100);
const sectionLength=points=>points?.reduce((sum,p,i)=>i?sum+Math.hypot(p[0]-points[i-1][0],p[1]-points[i-1][1]):sum,0)??0;
const point=value=>Number.isFinite(value?.x)&&Number.isFinite(value?.y);

// This describes accepted work and actual needle/guide positions. The only
// changing announcements are section, repair and finish transitions.
export function stitchView(state,stitch,{inputMode='pointer',reason=null}={}){
 if(!stitch)return null;
 const locale=state.settings.locale,t=key=>translate(locale,key),n=value=>number(locale,value);
 const keyboard=inputMode==='keyboard',finished=stitch.phase==='finished',mend=stitch.mode==='mend';
 const total=stitch.sections.length,covered=stitch.completedSections>=total;
 const section=Math.min(total,stitch.section+1),length=sectionLength(stitch.sections[stitch.section]);
 const percent=covered?100:Math.round(Math.max(0,Math.min(1,length?stitch.distance/length:0))*100);
 const prefix=finished?(mend?'stitchMendFinished':'stitchFinished'):covered?'stitchReady':stitch.loose?'stitchRepair':'stitchPointer';
 const instructions=t(keyboard?(prefix==='stitchPointer'?'stitchKeyboardInstructions':prefix+'Keyboard'):prefix+'Instructions');
 const shortInstructions=keyboard&&prefix==='stitchPointer'?t('stitchKeyboardShort'):keyboard?instructions:t(prefix+'Short');
 let progress=fill(t('stitchProgress'),{done:n(stitch.completedSections),total:n(total)});
 let status=stitch.loose?t('stitchLoose'):covered?t('stitchReadyStatus'):fill(t('stitchSectionProgress'),{section:n(section),percent:n(percent)}),detail='';
 const position=(key,value)=>fill(t(key),{x:n(coordinate(value.x)),y:n(coordinate(value.y))});
 let readout=position('stitchNeedlePosition',stitch.needle);
 if(stitch.nextGuidePoint)readout+=' '+position('stitchGuidePosition',stitch.nextGuidePoint);
 readout+=' '+t('stitchAxisInstructions');
 if(finished){
  if(mend){progress='';status=t('story-mended-friend-1-done')}
  else{
   progress=fill(t('stitchScore'),{score:n(stitch.result?.score??0)});
   if(stitch.best!==null)progress+=' · '+fill(t('stitchBest'),{score:n(stitch.best)});
   status=stitch.result?.practice?t('practiceLabel'):t('activityReward')+' +'+n((stitch.result?.reward??0)+(stitch.result?.bonus??0))+' '+t('buttons');
   const next=restorationReady(state,'studio');
   detail=next.complete?t('stitchHomeRestored'):fill(t(next.ready?'stitchRestoreReady':'stitchRestoreGoal'),{earned:n(state.activities.mastery.stitch),needed:n(next.required),cost:n(next.cost)});
  }
 }
 if(reason)status=t(reason);
 return {title:t(mend?'stitchMendTitle':'activity-stitch'),instructions,shortInstructions,progress,status,detail,readout};
}

export function createStitchUI(host,canvas,getState,dispatch,{pick,pointAt}){
 const root=document.createElement('section');root.className='stitch-playfield';root.hidden=true;
 root.setAttribute('aria-labelledby','stitch-work-title');
 root.innerHTML='<header class="stitch-heading"><h2 id="stitch-work-title"></h2><p class="stitch-progress"></p></header>'+
  '<div class="stitch-work-strip" role="region"><div class="stitch-work-copy"><p id="stitch-work-instructions"><span class="stitch-cue-full"></span><span class="stitch-cue-short" aria-hidden="true"></span></p><p id="stitch-work-status"></p><p class="stitch-work-detail"></p></div><button type="button" class="stitch-exit" data-stitch-action="exit">'+icon('arrow')+'<span></span></button></div>'+
  '<p id="stitch-needle-readout" class="sr-only"></p><p id="stitch-work-announcement" class="sr-only" role="status" aria-live="polite" aria-atomic="true"></p>';
 // House controls rebuild for sound, pause and locale. Keep the work surface
 // beside #ui so those refreshes cannot detach its controls or pointer capture.
 const mount=host.parentElement??host;mount.append(root);
 const gesture=createStitchGesture(),keyboard=createStitchKeyboard();
 const parts={title:root.querySelector('#stitch-work-title'),progress:root.querySelector('.stitch-progress'),full:root.querySelector('.stitch-cue-full'),short:root.querySelector('.stitch-cue-short'),status:root.querySelector('#stitch-work-status'),detail:root.querySelector('.stitch-work-detail'),strip:root.querySelector('.stitch-work-strip'),exit:root.querySelector('[data-stitch-action="exit"]'),readout:root.querySelector('#stitch-needle-readout'),announcement:root.querySelector('#stitch-work-announcement')};
 let session=null,previousPhase=null,inputMode='pointer',feedback=null,feedbackAge=0,announcementSignature='',viewSignature='',cachedView=null,lost=false,disposed=false;
 const originalCursor=canvas.style.cursor,originalShortcuts=canvas.getAttribute('aria-keyshortcuts');
 const originalDescription=canvas.getAttribute('aria-describedby'),originalRole=canvas.getAttribute('role');
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
 function restoreCanvas(){
  canvas.style.cursor=originalCursor;canvas.setAttribute('aria-label',t('canvasLabel'));
  if(originalShortcuts===null)canvas.removeAttribute('aria-keyshortcuts');else canvas.setAttribute('aria-keyshortcuts',originalShortcuts);
  if(originalDescription===null)canvas.removeAttribute('aria-describedby');else canvas.setAttribute('aria-describedby',originalDescription);
  if(originalRole===null)canvas.removeAttribute('role');else canvas.setAttribute('role',originalRole);
 }
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
  setAttribute(root,'data-phase',stitch.phase);setAttribute(root,'data-mode',stitch.mode);setAttribute(root,'data-input',inputMode);setAttribute(root,'data-ready',String(stitch.ready));setAttribute(root,'data-loose',String(stitch.loose));
  root.classList.toggle('stitch-holding',gesture.target==='needle'&&stitch.phase==='sew');
  setAttribute(canvas,'aria-label',t('stitchCanvasLabel'));setAttribute(canvas,'role','application');
  setAttribute(canvas,'aria-keyshortcuts','ArrowLeft ArrowRight ArrowUp ArrowDown Space U Enter Escape');
  setAttribute(canvas,'aria-describedby',[originalDescription,'stitch-work-instructions','stitch-work-status','stitch-needle-readout'].filter(Boolean).join(' '));
  const currentLength=sectionLength(stitch.sections[stitch.section]),progress=currentLength?Math.round(stitch.distance/currentLength*100):100;
  const nextView=JSON.stringify([s.settings.locale,stitch.phase,stitch.mode,inputMode,stitch.section,stitch.completedSections,progress,stitch.loose,stitch.ready,[coordinate(stitch.needle.x),coordinate(stitch.needle.y)],stitch.nextGuidePoint,stitch.result,stitch.best,s.activities.mastery.stitch,s.restoration,feedback]);
  if(nextView!==viewSignature){
   const view=cachedView=stitchView(s,stitch,{inputMode,reason:feedback});viewSignature=nextView;
   setText(parts.title,view.title);setText(parts.progress,view.progress);parts.progress.hidden=!view.progress;
   setText(parts.full,view.instructions);setText(parts.short,view.shortInstructions);setText(parts.status,view.status);setText(parts.detail,view.detail);parts.detail.hidden=!view.detail;
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
 function pointerdown(e){
  const stitch=active();if(!stitch||blocked())return;stop(e);if(gesture.pointerId!==null)return;
  const target=hit(e),projected=project(e);
  if(!gesture.down(e,target,stitch,projected))return;
  keyboard.cancel();dispatch('stitch-release');
  inputMode='pointer';clearFeedback();canvas.focus({preventScroll:true});
  try{canvas.setPointerCapture(e.pointerId)}catch{cancel();return}
  if(target==='needle'&&stitch.phase==='sew')invoke('stitch-control',{x:stitch.needle.x,y:stitch.needle.y,pressed:true});
  update(0);
 }
 function pointermove(e){
  const stitch=active();if(!stitch)return;if(blocked()){cancel();return}stop(e);
  if(gesture.pointerId===null){const target=hit(e);canvas.style.cursor=target==='needle'?'grab':target?'pointer':'default';return}
  if(e.pointerId!==gesture.pointerId)return;
  if(e.pointerType==='mouse'&&e.buttons===0){cancel();return}
  const projected=project(e);
  if(gesture.target==='needle'&&gesture.phase==='sew'&&!point(projected)){cancel();return}
  const control=gesture.move(e,projected);if(control)invoke('stitch-control',control);
  canvas.style.cursor=gesture.target==='needle'?'grabbing':'default';
 }
 function pointerup(e){
  const stitch=active();if(!stitch)return;stop(e);if(e.pointerId!==gesture.pointerId)return;
  if(blocked()){cancel();return}
  const id=gesture.pointerId,result=gesture.up(e,hit(e));releaseCapture(id);root.classList.remove('stitch-holding');
  if(result?.type==='release'){invoke('stitch-release');canvas.style.cursor='grab';update(0);return}
  if(result?.type!=='tap')return;
  if(result.target==='needle'&&stitch.phase==='finished')invoke('stitch-replay');
  else if(result.target==='cloth')invoke(stitch.phase==='finished'?'stitch-exit':'stitch-finish');
  else if(result.target==='spool'&&stitch.phase==='sew')invoke('stitch-unpick');
  update(0);
 }
 function pointercancel(e){if(e.pointerId===gesture.pointerId)cancel()}
 function consumeClick(e){if(active()&&!blocked())stop(e)}
 function contextmenu(e){if(active()){stop(e);cancel()}}
 const unrelated=target=>Boolean(target?.closest?.('input,select,textarea,button,dialog,[contenteditable="true"],[contenteditable=""],[role="textbox"]'));
 function keydown(e){
  const stitch=active();if(!stitch||blocked()||e.defaultPrevented)return;
  if(unrelated(e.target)&&!(e.key==='Escape'&&root.contains(e.target)))return;
  if(gesture.pointerId!==null&&e.key!=='Escape'&&e.code!=='Escape'){
   if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space','KeyU','Enter'].includes(e.code)||['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' ','u','U','Enter'].includes(e.key))stop(e);
   return;
  }
  const owned=keyboard.active,command=keyboard.down(e);if(!command)return;stop(e);inputMode='keyboard';clearFeedback();
  if(command.action==='exit'){cancel();invoke('stitch-exit')}
  else if(command.action==='finish')invoke(stitch.phase==='finished'?'stitch-exit':'stitch-finish');
  else if(command.action==='unpick')invoke('stitch-unpick');
  else if(stitch.phase==='sew'){
   if(!owned)dispatch('stitch-release');
   const current=active();invoke('stitch-control',keyboard.controls(0,current.target));
  }else keyboard.cancel();
  update(0);
 }
 function keyup(e){
  if(!keyboard.up(e))return;stop(e);
  const stitch=active();
  if(stitch&&!blocked()&&stitch.phase==='sew'&&gesture.pointerId===null){
   // A key release stops any outstanding target or vertex pursuit. Explicit
   // remaining held controls may continue, starting from the actual needle.
   invoke('stitch-release');
   if(keyboard.active){const current=active();invoke('stitch-control',keyboard.controls(0,current.needle))}
   update(0);
  }else cancel();
 }
 function exit(){cancel();invoke('stitch-exit');update(0)}
 function visibility(){if(document.hidden)cancel()}
 function contextLost(){lost=true;cancel()}
 function focusout(){if(keyboard.active||gesture.pointerId!==null)cancel()}
 const bindings=[[canvas,'pointerdown',pointerdown,true],[canvas,'pointermove',pointermove,true],[canvas,'pointerup',pointerup,true],[canvas,'pointercancel',pointercancel,true],[canvas,'lostpointercapture',pointercancel,true],[canvas,'click',consumeClick,true],[canvas,'contextmenu',contextmenu,true],[canvas,'webglcontextlost',contextLost,false],[canvas,'focusout',focusout,false],[window,'keydown',keydown,true],[window,'keyup',keyup,true],[window,'blur',cancel,false],[window,'resize',cancel,false],[window,'orientationchange',cancel,false],[document,'visibilitychange',visibility,false],[parts.exit,'click',exit,false]];
 for(const [target,event,handler,capture] of bindings)target.addEventListener(event,handler,{capture});
 update(0);
 return {update,cancel,respond,dispose(){if(disposed)return;cancel();disposed=true;for(const [target,event,handler,capture] of bindings)target.removeEventListener(event,handler,{capture});host.dataset.stitchActive='false';restoreCanvas();root.remove()}};
}
