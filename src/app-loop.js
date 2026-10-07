// The animation frame, visibility and keyboard handling, and the opt-in debug seam.
import * as sim from './simulation.js';
import {bindPlacementEscape} from './placement-keys.js';

export function installLoop(app){
 app.last=performance.now();app.lastSave=0;
 let lastUI=0,stopped=false;
 function frame(now){if(stopped)return;const dt=Math.min(.1,Math.max(0,(now-app.last)/1000));app.last=now;
  if(!document.hidden&&!app.fatal&&!app.session.entered&&app.homeUI?.previewVisible){app.world?.render(app.state,0,null)}
  if(!document.hidden&&!app.fatal&&app.session.entered){app.updateWorkUI(dt);app.session.advance(app.state,dt);
  if(app.state.events.length)for(const event of app.state.events.splice(0))app.announce(event);
  if(app.notices.length&&now>=app.noticeAt&&!app.physicalActivity())app.showNotice(now);app.world?.render(app.state,dt,app.ui.selected);
  app.residentLabel.update(app.state,app.ui.selected,app.host.dataset.focusRoom||
    (app.host.dataset.focusDoll?app.state.dolls.find(d=>d.id===app.host.dataset.focusDoll)?.room:''),
    app.world?.project(app.ui.selected,.05),Boolean(app.ui.panel||app.ui.placement||app.state.paused||app.storyUI?.selected||app.physicalActivity()));
  if(app.physicalActivity()!=='lullaby')app.audio.tick(sim.isNight(app.state));
  if(now-lastUI>250){app.ui.tick();app.roomViews.update();app.objectControls.update();
  app.storyUI.update();lastUI=now}if(now-app.lastSave>8000){app.save();app.lastSave=now}}
  requestAnimationFrame(frame);
 }
 requestAnimationFrame(frame);
 document.addEventListener('visibilitychange',()=>{if(document.hidden){app.storyUI?.cancelDrag();
 app.cancelWorkInput()}app.syncPause();app.last=performance.now();if(document.hidden)app.save()});
 window.addEventListener('pagehide',()=>{app.cancelWorkInput();app.save()});
 bindPlacementEscape(window,()=>{if(!app.ui.placement)return false;app.ui.clearPlacement();
 app.world?.setPlacement(null);app.roomViews.update();return true});
 window.addEventListener('keydown',event=>{
  if(!app.session.entered||event.defaultPrevented)return;
  if(app.physicalActivity())return;
  if(event.key==='Escape'&&!app.ui.panel&&!app.ui.placement&&(app.storyUI?.selected||
    app.carrying)){event.preventDefault();app.dispatch('deselect-object');return}
  if(event.target.closest('input,select,textarea,button,dialog'))return;
  if(event.key==='Escape'){if(app.ui.placement){app.ui.clearPlacement();app.world?.setPlacement(null)}else if(app.ui.panel)app.ui.close();return}
  if(app.panelOpen)return;
  if(event.code==='Space'){event.preventDefault();app.dispatch('pause')}
  if(event.key==='h'||event.key==='H'){event.preventDefault();app.dispatch('camera')}
  if(event.key==='+'||event.key==='='){event.preventDefault();app.dispatch('zoom-in')}
  if(event.key==='-'){event.preventDefault();app.dispatch('zoom-out')}
  if(event.key==='ArrowLeft'){event.preventDefault();app.world?.orbit(-.09)}
  if(event.key==='ArrowRight'){event.preventDefault();app.world?.orbit(.09)}
 });
}

export function installDebug(app){
 // Explicit opt-in diagnostics for reproducible browser verification, never enabled by default.
 if(new URLSearchParams(location.search).get('debug')==='1'){
  window.dollhouse={state:()=>structuredClone(app.state),stats:()=>({calls:app.world?.renderer.info.render.calls,
    triangles:app.world?.renderer.info.render.triangles,
      geometries:app.world?.renderer.info.memory.geometries,textures:app.world?.renderer.info.memory.textures}),
    project:(id,height)=>app.world?.project(id,height),visual:()=>app.world?.visualStatus(),
      objects:()=>app.world?.objectPositions(),tea:()=>sim.teaStatus(app.state),
    teaObjects:()=>app.world?.teaPositions(),stitch:()=>sim.stitchStatus(app.state),stitchObjects:()=>app.world?.stitchPositions(),projectStitch:(x,y,
    height)=>app.world?.projectStitch(x,y,height),chimes:()=>sim.chimeStatus(app.state),
      chimeObjects:()=>app.world?.chimePositions(),chimePullSpan:()=>app.world?.chimePullSpan()};
 }
}
