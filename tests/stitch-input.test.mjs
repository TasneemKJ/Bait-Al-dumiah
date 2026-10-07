import test from 'node:test';
import assert from 'node:assert/strict';
import {createStitchGesture,createStitchKeyboard} from '../src/stitch-input.js';
import {createStitchUI} from '../src/stitch-ui.js';
import * as sim from '../src/simulation.js';

const pointer=(x,y,id=1,extra={})=>({pointerId:id,clientX:x,clientY:y,button:0,isPrimary:true,...extra});
const key=(code,extra={})=>({code,repeat:false,...extra});
const sewing={phase:'sew',needle:{x:-.6,y:.1},target:{x:.7,y:.8}};
const near=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-12,actual+' != '+expected);

test('grabbing the actual needle preserves its two-dimensional grip offset and actual tip',()=>{
 const g=createStitchGesture();
 assert.equal(g.down(pointer(100,100),null,sewing,{x:-.6,y:-.4}),false);
 assert.equal(g.down(pointer(100,100),'needle',sewing,{x:-.6,y:-.4}),true);
 assert.deepEqual(g.move(pointer(100,100),{x:-.6,y:-.4}),{x:-.6,y:.1,pressed:true});
 const moved=g.move(pointer(135,80),{x:-.25,y:-.6});
 near(moved.x,-.25);near(moved.y,-.1);assert.equal(moved.pressed,true);
 assert.deepEqual(g.up(pointer(135,80),'cloth'),{type:'release'});
});

test('unbounded projection preserves edge grabs while the final two-dimensional target is clamped',()=>{
 const g=createStitchGesture(),edge={phase:'sew',needle:{x:.9,y:-.9}};
 assert.equal(g.down(pointer(100,100),'needle',edge,{x:1.3,y:-1.5}),true);
 const moved=g.move(pointer(110,110),{x:1.4,y:-1.4});
 near(moved.x,1);near(moved.y,-.8);
 assert.deepEqual(g.move(pointer(900,900),{x:20,y:20}),{x:1,y:1,pressed:true});
 assert.deepEqual(g.move(pointer(-900,-900),{x:-20,y:-20}),{x:-1,y:-1,pressed:true});
});

test('one primary pointer owns the needle and foreign fingers or buttons cannot steal it',()=>{
 const g=createStitchGesture();
 assert.equal(g.down(pointer(10,10,1,{isPrimary:false}),'needle',sewing,{x:0,y:0}),false);
 assert.equal(g.down(pointer(10,10,1,{button:2}),'needle',sewing,{x:0,y:0}),false);
 assert.equal(g.down(pointer(10,10),'needle',sewing,{x:0,y:0}),true);
 assert.equal(g.down(pointer(40,50,2),'needle',sewing,{x:.5,y:.5}),false);
 assert.equal(g.move(pointer(40,50,2),{x:.5,y:.5}),null);
 assert.equal(g.up(pointer(40,50,2),'spool'),null);assert.equal(g.pointerId,1);
 assert.deepEqual(g.up(pointer(40,50),'cloth'),{type:'release'});assert.equal(g.pointerId,null);
});

test('spool and cloth taps need matching real targets and can never be a returned or sparse drag',()=>{
 const g=createStitchGesture();
 g.down(pointer(10,10),'spool',sewing,null);
 assert.deepEqual(g.up(pointer(12,11),'spool'),{type:'tap',target:'spool'});
 g.down(pointer(10,10),'cloth',sewing,null);
 assert.equal(g.up(pointer(11,10),'spool'),null);
 g.down(pointer(10,10),'spool',sewing,null);
 assert.equal(g.move(pointer(50,10),null),null);
 assert.equal(g.up(pointer(10,10),'spool'),null);
 g.down(pointer(10,10),'cloth',sewing,null);
 assert.equal(g.up(pointer(50,10),'cloth'),null);
});

test('finished needle and cloth are taps, with no new sewing control from their drags',()=>{
 const g=createStitchGesture(),finished={phase:'finished',needle:{x:0,y:0}};
 g.down(pointer(10,10),'needle',finished,null);
 assert.equal(g.phase,'finished');assert.equal(g.move(pointer(11,11),{x:.1,y:.2}),null);
 assert.deepEqual(g.up(pointer(11,11),'needle'),{type:'tap',target:'needle'});
 g.down(pointer(10,10),'cloth',finished,null);
 assert.deepEqual(g.up(pointer(10,10),'cloth'),{type:'tap',target:'cloth'});
});

