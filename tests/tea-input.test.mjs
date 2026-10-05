import test from 'node:test';
import assert from 'node:assert/strict';
import {createTeaGesture,createTeaKeyboard,TEA_INPUT} from '../src/tea-input.js';
import {createTeaUI} from '../src/tea-ui.js';
import * as sim from '../src/simulation.js';

const pointer=(x,y,id=1,extra={})=>({pointerId:id,clientX:x,clientY:y,button:0,isPrimary:true,...extra});
const key=(code,extra={})=>({code,repeat:false,...extra});
const pouring={phase:'pour',aim:.2};

test('only the actual pot starts a pour, and grabbing its body preserves the spout aim',()=>{
 const g=createTeaGesture();
 assert.equal(g.down(pointer(100,100),null,pouring,.4),false);
 assert.equal(g.down(pointer(100,100),'pot',pouring,.4),true);
 assert.deepEqual(g.move(pointer(100,100),.4),{aim:.2,tilt:0,pressed:true});
 const moved=g.move(pointer(140,100),.65);
 assert.ok(Math.abs(moved.aim-.45)<1e-12);
 assert.equal(moved.tilt,0);
 assert.deepEqual(g.up(pointer(140,100),'cup:0'),{type:'release'});
});

test('downward travel controls bounded tilt after a dead zone; upward travel never pours',()=>{
 const g=createTeaGesture();g.down(pointer(100,100),'pot',pouring,.2);
 assert.equal(g.move(pointer(100,75),.2).tilt,0);
 assert.equal(g.move(pointer(100,100+TEA_INPUT.tiltDeadzone),.2).tilt,0);
 assert.equal(g.move(pointer(100,100+TEA_INPUT.tiltDeadzone+TEA_INPUT.tiltDistance/2),.2).tilt,.5);
 assert.deepEqual(g.move(pointer(900,900),9),{aim:1,tilt:1,pressed:true});
 assert.equal(g.move(pointer(-100,100),-9).aim,-1);
});

test('one primary pointer owns the pot and foreign fingers cannot move or release it',()=>{
 const g=createTeaGesture();
 assert.equal(g.down(pointer(10,10,1,{isPrimary:false}),'pot',pouring,.2),false);
 assert.equal(g.down(pointer(10,10,1,{button:2}),'pot',pouring,.2),false);
 assert.equal(g.down(pointer(10,10),'pot',pouring,.2),true);
 assert.equal(g.down(pointer(40,50,2),'pot',pouring,.5),false);
 assert.equal(g.move(pointer(40,100,2),.7),null);
 assert.equal(g.up(pointer(40,100,2),'tray'),null);
 assert.equal(g.pointerId,1);
 assert.deepEqual(g.up(pointer(40,100),'tray'),{type:'release'});
 assert.equal(g.pointerId,null);
});

test('cup and tray taps require matching real targets and no earlier drag',()=>{
 const g=createTeaGesture();
 g.down(pointer(10,10),'cup:1',pouring,0);
 assert.deepEqual(g.up(pointer(12,11),'cup:1'),{type:'tap',target:'cup:1'});
 g.down(pointer(10,10),'tray',pouring,0);
 assert.equal(g.up(pointer(11,10),'cup:0'),null);
 g.down(pointer(10,10),'tray',pouring,0);
 assert.equal(g.move(pointer(50,10),0),null);
 assert.equal(g.up(pointer(10,10),'tray'),null,'returning after a drag is not a tap');
 g.down(pointer(10,10),'tray',pouring,0);
 assert.equal(g.up(pointer(50,10),'tray'),null,'a missing move event cannot turn a drag into a tap');
});

test('the served pot is a replay tap, never a new physical pour while it is held',()=>{
 const g=createTeaGesture();g.down(pointer(10,10),'pot',{phase:'served',aim:0},0);
 assert.equal(g.move(pointer(11,11),0),null);
 assert.deepEqual(g.up(pointer(11,11),'pot'),{type:'tap',target:'pot'});
});

