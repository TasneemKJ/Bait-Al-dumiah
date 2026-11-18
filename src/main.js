import {createFilmUI} from './film-ui.js';
import {createHomeSession} from './home-session.js';
import {createHomeUI} from './home-ui.js';
import {createStoryUI} from './story-ui.js';
import {createPlayfieldLayout} from './playfield-layout.js';
import {createTeaUI} from './tea-ui.js';
import {createStitchUI} from './stitch-ui.js';
import {createChimeUI} from './chime-ui.js';
import {createWorld} from './render/world.js';
import {createUI} from './ui.js';
import {createResidentLabel} from './resident-label.js';
import {createKeyRing} from './key-ring.js';
import {appStore} from './app-store.js';
import {createPorterBell} from './porter-bell.js';
import {createHouseAccess} from './house-access.js';
import {createIntroUI} from './intro-ui.js';
import {createIntroSound} from './intro-sound.js';
import {DollhouseAudio} from './audio.js';
import {installFeedback} from './app-feedback.js';
import {installView} from './app-view.js';
import {installCommands} from './app-commands.js';
import {installLoop} from './app-loop.js';
import {installDebug} from './debug-seam.js';
import {installIdleLife} from './idle-life.js';
import {inNativeApp} from './native-app.js';
import {installStore} from './cmd-store.js';
import {installTouchFeedback} from './app-touch.js';
import {useAppWording} from './locale-data.js';
import {installMischief} from './mischief-ui.js';
import * as sim from './simulation.js';

// In the iPhone app, lines about a browser read as the app (src/locale-data.js `<key>App`).
useAppWording(inNativeApp());

let storage;try{storage=localStorage}catch{}
const session=createHomeSession({storage,reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches,
  deviceLocale:navigator.languages?.[0]??navigator.language});
// The one shared context: services and DOM roots are fixed, the rest is filled in as the pieces are built.
const app={
  session,audio:new DollhouseAudio(),canvas:document.querySelector('#world'),host:document.querySelector('#ui'),
  state:session.state,world:null,ui:null,homeUI:null,objectControls:null,storyUI:null,
    teaUI:null,stitchUI:null,chimeUI:null,
  roomViews:null,residentLabel:null,playfieldLayout:null,intro:null,
  manualPause:false,panelOpen:false,fatal:false,saveWarning:false,carrying:false,lastChimeTone:null,
};

// The keyboard and VoiceOver list (src/house-access.js): the same as a touch, except that a story object chosen
// from the list also turns the camera to its room (a touch already sees it).
function accessPick(data){
  if(!data||!app.session.entered)return;
  if(data.panel){app.ui.open(data.panel);return}
  if(data.object&&!(data.object==='prop:tea-set'&&app.state.cares===0)){
   app.dispatch(app.storyUI?.selected===data.object?'activate-object':'select-object',data.object);return}
  pickFromScene(data);
}

// A touch on the 3D scene: pick an object, a resident, the ghost or a placement slot.
function pickFromScene(data){
  if(!app.session.entered)return;
  if(data&&(data.wind||data.keyTo||data.musicKey||data.musicBox||data.roomTap||data.roomTouch||
    data.nook||data.object||data.doll||data.ghost||data.slot||data.doorTap)){
    app.audio?.wake?.();
    if(storage?.getItem?.('bait-al-dumiah.v1.haptics')!=='off')try{globalThis.navigator?.vibrate?.(8)}catch{}
  }
  if(data.doorTap){app.audio?.effect?.('door-locked');app.say(app.ui.t('doorTapNote'));return}
  const {storyUI,ui,dispatch}=app,focused=app.host.dataset.focusRoom;
  // A room touched on the whole house opens; a hiding place searches only once its room is the subject.
  // The music box key: carried by a drag (keyTo) or by a touch on it and then on a box or a room; wound by a
  // circle round its box (wind) or a touch on the box (a quarter turn).
  if(data.wind)return dispatch('turn-key',data.wind);
  if(data.keyTo)return dispatch('move-key',data.keyTo);
  if(data.musicKey)return dispatch('hold-key');
  if(data.musicBox)return app.keyHeld?dispatch('move-key',data.room):
   dispatch('turn-key',{doll:data.musicBox,turns:.25});
  if(app.keyHeld&&(data.roomTap||data.roomTouch))dispatch('move-key',data.roomTap||data.roomTouch);
  if(data.roomTap)return dispatch('focus-room',data.roomTap);
  // A bare wall or floor: the doll who lives in the room turns and waves (no sheet, nothing to read).
  if(data.roomTouch){const d=app.state.dolls.find(x=>x.room===data.roomTouch);if(d)dispatch('greet-doll',d.id);return}
  if(data.nook)return dispatch(focused===data.room?'search':'focus-room',focused===data.room?data.nook:data.room);
  const spot=data.object&&sim.spotForObject(data.object);
  if(spot&&focused===spot.room&&sim.missing(app.state)?.spot===spot.id)return dispatch('search',spot.id);
  // A new household's first tea needs no second touch: the tea set opens its ritual at once.
  const firstTea=data.object==='prop:tea-set'&&app.state.cares===0&&!sim.wishGranted(app.state,'lina');
  if(data.object)dispatch(firstTea||storyUI?.selected===data.object?'activate-object':'select-object',
   data.object,'scene');
  // A first touch greets (she waves, a soft sound, nothing to read); touching her again opens her sheet.
  if(data.doll){if(app.touchedDoll===data.doll)ui.open('household',data.doll);
  else{app.touchedDoll=data.doll;dispatch('greet-doll',data.doll)}}
  if(data.ghost)dispatch('discover');
  if(data.slot&&ui.placement)dispatch(ui.moveId!==null?'relocate-object':'place',
    {id:ui.moveId,item:ui.placement,...data.slot});
}

