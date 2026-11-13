import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {composeCard,cardLines,CARD} from '../src/share-card.js';
import {createAppStore,APP_NAMES} from '../src/app-store.js';
import {createState} from '../src/simulation.js';
import {translate,number} from '../src/i18n.js';
import {settingsMarkup} from '../src/panels-ui.js';
import {button} from '../src/shell-markup.js';
import {bootHome} from './helpers/main-home-harness.mjs';

// Studio bar (2026-11-13): one picture worth showing someone, from the game's own render, through the iOS share sheet.
function fakeCanvas(){const calls=[];const ctx=new Proxy({},{get:(o,k)=>k==='calls'?calls:k==='createLinearGradient'?
 ()=>({addColorStop(){}}):k==='measureText'?()=>({width:100}):(...a)=>calls.push([k,...a]),set:()=>true});
 return {calls,width:0,height:0,getContext:()=>ctx,toDataURL:type=>`data:${type};base64,AAAA`}}
test('the card is the house render cropped 4:5 with both names, the day and the dolls',()=>{
 for(const lang of ['en','ar']){
  const s=createState();s.day=7;s.settings.locale=lang;
  const lines=cardLines(s,k=>translate(lang,k),v=>number(lang,v));
  assert.ok(lines.title.includes(translate(lang,'title')));assert.ok(lines.alt.includes(translate(lang==='ar'?'en':'ar','title')));
  for(const id of ['lina','noor','sami'])assert.ok(lines.detail.includes(translate(lang,id)),id);
  assert.ok(lines.detail.includes(number(lang,7)));
  const canvas=fakeCanvas(),url=composeCard({width:1170,height:2532},lines,()=>canvas,lang==='ar');
  assert.equal(url,'data:image/png;base64,AAAA');assert.deepEqual([canvas.width,canvas.height],[CARD.width,CARD.height]);
  const draw=canvas.calls.find(c=>c[0]==='drawImage');
  assert.equal(draw[4],1170);assert.equal(Math.round(draw[5]),Math.round(1170*CARD.height/CARD.width),'4:5 from the middle');
  const text=canvas.calls.filter(c=>c[0]==='fillText').map(c=>c[1]);
  assert.deepEqual(text,[lines.title,lines.alt,lines.detail]);
 }
});
test('Share is offered only in the app, and sends one PNG through the bridge',()=>{
 const posts=[],w={webkit:{messageHandlers:{[APP_NAMES.handler]:{postMessage:m=>posts.push(m)}}}};
 vm.runInNewContext(readFileSync(new URL('../public/tas-bridge.js',import.meta.url),'utf8'),{window:w});
 const store=createAppStore(w),game=bootHome({store});game.button('play').click();game.frame(1000);
 game.dispatch()('share-house');
 const sent=posts.filter(p=>p.type==='share');assert.equal(sent.length,1);assert.match(sent[0].data.dataURL,/^data:image\/png;base64,/);
 const web=bootHome();web.button('play').click();web.frame(1000);web.dispatch()('share-house');
 const ctx={t:k=>translate('en',k),button,resetConfirm:false};
 assert.doesNotMatch(settingsMarkup(createState(),ctx),/share-house/,'the web has no share row');
});
test('in the app Settings offers the share row',async()=>{
 const {appInfoMarkup}=await import('../src/app-info.js');
 assert.match(appInfoMarkup({t:k=>translate('ar',k),button},{inApp:true,haptics:true}),/data-action="share-house"/);
});
