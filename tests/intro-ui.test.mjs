import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {INTRO_BEATS} from '../src/content.js';
import {strings} from '../src/i18n.js';
import {createState} from '../src/simulation.js';
import {INTRO_SECONDS,introBeat} from '../src/render/intro-camera.js';
import {createIntroUI,captionLook} from '../src/intro-ui.js';
import {INTRO_CUES,INTRO_RESOLVE,introCuesIn} from '../src/intro-score.js';
import {createIntroSound,STALE} from '../src/intro-sound.js';
import {DollhouseAudio} from '../src/audio.js';

function fakeDOM(){
 const view=new EventTarget(),document={defaultView:view,activeElement:null,createElement:tag=>new Node(tag)};
 class Node extends EventTarget{
  constructor(tag){super();this.tagName=tag.toUpperCase();this.ownerDocument=document;this.children=[];
   this.dataset={};this.attributes={};this.hidden=false;this.textContent='';this.clientHeight=844;
   const props={};this.style={setProperty:(k,v)=>{props[k]=v},removeProperty:k=>{delete props[k]},props}}
  append(...nodes){for(const node of nodes)node.parentNode=this;this.children.push(...nodes)}
  setAttribute(name,value){this.attributes[name]=String(value)}focus(){document.activeElement=this}
  setPointerCapture(id){this.captured=id}
  fire(type,props={}){const event=new Event(type,{cancelable:true});
   for(const [k,v] of Object.entries(props))Object.defineProperty(event,k,{value:v});
   Object.defineProperty(event,'target',{value:this});for(let n=this;n;n=n.parentNode)n.dispatchEvent(event);
   return event}
  click(){this.fire('click')}
 }
 return {root:new Node('div'),document,view};
}
function harness({beats=null,reducedMotion=false,locale='en'}={}){
 const {root,document,view}=fakeDOM(),state=createState(),calls=[],finished=[],orbits=[];
 state.settings.reducedMotion=reducedMotion;state.settings.locale=locale;
 const intro=createIntroUI(root,{getState:()=>state,orbit:a=>orbits.push(a),frame:(seconds,still)=>{
  calls.push({seconds,still});return beats?beats(seconds):{beat:introBeat(seconds),done:seconds>=INTRO_SECONDS}},
 onFinish:result=>finished.push(result)});
 const layer=root.children[0],[veil,caption,skip]=layer.children;
 const run=(from,to)=>{for(let now=from;now<=to;now+=50)intro.update(now)};
 return {intro,root,document,view,layer,veil,caption,line:caption.children[0],skip,calls,finished,orbits,run};
}
const key=(view,name)=>{const event=new Event('keydown',{cancelable:true});event.key=name;view.dispatchEvent(event);
 return event};

test('frame 1 is posed before the first render and the lines follow the beats to a natural end',()=>{
 const h=harness();assert.equal(h.intro.start(),true);assert.deepEqual(h.calls[0],{seconds:0,still:false});
 assert.equal(h.root.dataset.intro,'playing');assert.equal(h.veil.style.opacity,'1','starts under the paper veil');
 assert.equal(h.document.activeElement,h.skip,'Skip is focused for keyboard and screen-reader players');
 assert.equal(h.line.textContent,strings.en.introApproach);
 h.run(0,4000);assert.equal(h.line.textContent,strings.en.introReveal);
 h.run(4050,9000);assert.equal(h.intro.active,false);assert.equal(h.finished[0].skipped,false);
 assert.equal(h.finished.length,1);h.run(9050,10000);
 assert.equal(h.layer.hidden,true,'the layer dissolved');assert.equal(h.root.dataset.intro,undefined);
});

test('lines cross-fade: each eases in after its beat starts and out before the next',()=>{
 let start=0;for(const [index,beat] of INTRO_BEATS.entries()){
  const middle=captionLook(start+beat.seconds/2);assert.ok(middle.opacity>.99,`beat ${index} readable`);
  if(index<INTRO_BEATS.length-1)assert.ok(captionLook(start+beat.seconds-.01).opacity<.05);
  start+=beat.seconds}
 assert.equal(captionLook(0).opacity,0);assert.equal(captionLook(2,true).lift,0,'no travel in the still version');
});

