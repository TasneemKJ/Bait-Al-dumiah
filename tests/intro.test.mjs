import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {INTRO_BEATS,SAVE_KEY} from '../src/content.js';
import {strings,introLines} from '../src/i18n.js';
import {createState,claimIntro,readSave,restore} from '../src/simulation.js';
import {createHomeSession} from '../src/home-session.js';
import {INTRO_SECONDS,INTRO_HANDOFF,introKeys,introPose,introVelocity,introVeil,
  VEIL_CUT} from '../src/render/intro-camera.js';
import {createCameraMove,springStep} from '../src/render/camera-motion.js';
import {cameraApi} from '../src/render/world-camera.js';
import {framing} from '../src/render/visual-policy.js';
import {bootHome} from './helpers/main-home-harness.mjs';

const VIEWS=[[390,844],[360,640],[412,915],[844,390],[1280,800]];
const speed=v=>Math.hypot(...v.slice(0,6));

test('the intro is two or three beats lasting six to ten seconds, each with one short bilingual line',()=>{
 assert.ok(INTRO_BEATS.length>=2&&INTRO_BEATS.length<=3);
 assert.ok(INTRO_SECONDS>=6&&INTRO_SECONDS<=10,`${INTRO_SECONDS} s`);
 for(const beat of INTRO_BEATS)for(const locale of ['en','ar']){
  const line=strings[locale][beat.line];assert.ok(line?.trim(),locale+beat.line);
  assert.ok(line.length<=56,`one short line: ${line}`);assert.equal(/\n/.test(line),false);
  if(locale==='ar')assert.match(line,/[؀-ۿ]/);
 }
 for(const key of ['introSkip','introSkipLabel','introSetting','watchIntro','introSettingHelp'])
  for(const locale of ['en','ar'])assert.ok(strings[locale][key]?.trim(),locale+key);
});

test('the line table is {beat, en, ar} per beat with an empty narration slot for later',()=>{
 const lines=introLines('ar');assert.equal(lines.length,INTRO_BEATS.length);
 for(const [i,line] of lines.entries()){
  assert.equal(line.beat,INTRO_BEATS[i].id);assert.equal(line.en,strings.en[INTRO_BEATS[i].line]);
  assert.equal(line.ar,strings.ar[INTRO_BEATS[i].line]);assert.equal(line.text,line.ar);assert.equal(line.voice,null);
 }
});

test('the path eases out of rest and never stops dead between beats, and is still moving at the handoff',()=>{
 for(const [w,h] of VIEWS){
  const keys=introKeys(w,h);
  assert.ok(speed(introVelocity(keys,1/240))<.05,'starts from rest, not at full speed');
  const early=speed(introVelocity(keys,.1)),later=speed(introVelocity(keys,.6));assert.ok(later>early);
  const boundary=INTRO_BEATS[0].seconds;
  for(const t of [boundary-.02,boundary,boundary+.02])assert.ok(speed(introVelocity(keys,t))>.3,`moving at ${t}`);
  const before=introVelocity(keys,boundary-.01),after=introVelocity(keys,boundary+.01);
  assert.ok(Math.hypot(...before.map((v,i)=>v-after[i]))<.05*speed(before),'velocity is continuous across beats');
  assert.ok(speed(introVelocity(keys,INTRO_HANDOFF))>.2,'carries velocity into the settle glide');
 }
});

test('the camera path stays inside the orbit and zoom limits the controls enforce',()=>{
 const keys=introKeys(390,844);
 for(let s=0;s<=INTRO_HANDOFF;s+=1/60){
  const pose=introPose(keys,s),sph=new T.Spherical().setFromVector3(new T.Vector3(...pose.eye));
  assert.ok(Math.abs(sph.theta)<=.48+1e-9,`azimuth ${sph.theta} at ${s}`);
  assert.ok(sph.phi>=1.10-1e-9&&sph.phi<=1.50+1e-9,`polar ${sph.phi} at ${s}`);
  assert.ok(pose.zoom>=.8&&pose.zoom<=3.5,`zoom ${pose.zoom}`);
 }
});

test('reduced motion: still shots that change only under the raised paper veil',()=>{
 const keys=introKeys(390,844);let start=0;
 for(const [index,beat] of INTRO_BEATS.entries()){
  const settled=introPose(keys,start+VEIL_CUT+.05,true),late=introPose(keys,start+beat.seconds-.05,true);
  assert.deepEqual(settled.target,late.target,'no camera travel within a shot');
  assert.deepEqual(late.target,keys[index+1].target);
  if(index>0){assert.deepEqual(introPose(keys,start+.1,true).target,keys[index].target,'cut waits for the veil');
   assert.ok(introVeil(start+VEIL_CUT,true)>=.85,'the cut happens under the veil');
   assert.ok(introVeil(start-.5,true)<.01&&introVeil(start+1,true)<.01,'the veil lifts again')}
  start+=beat.seconds;
 }
 assert.equal(introVeil(INTRO_BEATS[0].seconds+VEIL_CUT,false),0,'the moving version never dips');
 assert.equal(introVeil(0),1);assert.ok(introVeil(.55)>0&&introVeil(.55)<1);assert.equal(introVeil(1.2),0);
});