test('cancellation and malformed samples cannot manufacture sewing controls or a repair tap',()=>{
 const g=createStitchGesture();
 assert.equal(g.down(pointer(NaN,10),'needle',sewing,{x:0,y:0}),false);
 assert.equal(g.down(pointer(10,10),'constructor',sewing,{x:0,y:0}),false);
 assert.equal(g.down(pointer(10,10),'needle',{phase:'sew',needle:{x:Infinity,y:0}},{x:0,y:0}),false);
 assert.equal(g.down(pointer(10,10),'needle',sewing,{x:0,y:NaN}),false);
 g.down(pointer(10,10),'needle',sewing,{x:0,y:0});
 assert.equal(g.move(pointer(20,20),{x:Infinity,y:0}),null);
 assert.deepEqual(g.up(pointer(Infinity,100),'cloth'),{type:'release'});
 g.down(pointer(10,10),'spool',sewing,null);
 assert.equal(g.up(pointer(10,Infinity),'spool'),null);
 g.down(pointer(10,10),'needle',sewing,{x:0,y:0});
 assert.equal(g.cancel(),true);assert.equal(g.up(pointer(30,30),'needle'),null);
 assert.equal(g.cancel(),false);assert.equal(g.phase,null);
});

test('arrow direction is two-dimensional, with diagonal speed equal to straight speed',()=>{
 const straight=createStitchKeyboard(),diagonal=createStitchKeyboard();
 straight.down(key('ArrowRight'));diagonal.down(key('ArrowRight'));diagonal.down(key('ArrowDown'));
 const a=straight.controls(.1,{x:0,y:0}),b=diagonal.controls(.1,{x:0,y:0});
 near(a.x,.09);near(a.y,0);near(Math.hypot(b.x,b.y),Math.hypot(a.x,a.y));near(b.x,b.y);
 assert.equal(a.pressed,false);assert.equal(b.pressed,false);
 diagonal.down(key('Space'));
 assert.equal(diagonal.controls(.1,{x:0,y:0}).pressed,true);
 diagonal.down(key('ArrowLeft'));diagonal.down(key('ArrowUp'));
 assert.deepEqual(diagonal.controls(.1,{x:.2,y:.3}),{x:.2,y:.3,pressed:true});
});

test('keyboard targets use the raw target and clamp time and both edges without submitting progress',()=>{
 const keys=createStitchKeyboard();keys.down(key('ArrowRight'));keys.down(key('ArrowUp'));keys.down(key('Space'));
 const moved=keys.controls(.1,{x:.3,y:.2,score:100,distance:9});
 near(moved.x,.3+.09/Math.SQRT2);near(moved.y,.2-.09/Math.SQRT2);
 assert.deepEqual(Object.keys(moved).sort(),['pressed','x','y']);
 assert.deepEqual(keys.controls(20,{x:.99,y:-.99}),{x:1,y:-1,pressed:true});
 assert.deepEqual(keys.controls(-1,{x:.3,y:.2}),{x:.3,y:.2,pressed:true});
 assert.equal(keys.controls(.1,{x:0,y:NaN}),null);
});

test('U, Enter and Escape are nonrepeating commands and modified or unrelated keys are ignored',()=>{
 const keys=createStitchKeyboard();
 assert.deepEqual(keys.down(key('KeyU')),{handled:true,action:'unpick'});
 assert.deepEqual(keys.down({key:'u'}),{handled:true,action:'unpick'});
 assert.deepEqual(keys.down(key('Enter')),{handled:true,action:'finish'});
 assert.deepEqual(keys.down(key('Escape')),{handled:true,action:'exit'});
 assert.deepEqual(keys.down(key('KeyU',{repeat:true})),{handled:true});
 assert.equal(keys.down(key('Space',{ctrlKey:true})),null);
 assert.equal(keys.down(key('KeyU',{metaKey:true})),null);
 assert.equal(keys.down(key('ArrowLeft',{altKey:true})),null);
 assert.equal(keys.down(key('KeyH')),null);assert.equal(keys.down(key('constructor')),null);
 assert.equal(keys.active,false);
});

