import {point} from './stitch-view.js';

// Pointer, keyboard and lifecycle input for the stitch work surface. The surface
// owns state and rendering; this module turns browser events into commands.
export function bindStitchInput(ctx){
 const {root,active,blocked,stop,hit,project,releaseCapture,invoke,cancel,clearFeedback,update,gesture,keyboard,canvas,dispatch,setInputMode,setLost,parts}=ctx;
 function pointerdown(e){
  const stitch=active();if(!stitch||blocked())return;stop(e);if(gesture.pointerId!==null)return;
  const target=hit(e),projected=project(e);
  if(!gesture.down(e,target,stitch,projected))return;
  keyboard.cancel();dispatch('stitch-release');
  setInputMode('pointer');clearFeedback();canvas.focus({preventScroll:true});
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
  const owned=keyboard.active,command=keyboard.down(e);if(!command)return;stop(e);setInputMode('keyboard');clearFeedback();
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
 function contextLost(){setLost();cancel()}
 function focusout(){if(keyboard.active||gesture.pointerId!==null)cancel()}
 const bindings=[[canvas,'pointerdown',pointerdown,true],[canvas,'pointermove',pointermove,true],[canvas,'pointerup',pointerup,true],[canvas,'pointercancel',pointercancel,true],[canvas,'lostpointercapture',pointercancel,true],[canvas,'click',consumeClick,true],[canvas,'contextmenu',contextmenu,true],[canvas,'webglcontextlost',contextLost,false],[canvas,'focusout',focusout,false],[window,'keydown',keydown,true],[window,'keyup',keyup,true],[window,'blur',cancel,false],[window,'resize',cancel,false],[window,'orientationchange',cancel,false],[document,'visibilitychange',visibility,false],[parts.exit,'click',exit,false]];
 for(const [target,event,handler,capture] of bindings)target.addEventListener(event,handler,{capture});
 return ()=>{for(const [target,event,handler,capture] of bindings)target.removeEventListener(event,handler,{capture})};
}
