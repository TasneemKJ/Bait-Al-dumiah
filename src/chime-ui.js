import {chimeStatus} from './simulation.js';
import {translate,number} from './i18n.js';
import {createChimeGesture} from './chime-input.js';
import {icon} from './icons.js';
const names=['chimeMoon','chimeStar','chimeJasmine','chimeHeart'];
const stop=e=>{e.preventDefault();e.stopImmediatePropagation()};
const text=(el,value)=>{if(el.textContent!==value)el.textContent=value};

// The only visible button is Exit. All notes and replay live in the 3D room.
export function createChimeUI(host,canvas,getState,dispatch,{pick,pullSpan}){
 const root=document.createElement('section');root.className='chime-playfield';root.hidden=true;
 root.innerHTML=`<header class="chime-heading"><h2></h2><p class="chime-progress"></p></header><div class="chime-work-strip"><div><p id="chime-instructions" class="chime-long"></p><p class="chime-short" aria-hidden="true"></p><p id="chime-status"></p></div><button type="button" class="chime-exit">${icon('arrow')}<span></span></button></div><p class="sr-only" id="chime-readout"></p><p class="sr-only" id="chime-demonstration"></p><p class="sr-only chime-announcement" role="status" aria-live="polite"></p>`;
 host.append(root);
 const parts={title:root.querySelector('h2'),progress:root.querySelector('.chime-progress'),instructions:root.querySelector('#chime-instructions'),short:root.querySelector('.chime-short'),status:root.querySelector('#chime-status'),exit:root.querySelector('button'),readout:root.querySelector('#chime-readout'),demo:root.querySelector('#chime-demonstration'),announcement:root.querySelector('.chime-announcement')};
 const original=Object.fromEntries(['role','aria-label','aria-describedby','aria-keyshortcuts'].map(k=>[k,canvas.getAttribute(k)]));
 const gesture=createChimeGesture();let session=null,keyboard=false,selection=0,input='pointer',signature='',disposed=false,lost=false;
 const state=()=>getState(),active=()=>chimeStatus(state()),t=k=>translate(state().settings.locale,k),n=v=>number(state().settings.locale,v);
 const blocked=()=>state().paused||document.hidden||lost||Boolean(host.querySelector('dialog[open],.error-screen'));
 const inside=e=>{const r=canvas.getBoundingClientRect();return Number.isFinite(e.clientX)&&Number.isFinite(e.clientY)&&e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom&&document.elementFromPoint(e.clientX,e.clientY)===canvas};
 const releaseCapture=id=>{if(id!==null){try{if(canvas.hasPointerCapture(id))canvas.releasePointerCapture(id)}catch{}}};
 function cancel(){
  const id=gesture.pointerId;gesture.cancel();keyboard=false;releaseCapture(id);
  if(active()?.held!==null&&active())dispatch('chime-cancel');
  canvas.style.cursor='default';
 }
 function restoreCanvas(){for(const [key,value] of Object.entries(original)){if(value===null)canvas.removeAttribute(key);else canvas.setAttribute(key,key==='aria-label'?t('canvasLabel'):value)}}
 function update(dt=0){
  if(disposed)return;if(!root.isConnected)host.append(root);
  let a=active();host.dataset.chimeActive=String(Boolean(a));
  if(!a){if(session){cancel();restoreCanvas();session=null;signature=''}root.hidden=true;return}
  if(session!==state().activities.active){cancel();session=state().activities.active;selection=0;signature='';a=active()}
  root.hidden=blocked();if(root.hidden){cancel();return}
  if(keyboard&&a.phase==='echo'&&a.held!==null){dispatch('chime-pull',Math.min(1,a.pull+Math.max(0,Math.min(.1,Number.isFinite(dt)?dt:0))*1.4));a=active()}
  root.dataset.phase=a.phase;root.dataset.input=input;
  canvas.setAttribute('role','application');canvas.setAttribute('aria-label',t('chimeCanvas'));
  canvas.setAttribute('aria-keyshortcuts','ArrowLeft ArrowRight Space R Escape');
  canvas.setAttribute('aria-describedby','chime-instructions chime-status chime-readout chime-demonstration');
  const listening=a.phase==='listen',done=a.phase==='finished';
  text(parts.title,t('chimeTitle'));text(parts.progress,t(listening?'chimeListen':done?'chimeDone':'chimeEcho'));
  const full=t(done?'chimeDoneHelp':listening?'chimeListenHelp':input==='keyboard'?'chimeKeyboard':'chimeEchoHelp');
  text(parts.instructions,full);text(parts.short,t(done?'chimeDoneShort':listening?'chimeListenShort':input==='keyboard'?'chimeKeysShort':'chimeShort'));
  const progress=t('chimeProgress').replace('{done}',n(a.cursor)).replace('{total}',n(a.pattern.length));
  const status=done?(a.result?.practice?t('chimePractice'):t('chimeReward').replace('{reward}',n((a.result?.reward??0)+(a.result?.bonus??0)))):listening&&a.listenTime<0?t('chimeMistake'):progress;
  text(parts.status,status);text(parts.exit.querySelector('span'),t('chimeExit'));parts.exit.setAttribute('aria-label',t('chimeExit'));
  const selected=t('chimeSelected').replace('{name}',t(names[selection]));
  text(parts.readout,selected+'. '+t('chimePullReadout').replace('{pull}',n(a.pull*100)));
  text(parts.demo,t('chimeDemonstration').replace('{notes}',a.pattern.map(id=>t(names[id])).join('، ')));
  const next=JSON.stringify([state().settings.locale,a.phase,a.cursor,a.mistakes,a.round,input,selection]);
  if(next!==signature){text(parts.announcement,status+' '+full+(input==='keyboard'?' '+selected:''));signature=next}
 }
 function down(e){
  const a=active();if(!a||blocked())return;stop(e);if(gesture.pointerId!==null||keyboard||!inside(e))return;
  const target=pick(e.clientX,e.clientY);if(target!=='moon'&&a.phase!=='echo')return;
  canvas.focus({preventScroll:true});if(!gesture.down(e,target,pullSpan()))return;
  input='pointer';dispatch('chime-focus',-1);
  try{canvas.setPointerCapture(e.pointerId)}catch{cancel();return}
  if(target!=='moon')dispatch('chime-grab',target);update(0);
 }
 function move(e){
  if(!active())return;if(blocked()){cancel();return}stop(e);
  if(gesture.pointerId===null){const target=pick(e.clientX,e.clientY);canvas.style.cursor=target==='moon'?'pointer':Number.isInteger(target)?'grab':'default';return}
  if(e.pointerId!==gesture.pointerId)return;
  if(e.pointerType==='mouse'&&e.buttons===0){cancel();return}
  if(!inside(e)){cancel();return}
  const control=gesture.move(e);if(control&&control.target!=='moon'){dispatch('chime-pull',control.pull);canvas.style.cursor='grabbing'}
 }
 function up(e){
  if(!active())return;stop(e);if(e.pointerId!==gesture.pointerId)return;
  if(blocked()){cancel();return}
  const id=gesture.pointerId,result=gesture.up(e,inside(e));releaseCapture(id);
  if(!result){cancel();return}
  if(result.target==='moon')dispatch('chime-replay');
  else{dispatch('chime-pull',result.pull);dispatch('chime-release')}
  update(0);
 }
 const unrelated=e=>e.target?.closest?.('button,dialog,input,select,textarea,[contenteditable=true]');
 function keydown(e){
  const a=active();if(!a||blocked()||e.defaultPrevented||e.altKey||e.ctrlKey||e.metaKey)return;
  if(unrelated(e)&&e.key!=='Escape')return;
  if(!['ArrowLeft','ArrowRight',' ','Space','r','R','Escape'].includes(e.key)&&e.code!=='Space')return;stop(e);
  if(e.key==='Escape'){cancel();dispatch('chime-exit');update(0);return}
  if(gesture.pointerId!==null)return;input='keyboard';
  if(e.key==='r'||e.key==='R'){if(!e.repeat){cancel();dispatch('chime-replay')}return}
  if(e.key==='ArrowLeft'||e.key==='ArrowRight'){
   if(!keyboard){selection=(selection+(e.key==='ArrowLeft'?3:1))%4;dispatch('chime-focus',selection)}
  }else if(!e.repeat&&!keyboard&&a.phase==='echo'){keyboard=true;dispatch('chime-focus',selection);dispatch('chime-grab',selection)}
  update(0);
 }
 function keyup(e){if(e.code!=='Space'&&e.key!==' ')return;if(!keyboard)return;stop(e);keyboard=false;if(blocked())cancel();else dispatch('chime-release');update(0)}
 const cancelPointer=e=>{if(e.pointerId===gesture.pointerId)cancel()};
 const exit=()=>{cancel();dispatch('chime-exit');update(0)};
 const visibility=()=>{if(document.hidden)cancel()};
 const contextLost=()=>{lost=true;cancel()};
 const consume=e=>{if(active())stop(e)};
 const bindings=[[canvas,'pointerdown',down,true],[canvas,'pointermove',move,true],[canvas,'pointerup',up,true],[canvas,'pointercancel',cancelPointer,true],[canvas,'lostpointercapture',cancelPointer,true],[canvas,'click',consume,true],[canvas,'contextmenu',e=>{if(active()){stop(e);cancel()}},true],[canvas,'focusout',cancel,false],[canvas,'webglcontextlost',contextLost,false],[window,'keydown',keydown,true],[window,'keyup',keyup,true],[window,'blur',cancel,false],[window,'resize',cancel,false],[window,'orientationchange',cancel,false],[document,'visibilitychange',visibility,false],[parts.exit,'click',exit,false]];
 for(const [target,event,handler,capture] of bindings)target.addEventListener(event,handler,{capture});
 update(0);
 return {update,cancel,dispose(){if(disposed)return;cancel();disposed=true;for(const [target,event,handler,capture] of bindings)target.removeEventListener(event,handler,{capture});restoreCanvas();host.dataset.chimeActive='false';root.remove()}};
}