test('key release and cancellation remove held controls; a canceled keyboard never resumes movement',()=>{
 const keys=createStitchKeyboard();keys.down(key('Space'));keys.down(key('ArrowLeft'));
 assert.equal(keys.active,true);assert.equal(keys.up(key('Space')),true);
 assert.equal(keys.controls(.1,{x:0,y:0}).pressed,false);
 keys.cancel();assert.equal(keys.active,false);
 assert.deepEqual(keys.controls(.1,{x:.4,y:.2}),{x:.4,y:.2,pressed:false});
 assert.equal(keys.up(key('ArrowLeft')),false);
 assert.deepEqual(keys.controls(NaN,{x:.4,y:.2}),{x:.4,y:.2,pressed:false});
});

// Small DOM event fixture for the input adapter, not a layout or WebGL test.
// Real browser checks remain responsible for target projection and screenshots.
function adapterFixture(){
 const oldDocument=globalThis.document,oldWindow=globalThis.window;
 class Node extends EventTarget{
  constructor(tag='div'){
   super();this.tag=tag;this.attrs=new Map();this.children=[];this.parentElement=null;this.style={cursor:''};this.hidden=false;this.captures=new Set();this._text='';
   const attr=key=>'data-'+key.replace(/[A-Z]/g,m=>'-'+m.toLowerCase());
   this.dataset=new Proxy({},{get:(_,key)=>this.getAttribute(attr(key)),set:(_,key,value)=>{this.setAttribute(attr(key),value);return true}});
   this.classList={remove:name=>this.classList.toggle(name,false),toggle:(name,force)=>{const names=new Set(this.className.split(/\s+/).filter(Boolean));const on=force??!names.has(name);if(on)names.add(name);else names.delete(name);this.className=[...names].join(' ');return on}};
  }
  setAttribute(name,value){this.attrs.set(name,String(value))}
  getAttribute(name){return this.attrs.get(name)??null}
  removeAttribute(name){this.attrs.delete(name)}
  set className(value){this.setAttribute('class',value)}get className(){return this.getAttribute('class')??''}
  append(node){node.remove();node.parentElement=this;this.children.push(node)}
  remove(){if(this.parentElement)this.parentElement.children=this.parentElement.children.filter(c=>c!==this);this.parentElement=null}
  contains(node){return node===this||this.children.some(c=>c.contains(node))}
  matches(selector){return selector.split(',').some(part=>{
   const tokens=part.trim().match(/^[\w-]+|[.#][\w-]+|\[[^\]]+\]/g)??[];
   return tokens.length>0&&tokens.every(token=>{
    if(token[0]==='.')return this.className.split(/\s+/).includes(token.slice(1));
    if(token[0]==='#')return this.getAttribute('id')===token.slice(1);
    if(token[0]==='['){const [,name,value]=token.match(/^\[([^=\]]+)(?:="?([^"\]]*)"?)?\]$/);return value===undefined?this.attrs.has(name):this.getAttribute(name)===value}
    return this.tag===token;
   });
  })}
  closest(selector){return this.matches(selector)?this:this.parentElement?.closest(selector)??null}
  querySelector(selector){for(const child of this.children){if(child.matches(selector))return child;const found=child.querySelector(selector);if(found)return found}return null}
  set innerHTML(html){
   for(const child of this.children)child.parentElement=null;this.children=[];const stack=[this];
   for(const match of html.matchAll(/<(\/?)([\w-]+)([^>]*)>/g)){
    const [,closing,tag,attributes]=match;
    if(closing){if(stack.length>1)stack.pop();continue}
    const node=new Node(tag);for(const [,name,value] of attributes.matchAll(/([\w-]+)="([^"]*)"/g))node.setAttribute(name,value);
    stack.at(-1).append(node);if(!attributes.endsWith('/')&&!['input','br','hr','img'].includes(tag))stack.push(node);
   }
  }
  set textContent(value){this._text=String(value);for(const child of this.children)child.parentElement=null;this.children=[]}
  get textContent(){return this._text+this.children.map(c=>c.textContent).join('')}
  focus(){if(document.activeElement===this)return;document.activeElement?.dispatchEvent(new Event('focusout'));document.activeElement=this}
  setPointerCapture(id){this.captures.add(id)}hasPointerCapture(id){return this.captures.has(id)}
  releasePointerCapture(id){if(!this.captures.delete(id))return;emit(this,'lostpointercapture',{pointerId:id})}
 }
 const doc=new EventTarget();doc.hidden=false;doc.createElement=tag=>new Node(tag);globalThis.document=doc;globalThis.window=new EventTarget();
 const app=new Node(),host=new Node(),canvas=new Node('canvas');app.append(canvas);app.append(host);
 const state=sim.createState();sim.beginActivity(state,'stitch');const commands=[];
 const dispatch=(action,value)=>{
  commands.push({action,value});
  if(action==='stitch-control')return sim.controlStitch(state,value);
  if(action==='stitch-release')return sim.releaseStitch(state);
  if(action==='stitch-unpick')return sim.unpickStitch(state);
  if(action==='stitch-finish')return sim.finishStitch(state);
  if(action==='stitch-exit'){sim.endActivity(state);return {ok:true}}
 };
 const view=createStitchUI(host,canvas,()=>state,dispatch,{pick:x=>x<150?'needle':x<250?'spool':'cloth',pointAt:(x,y)=>({x:(x-100)/100,y:(y-100)/100})});
 return {state,commands,app,host,canvas,view,root:app.querySelector('.stitch-playfield'),close(){view.dispose();globalThis.document=oldDocument;globalThis.window=oldWindow}};
}
function emit(target,type,properties={}){const e=new Event(type,{bubbles:true,cancelable:true});for(const [key,value] of Object.entries(properties))Object.defineProperty(e,key,{value,configurable:true});target.dispatchEvent(e);return e}


test('finished grip and cloth taps survive intervening frames and dispatch exactly once',()=>{
 const f=adapterFixture();try{
  f.state.activities.active.phase='finished';
  f.state.activities.active.result={score:85,reward:7,bonus:0,practice:false};
  f.view.update(0);
  emit(f.canvas,'pointerdown',pointer(100,100));f.view.update(.016);emit(f.canvas,'pointerup',pointer(100,100));
  assert.equal(f.commands.filter(c=>c.action==='stitch-replay').length,1);
  emit(f.canvas,'pointerdown',pointer(300,100));f.view.update(.016);emit(f.canvas,'pointerup',pointer(300,100));
  assert.equal(f.commands.filter(c=>c.action==='stitch-exit').length,1);
 }finally{f.close()}
});

test('raw pointer input and house refreshes preserve actual needle state until simulation advances',()=>{
 const f=adapterFixture();try{
  const original={...f.state.activities.active.needle};
  f.state.activities.active.target={x:.9,y:.8};
  emit(f.canvas,'pointerdown',pointer(100,100));
  assert.deepEqual(f.state.activities.active.target,original,'regrab targets the actual needle, never an old pursuit');
  emit(f.canvas,'pointermove',pointer(130,120));
  assert.deepEqual(f.state.activities.active.needle,original);
  assert.equal(f.state.activities.active.distance,0);
  assert.equal(f.state.activities.active.pressed,true);assert.equal(f.canvas.hasPointerCapture(1),true);
  f.host.innerHTML='<div class="replacement-controls"></div>';f.view.update(.016);
  assert.equal(f.app.contains(f.root),true);assert.equal(f.root.parentElement,f.app);assert.equal(f.canvas.hasPointerCapture(1),true);
  emit(f.canvas,'pointerup',pointer(130,120));
  assert.equal(f.state.activities.active.pressed,false);assert.equal(f.canvas.hasPointerCapture(1),false);
  assert.deepEqual(f.state.activities.active.target,original);
  for(const command of f.commands.filter(c=>c.action==='stitch-control'))assert.deepEqual(Object.keys(command.value).sort(),['pressed','x','y']);
 }finally{f.close()}
});

test('keyboard release stops outstanding pursuit while subsequent explicit arrows move the lifted target',()=>{
 const f=adapterFixture();try{
  const a=f.state.activities.active,start={...a.needle};
  emit(window,'keydown',key('ArrowRight'));f.view.update(.1);
  near(a.target.x,start.x+.09);assert.equal(a.pressed,false);
  emit(window,'keyup',key('ArrowRight'));assert.deepEqual(a.target,a.needle);
  emit(window,'keydown',key('Space'));emit(window,'keydown',key('ArrowRight'));f.view.update(.1);
  assert.equal(a.pressed,true);assert.ok(a.target.x>a.needle.x);
  a.capture={section:0,edge:0,point:{x:0,y:0},alignmentWeight:1};
  emit(window,'keyup',key('Space'));
  assert.equal(a.pressed,false);assert.equal(a.capture,null);assert.deepEqual(a.target,a.needle);
  f.view.update(.1);assert.ok(a.target.x>a.needle.x);assert.equal(a.pressed,false);
  emit(window,'keyup',key('ArrowRight'));assert.deepEqual(a.target,a.needle);
 }finally{f.close()}
});

test('foreign pointer cancellation and keyboard commands cannot steal an active needle',()=>{
 const f=adapterFixture();try{
  emit(f.canvas,'pointerdown',pointer(100,100));
  const before=f.commands.length;
  emit(f.canvas,'pointercancel',{pointerId:2});
  emit(f.canvas,'pointermove',pointer(140,140,2));
  emit(window,'keydown',key('KeyU'));emit(window,'keydown',key('Space'));
  assert.equal(f.commands.length,before);assert.equal(f.state.activities.active.pressed,true);
  emit(f.canvas,'pointercancel',{pointerId:1});
  assert.equal(f.state.activities.active.pressed,false);assert.equal(f.canvas.hasPointerCapture(1),false);
 }finally{f.close()}
});

test('pause, hidden, blur, resize, modal, lost capture and context loss cancel ownership and pursuit',()=>{
 const cases=[
  ['pause',f=>{f.state.paused=true;f.view.update(0)}],
  ['hidden',()=>{document.hidden=true;emit(document,'visibilitychange')}],
  ['blur',()=>emit(window,'blur')],
  ['resize',()=>emit(window,'resize')],
  ['orientation',()=>emit(window,'orientationchange')],
  ['modal',f=>{f.host.innerHTML='<dialog open=""></dialog>';f.view.update(0)}],
  ['capture',f=>emit(f.canvas,'lostpointercapture',{pointerId:1})],
  ['context',f=>emit(f.canvas,'webglcontextlost')],
  ['focus',f=>emit(f.canvas,'focusout')],
  ['invalid projection',f=>emit(f.canvas,'pointermove',pointer(NaN,120))],
  ['mouse button lost',f=>emit(f.canvas,'pointermove',pointer(120,120,1,{pointerType:'mouse',buttons:0}))],
  ['pointer cancel',f=>emit(f.canvas,'pointercancel',{pointerId:1})],
 ];
 for(const [name,trigger] of cases){
  const f=adapterFixture();try{
   emit(f.canvas,'pointerdown',pointer(100,100));emit(f.canvas,'pointermove',pointer(125,110));
   f.state.activities.active.capture={section:0,edge:0,point:{x:0,y:0},alignmentWeight:1};
   trigger(f);
   const a=f.state.activities.active;
   assert.equal(a.pressed,false,name);assert.equal(a.capture,null,name);assert.deepEqual(a.target,a.needle,name);
   assert.equal(f.canvas.hasPointerCapture(1),false,name);
   f.state.paused=false;document.hidden=false;f.host.innerHTML='';f.view.update(.1);
   emit(f.canvas,'pointermove',pointer(150,140));
   assert.equal(a.pressed,false,name+' never resumes from an old gesture');
  }finally{f.close()}
 }
});

test('unrelated form shortcuts are ignored, and disposal removes listeners and restores canvas semantics',()=>{
 const f=adapterFixture();try{
  assert.equal(f.canvas.getAttribute('role'),'application');assert.equal(document.activeElement,f.canvas);
  const input=document.createElement('input');
  emit(window,'keydown',key('Space',{target:input}));
  assert.equal(f.state.activities.active.pressed,false);
  emit(window,'keydown',key('Space'));assert.equal(f.state.activities.active.pressed,true);
  f.view.dispose();const before=f.commands.length;
  emit(window,'keydown',key('Space'));emit(f.canvas,'pointerdown',pointer(100,100));
  assert.equal(f.commands.length,before);assert.equal(f.state.activities.active.pressed,false);
  assert.equal(f.canvas.getAttribute('role'),null);assert.equal(f.canvas.getAttribute('aria-keyshortcuts'),null);
  assert.equal(f.host.dataset.stitchActive,'false');assert.equal(f.app.contains(f.root),false);
 }finally{f.close()}
});

test('accessible announcements change for a loose section rather than every needle sample',()=>{
 const f=adapterFixture();try{
  const announcement=f.root.querySelector('#stitch-work-announcement'),before=announcement.textContent;
  const readout=f.root.querySelector('#stitch-needle-readout').textContent;
  f.state.activities.active.needle.x+=.02;f.state.activities.active.target={...f.state.activities.active.needle};
  f.state.activities.active.distance=.02;f.view.update(.016);
  assert.equal(announcement.textContent,before);
  assert.notEqual(f.root.querySelector('#stitch-needle-readout').textContent,readout);
  f.state.activities.active.loose=true;f.view.update(.016);
  assert.notEqual(announcement.textContent,before);assert.ok(announcement.textContent.includes('spool'));
 }finally{f.close()}
});
