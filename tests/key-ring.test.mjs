import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as sim from '../src/simulation.js';
import {translate} from '../src/i18n.js';

// DESIGN.md #67 (D7): the bottom bar folds into the house. A brass key ring hangs inside the front door; each tool
// is a key to a real place, and a key is added only when the house first needs it.
const ring=await import('../src/key-ring.js').catch(()=>({}));
const src=f=>readFileSync(new URL('../src/'+f,import.meta.url),'utf8');
const ids=(s,store=false)=>ring.ringKeys(s,{store}).map(k=>k.id);

test('night one has only two keys: the house (hang up, back to the whole house) and the fuse box',()=>{
 assert.equal(typeof ring.ringKeys,'function');
 assert.deepEqual(ids(sim.createState()),['house','fuse']);
 assert.deepEqual(ids(sim.createState(),true),['house','fuse'],'the fifth room waits for the second day');
});

test('each key arrives when the house first needs it, and opens its own place',()=>{
 const s=sim.createState();s.buttons=99;for(const d of s.dolls)sim.care(s,d.id,sim.wishFor(s,d.id));
 assert.deepEqual(ids(s),['house','fuse','drawer'],'three wishes granted: the drawer for the first keepsake');
 const w=sim.createState();w.journal=['music-box'];assert.deepEqual(ids(w),['house','fuse','album'],'a first whisper');
 const d2=sim.createState();d2.day=2;assert.deepEqual(ids(d2,true),['house','fuse','drawer','album','fifth']);
 assert.deepEqual(ids(d2,false),['house','fuse','drawer','album'],'no store on the web, so no locked room to sell');
 const all=Object.fromEntries(ring.ringKeys(Object.assign(sim.createState(),{day:3,journal:['jasmine']}),{store:true})
  .map(k=>[k.id,k.action]));
 assert.deepEqual(all,{house:'camera',fuse:'panel-settings',drawer:'panel-decorate',album:'panel-journal',fifth:'panel-store'});
});

test('the ring is the only bar: no room buttons, no Things, Tools, Sound or Pause row; Pause lives in the fuse box',()=>{
 const t=key=>translate('en',key),s=sim.createState();
 const html=ring.keyRingMarkup(ring.ringKeys(s,{store:false}),t);
 assert.match(html,/class="key-ring"/);assert.equal((html.match(/data-action=/g)||[]).length,2);
 for(const k of ring.ringKeys(Object.assign(sim.createState(),{day:3,journal:['x']}),{store:true}))
  for(const lang of ['en','ar'])assert.ok(translate(lang,'key-'+k.id).length>1,`${lang} key-${k.id}`);
 const shell=src('shell-markup.js');
 assert.doesNotMatch(shell,/class="dock"/);assert.doesNotMatch(shell,/data-short="\$\{t\('barHouse'\)\}"/);
 const main=src('main.js');assert.doesNotMatch(main,/createRoomViews\(/);assert.doesNotMatch(main,/createObjectControls\(/);
 assert.match(main,/createKeyRing\(/);
 assert.match(src('panels-ui.js'),/button\('pause'/,'Pause in the fuse box');
 assert.match(src('panels-ui.js'),/button\('panel-store'/,'Restore, Terms and Privacy stay reachable from the fuse box');
});

test('a new key is announced once, plainly, in both languages; Arabic says it as Arabic',()=>{
 assert.equal(translate('ar','ringFirst'),'لكلّ باب مفتاح، ولكلّ مفتاح ليلة يُعطى فيها.');
 for(const lang of ['en','ar'])assert.doesNotMatch(translate(lang,'ringNewKey')+translate(lang,'ringFirst'),/!/);
 const said=[],state=sim.createState(),r=ring.createKeyRing(fakeHost(),()=>state,{say:x=>said.push(x),
  t:k=>translate('en',k)});
 r.update();assert.deepEqual(said,[],'the keys a house already has are not news');
 state.journal=['jasmine'];r.update();r.update();
 assert.deepEqual(said,[translate('en','ringFirst'),translate('en','ringNewKey').replace('{key}',translate('en','key-album'))]);
});

function fakeHost(){const nodes=[];return {append(n){nodes.push(n)},querySelector:()=>null,ownerDocument:{createElement(){
 return {set innerHTML(v){this.html=v},get innerHTML(){return this.html},setAttribute(){},className:'',isConnected:true}}}}}
