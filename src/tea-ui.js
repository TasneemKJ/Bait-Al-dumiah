import {teaStatus,restorationReady} from './simulation.js';
import {translate,number} from './i18n.js';
import {icon} from './icons.js';
import {createTeaGesture,createTeaKeyboard} from './tea-input.js';

const fill=(text,values)=>text.replace(/\{(\w+)\}/g,(_,key)=>values[key]??'');
const percent=value=>Math.round(Math.max(0,value)*100);

// A read-only description of the same visible cups. Percentages support a
// keyboard player; no answer, score or ready flag is submitted by this UI.
export function teaView(state,tea,{inputMode='pointer',reason=null}={}){
 if(!tea)return null;
 const locale=state.settings.locale,t=key=>translate(locale,key),n=value=>number(locale,value);
 const keyboard=inputMode==='keyboard',served=tea.phase==='served',guest=tea.mode==='guest';
 const cups=tea.cups.map(c=>fill(t('teaCupState'),{cup:n(c.id+1),fill:n(percent(c.fill)),target:n(percent(c.target))})+(c.overfilled?' · '+t('teaCupOverfilled'):c.ready?' · '+t('teaCupReady'):''));
 const aimed=tea.cups.findIndex(c=>c.id===tea.aimedCup),overfilled=tea.cups.some(c=>c.overfilled);
 const prefix=served?(guest?'teaGuestServed':'teaServed'):tea.ready?'teaReady':overfilled?'teaEmpty':'teaPointer';
 let instructions=t(keyboard?(prefix==='teaPointer'?'teaKeyboardInstructions':prefix+'Keyboard'):prefix+'Instructions');
 const shortInstructions=keyboard&&prefix==='teaPointer'?t('teaKeyboardShort'):keyboard?instructions:t(prefix+'Short');
 let progress=fill(t('teaProgress'),{ready:n(tea.cups.filter(c=>c.ready).length),total:n(tea.cups.length)});
 let status=aimed>=0?cups[aimed]:t('teaAimBetween'),detail='';
 if(served){
  if(guest){progress='';status=t('story-guest-tea-2-done')}
  else{
   progress=fill(t('teaScore'),{score:n(tea.result?.score??0)});
   if(tea.best!==null)progress+=' · '+fill(t('teaBest'),{score:n(tea.best)});
   status=tea.result?.practice?t('practiceLabel'):t('activityReward')+' +'+n((tea.result?.reward??0)+(tea.result?.bonus??0))+' '+t('buttons');
   const next=['kitchen','parlor'].map(room=>({room,...restorationReady(state,room)})).filter(r=>!r.complete).sort((a,b)=>a.required-b.required)[0];
   detail=next?fill(t(next.ready?'teaRestoreReady':'teaRestoreGoal'),{room:t(next.room+'Short'),earned:n(state.activities.mastery.tea),needed:n(next.required),cost:n(next.cost)}):t('teaHomeRestored');
  }
 }
 if(reason)status=t(reason);
 return {title:t(guest?'story-guest-tea-title':'activity-tea'),instructions,shortInstructions,progress,status,detail,cups};
}

