// Pointer, keyboard and lifecycle input for the tea work surface. The surface
// owns state and rendering; this module turns browser events into commands.
import {bindAll} from './event-bindings.js';
import {lastPointerWasMouse} from './pointer-kind.js';
import {TEA_TABLE} from './content.js';

// Pointer handlers: hold the pot to pour, tap a cup to empty it, tap the tray to serve or leave.
function teaPointer(ctx){
 const {root,active,blocked,stop,releaseCapture,invoke,cancel,clearFeedback,update,gesture,
   keyboard,canvas,dispatch,pick,aimAt,setInputMode,startPour}=ctx;
 // A tap on the pot pours every cup still short of its line, nearest the spout first, and serves when all are
 // ready; with every cup already ready, it serves.
 function tapPour(tea){if(!tea||tea.phase!=='pour')return;if(tea.ready){invoke('tea-serve');return}
  const spout=tea.aim*TEA_TABLE.aimSpan,open=tea.cups.filter(c=>!c.ready&&!c.overfilled)
   .sort((a,b)=>Math.abs(a.x-spout)-Math.abs(b.x-spout));if(open.length)startPour(open.map(c=>c.id))}
 function pointerdown(e){
  const tea=active();if(!tea||blocked())return;stop(e);
  if(gesture.pointerId!==null)return;
  // 2026-11-14 (owner, on iPhone: "still cannot move or drag the tea pot"): the pot is small on a phone, so
  // while pouring a touch that misses the cups and the tray takes the pot. Aim is relative, so it never jumps.
  const hit=pick(e.clientX,e.clientY),projected=aimAt(e.clientX,e.clientY),
   target=hit===null?(tea.phase==='pour'?'pot':'tray'):hit;
  if(!gesture.down(e,target,tea,projected))return;
  keyboard.cancel();if(tea.pressed||tea.tilt)dispatch('tea-release');
  setInputMode('pointer');clearFeedback();canvas.focus({preventScroll:true});
  try{canvas.setPointerCapture(e.pointerId)}catch{cancel();return}
  if(target==='pot'&&tea.phase==='pour')invoke('tea-control',{aim:tea.aim,tilt:0,pressed:true});
  update(0);
 }
 function pointermove(e){
  const tea=active();if(!tea)return;if(blocked()){cancel();return}stop(e);
  if(gesture.pointerId===null){const target=pick(e.clientX,e.clientY);
  canvas.style.cursor=target==='pot'?'grab':target?'pointer':'default';return}
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
  const id=gesture.pointerId,result=gesture.up(e,pick(e.clientX,e.clientY));
  releaseCapture(id);root.classList.remove('tea-holding');
  if(result?.type==='release'){invoke('tea-release');update(0);return}
  if(result?.type==='pour-tap'){invoke('tea-release');tapPour(active());update(0);return}
  if(result?.type!=='tap')return;
  if(result.target==='pot'&&tea.phase==='served')invoke('tea-replay');
  // Served: a tap anywhere but the pot goes home (a cup, the tray, the table).
  else if(tea.phase==='served')invoke('tea-exit');
  // The tray serves a ready table; before that a tap on it pours, like the pot (a first tap is never refused).
  else if(result.target==='tray'){if(tea.ready)invoke('tea-serve');else tapPour(tea)}
  else if(result.target.startsWith('cup:')&&tea.phase==='pour'){const cup=tea.cups[Number(result.target.slice(4))];
   if(cup?.overfilled)invoke('tea-empty',cup.id);else if(cup&&!cup.ready)startPour([cup.id])}
  update(0);
 }
 function pointercancel(e){if(e.pointerId===gesture.pointerId)cancel()}
 return {pointerdown,pointermove,pointerup,pointercancel};
}

const unrelated=target=>Boolean(target?.closest?.('input,select,textarea,button,dialog,'+
  '[contenteditable="true"],[contenteditable=""],[role="textbox"]'));
// Keyboard handlers: arrows aim, Space pours, E empties, Enter serves and Escape leaves.
function teaKeys(ctx){
 const {root,active,blocked,stop,invoke,cancel,respond,clearFeedback,update,gesture,keyboard,setInputMode}=ctx;
 function keydown(e){
  const tea=active();if(!tea||blocked()||e.defaultPrevented)return;
  if(unrelated(e.target)&&!(e.key==='Escape'&&root.contains(e.target)))return;
  if(gesture.pointerId!==null&&e.key!=='Escape'){
   if(['ArrowLeft','ArrowRight','Space','KeyE','Enter'].includes(e.code))stop(e);
   return;
  }
  const command=keyboard.down(e);if(!command)return;stop(e);setInputMode('keyboard');clearFeedback();
  if(command.action==='exit'){cancel();invoke('tea-exit')}
  else if(command.action==='serve')invoke(tea.phase==='served'?'tea-exit':'tea-serve');
  else if(command.action==='empty'){
   if(tea.aimedCup===null)respond('teaAimBetween');else invoke('tea-empty',tea.aimedCup);
  }else if(tea.phase==='pour')invoke('tea-control',keyboard.controls(0,tea.aim));
  update(0);
 }
 function keyup(e){
  if(!keyboard.up(e))return;stop(e);
  const tea=active();
  if(tea&&!blocked()&&tea.phase==='pour'&&gesture.pointerId===null)invoke('tea-control',
    keyboard.controls(0,tea.aim));else cancel();
 }
 return {keydown,keyup};
}

export function bindTeaInput(ctx){
 const {active,stop,invoke,cancel,update,keyboard,gesture,canvas,setLost,parts}=ctx;
 const {pointerdown,pointermove,pointerup,pointercancel}=teaPointer(ctx),{keydown,keyup}=teaKeys(ctx);
 function consumeClick(e){if(active()&&!ctx.blocked())stop(e)}
 function contextmenu(e){if(active()){stop(e);if(lastPointerWasMouse())cancel()}}
 function exit(){cancel();invoke('tea-exit');update(0)}
 function visibility(){if(document.hidden)cancel()}
 function contextLost(){setLost();cancel()}
 function focusout(){if(keyboard.active||gesture.pointerId!==null)cancel()}
 return bindAll([
  [canvas,'pointerdown',pointerdown,true],[canvas,'pointermove',pointermove,true],
  [canvas,'pointerup',pointerup,true],[canvas,'pointercancel',pointercancel,true],[canvas,
    'lostpointercapture',pointercancel,true],
  [canvas,'click',consumeClick,true],[canvas,'contextmenu',contextmenu,true],
  [canvas,'webglcontextlost',contextLost,false],[canvas,'focusout',focusout,false],
  [window,'keydown',keydown,true],[window,'keyup',keyup,true],[window,'blur',cancel,false],
  [window,'resize',cancel,false],[window,'orientationchange',cancel,false],
  [document,'visibilitychange',visibility,false],[parts.exit,'click',exit,false],
 ]);
}
