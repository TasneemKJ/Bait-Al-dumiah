import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {createAppStore,APP_NAMES} from '../src/app-store.js';
import {OPEN_ACCESS,welcomeFifthRoom,doorCost,clampImport,fifthRoomLocked} from '../src/access.js';
import {doorMarkup,householdMarkup} from '../src/panels-ui.js';
import {storeMarkup} from '../src/store-ui.js';
import {nextStep} from '../src/objective-ui.js';
import {button} from '../src/shell-markup.js';
import {translate,number} from '../src/i18n.js';
import * as sim from '../src/simulation.js';
import {DOOR_STEPS,VISITOR_GIFTS,SECRETS} from '../src/content.js';
import {bootHome} from './helpers/main-home-harness.mjs';

const BOUGHT={fifthRoom:true,canary:false,bought:true},UNBOUGHT={fifthRoom:false,canary:false,bought:false};
const ctx=lang=>({t:key=>translate(lang,key),n:v=>number(lang,v),button});
function store(owned={}){
 const w={};w.webkit={messageHandlers:{[APP_NAMES.handler]:{postMessage(){}}}};
 vm.runInNewContext(readFileSync(new URL('../public/tas-bridge.js',import.meta.url),'utf8'),{window:w});
 const s=createAppStore(w);w.baitApp.update({owned,prices:{fifthRoom:'$4.99'}});return {s,w};
}
const live=(game,seconds,from=0)=>{let t=from;for(let i=0;i<seconds*10;i++){t+=100;game.frame(t)}return t};

