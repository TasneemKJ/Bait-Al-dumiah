import {INTRO_BEATS} from './content.js';
import {introLines,translate} from './i18n.js';
import {introVeil} from './render/intro-camera.js';

const MODIFIERS=['Shift','Control','Alt','Meta','CapsLock','Fn'];
const FADE=.45,STILL_PEAK=.25,GRAB_SLOP=10;
const ease=x=>{const k=Math.min(1,Math.max(0,x));return k*k*(3-2*k)};
// The caption's opacity and lift within its beat: it eases in, and eases out before the next beat's line.
export function captionLook(seconds,still=false){
 let start=0;for(const [index,beat] of INTRO_BEATS.entries()){const end=start+beat.seconds;
  if(seconds<end||index===INTRO_BEATS.length-1){const into=seconds-start-(index?0:.5),out=end-seconds;
   const shown=ease(into/.6)*(index===INTRO_BEATS.length-1?1:ease(out/.35));
   return {opacity:shown,lift:still?0:8*(1-ease(into/.6))}}start=end}
 return {opacity:0,lift:0};
}
function build(root){
 const doc=root.ownerDocument,element=(tag,className)=>{const node=doc.createElement(tag);
 node.className=className;return node};
 const layer=element('div','intro-layer'),veil=element('div','intro-veil'),caption=element('div','intro-caption');
 const line=element('p','intro-line'),skip=element('button','intro-skip');
 caption.setAttribute('aria-live','polite');skip.type='button';layer.hidden=true;caption.append(line);
 layer.append(veil,caption,skip);root.append(layer);return {doc,layer,veil,caption,line,skip};
}
// Taps skip on release; a drag past a small slop grabs the camera where it is and turns it 1:1 under the finger.
function bindPointers(ui,s,{skip,orbit,end}){
 const {layer}=ui;
 layer.addEventListener('pointerdown',event=>{if(s.phase!=='playing'||event.target===ui.skip||s.press)return;
  s.press={id:event.pointerId,x:event.clientX,y:event.clientY,last:event.clientX,grab:false};
  layer.setPointerCapture?.(event.pointerId);layer.dataset.pressed=''});
 layer.addEventListener('pointermove',event=>{const press=s.press;if(!press||event.pointerId!==press.id)return;
  if(!press.grab&&Math.hypot(event.clientX-press.x,event.clientY-press.y)>GRAB_SLOP&&s.phase==='playing'){
   press.grab=true;press.last=event.clientX;end({skipped:true,grab:true});return}
  if(press.grab){const turn=-(event.clientX-press.last)*2*Math.PI/Math.max(1,layer.clientHeight||844);
   const at=Number(event.timeStamp)||0,dt=(at-(press.at??at))/1000;orbit(turn);press.last=event.clientX;
   if(dt>0)press.spin=.6*(press.spin??0)+.4*turn/dt;press.at=at}});
 // A release hands the finger's velocity on: the house keeps turning and slows, as it does in play.
 const release=event=>{const press=s.press;if(!press||event.pointerId!==press.id)return;s.press=null;
  delete layer.dataset.pressed;if(press.grab)s.spin=!s.still&&Number.isFinite(press.spin)?press.spin:0;
  else if(event.type==='pointerup')skip()};
 layer.addEventListener('pointerup',release);layer.addEventListener('pointercancel',release);
 ui.skip.addEventListener('click',event=>{event.preventDefault();skip()});
 // Any new touch anywhere stops a coasting turn at once, so it never pulls against the player's next gesture.
 ui.doc.defaultView?.addEventListener('pointerdown',()=>{s.spin=0},{capture:true});
}
// The fade out: the layer and its vignette dissolve while the HUD returns. The still version first raises the
// paper veil and only then cuts the camera to the kitchen, unseen.
function leave(ui,s,dt){
 s.leaveT+=dt;const delay=s.wasStill?STILL_PEAK:0;
 if(s.spin){s.orbit(s.spin*dt);s.spin*=Math.exp(-6*dt);if(Math.abs(s.spin)<.01)s.spin=0}
 if(s.pending){ui.veil.style.opacity=String(Math.max(s.veilAt,.88*ease(s.leaveT/STILL_PEAK)));
  if(s.leaveT>=STILL_PEAK){const result=s.pending;s.pending=null;s.onFinish?.(result)}}
 const shown=1-ease((s.leaveT-delay)/FADE);ui.layer.style.opacity=String(shown);
 ui.root.style.setProperty('--intro-hud',String(1-shown));if(!s.press)ui.layer.dataset.passive='';
 if(shown<=0&&!s.pending&&!s.press&&!s.spin){s.phase='idle';ui.layer.hidden=true;delete ui.layer.dataset.passive;
  delete ui.root.dataset.intro;ui.root.style.removeProperty('--intro-hud');ui.layer.style.opacity=''}
}
// The first-launch intro overlay: one short line per beat, a Skip control in the thumb zone, and any tap or key
// skips from the first frame. `frame(seconds,still)` poses the camera and returns {beat,done}, or null when the
// renderer cannot play it; the intro then steps aside at once. `onFinish({skipped,grab,seconds,still})` runs
// exactly once per start; start() returns true whenever it ran, even when it finished at once.
export function createIntroUI(root,{getState,frame,orbit=()=>{},onStart,onFinish}){
 const ui={...build(root),root},s={phase:'idle',elapsed:0,last:null,beat:-1,still:false,press:null,
   pending:null,leaveT:0,veilAt:0,wasStill:false,listeners:null,onFinish,spin:0,orbit};
 function end(result){
  if(s.phase!=='playing')return;s.phase='leaving';s.leaveT=0;s.listeners?.abort();s.listeners=null;
  const full={skipped:false,grab:false,...result,seconds:s.elapsed,still:s.still};
  s.wasStill=s.still&&full.skipped&&!full.grab;
  if(s.wasStill){s.pending=full;s.veilAt=Number(ui.veil.style.opacity)||0}else onFinish?.(full);
 }
 function showBeat(index){
  s.beat=index;ui.line.textContent=introLines(getState().settings.locale)[index]?.text??'';
  ui.layer.dataset.beat=INTRO_BEATS[index]?.id??'';
 }
 function apply(){
  const result=frame(s.elapsed,s.still);if(!result){end({});return}
  if(result.beat!==s.beat)showBeat(result.beat);const look=captionLook(s.elapsed,s.still);
  ui.line.style.opacity=String(look.opacity);ui.line.style.transform=look.lift?`translateY(${look.lift}px)`:'';
  ui.veil.style.opacity=String(introVeil(s.elapsed,s.still));if(result.done)end({});
 }
 const skip=()=>end({skipped:true});
 bindPointers(ui,s,{skip,orbit:amount=>orbit(amount),end});
 function onKey(event){if(MODIFIERS.includes(event.key))return;event.preventDefault();event.stopPropagation();skip()}
 return {
  // Holding the house: the intro is playing, or the still version is about to cut under its veil.
  get active(){return s.phase==='playing'||Boolean(s.pending)},get visible(){return s.phase!=='idle'},
  get beat(){return s.beat},
  start(){
   if(s.phase!=='idle')return false;const {locale,reducedMotion}=getState().settings;
   Object.assign(s,{phase:'playing',elapsed:0,last:null,beat:-1,still:reducedMotion===true,press:null,
     pending:null,spin:0});
   ui.layer.lang=locale;ui.layer.dir=locale==='ar'?'rtl':'ltr';ui.layer.dataset.still=String(s.still);
   ui.skip.textContent=translate(locale,'introSkip');
   ui.skip.setAttribute('aria-label',translate(locale,'introSkipLabel'));
   root.dataset.intro='playing';root.style.setProperty('--intro-hud','0');ui.layer.hidden=false;
   s.listeners=new AbortController();ui.doc.defaultView?.addEventListener('keydown',onKey,
     {capture:true,signal:s.listeners.signal});
   onStart?.();apply();if(s.phase==='playing')ui.skip.focus({preventScroll:true});return true;
  },
  // Advances by real time, at most a quarter second per frame so a stalled tab resumes where it was.
  update(now){
   if(s.phase==='idle')return;const dt=s.last===null?0:Math.min(.25,Math.max(0,(now-s.last)/1000));s.last=now;
   if(s.phase==='playing'){s.elapsed+=dt;apply()}else leave(ui,s,dt);
  },
  skip,
 };
}
