import {bindAll} from './event-bindings.js';
// Pointer, keyboard and lifecycle input for the chime surface; the surface owns state and rendering.
export function bindChimeInput(ctx){
 const {canvas,gesture,mode,parts,active,blocked,stop,inside,pick,pullSpan,dispatch,cancel,update,releaseCapture,setLost}=ctx;
 function down(e){
  const a=active();if(!a||blocked())return;stop(e);if(gesture.pointerId!==null||mode.keyboard||!inside(e))return;
  const target=pick(e.clientX,e.clientY);if(target!=='moon'&&a.phase!=='echo')return;
  canvas.focus({preventScroll:true});if(!gesture.down(e,target,pullSpan()))return;
  mode.input='pointer';dispatch('chime-focus',-1);
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
  if(gesture.pointerId!==null)return;mode.input='keyboard';
  if(e.key==='r'||e.key==='R'){if(!e.repeat){cancel();dispatch('chime-replay')}return}
  if(e.key==='ArrowLeft'||e.key==='ArrowRight'){
   if(!mode.keyboard){mode.selection=(mode.selection+(e.key==='ArrowLeft'?3:1))%4;dispatch('chime-focus',mode.selection)}
  }else if(!e.repeat&&!mode.keyboard&&a.phase==='echo'){mode.keyboard=true;dispatch('chime-focus',mode.selection);dispatch('chime-grab',mode.selection)}
  update(0);
 }
 function keyup(e){if(e.code!=='Space'&&e.key!==' ')return;if(!mode.keyboard)return;stop(e);mode.keyboard=false;if(blocked())cancel();else dispatch('chime-release');update(0)}
 const cancelPointer=e=>{if(e.pointerId===gesture.pointerId)cancel()};
 return bindAll([
  [canvas,'pointerdown',down,true],[canvas,'pointermove',move,true],[canvas,'pointerup',up,true],
  [canvas,'pointercancel',cancelPointer,true],[canvas,'lostpointercapture',cancelPointer,true],
  [canvas,'click',e=>{if(active())stop(e)},true],[canvas,'contextmenu',e=>{if(active()){stop(e);cancel()}},true],
  [canvas,'focusout',cancel,false],[canvas,'webglcontextlost',()=>{setLost();cancel()},false],
  [window,'keydown',keydown,true],[window,'keyup',keyup,true],[window,'blur',cancel,false],
  [window,'resize',cancel,false],[window,'orientationchange',cancel,false],
  [document,'visibilitychange',()=>{if(document.hidden)cancel()},false],
  [parts.exit,'click',()=>{cancel();dispatch('chime-exit');update(0)},false],
 ]);
}
