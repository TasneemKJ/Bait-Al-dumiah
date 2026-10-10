import test from 'node:test';
import assert from 'node:assert/strict';
import {readdirSync,readFileSync} from 'node:fs';
import {dirname,join,relative,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

// Layers, lowest first. A module may import its own layer or a lower one, never a higher one.
//   shared      listener helper with no globals, usable from any layer
//   data        copy, content tables, i18n lookup, icon markup strings (pure functions, no DOM access)
//   simulation  state and rules plus the pure helpers it shares with the layers above (no DOM, no Three.js)
//   render      Three.js world; reads state through simulation queries
//   ui          DOM shell, panels, rituals, audio
//   main        composition root
const LAYERS=['shared','data','simulation','render','ui','main'];
const LAYER_OF={
 'event-bindings.js':'shared','content.js':'data','locale-data.js':'data','locale-rituals.js':'data','locale-story.js':'data',
 'locale-house.js':'data','locale-keepsakes.js':'data','i18n.js':'data','icons.js':'data',
 'simulation.js':'simulation','home-session.js':'simulation','return-greeting.js':'simulation',
 'stitch-path.js':'simulation','sim-util.js':'simulation','sim-core.js':'simulation','sim-tea.js':'simulation','sim-stitch.js':'simulation','sim-chimes.js':'simulation','sim-story.js':'simulation','sim-queries.js':'simulation','sim-state.js':'simulation','save-codec.js':'simulation','lullaby-score.js':'simulation','night-score.js':'simulation',
 'tea-input.js':'simulation','stitch-input.js':'simulation','chime-input.js':'simulation',
 'carry-gesture.js':'simulation','pointer-gesture.js':'simulation','wish-glow.js':'simulation',
 'resident-portraits.js':'simulation',
 'ui.js':'ui','activities-ui.js':'ui','chime-ui.js':'ui','home-ui.js':'ui','object-ui.js':'ui',
 'stitch-ui.js':'ui','stitch-view.js':'ui','canvas-aria.js':'ui','chime-input-bindings.js':'ui','chime-view.js':'ui','objective-ui.js':'ui','shell-markup.js':'ui','hud-sync.js':'ui','dom-sync.js':'ui','readouts.js':'ui','ui-events.js':'ui','save-transfer.js':'ui','panels-ui.js':'ui','stitch-input-bindings.js':'ui','tea-input-bindings.js':'ui','tea-view.js':'ui','story-ui.js':'ui','tea-ui.js':'ui','audio.js':'ui','gift-art.js':'ui',
 'object-controls.js':'ui','room-views.js':'ui','resident-label.js':'ui','placement-keys.js':'ui','playfield-layout.js':'ui','placement-flow.js':'ui',
 'app-feedback.js':'ui','app-view.js':'ui','app-commands.js':'ui','cmd-home.js':'ui','cmd-camera.js':'ui','cmd-story.js':'ui','cmd-activities.js':'ui','cmd-house.js':'ui','cmd-save.js':'ui','app-loop.js':'ui',
 'main.js':'main',
};
const MAX_LINES=500;
// Long lines hide size: the code here is dense, so bytes, line width and function length are capped too.
// There are no exceptions: split a module, a table or a function instead.
const MAX_BYTES=40000;
const MAX_LINE_CHARS=120;
const MAX_FUNCTION_LINES=60;

const srcDir=resolve(dirname(fileURLToPath(import.meta.url)),'../src');
function listModules(dir=srcDir){
 return readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?listModules(join(dir,e.name)):e.name.endsWith('.js')?[join(dir,e.name)]:[]);
}
const modules=listModules().map(file=>({file,rel:relative(srcDir,file).split('\\').join('/'),text:readFileSync(file,'utf8')}));
const layerOf=rel=>rel.startsWith('render/')?'render':LAYER_OF[rel];
const importsOf=text=>[...text.matchAll(/(?:from\s*|import\s*\(\s*|^\s*import\s+)['"]([^'"]+)['"]/gm)].map(m=>m[1]);

test('every source module is assigned to a layer',()=>{
 const unassigned=modules.filter(m=>!layerOf(m.rel)).map(m=>m.rel);
 assert.deepEqual(unassigned,[],'add new modules to LAYER_OF in tests/architecture.test.mjs');
 for(const rel of Object.keys(LAYER_OF))assert.ok(modules.some(m=>m.rel===rel),`LAYER_OF lists missing module ${rel}`);
});

test('imports never point up the layer stack',()=>{
 const violations=[];
 for(const m of modules){
  const own=LAYERS.indexOf(layerOf(m.rel));
  for(const spec of importsOf(m.text)){
   if(!spec.startsWith('.'))continue;
   const target=relative(srcDir,resolve(dirname(m.file),spec)).split('\\').join('/');
   const targetLayer=layerOf(target);
   if(!targetLayer){violations.push(`${m.rel} imports unclassified ${target}`);continue}
   if(LAYERS.indexOf(targetLayer)>own)violations.push(`${m.rel} (${layerOf(m.rel)}) imports ${target} (${targetLayer})`);
  }
 }
 assert.deepEqual(violations,[]);
});

test('data and simulation layers touch neither the DOM nor Three.js',()=>{
 const forbidden=/\b(document|window|localStorage|sessionStorage|navigator|requestAnimationFrame)\b/;
 const code=text=>text.replace(/(["'`])(?:\\.|(?!\1).)*\1/g,'""');
 const offenders=modules.filter(m=>['data','simulation'].includes(layerOf(m.rel)))
  .filter(m=>forbidden.test(code(m.text))||importsOf(m.text).some(s=>s==='three'||s.startsWith('three/')))
  .map(m=>m.rel);
 assert.deepEqual(offenders,[]);
});

test('render modules never import the ui or main layers',()=>{
 const offenders=modules.filter(m=>layerOf(m.rel)==='render')
  .flatMap(m=>importsOf(m.text).filter(s=>/\/(ui|main)\.js$|-ui\.js$/.test(s)).map(s=>`${m.rel} -> ${s}`));
 assert.deepEqual(offenders,[]);
});

test('modules stay under the size cap',()=>{
 const lines=text=>text.split('\n').length-(text.endsWith('\n')?1:0);
 const over=modules.filter(m=>lines(m.text)>MAX_LINES).map(m=>`${m.rel}: ${lines(m.text)} lines`);
 assert.deepEqual(over,[],`split the module (cap ${MAX_LINES})`);
});

test('modules stay under the byte and line-width caps',()=>{
 const heavy=modules.filter(m=>Buffer.byteLength(m.text)>MAX_BYTES).map(m=>`${m.rel}: ${Buffer.byteLength(m.text)} bytes`);
 assert.deepEqual(heavy,[],`split the module (cap ${MAX_BYTES} bytes)`);
 const longest=m=>Math.max(...m.text.split('\n').map(l=>l.length));
 const wide=modules.filter(m=>longest(m)>MAX_LINE_CHARS).map(m=>`${m.rel}: ${longest(m)} characters`);
 assert.deepEqual(wide,[],`break up lines over ${MAX_LINE_CHARS} characters`);
});

test('top-level functions stay under the length cap',()=>{
 const long=[];
 for(const m of modules){
  const lines=m.text.split('\n');let start=-1,name='';
  lines.forEach((line,i)=>{
   if(/^(export )?(async )?function /.test(line)){start=i;name=line.match(/function\s+([\w$]+)/)[1]}
   else if(line==='}'&&start>=0){if(i-start+1>MAX_FUNCTION_LINES)long.push(`${m.rel}: ${name} (${i-start+1} lines)`);start=-1}
  });
 }
 assert.deepEqual(long,[],`split functions over ${MAX_FUNCTION_LINES} lines`);
});

test('modules never import each other in a cycle',()=>{
 const graph=new Map(modules.map(m=>[m.rel,importsOf(m.text).filter(s=>s.startsWith('.'))
  .map(s=>relative(srcDir,resolve(dirname(m.file),s)).split('\\').join('/'))]));
 const state=new Map(),cycles=[];
 const visit=(node,path)=>{
  state.set(node,'open');
  for(const next of graph.get(node)??[]){
   if(state.get(next)==='open')cycles.push([...path,node,next].join(' -> '));
   else if(!state.has(next))visit(next,[...path,node]);
  }
  state.set(node,'done');
 };
 for(const node of graph.keys())if(!state.has(node))visit(node,[]);
 assert.deepEqual(cycles,[]);
});