test('the critically damped spring never overshoots, from rest or from a carried velocity toward the goal',()=>{
 for(const v0 of [0,-1,-5,3]){let x=1,v=v0;const omega=2*Math.PI/.45;
  for(let i=0;i<240;i++){[x,v]=springStep(x,v,omega,1/60);if(v0<=0)assert.ok(x>=-1e-9,`overshot from ${v0}`)}
  assert.ok(Math.abs(x)<1e-6)}
});

test('the save field: a fresh house plays it once, every older save and every round trip never replays it',()=>{
 const fresh=createState();assert.equal(fresh.introSeen,false);
 assert.equal(claimIntro(fresh),true);assert.equal(claimIntro(fresh),false);
 assert.equal(restore(JSON.stringify(fresh)).introSeen,true);
 const legacy=createState();delete legacy.introSeen;assert.equal(restore(JSON.stringify(legacy)).introSeen,true);
 for(const junk of ['yes',1,null,{}]){const save=createState();save.introSeen=junk;
  assert.equal(restore(JSON.stringify(save)).introSeen,true,`clamps ${JSON.stringify(junk)}`)}
 assert.equal(restore(JSON.stringify(createState())).introSeen,false);assert.equal(readSave(null).state.introSeen,false);
});

test('Home: a first launch is pending, an unreadable earlier save is a returning player',()=>{
 const store=raw=>({getItem:key=>key===SAVE_KEY?raw:null,setItem(){}});
 assert.equal(createHomeSession({storage:store(null)}).state.introSeen,false);
 assert.equal(createHomeSession({storage:store('{broken')}).state.introSeen,true);
 const old=createState();delete old.introSeen;
 assert.equal(createHomeSession({storage:store(JSON.stringify(old))}).state.introSeen,true);
});

function rig(w=390,h=844){
 const camera=new T.OrthographicCamera(-5,5,5,-5,.1,100);camera.position.set(5.8,5.6,24);
 const controls={target:new T.Vector3(),enabled:true,enableDamping:false,minZoom:.8,maxZoom:3.5,
  update(){camera.lookAt(this.target)}};
 const cameraMove=createCameraMove(camera,controls),st={requestedEnabled:true,reducedMotion:false,lost:false};
 let busy=false;
 const api=cameraApi({st,canvas:{clientWidth:w,clientHeight:h},camera,controls,house:null,residents:null,
  cameraMove,presentation:{value:{}},working:()=>busy,focusPose:()=>null});
 const sample=()=>[...controls.target.toArray(),...camera.position.toArray(),camera.zoom,camera.top-camera.bottom];
 return {camera,controls,cameraMove,api,st,sample,work:value=>{busy=value}};
}
// Plays the intro through the world API at 60 fps, ticking the spring the way the render loop does.
function play(r,until,{still=false,skipAt=null}={}){
 const frames=[];for(let i=0;i*1/60<=until;i++){const t=i/60;
  if(skipAt!==null&&t>=skipAt){if(!frames.skipped){r.api.introSkip(skipAt,still);r.api.focusRoom('kitchen');
   frames.skipped=true}}else r.api.introFrame(t,still);
  if(r.cameraMove.active)r.cameraMove.tick(1/60);frames.push(r.sample())}
 return frames;
}
const step=(frames,i)=>frames[i].map((v,c)=>v-frames[i-1][c]);

test('the settle beat is the play spring: velocity carries across the handoff, nothing overshoots, it lands exactly',()=>{
 for(const [w,h] of VIEWS){
  const r=rig(w,h),frames=play(r,INTRO_SECONDS+4),hand=Math.round(INTRO_HANDOFF*60);
  const before=speed(step(frames,hand-1)),after=speed(step(frames,hand+1));
  assert.ok(after>.6*before&&after<1.6*before,`no seam at the handoff: ${before} then ${after}`);
  const goal=framing(w,h,'kitchen',{}),end=[...goal.target,...goal.target.map((v,i)=>v+[5.8,5.6,24][i]),goal.zoom];
  for(let c=0;c<7;c++){const sign=Math.sign(frames[hand][c]-end[c]);
   for(const f of frames.slice(hand))assert.ok(sign*(f[c]-end[c])>=-1e-6,`channel ${c} overshot at ${w}x${h}`)}
  assert.deepEqual(frames.at(-1).slice(0,7).map(v=>+v.toFixed(5)),end.map(v=>+v.toFixed(5)));
  assert.equal(r.cameraMove.active,false);
  r.api.focusRoom('kitchen');assert.equal(r.cameraMove.active,false,'asking for where it already is moves nothing');
 }
});