test('a tap skips on release; a press shows feedback at once; a drag grabs the camera 1:1 instead',()=>{
 const tap=harness();tap.intro.start();tap.layer.fire('pointerdown',{pointerId:1,clientX:100,clientY:100});
 assert.equal(tap.layer.dataset.pressed,'','feedback on press');assert.equal(tap.finished.length,0);
 tap.layer.fire('pointerup',{pointerId:1,clientX:102,clientY:101});
 assert.equal(tap.finished.length,1);assert.equal(tap.finished[0].skipped,true);assert.equal(tap.finished[0].grab,false);
 const drag=harness();drag.intro.start();drag.run(0,1500);
 drag.layer.fire('pointerdown',{pointerId:2,clientX:100,clientY:100});
 drag.layer.fire('pointermove',{pointerId:2,clientX:105,clientY:100});assert.equal(drag.finished.length,0,'slop');
 drag.layer.fire('pointermove',{pointerId:2,clientX:120,clientY:100});
 assert.deepEqual(drag.finished.map(r=>r.grab),[true]);assert.equal(drag.orbits.length,0,'no jump on catch');
 drag.layer.fire('pointermove',{pointerId:2,clientX:162.2,clientY:100});
 assert.ok(Math.abs(drag.orbits[0]+42.2*2*Math.PI/844)<1e-9,'turns 1:1 with the finger');
 drag.layer.fire('pointermove',{pointerId:2,clientX:180,clientY:100,timeStamp:1000});
 drag.layer.fire('pointermove',{pointerId:2,clientX:200,clientY:100,timeStamp:1050});
 drag.layer.fire('pointerup',{pointerId:2,clientX:200,clientY:100});assert.equal(drag.finished.length,1);
 const turned=drag.orbits.length;drag.run(1550,1700);assert.ok(drag.orbits.length>turned,'release velocity carries on');
 const first=drag.orbits[turned],later=drag.orbits.at(-1);
 assert.ok(Math.sign(first)===Math.sign(-1)&&Math.abs(later)<Math.abs(first),'and decelerates the way it was going');
 drag.run(1750,4000);assert.equal(drag.layer.hidden,true);
 const again=harness();again.intro.start();again.run(0,500);
 again.layer.fire('pointerdown',{pointerId:3,clientX:100,clientY:100});
 for(const [x,t] of [[130,600],[160,650],[190,700]])again.layer.fire('pointermove',{pointerId:3,clientX:x,clientY:100,
  timeStamp:t});
 again.layer.fire('pointerup',{pointerId:3,clientX:190,clientY:100});const count=again.orbits.length;
 again.view.dispatchEvent(new Event('pointerdown'));again.run(550,700);
 assert.equal(again.orbits.length,count,'a new touch stops the coast at once');
});

test('any key skips from the first frame, once; modifiers alone do not; the listener leaves with the intro',()=>{
 const h=harness();h.intro.start();assert.equal(key(h.view,'Shift').defaultPrevented,false);
 const space=key(h.view,' ');assert.equal(space.defaultPrevented,true,'never reaches gameplay shortcuts');
 assert.equal(h.finished.length,1);key(h.view,'Enter');assert.equal(h.finished.length,1);
 const b=harness();b.intro.start();b.skip.click();b.skip.click();assert.equal(b.finished.length,1);
});

test('the exit dissolves the layer and returns the HUD over about half a second, never a cut',()=>{
 const h=harness();h.intro.start();h.run(0,2000);h.intro.skip();h.intro.update(2050);h.intro.update(2250);
 const mid=Number(h.layer.style.opacity),hud=Number(h.root.style.props['--intro-hud']);
 assert.ok(mid>.1&&mid<.95,`fading: ${mid}`);assert.ok(Math.abs(mid+hud-1)<1e-9);
 assert.equal(h.layer.dataset.passive,'','taps reach the game while it fades');h.run(2300,3000);
 assert.equal(h.layer.hidden,true);
});

test('reduced motion: still shots, the skip waits under the veil before the camera cuts, Arabic is RTL',()=>{
 const h=harness({reducedMotion:true,locale:'ar'});h.intro.start();assert.equal(h.calls[0].still,true);
 assert.equal(h.layer.dir,'rtl');assert.equal(h.skip.textContent,strings.ar.introSkip);
 h.run(0,2000);h.intro.skip();assert.equal(h.finished.length,0,'no cut in plain sight');
 assert.equal(h.intro.active,true);h.intro.update(2100);assert.ok(Number(h.veil.style.opacity)>.3);
 h.run(2150,2400);assert.equal(h.finished.length,1);assert.equal(h.finished[0].still,true);
});

test('a lost renderer skips gracefully and a stalled tab resumes instead of jumping to the end',()=>{
 const lost=harness({beats:()=>null});assert.equal(lost.intro.start(),true);
 assert.equal(lost.intro.active,false);assert.equal(lost.finished.length,1);
 const h=harness();h.intro.start();h.intro.update(1000);h.intro.update(61000);
 assert.ok(h.calls.at(-1).seconds<=.25);assert.equal(h.intro.active,true);
});

