import test from 'node:test';
import assert from 'node:assert/strict';
import {readdirSync,readFileSync} from 'node:fs';
import {dirname,join,relative,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

// Layers, lowest first. A module may import its own layer or a lower one, never a higher one.
//   data        copy, content tables, i18n lookup, icon markup strings (pure functions, no DOM access)
//   simulation  state and rules plus the pure helpers it shares with the layers above (no DOM, no Three.js)
//   render      Three.js world; reads state through simulation queries
//   ui          DOM shell, panels, rituals, audio
//   main        composition root
const LAYERS=['data','simulation','render','ui','main'];
const LAYER_OF={
 'content.js':'data','locale-data.js':'data','i18n.js':'data','icons.js':'data',
 'simulation.js':'simulation','home-session.js':'simulation','return-greeting.js':'simulation',
 'stitch-path.js':'simulation','sim-util.js':'simulation','sim-state.js':'simulation','save-codec.js':'simulation','lullaby-score.js':'simulation','night-score.js':'simulation',
 'tea-input.js':'simulation','stitch-input.js':'simulation','chime-input.js':'simulation',
 'carry-gesture.js':'simulation','pointer-gesture.js':'simulation','wish-glow.js':'simulation',
 'resident-portraits.js':'simulation',
 'ui.js':'ui','activities-ui.js':'ui','chime-ui.js':'ui','home-ui.js':'ui','object-ui.js':'ui',
 'stitch-ui.js':'ui','stitch-view.js':'ui','canvas-aria.js':'ui','objective-ui.js':'ui','shell-markup.js':'ui','save-transfer.js':'ui','panels-ui.js':'ui','stitch-input-bindings.js':'ui','tea-input-bindings.js':'ui','tea-view.js':'ui','story-ui.js':'ui','tea-ui.js':'ui','audio.js':'ui','gift-art.js':'ui',
 'object-controls.js':'ui','room-views.js':'ui','resident-label.js':'ui','placement-keys.js':'ui','playfield-layout.js':'ui',
 'main.js':'main',
};
const MAX_LINES=500;
// Long lines hide size: the code here is dense, so bytes, line width and function length are capped too.
const MAX_BYTES=40000;
const MAX_LINE_CHARS=200;
const MAX_FUNCTION_LINES=160;
// Modules allowed past the cap, each with the reason.
const SIZE_EXCEPTIONS={
 'locale-data.js':'bilingual copy table, data only',
};
// Modules allowed past the byte cap.
const BYTE_EXCEPTIONS={
 'locale-data.js':'bilingual copy table, data only',
};

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

test('modules stay under the size cap unless listed',()=>{
 const lines=text=>text.split('\n').length-(text.endsWith('\n')?1:0);
 const over=modules.filter(m=>lines(m.text)>MAX_LINES&&!(m.rel in SIZE_EXCEPTIONS)).map(m=>`${m.rel}: ${lines(m.text)} lines`);
 assert.deepEqual(over,[],`split the module or list it in SIZE_EXCEPTIONS with a reason (cap ${MAX_LINES})`);
 for(const rel of Object.keys(SIZE_EXCEPTIONS)){
  const m=modules.find(x=>x.rel===rel);
  assert.ok(m&&lines(m.text)>MAX_LINES,`${rel} no longer needs its size exception`);
 }
});

test('modules stay under the byte and line-width caps unless listed',()=>{
 const heavy=modules.filter(m=>Buffer.byteLength(m.text)>MAX_BYTES&&!(m.rel in BYTE_EXCEPTIONS)).map(m=>`${m.rel}: ${Buffer.byteLength(m.text)} bytes`);
 assert.deepEqual(heavy,[],`split the module or list it in BYTE_EXCEPTIONS (cap ${MAX_BYTES})`);
 const wide=modules.filter(m=>!(m.rel in BYTE_EXCEPTIONS)&&m.text.split('\n').some(l=>l.length>MAX_LINE_CHARS)).map(m=>m.rel);
 assert.deepEqual(wide,[],`break up lines over ${MAX_LINE_CHARS} characters`);
 for(const rel of Object.keys(BYTE_EXCEPTIONS)){
  const m=modules.find(x=>x.rel===rel);
  assert.ok(m&&Buffer.byteLength(m.text)>MAX_BYTES,`${rel} no longer needs its byte exception`);
 }
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
