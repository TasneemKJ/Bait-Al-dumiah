import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {createAppStore,accessFrom,APP_NAMES,PRODUCTS} from '../src/app-store.js';
import {OPEN_ACCESS,fifthRoomOpen,fifthRoomLocked} from '../src/access.js';
import {storeMarkup} from '../src/store-ui.js';
import {doorMarkup,sheetMarkup} from '../src/panels-ui.js';
import {nextStep} from '../src/objective-ui.js';
import {button} from '../src/shell-markup.js';
import {translate,number} from '../src/i18n.js';
import {createState} from '../src/simulation.js';
import {DOOR_STEPS} from '../src/content.js';
import {bootHome} from './helpers/main-home-harness.mjs';

// A window with the verbatim page bridge (public/tas-bridge.js) loaded, and optionally the app's handler.
function page({inApp=true,boot=null}={}){
 const posts=[],w={posts};
 if(inApp)w.webkit={messageHandlers:{[APP_NAMES.handler]:{postMessage:m=>posts.push(m)}}};
 if(boot)w[APP_NAMES.boot]=boot;
 vm.runInNewContext(readFileSync(new URL('../public/tas-bridge.js',import.meta.url),'utf8'),{window:w});
 return w;
}
const ctx=lang=>({t:key=>translate(lang,key),n:v=>number(lang,v),button});
const LOCKED={fifthRoom:false,canary:false,bought:false};

test('the names agree with ios/BaitAlDumiah/BaitConfig.swift and the catalog keys',()=>{
 const swift=readFileSync(new URL('../ios/BaitAlDumiah/BaitConfig.swift',import.meta.url),'utf8');
 assert.match(swift,new RegExp(`handlerName: "${APP_NAMES.handler}"`));
 assert.match(swift,new RegExp(`bridgeGlobal: "${APP_NAMES.bridge}"`));
 assert.match(swift,new RegExp(`bootGlobal: "${APP_NAMES.boot}"`));
 for(const key of Object.values(PRODUCTS))assert.match(swift,new RegExp(`key: "${key}"`),key);
 assert.deepEqual(Object.keys(OPEN_ACCESS).sort(),['bought','canary','fifthRoom']);
});

test('on the web nothing is sold: the door is open, the canary absent, nothing is posted',()=>{
 const w=page({inApp:false}),store=createAppStore(w);
 assert.equal(store.inApp,false);assert.deepEqual(store.access(),OPEN_ACCESS);
 assert.equal(store.owns('fifthRoom'),true);assert.equal(store.price('fifthRoom'),'');
 assert.equal(store.buy('fifthRoom'),false);assert.equal(w.baitApp,undefined,'no bridge global on the web');
 assert.deepEqual(createAppStore({}).access(),OPEN_ACCESS,'a page without the bridge script is the web');
 const s=createState();assert.equal(fifthRoomOpen(s,store.access()),true);
});

test('in the app the App Store answers, at the moment it is asked, and the page hears every change',()=>{
 const w=page(),store=createAppStore(w);let heard=0;store.onChange(()=>heard++);
 assert.equal(w.baitApp,store.bridge,'TasKit calls baitApp.update()');
 assert.equal(JSON.stringify(w.posts[0]),JSON.stringify({type:'price',data:null}),'asks again at load: prices sent earlier are lost');
 assert.deepEqual(store.access(),LOCKED);
 w.baitApp.update({owned:{fifthRoom:true,canaryMonthly:false,canaryYearly:false},
  prices:{fifthRoom:'$4.99',canaryMonthly:'$1.99',canaryYearly:'$14.99'}});
 assert.deepEqual(store.access(),{fifthRoom:true,canary:false,bought:true});assert.equal(store.price('canaryYearly'),'$14.99');
 w.baitApp.update({owned:{canaryYearly:true}});
 assert.deepEqual(store.access(),{fifthRoom:false,canary:true,bought:false},'a refund closes it again');
 assert.ok(heard>=2);
 store.buy('fifthRoom');assert.equal(JSON.stringify(w.posts.at(-1)),'{"type":"buy","data":{"id":"fifthRoom"}}');
 assert.equal(store.status,'buying');store.clearStatus();assert.equal(store.status,'');
 store.restore();assert.equal(w.posts.at(-1).type,'restore');
 store.manage();assert.equal(w.posts.at(-1).type,'manageSubscriptions');
 store.openPage('terms');assert.equal(JSON.stringify(w.posts.at(-1)),'{"type":"openURL","data":{"page":"terms"}}');
});

test('the boot answer is read before the game asks, and a stray global on the web locks nothing',()=>{
 assert.deepEqual(createAppStore(page({boot:{owned:{fifthRoom:true}}})).access(),{fifthRoom:true,canary:false,bought:true});
 assert.deepEqual(createAppStore(page({inApp:false,boot:{owned:{fifthRoom:false}}})).access(),OPEN_ACCESS);
 assert.deepEqual(accessFrom(null),OPEN_ACCESS);
});

