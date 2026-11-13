import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,readSave,care,mendDoor} from '../src/simulation.js';
import {sheetMarkup} from '../src/panels-ui.js';
import {nextStep} from '../src/objective-ui.js';
import {button} from '../src/shell-markup.js';
import {translate,number} from '../src/i18n.js';

// An imported save code is untrusted text. Every string a hostile file can carry must be dropped or
// replaced by a known value, so nothing it says reaches the innerHTML sinks (src/ui.js, placement-flow.js).
const PAYLOAD='<img src=x onerror=alert(1)>';
// Every leaf of a played save, replaced by the payload in turn and all at once.
function leaves(v,path=[]){if(v&&typeof v==='object')return Object.entries(v).flatMap(([k,x])=>leaves(x,[...path,k]));
 return [path]}
function set(o,path,value){let t=o;for(const k of path.slice(0,-1))t=t[k];t[path.at(-1)]=value}
function played(){const s=createState();s.buttons=500;care(s,'lina','tea');mendDoor(s);s.journal=['music-box'];
 s.gifts=['blue-bead'];s.decor.push({id:1,item:'bear',room:'kitchen',slot:0,rotation:0,originRoom:'kitchen',
  active:false,tendedDay:0,lastUse:-10});s.story.lastAction='prop:tea-set';s.arc.last='2026-11-01';return s}
const ctx=lang=>({t:k=>translate(lang,k),n:v=>number(lang,v),button,avatar:()=>'',selected:'lina',
 selectedObject:null,activityResult:null,resetConfirm:false});
function rendered(s){let html='';for(const lang of ['en','ar']){s.settings.locale=lang;
 for(const panel of ['household','decorate','journal','settings','activities'])html+=sheetMarkup(panel,s,ctx(lang));
 html+=nextStep(s,ctx(lang).t,ctx(lang).n,null).copy}return html}

test('a hostile string in any field of an imported save is dropped, never rendered',()=>{
 const base=played(),paths=leaves(base);assert.ok(paths.length>60,'the whole save is covered');
 const all=structuredClone(base);for(const p of paths)if(p[0]!=='version')set(all,p,PAYLOAD);
 for(const v of [all,...paths.filter(p=>p[0]!=='version').map(p=>{const o=structuredClone(base);set(o,p,PAYLOAD);
  return o})]){
  const r=readSave(JSON.stringify(v));assert.equal(r.ok,true);
  assert.doesNotMatch(JSON.stringify(r.state),/<img|onerror/,'the restored save holds no foreign text');
  assert.doesNotMatch(rendered(r.state),/<img|onerror/,'no sheet renders it');
 }
});
test('extra fields, wrong types and oversized lists are refused or cut to the known schema',()=>{
 const v={...played(),evil:PAYLOAD,__proto__polluted:{x:PAYLOAD},journal:Array(5000).fill(PAYLOAD),
  decor:Array(5000).fill({item:PAYLOAD,room:PAYLOAD}),dolls:PAYLOAD,settings:{locale:PAYLOAD,quality:PAYLOAD},
  arc:{last:PAYLOAD,visits:PAYLOAD},story:{lastAction:PAYLOAD},hints:{night:PAYLOAD,fifthOffer:PAYLOAD}};
 const s=readSave(JSON.stringify(v)).state;
 assert.deepEqual(Object.keys(s).sort(),Object.keys(createState()).sort(),'only known top-level fields');
 assert.deepEqual(s.journal,[]);assert.deepEqual(s.decor,[]);assert.equal(s.settings.locale,'en');
 assert.equal(s.settings.quality,'auto');assert.equal(s.arc.last,'');assert.equal(s.story.lastAction,null);
 assert.equal(s.hints.fifthOffer,undefined);assert.doesNotMatch(JSON.stringify(s),/<img/);
 assert.equal(readSave(JSON.stringify({...v,version:PAYLOAD})).ok,false,'a hostile version is refused');
});
