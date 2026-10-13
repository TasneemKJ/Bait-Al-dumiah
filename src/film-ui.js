import {translate} from './i18n.js';
import {createFilmSound} from './film-sound.js';

function build(root){
 const dialog=document.createElement('dialog');dialog.className='film-dialog';
 dialog.setAttribute('aria-labelledby','film-title');
 dialog.innerHTML='<header><h2 id="film-title"></h2><button type="button" data-film="close"></button></header>'+
  '<div class="film-stage"><canvas role="img" aria-describedby="film-story"></canvas>'+
  '<span id="film-story" class="sr-only" aria-live="polite"></span><p role="status" hidden></p></div>'+
  '<footer><button type="button" data-film="play"></button><span class="film-time"></span>'+
  '<button type="button" data-film="sound"></button></footer>';
 root.append(dialog);return {dialog,canvas:dialog.querySelector('canvas'),status:dialog.querySelector('[role=status]'),
  caption:dialog.querySelector('#film-story'),
  close:dialog.querySelector('[data-film=close]'),play:dialog.querySelector('[data-film=play]'),
  sound:dialog.querySelector('[data-film=sound]'),time:dialog.querySelector('.film-time')};
}
function bindControls(ui,{close,toggle,sound,pause}){
 ui.close.addEventListener('click',close);ui.play.addEventListener('click',()=>{ui.status.hidden=true;toggle();});
 ui.sound.addEventListener('click',()=>void sound());
 ui.dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
 ui.dialog.addEventListener('keydown',event=>{
  event.stopPropagation();if(event.code==='Space'&&event.target===ui.canvas){event.preventDefault();toggle();}
 });
 document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
 window.addEventListener('pagehide',pause);
}
function updateLabels(ui,s,t){
  ui.play.textContent=t(s.seconds>=60?'filmReplay':s.paused?'filmPlay':'filmPause');
  ui.sound.textContent=t(s.muted?'filmSilent':'filmSound');ui.sound.setAttribute('aria-pressed',String(!s.muted));
  ui.time.textContent=`${Math.floor(s.seconds).toString().padStart(2,'0')} / 60`;
 }
export function createFilmUI(root,{getState,onState,onClose}){
 const ui=build(root),audio=createFilmSound();
 const s={active:false,paused:false,seconds:0,last:null,scene:null,locale:'en',still:false,
  muted:true,request:0,raf:0,lastDraw:-1,nextShot:0};
 const t=key=>translate(s.locale,key);
 const labels=()=>updateLabels(ui,s,t);
 function close(){if(!s.active)return;s.active=false;s.request++;cancelAnimationFrame(s.raf);s.raf=0;audio.dispose();
  s.scene?.dispose();s.scene=null;ui.dialog.close();onState(false);onClose?.();}
 function pause(){if(!s.active)return;s.paused=true;s.last=null;audio.stop();labels();}
 function fail(){pause();ui.status.hidden=false;ui.status.textContent=t('filmError');
  ui.play.disabled=true;ui.sound.disabled=true;audio.stop();s.scene?.dispose();s.scene=null;}
 function toggle(){if(!s.scene)return;ui.status.hidden=true;
  if(s.seconds>=60){s.seconds=0;s.lastDraw=-1;s.nextShot=0;}s.paused=!s.paused;s.last=null;
  if(s.paused)audio.stop();labels();}
 async function sound(){const request=s.request;if(s.muted){const enabled=await audio.enable();
  if(!s.active||request!==s.request)return;if(enabled)s.muted=false;}
  else{s.muted=true;audio.mute();}labels();}
 function update(now){if(!s.active)return;
  const dt=s.last===null?0:Math.max(0,(now-s.last)/1000);s.last=now;
  if(s.scene&&!s.paused&&!document.hidden){s.seconds=Math.min(60,s.seconds+dt);
   // GPU/compositor stalls can arrive after render() returns; observe frame gaps too.
   if(!s.still&&dt>.18){s.still=true;s.lastDraw=-1;s.nextShot=0;}
   const frame=Math.floor(s.seconds*12);
   if(frame!==s.lastDraw&&(!s.still||s.lastDraw<0||s.seconds>=s.nextShot)){try{
    const started=performance.now(),shot=s.scene.render(s.still?Math.max(1.2,frame/12):frame/12,s.locale,s.still);
    s.lastDraw=frame;s.nextShot=shot.end;
    if(!s.still&&performance.now()-started>180){s.still=true;s.lastDraw=-1;s.nextShot=0;}
    const text=t('filmLine'+shot.index);
    if(ui.caption.textContent!==text)ui.caption.textContent=text;}
    catch{fail();return;}}
   audio.tick(s.seconds);
   if(s.seconds>=60){pause();ui.status.hidden=false;ui.status.textContent=t('filmEnd');}labels();}
  s.raf=requestAnimationFrame(update);
 }
 bindControls(ui,{close,toggle,sound,pause});
 return {
  get active(){return s.active;},
  status(){return {active:s.active,paused:s.paused,seconds:s.seconds,still:s.still,stats:s.scene?.stats()??null};},
  async open(){if(s.active)return;const settings=getState().settings,request=++s.request;
   Object.assign(s,{active:true,paused:false,seconds:0,last:null,lastDraw:-1,nextShot:0,locale:settings.locale,
    still:settings.reducedMotion,muted:settings.muted});
   ui.dialog.lang=s.locale;ui.dialog.dir=s.locale==='ar'?'rtl':'ltr';
   ui.dialog.querySelector('h2').textContent=t('filmTitle');ui.close.textContent=t('filmClose');
   ui.canvas.setAttribute('aria-label',t('filmLabel'));ui.canvas.tabIndex=0;
   ui.status.hidden=false;ui.status.textContent=t('filmLoading');ui.play.disabled=true;
   ui.sound.disabled=false;labels();onState(true);
   ui.dialog.showModal();ui.close.focus();audio.mute();
   if(!s.muted)void audio.enable().then(ok=>{if(s.active&&request===s.request&&!ok){s.muted=true;labels();}});
   try{const {createFilmScene}=await import('./render/film-scene.js');
    if(!s.active||request!==s.request)return;
    const width=Math.min(540,Math.max(320,Math.round(ui.canvas.clientHeight*9/16)));
    s.scene=createFilmScene(ui.canvas,{width,height:Math.round(width*16/9),outputWidth:width});
    const shot=s.scene.render(s.still?1.2:0,s.locale,s.still);s.lastDraw=0;s.nextShot=shot.end;
    ui.caption.textContent=t('filmLine'+shot.index);ui.status.hidden=true;
    ui.play.disabled=false;s.raf=requestAnimationFrame(update);
   }catch{if(!s.active||request!==s.request)return;fail();}
  },close,
 };
}