test('Skip takes over from the live pose and velocity, never a cut, at any moment of the intro',()=>{
 for(const at of [.4,1.5,INTRO_BEATS[0].seconds,4.5,INTRO_HANDOFF+.5]){
  const r=rig(),frames=play(r,at+6,{skipAt:at}),i=Math.ceil(at*60);
  const before=step(frames,i-1),after=step(frames,i+1),b=speed(before),a=speed(after);
  assert.ok(a<Math.max(.08,3*b),`no jump after a skip at ${at}: ${b} then ${a}`);
  if(b>.01)assert.ok(after.slice(0,6).reduce((sum,v,c)=>sum+v*before[c],0)>-.2*b*b,`keeps its heading at ${at}`);
  assert.equal(r.cameraMove.active,false,'and still lands in the kitchen');
 }
});

test('the earlier glide lesson holds: disabling input never freezes the intro or its settle glide',()=>{
 const r=rig();r.api.introFrame(0);r.api.setEnabled(false);assert.equal(r.controls.enabled,false);
 assert.equal(r.api.introFrame(INTRO_BEATS[0].seconds+.5).beat,1);r.api.introFrame(INTRO_HANDOFF+.01);
 assert.equal(r.cameraMove.active,true);r.api.setEnabled(false);assert.equal(r.cameraMove.active,true);
 r.api.zoom(1.1);assert.equal(r.cameraMove.active,false,'direct camera input still takes the camera');
});

test('a room visit retargeted mid-glide keeps its velocity instead of restarting from rest',()=>{
 const r=rig();r.api.focusRoom('studio');for(let i=0;i<6;i++)r.cameraMove.tick(1/60);
 const moving=speed(r.cameraMove.velocity());assert.ok(moving>.5);
 r.api.focusRoom('bedroom');assert.ok(speed(r.cameraMove.velocity())>.5*moving);
});

test('the intro steps aside when the renderer is lost or a ritual owns the camera',()=>{
 const lost=rig();lost.st.lost=true;assert.equal(lost.api.introFrame(1),null);assert.equal(lost.api.introSkip(1),false);
 const working=rig();working.work(true);assert.equal(working.api.introFrame(1),null);
});

test('main: a fresh Play holds the house still under the intro, and a skip hands play the kitchen glide',()=>{
 const game=bootHome({introHolds:true});game.button('play').click();
 assert.equal(game.intro().starts,1);assert.equal(game.host.inert,true,'the HUD waits behind the intro');
 assert.deepEqual(game.focuses,[]);assert.equal(game.state().introSeen,true);
 assert.equal(JSON.parse(game.storage.get(SAVE_KEY)).introSeen,true,'claimed in the entry save');
 const before=game.state().elapsed;for(let now=100;now<=3000;now+=100)game.frame(now);
 assert.equal(game.state().elapsed,before,'no simulation time passes during the intro');
 assert.ok(game.intro().updates>0);game.key('h','KeyH');assert.deepEqual(game.focuses,[]);
 game.intro().skip();assert.deepEqual(game.skips,[[1,false]]);assert.deepEqual(game.focuses,['kitchen']);
 assert.equal(game.host.inert,false);game.frame(3100);game.frame(3200);assert.ok(game.state().elapsed>before);
});

test('main: a grab leaves the camera where the player caught it',()=>{
 const game=bootHome({introHolds:true});game.button('play').click();
 game.intro().skip({skipped:true,grab:true,seconds:2,still:false});
 assert.deepEqual(game.skips,[]);assert.deepEqual(game.focuses,[]);assert.equal(game.host.inert,false);
});

test('main: the Play tap unlocks sound in the same gesture that starts the intro, only when sound is on',()=>{
 const on=bootHome({introHolds:true,preferences:JSON.stringify({muted:false,_base:null})});
 on.button('play').click();assert.equal(on.intro().starts,1);assert.ok(on.audioEvents.includes('enable'));
 const off=bootHome({introHolds:true});off.button('play').click();
 assert.equal(off.intro().starts,1);assert.equal(off.audioEvents.includes('enable'),false,'muted stays silent');
});

test('main: reload and old saves never replay the intro; Settings can replay it on request',()=>{
 const first=bootHome();first.button('play').click();const raw=first.storage.get(SAVE_KEY);
 const again=bootHome({saved:raw,introHolds:true});again.button('play').click();assert.equal(again.intro().starts,0);
 const legacy=createState();delete legacy.introSeen;
 const old=bootHome({saved:JSON.stringify(legacy),introHolds:true});old.button('play').click();
 assert.equal(old.intro().starts,0);
 old.dispatch()('watch-intro');assert.equal(old.intro().starts,1);assert.equal(old.host.inert,true);
 old.dispatch()('watch-intro');assert.equal(old.intro().starts,1,'one intro at a time');
});