test('cancellation and malformed samples cannot leave a stale pointer or manufacture an action',()=>{
 const g=createTeaGesture();
 assert.equal(g.down(pointer(NaN,10),'pot',pouring,0),false);
 assert.equal(g.down(pointer(10,10),'cup:99',pouring,0),false);
 assert.equal(g.down(pointer(10,10),'pot',{phase:'pour',aim:Infinity},0),false);
 assert.equal(g.down(pointer(10,10),'pot',pouring,NaN),false);
 g.down(pointer(10,10),'pot',pouring,0);
 assert.equal(g.move(pointer(30,30),NaN),null);
 assert.deepEqual(g.up(pointer(Infinity,100),'tray'),{type:'release'});
 g.down(pointer(10,10),'tray',pouring,0);
 assert.equal(g.up(pointer(10,Infinity),'tray'),null);
 g.down(pointer(10,10),'pot',pouring,0);assert.equal(g.cancel(),true);
 assert.equal(g.up(pointer(10,100),'pot'),null);
 assert.equal(g.cancel(),false);
});

test('held keyboard input drives the same continuous aim and tilt with bounded frame time',()=>{
 const keys=createTeaKeyboard();
 assert.deepEqual(keys.down(key('ArrowRight')),{handled:true});
 assert.deepEqual(keys.down(key('Space')),{handled:true});
 const moving=keys.controls(.1,0);
 assert.ok(Math.abs(moving.aim-.09)<1e-12);
 assert.equal(moving.tilt,TEA_INPUT.keyboardTilt);assert.equal(moving.pressed,true);
 assert.deepEqual(keys.controls(20,.99),{aim:1,tilt:TEA_INPUT.keyboardTilt,pressed:true});
 keys.down(key('ArrowLeft'));
 assert.equal(keys.controls(.1,.3).aim,.3,'opposite arrows cancel each other');
 assert.equal(keys.up(key('Space')),true);
 assert.deepEqual(keys.controls(.1,.3),{aim:.3,tilt:0,pressed:false});
});

test('single keyboard commands do not repeat; modified shortcuts and unrelated keys are ignored',()=>{
 const keys=createTeaKeyboard();
 assert.deepEqual(keys.down(key('KeyE')),{handled:true,action:'empty'});
 assert.deepEqual(keys.down(key('Enter')),{handled:true,action:'serve'});
 assert.deepEqual(keys.down(key('Escape')),{handled:true,action:'exit'});
 assert.deepEqual(keys.down(key('Enter',{repeat:true})),{handled:true});
 assert.equal(keys.down(key('Space',{ctrlKey:true})),null);
 assert.equal(keys.down(key('KeyE',{metaKey:true})),null);
 assert.equal(keys.down(key('ArrowLeft',{altKey:true})),null);
 assert.equal(keys.down(key('KeyH')),null);
 assert.equal(keys.down(key('constructor')),null);
 assert.equal(keys.active,false);
});

