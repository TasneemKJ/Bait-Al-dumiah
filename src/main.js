import {createHomeSession} from './home-session.js';
import {createHomeUI} from './home-ui.js';
import {createStoryUI} from './story-ui.js';
import {createPlayfieldLayout} from './playfield-layout.js';
import {createTeaUI} from './tea-ui.js';
import {createStitchUI} from './stitch-ui.js';
import {createChimeUI} from './chime-ui.js';
import {createObjectControls} from './object-controls.js';
import {createWorld} from './render/world.js';
import {createUI} from './ui.js';
import {createResidentLabel} from './resident-label.js';
import {createRoomViews} from './room-views.js';
import {createIntroUI} from './intro-ui.js';
import {createIntroSound} from './intro-sound.js';
import {DollhouseAudio} from './audio.js';
import {installFeedback} from './app-feedback.js';
import {installView} from './app-view.js';
import {installCommands} from './app-commands.js';
import {installLoop,installDebug} from './app-loop.js';

let storage;try{storage=localStorage}catch{}
const session=createHomeSession({storage,reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches});
// The one shared context: services and DOM roots are fixed, the rest is filled in as the pieces are built.
const app={
  session,audio:new DollhouseAudio(),canvas:document.querySelector('#world'),host:document.querySelector('#ui'),
  state:session.state,world:null,ui:null,homeUI:null,objectControls:null,storyUI:null,
    teaUI:null,stitchUI:null,chimeUI:null,
  roomViews:null,residentLabel:null,playfieldLayout:null,intro:null,
  manualPause:false,panelOpen:false,fatal:false,saveWarning:false,carrying:false,lastChimeTone:null,
};

// A touch on the 3D scene: pick an object, a resident, the ghost or a placement slot.
function pickFromScene(data){
  if(!app.session.entered)return;
  const {storyUI,ui,dispatch}=app;
  if(data.object)dispatch(storyUI?.selected===data.object?'activate-object':'select-object',data.object,'scene');
  if(data.doll)ui.open('household',data.doll);
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
  app.roomViews=createRoomViews(host,getState,id=>dispatch('focus-room',id));
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
  app.objectControls=createObjectControls(host,getState,key=>dispatch('select-object',key));
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
installLoop(app);installDebug(app);