function buildViews(){
  const {session,canvas,host,dispatch}=app,getState=()=>app.state;
  app.ui=createUI(host,getState,dispatch);
  app.homeUI=createHomeUI(document.querySelector('#home'),getState,dispatch,
    {canContinue:session.canContinue,loadStatus:session.loadStatus});
  app.syncPause();
  app.residentLabel=createResidentLabel(host);
  // The key ring by the door and the porter's bell replace the bottom bar (DESIGN.md #67).
  app.roomViews=createKeyRing(host,getState,{t:key=>app.ui.t(key),say:text=>app.say?.(text),store:()=>appStore.inApp});
  app.access=createHouseAccess(host,getState,{t:key=>app.ui.t(key),onPick:accessPick});
  app.bell=createPorterBell(host,getState,{t:key=>app.ui.t(key),sound:()=>app.audio.effect('mobile'),
    onTap:call=>dispatch('answer-bell',call)});
  try{
    app.world=createWorld(canvas,{onPick:pickFromScene,onError:app.showError});
    app.world.setEnabled(false);app.homeUI.ready();document.querySelector('#loading')?.remove();
  }catch(error){console.error('Dollhouse renderer could not start:',error);app.showError('webgl')}
  const world=()=>app.world;
  const sound=createIntroSound(app.audio);
  app.intro=createIntroUI(document.querySelector('#app'),{getState,onStart:()=>sound.start(),
    frame:(seconds,still)=>{const shot=world()?.introFrame(seconds,still)??null;if(shot)sound.advance(seconds);
      return shot},orbit:amount=>world()?.orbit(amount),
    onFinish:result=>{sound.finish(result);dispatch('intro-done',result)}});
  app.storyUI=createStoryUI(host,getState,dispatch,key=>world()?.objectPositions().find(point=>point.key===key));
  app.teaUI=createTeaUI(host,canvas,getState,dispatch,{pick:(x,y)=>world()?.teaAt(x,y),
    aimAt:(x,y)=>world()?.teaAimAt(x,y)});
  app.stitchUI=createStitchUI(host,canvas,getState,dispatch,{pick:(x,
    y)=>world()?.stitchAt(x,y),pointAt:(x,y)=>world()?.stitchPointAt(x,y)});
  app.chimeUI=createChimeUI(host,canvas,getState,dispatch,{pick:(x,y)=>world()?.chimeAt(x,
    y),pullSpan:()=>world()?.chimePullSpan()??0});
  app.playfieldLayout=createPlayfieldLayout(host,(value,viewport)=>{
    if(session.entered){world()?.setPresentation(value,viewport);app.storyUI?.layout()}
  },()=>{
    if(world()?.syncViewport()&&session.entered)app.storyUI?.cancelDrag();
    if(session.entered)app.storyUI?.layout();
  });
}

installFeedback(app);installView(app);installCommands(app);
buildViews();
app.film=createFilmUI(document.querySelector('#app'),{getState:()=>app.state,
 onState:active=>{app.filmActive=active;app.cancelWorkInput();app.syncPause();
  app.world?.setEnabled(!active&&!app.state.paused);},
 onClose:()=>{app.ui.open('settings');
  app.host.querySelector('[data-action="watch-film"]')?.focus({preventScroll:true});},
});
installMischief(app);
installLoop(app);installDebug(app);installStore(app);installTouchFeedback(app);installIdleLife(app);
// The iPhone app flushes the save before it copies it (TasKit flushSaveScript); save() writes nothing before Play.
window.__baitAlDumiahSave=()=>app.save();