test('timing table: one or two soft sounds per beat on its visual beat, a bed, a resolve, peaks below the game',()=>{
 for(const [index] of INTRO_BEATS.entries()){
  const own=INTRO_CUES.filter(c=>c.beat===index);assert.ok(own.every(c=>introBeat(c.at)===index),'cue on its beat');
  const soft=own.filter(c=>c.kind!=='drone');assert.ok(soft.length>=1&&soft.length<=2,`beat ${index}: ${soft.length}`);
 }
 assert.ok(INTRO_CUES.some(c=>c.kind==='drone'&&c.at<.5),'a room-tone bed from the start');
 assert.ok(INTRO_CUES.every(c=>c.at>=0&&c.at<INTRO_SECONDS));assert.equal(INTRO_RESOLVE.length,3);
 for(const cue of [...INTRO_CUES,...INTRO_RESOLVE])assert.ok((cue.volume??.027)<=(cue.kind==='drone'?.018:.055));
 assert.deepEqual(introCuesIn(-Infinity,INTRO_SECONDS),INTRO_CUES);assert.deepEqual(introCuesIn(1,1),[]);
});

function fakeAudio(ready=false){
 return {ready,cues:[],fades:[],holds:[],introCue(cue,delay){this.cues.push({cue,delay})},
  introFade(s){this.fades.push(s)},holdLullaby(s){this.holds.push(s)}};
}
test('gesture gate: silent until audio is unlocked and on; no backlog burst; skip fades, play resolves',()=>{
 const audio=fakeAudio(false),sound=createIntroSound(audio);sound.start();
 for(let t=0;t<=2;t+=.05)assert.equal(sound.advance(t),0);assert.equal(audio.cues.length,0,'locked: silent');
 audio.ready=true;sound.advance(2);
 assert.ok(audio.cues.every(({cue})=>cue.at>2-STALE),'cues missed while locked are dropped');
 const sound2=createIntroSound(audio);audio.cues=[];sound2.start();
 for(let t=0;t<=INTRO_SECONDS;t+=1/60)sound2.advance(t);
 assert.equal(audio.cues.length,INTRO_CUES.length,'each cue once');
 assert.ok(audio.cues.every(({delay})=>delay>=0&&delay<=.13),'scheduled just ahead on the same clock');
 sound2.finish({skipped:false});assert.equal(audio.cues.length,INTRO_CUES.length+INTRO_RESOLVE.length);
 const sound3=createIntroSound(audio);sound3.start();sound3.advance(1);sound3.finish({skipped:true});
 assert.ok(audio.fades[0]>=.15&&audio.fades[0]<=.25,'skip fades over 150 to 250 ms');
 const muted=fakeAudio(false),quiet=createIntroSound(muted);quiet.start();quiet.finish({skipped:true});
 assert.deepEqual([muted.cues,muted.fades],[[],[]]);
});

function fakeContext(){
 const ramps=[],param=v=>({value:v,setValueAtTime(){},linearRampToValueAtTime(x,t){ramps.push([x,t])},
  exponentialRampToValueAtTime(){},cancelScheduledValues(){}});
 const node=()=>({gain:param(1),frequency:param(0),Q:param(0),type:'',connect(){},disconnect(){},start(){},stop(){},
  onended:null});
 return {ramps,currentTime:10,createGain:node,createOscillator:node,createBiquadFilter:node};
}
test('the intro bus ramps out instead of cutting, and nothing plays while muted',()=>{
 const audio=new DollhouseAudio();audio.context=fakeContext();audio.master=audio.context.createGain();
 assert.equal(audio.introCue(INTRO_CUES[2]),null,'muted or locked: nothing plays');
 audio.enabled=true;assert.ok(audio.introCue(INTRO_CUES[2]));assert.ok(audio.introCue(INTRO_CUES[0]));
 audio.introFade(.2);assert.deepEqual(audio.context.ramps.at(-1),[0,10.2]);audio.dispose=()=>{};
});

test('the stylesheet keeps Skip a 44px thumb-zone target clear of the safe areas, fades driven by script',()=>{
 const css=readFileSync(new URL('../src/intro.css',import.meta.url),'utf8');
 assert.match(css,/min-height:44px/);assert.match(css,/env\(safe-area-inset-bottom\)/);
 assert.match(css,/env\(safe-area-inset-right\)/);assert.match(css,/env\(safe-area-inset-left\)/);
 assert.doesNotMatch(css,/@keyframes|animation:/,'opacity is eased per frame, so reduced motion cannot turn it to a cut');
 assert.match(readFileSync(new URL('../index.html',import.meta.url),'utf8'),/src\/intro\.css/);
});