test('a door already begun in this save stays the player\'s; otherwise it waits for The Fifth Room',()=>{
 const s=createState();
 assert.equal(fifthRoomOpen(s,LOCKED),false);assert.equal(fifthRoomLocked(s,LOCKED),true);
 s.door=1;assert.equal(fifthRoomOpen(s,LOCKED),true);
 s.door=DOOR_STEPS.length;assert.equal(fifthRoomLocked(s,LOCKED),false);
 assert.equal(fifthRoomOpen(createState(),undefined),true,'no answer is the open web');
});

test('the closed door in the app shows what opens it, never a mend button it cannot honour',()=>{
 for(const lang of ['en','ar']){
  const s=createState();s.buttons=999;
  const locked=doorMarkup(s,{...ctx(lang),access:LOCKED});
  assert.match(locked,/data-action="panel-store"/);assert.doesNotMatch(locked,/data-action="mend-door"/);
  assert.match(locked,lang==='ar'?/الغرفة الخامسة/:/The Fifth Room/);
  assert.match(doorMarkup(s,{...ctx(lang),access:OPEN_ACCESS}),/data-action="mend-door"/);
 }
});

test('the next-step clue never points at a door this copy has not opened',()=>{
 const s=createState();s.buttons=999;s.wishes=['lina','noor','sami'];s.journal=[];
 s.story.chapter=3;s.decor=[{id:1,item:'plant',room:'kitchen',slot:0}];s.activities.mastery={tea:9,stitch:9,lullaby:9};
 for(const r of Object.keys(s.restoration))s.restoration[r]=3;s.milestones=[];
 const t=key=>translate('en',key),n=String;
 assert.equal(nextStep(s,t,n,'',OPEN_ACCESS).action,'panel');
 assert.equal(nextStep(s,t,n,'',OPEN_ACCESS).value,'journal','the open door is suggested');
 assert.notEqual(nextStep(s,t,n,'',LOCKED).focus,'.door-next','the closed door is not');
});

test('the store card says what each one opens, prices left to right, and keeps Restore, Terms and Privacy',()=>{
 const w=page(),store=createAppStore(w);
 assert.match(storeMarkup(store,ctx('en')),/data-action="store-buy" data-id="fifthRoom"[^>]*disabled/,'no price, no buy');
 for(const lang of ['en','ar']){
  w.baitApp.update({owned:{},prices:{fifthRoom:'$4.99',canaryMonthly:'$1.99',canaryYearly:'$14.99'}});
  const html=storeMarkup(store,ctx(lang));
  for(const price of ['$4.99','$1.99','$14.99'])assert.ok(html.includes(`<bdi dir="ltr">${price}</bdi>`),price);
  for(const id of ['fifthRoom','canaryMonthly','canaryYearly'])assert.match(html,new RegExp(`data-id="${id}"`));
  assert.match(html,/data-action="store-restore"/);assert.match(html,/data-id="terms"/);assert.match(html,/data-id="privacy"/);
  assert.match(html,lang==='ar'?/بيتجدّد لحاله/:/renews automatically/i);
  assert.match(html,lang==='ar'?/بالشهر/:/a month/);assert.match(html,lang==='ar'?/بالسنة/:/a year/);
  assert.doesNotMatch(html,/\{price\}/);
  if(lang==='ar')assert.ok(/[؀-ۿ]/.test(html));
 }
 w.baitApp.update({owned:{fifthRoom:true,canaryMonthly:true}});
 const owned=storeMarkup(store,ctx('en'));
 assert.doesNotMatch(owned,/data-id="fifthRoom"/);assert.match(owned,/data-action="store-manage"/);
 w.baitApp.status='failed';assert.match(storeMarkup(store,ctx('en')),/Nothing was charged/);
 assert.equal(typeof sheetMarkup('store',createState(),ctx('en')),'string','the store is a sheet like any other');
});

test('nothing bought is ever written into the save',()=>{
 const w=page(),store=createAppStore(w);w.baitApp.update({owned:{fifthRoom:true,canaryYearly:true}});
 const game=bootHome({store});game.button('play').click();game.frame(1000);game.frame(3000);
 game.dispatch()('save');
 const saved=game.writes.map(x=>x.value).join('');
 assert.ok(saved.length>0);assert.doesNotMatch(saved,/fifthRoom|canary/i);
});

test('mending or a gift without The Fifth Room opens the card and changes nothing',()=>{
 const store=createAppStore(page());
 const rich=createState();rich.buttons=500;const saved=JSON.stringify(rich);
 const game=bootHome({store,saved});game.button('play').click();game.frame(1000);
 for(const action of ['mend-door','gift']){
  game.dispatch()(action);assert.equal(game.state().door,0);assert.equal(game.state().buttons,500);
  assert.ok(game.notices.includes(translate('en','doorLocked')),action);
 }
 const open=bootHome({saved});open.button('play').click();open.frame(1000);
 open.dispatch()('mend-door');assert.equal(open.state().door,1,'the web door mends as before');
});