test('buying The Fifth Room opens the door a crack at once: first mending done, a gift on the threshold',()=>{
 const s=sim.createState();assert.equal(welcomeFifthRoom(s,BOUGHT),true);
 assert.equal(s.door,1,'the hinge is mended for the buyer');assert.deepEqual(s.gifts,[VISITOR_GIFTS[0]]);
 assert.equal(s.buttons,sim.createState().buttons,'nothing was charged in buttons');
 assert.equal(welcomeFifthRoom(s,BOUGHT),false,'it never replays');assert.equal(s.door,1);
 for(const access of [OPEN_ACCESS,UNBOUGHT,undefined]){const w=sim.createState();
  assert.equal(welcomeFifthRoom(w,access),false);assert.equal(w.door,0,'the web and unbought copies are unchanged')}
});
test('for the buyer the remaining mendings cost no buttons; the web keeps its prices',()=>{
 for(const step of DOOR_STEPS){assert.equal(doorCost(step,BOUGHT),0);assert.equal(doorCost(step,OPEN_ACCESS),step.cost)}
 const s=sim.createState();s.buttons=0;welcomeFifthRoom(s,BOUGHT);
 const r=sim.mendDoor(s,{free:true});assert.equal(r.ok,true);assert.equal(r.step,'dust');assert.equal(s.buttons,0);
 assert.equal(sim.mendDoor(s,{free:true}).needs,'sami-dear','closeness with Sami still matters');
 s.dolls[2].bond=60;sim.mendDoor(s,{free:true});sim.mendDoor(s,{free:true});
 assert.equal(sim.mendDoor(s,{free:true}).needs,'all-whispers');s.journal=[...SECRETS];
 assert.equal(sim.mendDoor(s,{free:true}).opened,true);assert.equal(s.buttons,0);
 const web=sim.createState();web.buttons=39;assert.equal(sim.mendDoor(web).reason,'funds');
});
test('the door section names what came at once and every remaining wait, in both languages',()=>{
 for(const lang of ['en','ar']){const s=sim.createState();welcomeFifthRoom(s,BOUGHT);
  const html=doorMarkup(s,{...ctx(lang),access:BOUGHT}),t=k=>translate(lang,k);
  assert.ok(html.includes(t('doorOwnedIntro')),lang);assert.ok(html.includes(t('door_hingeTitle')));
  assert.ok(html.includes(t('gift-'+VISITOR_GIFTS[0]+'Title')),'the threshold gift is shown');
  assert.doesNotMatch(html,/data-action="gift"[^>]*>(?![^<]*disabled)/,'no gift button while the door is ajar');
  assert.match(html,/data-action="mend-door"(?![^>]*disabled)/,'the next mending is ready and free');
  for(const k of ['doorOwnedIntro','fifthDelivered','fifthNote','fifthOwned'])
   assert.match(t(k),lang==='en'?/Sami/:/سامي/,k+' names the wait for Sami');
  for(const k of ['doorOwnedIntro','fifthNote'])assert.match(t(k),lang==='en'?/whispers/:/همسات/,k);
 }
 const s=sim.createState();welcomeFifthRoom(s,BOUGHT);s.buttons=0;
 assert.match(nextStep(s,k=>translate('en',k),String,null,BOUGHT).copy,/./);
});
test('in the app, buying delivers at once: the journal opens on the ajar door and it is saved',()=>{
 const {s,w}=store();const game=bootHome({store:s});game.button('play').click();live(game,1);
 assert.equal(game.state().door,0);w.baitApp.update({owned:{fifthRoom:true}});
 assert.equal(game.state().door,1);assert.deepEqual(game.state().gifts,[VISITOR_GIFTS[0]]);
 assert.ok(game.notices.some(m=>m===translate('en','fifthDelivered')));assert.ok(game.opens.includes('journal'));
 w.baitApp.update({owned:{fifthRoom:true}});assert.equal(game.state().door,1,'a later answer never replays it');
});
test('a save imported in the app cannot open the door unless The Fifth Room is owned',()=>{
 const s=sim.createState();s.door=4;s.gifts=[...VISITOR_GIFTS.slice(0,3)];s.lastGiftDay=1;
 s.achieved=['door-open','all-gifts','first-care'];s.milestones=['door-open','first-care'];
 const clamped=clampImport(structuredClone(s),UNBOUGHT);
 assert.equal(clamped.door,0);assert.deepEqual(clamped.gifts,[]);assert.equal(clamped.lastGiftDay,0);
 assert.deepEqual(clamped.achieved,['first-care']);assert.deepEqual(clamped.milestones,['first-care']);
 assert.equal(fifthRoomLocked(clamped,UNBOUGHT),true,'the door is shown as sold again');
 for(const access of [BOUGHT,OPEN_ACCESS])assert.equal(clampImport(structuredClone(s),access).door,4,'owners and the web keep it');
 assert.match(readFileSync(new URL('../src/cmd-save.js',import.meta.url),'utf8'),/clampImport\(/,'import uses it');
});
test('the six whispers offer The Fifth Room once in the app; declining returns to the house',()=>{
 const {s}=store();const saved=sim.createState();saved.journal=SECRETS.slice(0,5);saved.buttons=999;
 saved.clock=150;saved.day=9;saved.lastSecretDay=8;
 for(const [i,room] of ['kitchen','parlor','studio','bedroom'].entries())for(let slot=0;slot<3;slot++)
  saved.decor.push({id:100+i*3+slot,item:'musicbox',room,slot,rotation:0,originRoom:room,active:false,tendedDay:0,
   lastUse:-10});
 const game=bootHome({store:s,saved:JSON.stringify(saved)});game.button('play').click();live(game,1);
 game.dispatch()('discover');assert.equal(game.state().journal.length,SECRETS.length);
 assert.deepEqual(game.opens.filter(p=>p==='store'),['store'],'the card is offered once');
 assert.equal(game.state().hints.fifthOffer,true);game.ui().close();
 assert.equal(game.ui().panel,null,'declining returns to the house');
 const back=sim.restore(JSON.stringify(game.state()));assert.equal(back.hints.fifthOffer,true,'never offered again');
});
test('the canary sings nothing a free player cannot read: each line is in the journal with that memory',()=>{
 const s=sim.createState();
 for(const lang of ['en','ar'])for(const d of s.dolls){d.bond=90;
  const html=householdMarkup(s,{...ctx(lang),avatar:()=>'',selected:d.id});
  for(let i=0;i<3;i++)assert.ok(html.includes(translate(lang,`canaryMemory-${d.id}-${i}`)),`${lang} ${d.id} ${i}`)}
 const fresh=sim.createState(),html=householdMarkup(fresh,{...ctx('en'),avatar:()=>'',selected:'lina'});
 assert.ok(!html.includes(translate('en','canaryMemory-lina-0')),'a line waits with its memory');
 const card=storeMarkup({owns:()=>false,price:()=>'$1',canary:()=>false,status:''},ctx('en'));
 assert.match(card,/Little souls/,'the card says where the lines are written');
});
test('owned at boot: nothing is written on Home; delivery waits for the house to be entered',()=>{
 for(const saved of [null,JSON.stringify(sim.createState())]){
  const {s}=store({fifthRoom:true});const game=bootHome({store:s,saved});
  assert.equal(game.writes.length,0,'Home never writes the save');assert.equal(game.state().door,0);
  game.button('play').click();live(game,1);
  assert.equal(game.state().door,1,'entering delivers it');assert.ok(game.opens.includes('journal'));
 }
 const {s}=store({fifthRoom:true});const failed=bootHome({store:s,saved:'x',readFails:true});
 assert.equal(failed.writes.length,0,'a failed read is never overwritten');
});