export function createTeaUI(host,canvas,getState,dispatch,{pick,aimAt}){
 const root=document.createElement('section');root.className='tea-playfield';root.hidden=true;
 root.setAttribute('aria-labelledby','tea-work-title');
 root.innerHTML=`<header class="tea-heading"><h2 id="tea-work-title"></h2><p class="tea-progress"></p></header>
  <div class="tea-work-strip" role="region"><div class="tea-work-copy"><p id="tea-work-instructions"><span class="tea-cue-full"></span><span class="tea-cue-short" aria-hidden="true"></span></p><p id="tea-work-status"></p><p class="tea-work-detail"></p></div><button type="button" class="tea-exit" data-tea-action="exit">${icon('arrow')}<span></span></button></div>
  <div id="tea-cup-readout" class="sr-only" role="group"></div><p id="tea-work-announcement" class="sr-only" role="status" aria-live="polite" aria-atomic="true"></p>`;
 // #ui is rebuilt for sound, pause and locale changes. Keep this input surface
 // beside it so a refresh cannot remove a captured pointer or the Exit button.
 const mount=host.parentElement??host;mount.append(root);
 const gesture=createTeaGesture(),keyboard=createTeaKeyboard();
 const parts={title:root.querySelector('#tea-work-title'),progress:root.querySelector('.tea-progress'),full:root.querySelector('.tea-cue-full'),short:root.querySelector('.tea-cue-short'),status:root.querySelector('#tea-work-status'),detail:root.querySelector('.tea-work-detail'),strip:root.querySelector('.tea-work-strip'),exit:root.querySelector('[data-tea-action="exit"]'),cups:root.querySelector('#tea-cup-readout'),announcement:root.querySelector('#tea-work-announcement')};
 let session=null,previousPhase=null,inputMode='pointer',feedback=null,feedbackAge=0,announcementAge=Infinity,announcementSignature='',viewSignature='',cachedView=null,lost=false,disposed=false;
 const originalCursor=canvas.style.cursor,originalShortcuts=canvas.getAttribute('aria-keyshortcuts');
 const originalDescription=canvas.getAttribute('aria-describedby'),originalRole=canvas.getAttribute('role');
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
 function restoreCanvas(){
  canvas.style.cursor=originalCursor;canvas.setAttribute('aria-label',t('canvasLabel'));
  if(originalShortcuts===null)canvas.removeAttribute('aria-keyshortcuts');else canvas.setAttribute('aria-keyshortcuts',originalShortcuts);
  if(originalDescription===null)canvas.removeAttribute('aria-describedby');else canvas.setAttribute('aria-describedby',originalDescription);
  if(originalRole===null)canvas.removeAttribute('role');else canvas.setAttribute('role',originalRole);
 }
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
  const nextView=JSON.stringify([s.settings.locale,tea.phase,tea.mode,inputMode,tea.aimedCup,tea.ready,tea.cups.map(c=>[c.id,percent(c.fill),percent(c.target),c.ready,c.overfilled]),tea.result,tea.best,s.activities.mastery.tea,s.restoration,feedback]);
  if(nextView!==viewSignature){
   const view=cachedView=teaView(s,tea,{inputMode,reason:feedback});viewSignature=nextView;
   setText(parts.title,view.title);setText(parts.progress,view.progress);parts.progress.hidden=!view.progress;
   setText(parts.full,view.instructions);setText(parts.short,view.shortInstructions);setText(parts.status,view.status);setText(parts.detail,view.detail);parts.detail.hidden=!view.detail;
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
 function pointerdown(e){
  const tea=active();if(!tea||blocked())return;stop(e);
  if(gesture.pointerId!==null)return;
  const target=pick(e.clientX,e.clientY),projected=aimAt(e.clientX,e.clientY);
  if(!gesture.down(e,target,tea,projected))return;
  keyboard.cancel();if(tea.pressed||tea.tilt)dispatch('tea-release');
  inputMode='pointer';clearFeedback();canvas.focus({preventScroll:true});
  try{canvas.setPointerCapture(e.pointerId)}catch{cancel();return}
  if(target==='pot'&&tea.phase==='pour')invoke('tea-control',{aim:tea.aim,tilt:0,pressed:true});
  update(0);
 }
 function pointermove(e){
  const tea=active();if(!tea)return;if(blocked()){cancel();return}stop(e);
  if(gesture.pointerId===null){const target=pick(e.clientX,e.clientY);canvas.style.cursor=target==='pot'?'grab':target?'pointer':'default';return}
  if(e.pointerId!==gesture.pointerId)return;
  if(e.pointerType==='mouse'&&e.buttons===0){cancel();return}
  const projected=aimAt(e.clientX,e.clientY);
  if(gesture.target==='pot'&&tea.phase==='pour'&&!Number.isFinite(projected)){cancel();return}
  const control=gesture.move(e,projected);if(control)invoke('tea-control',control);
  canvas.style.cursor=gesture.target==='pot'?'grabbing':'default';
 }
 function pointerup(e){
  const tea=active();if(!tea)return;stop(e);if(e.pointerId!==gesture.pointerId)return;
  if(blocked()){cancel();return}
  const id=gesture.pointerId,result=gesture.up(e,pick(e.clientX,e.clientY));releaseCapture(id);root.classList.remove('tea-holding');
  if(result?.type==='release'){invoke('tea-release');update(0);return}
  if(result?.type!=='tap')return;
  if(result.target==='pot'&&tea.phase==='served')invoke('tea-replay');
  else if(result.target==='tray')invoke(tea.phase==='served'?'tea-exit':'tea-serve');
  else if(result.target.startsWith('cup:')&&tea.phase==='pour')invoke('tea-empty',Number(result.target.slice(4)));
  update(0);
 }
 function pointercancel(e){if(e.pointerId===gesture.pointerId)cancel()}
 function consumeClick(e){if(active()&&!blocked())stop(e)}
 function contextmenu(e){if(active()){stop(e);cancel()}}
 const unrelated=target=>Boolean(target?.closest?.('input,select,textarea,button,dialog,[contenteditable="true"],[contenteditable=""],[role="textbox"]'));
 function keydown(e){
  const tea=active();if(!tea||blocked()||e.defaultPrevented)return;
  if(unrelated(e.target)&&!(e.key==='Escape'&&root.contains(e.target)))return;
  if(gesture.pointerId!==null&&e.key!=='Escape'){
   if(['ArrowLeft','ArrowRight','Space','KeyE','Enter'].includes(e.code))stop(e);
   return;
  }
  const command=keyboard.down(e);if(!command)return;stop(e);inputMode='keyboard';clearFeedback();
  if(command.action==='exit'){cancel();invoke('tea-exit')}
  else if(command.action==='serve')invoke(tea.phase==='served'?'tea-exit':'tea-serve');
  else if(command.action==='empty'){
   if(tea.aimedCup===null)respond('teaAimBetween');else invoke('tea-empty',tea.aimedCup);
  }else if(tea.phase==='pour')invoke('tea-control',keyboard.controls(0,tea.aim));
  update(0);
 }
 function keyup(e){
  if(!keyboard.up(e))return;stop(e);
  const tea=active();if(tea&&!blocked()&&tea.phase==='pour'&&gesture.pointerId===null)invoke('tea-control',keyboard.controls(0,tea.aim));else cancel();
 }
 function exit(){cancel();invoke('tea-exit');update(0)}
 function visibility(){if(document.hidden)cancel()}
 function contextLost(){lost=true;cancel()}
 function focusout(){if(keyboard.active)cancel()}
 const bindings=[[canvas,'pointerdown',pointerdown,true],[canvas,'pointermove',pointermove,true],[canvas,'pointerup',pointerup,true],[canvas,'pointercancel',pointercancel,true],[canvas,'lostpointercapture',pointercancel,true],[canvas,'click',consumeClick,true],[canvas,'contextmenu',contextmenu,true],[canvas,'webglcontextlost',contextLost,false],[canvas,'focusout',focusout,false],[window,'keydown',keydown,true],[window,'keyup',keyup,true],[window,'blur',cancel,false],[window,'resize',cancel,false],[window,'orientationchange',cancel,false],[document,'visibilitychange',visibility,false],[parts.exit,'click',exit,false]];
 for(const [target,event,handler,capture] of bindings)target.addEventListener(event,handler,{capture});
 update(0);
 return {update,cancel,respond,dispose(){if(disposed)return;cancel();disposed=true;for(const [target,event,handler,capture] of bindings)target.removeEventListener(event,handler,{capture});host.dataset.teaActive='false';restoreCanvas();root.remove()}};
}