test('keyboard cancellation releases pouring and aiming before pause, blur or exit can resume',()=>{
 const keys=createTeaKeyboard();keys.down(key('Space'));keys.down(key('ArrowLeft'));
 assert.equal(keys.active,true);keys.cancel();assert.equal(keys.active,false);
 assert.deepEqual(keys.controls(.1,.4),{aim:.4,tilt:0,pressed:false});
 assert.equal(keys.up(key('Space')),false);
 assert.deepEqual(keys.controls(NaN,.4),{aim:.4,tilt:0,pressed:false});
 assert.equal(keys.controls(.1,NaN),null);
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
 const state=sim.createState();sim.beginActivity(state,'tea');const commands=[];
 const dispatch=(action,value)=>{
  commands.push({action,value});
  if(action==='tea-control')return sim.controlTea(state,value);
  if(action==='tea-release')return sim.releaseTea(state);
  if(action==='tea-empty')return sim.emptyTeaCup(state,value);
  if(action==='tea-serve')return sim.serveTea(state);
 };
 const view=createTeaUI(host,canvas,()=>state,dispatch,{pick:x=>x<150?'pot':x<250?'cup:0':'tray',aimAt:x=>(x-100)/100});
 return {state,commands,app,host,canvas,view,root:app.querySelector('.tea-playfield'),close(){view.dispose();globalThis.document=oldDocument;globalThis.window=oldWindow}};
}
function emit(target,type,properties={}){const e=new Event(type,{bubbles:true,cancelable:true});Object.assign(e,properties);target.dispatchEvent(e);return e}

test('served scene pot and tray taps survive an intervening UI frame and dispatch exactly once',()=>{
 const f=adapterFixture();try{
  f.state.activities.active.phase='served';f.state.activities.active.result={score:85,reward:7,bonus:0,practice:false};f.view.update(0);
  emit(f.canvas,'pointerdown',pointer(100,100));f.view.update(.016);emit(f.canvas,'pointerup',pointer(100,100));
  assert.equal(f.commands.filter(c=>c.action==='tea-replay').length,1);
  emit(f.canvas,'pointerdown',pointer(300,100));f.view.update(.016);emit(f.canvas,'pointerup',pointer(300,100));
  assert.equal(f.commands.filter(c=>c.action==='tea-exit').length,1);
 }finally{f.close()}
});

test('rebuilding house controls cannot detach the work surface or lose a captured pot release',()=>{
 const f=adapterFixture();try{
  emit(f.canvas,'pointerdown',pointer(100,100));emit(f.canvas,'pointermove',pointer(100,180));
  assert.equal(f.state.activities.active.pressed,true);assert.equal(f.canvas.hasPointerCapture(1),true);
  f.host.innerHTML='<div class="replacement-controls"></div>';f.view.update(.016);
  assert.equal(f.app.contains(f.root),true);assert.equal(f.root.parentElement,f.app);assert.equal(f.canvas.hasPointerCapture(1),true);
  emit(f.canvas,'pointerup',pointer(100,180));
  assert.equal(f.state.activities.active.pressed,false);assert.equal(f.state.activities.active.tilt,0);assert.equal(f.canvas.hasPointerCapture(1),false);
 }finally{f.close()}
});

test('pause, rotation, hidden tab and blur release the real adapter without an automatic resumed pour',()=>{
 const f=adapterFixture();try{
  assert.equal(f.canvas.getAttribute('role'),'application');assert.equal(document.activeElement,f.canvas);
  emit(f.canvas,'pointerdown',pointer(100,100));emit(f.canvas,'pointermove',pointer(100,180));
  f.state.paused=true;f.view.update(0);assert.equal(f.state.activities.active.pressed,false);assert.equal(f.root.hidden,true);
  f.state.paused=false;f.view.update(0);emit(f.canvas,'pointermove',pointer(100,180));assert.equal(f.state.activities.active.pressed,false);
  emit(f.canvas,'pointerdown',pointer(100,100));emit(f.canvas,'pointermove',pointer(100,180));emit(window,'resize');
  assert.equal(f.state.activities.active.pressed,false);assert.equal(f.canvas.hasPointerCapture(1),false);
  emit(window,'keydown',key('Space'));assert.equal(f.state.activities.active.pressed,true);
  document.hidden=true;emit(document,'visibilitychange');assert.equal(f.state.activities.active.pressed,false);
  document.hidden=false;f.view.update(0);emit(window,'keydown',key('Space'));emit(window,'blur');
  assert.equal(f.state.activities.active.pressed,false);f.view.update(.1);assert.equal(f.state.activities.active.pressed,false);
  f.view.dispose();const before=f.commands.length;emit(window,'keydown',key('Space'));assert.equal(f.commands.length,before);
  assert.equal(f.canvas.getAttribute('role'),null);assert.equal(f.canvas.getAttribute('aria-keyshortcuts'),null);
 }finally{f.close()}
});
