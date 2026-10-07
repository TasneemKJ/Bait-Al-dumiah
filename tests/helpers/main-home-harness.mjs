import {readFileSync} from 'node:fs';
import * as sim from '../../src/simulation.js';
import {DOLLS,SAVE_KEY,ACTIVITIES,ACTIVITY_ROOM} from '../../src/content.js';
import {createHomeSession} from '../../src/home-session.js';
import {createHomeUI} from '../../src/home-ui.js';
import {translate} from '../../src/i18n.js';
import {returnGreeting,waveSchedule,waveRoom} from '../../src/return-greeting.js';
import {homeDOM} from './home-dom.mjs';

// Executes the actual main wiring. Only browser/renderer adapters are replaced;
// simulation, save boundary, Home UI and emitted event callbacks are real.
export function bootHome({saved=null,preferences=null,readFails=false,writeFails=false,audioSucceeds=true}={}){
 const {document,root}=homeDOM(),home=root,app=document.createElement('div'),host=document.createElement('div'),canvas=document.createElement('canvas');
 app.dataset.screen='home';host.hidden=true;host.inert=true;canvas.inert=true;canvas.setAttribute('aria-hidden','true');canvas.setAttribute('tabindex','-1');
 canvas.removeAttribute=name=>delete canvas.attributes[name];canvas.closest=()=>null;host.querySelector=()=>null;
 app.append(canvas,host,home);document.hidden=false;document.handlers={};document.addEventListener=(name,fn)=>document.handlers[name]=fn;
 const loading={remove(){this.removed=true}};document.querySelector=key=>({'#world':canvas,'#ui':host,'#home':home,'#app':app,'#loading':loading}[key]??null);
 const storage=new Map();if(saved!==null)storage.set(SAVE_KEY,saved);if(preferences!==null)storage.set(SAVE_KEY+'.preferences',preferences);const writes=[];
 const localStorage={getItem(key){if(readFails&&key===SAVE_KEY)throw Error('read');return storage.get(key)??null},setItem(key,value){if(writeFails)throw Error('quota');writes.push({key,value});storage.set(key,value)}};
 const window={handlers:{},addEventListener(name,fn){this.handlers[name]=fn}},audioEvents=[],renders=[],focuses=[],notices=[],welcomeEvents=[];let nextFrame,now=0,pick,dispatch,ui,reloadCount=0,rendererError,resizeCallback,viewportSyncs=0;
 class Audio{constructor(){this.enabled=false;this.paused=false}async enable(){audioEvents.push('enable');this.enabled=audioSucceeds;return audioSucceeds}setPaused(value){this.paused=value;audioEvents.push(['paused',value])}mute(){audioEvents.push('mute');this.enabled=false}tick(){audioEvents.push('tick')}effect(){audioEvents.push('effect')}stopVoices(){}chime(){} }
 const noop=()=>{},adapter=()=>({update:noop,cancel:noop,clear:noop,collapse:noop,cancelDrag:noop,layout:noop});
 const world={renderer:{info:{render:{},memory:{}}},getPortraits:()=>({}),setEnabled:noop,syncViewport:()=>{viewportSyncs++;return true},focusRoom(id){focuses.push(id);return true},clearObjectSelection:noop,render(state,dt){renders.push({elapsed:state.elapsed,dt})},project:()=>null,home:noop,welcomeBack:times=>welcomeEvents.push(times),setPresentation:noop,setTeaActive:noop,setStitchActive:noop,setChimeActive:noop,setPlacement:noop};
 const scope={sim,DOLLS,SAVE_KEY,ACTIVITIES,ACTIVITY_ROOM,downloadSave:noop,readSaveFile:async()=>null,createHomeSession,createHomeUI,returnGreeting,waveSchedule,waveRoom,localStorage,document,window,location:{search:'?debug=1',reload(){reloadCount++}},matchMedia:()=>({matches:false}),performance:{now:()=>now},requestAnimationFrame:fn=>{nextFrame=fn},createWorld(canvas,callbacks){pick=callbacks.onPick;rendererError=callbacks.onError;return world},DollhouseAudio:Audio,
  createUI(host,getState,handler){dispatch=handler;ui={selected:'lina',panel:null,placement:null,t:key=>translate(getState().settings.locale,key),n:String,setPortraits:noop,refresh:noop,tick:noop,toast:message=>notices.push(message),collapseTools:noop,open(){this.panel='household';handler('panel-state','household')},clearObject:noop};return ui},
  createResidentLabel:adapter,createRoomViews:adapter,createObjectControls:adapter,createStoryUI:adapter,createTeaUI:adapter,createStitchUI:adapter,createChimeUI:adapter,createPlayfieldLayout:(host,fit,resize)=>{resizeCallback=resize;return{measure:noop}},bindPlacementEscape:noop,objectInfo:()=>null,sceneObjectAction:()=>null};
 // main.js is a thin composition root over the app-*.js modules; run them as one scope with imports and exports removed.
 const files=['app-feedback','app-view','cmd-home','cmd-camera','cmd-story','cmd-activities','cmd-house','cmd-save','app-commands','app-loop','main'];
 const source=files.map(name=>readFileSync(new URL(`../../src/${name}.js`,import.meta.url),'utf8').replace(/^import .*;\n/gm,'').replace(/^export /gm,'')).join('\n');new Function(...Object.keys(scope),source)(...Object.values(scope));
 const button=action=>home.all().find(node=>node.getAttribute('data-home-action')===action);
 return {home,app,host,canvas,document,window,storage,writes,renders,audioEvents,focuses,notices,welcomeEvents,button,reloads:()=>reloadCount,viewportSyncs:()=>viewportSyncs,resize:()=>resizeCallback(),contextLost:()=>rendererError("context"),setReadFailure(value){readFails=value},dispatch:()=>dispatch,state:()=>window.dollhouse.state(),frame(time){now=time;nextFrame(time)},pick:data=>pick(data),ui:()=>ui,hidden(value){document.hidden=value;document.handlers.visibilitychange()},pagehide(){window.handlers.pagehide()},key(key,code=key){window.handlers.keydown({key,code,target:canvas,defaultPrevented:false,preventDefault(){}})}};
}
