import test from 'node:test';
import assert from 'node:assert/strict';
import * as sim from '../src/simulation.js';
import {translate} from '../src/i18n.js';

const visit=(s,n)=>{for(let i=1;i<=n;i++)sim.markVisit(s,`2026-12-${String(i).padStart(2,'0')}`)};
const toNight=s=>{s.clock=119.95;sim.step(s,.1)};
const events=s=>s.events.splice(0).map(e=>e.type);

test('the arc counts visit days, never hurried dawns, and a clock set back counts nothing',()=>{
 const s=sim.createState();
 assert.equal(sim.markVisit(s,'2026-12-01'),true);assert.equal(sim.markVisit(s,'2026-12-01'),false);
 assert.equal(sim.markVisit(s,'2026-11-30'),false);assert.equal(sim.markVisit(s,'not a date'),false);
 for(let i=0;i<10;i++)sim.changeLight(s);
 assert.equal(s.arc.visits,1,'ten hurried dawns are still one visit');
});

test('the fifth visit\'s night rains and the three keep together in the liwan; the day stays dry',()=>{
 const s=sim.createState();visit(s,4);toNight(s);
 assert.equal(sim.raining(s),false);assert.equal(sim.gatherRoom(s),null);
 sim.markVisit(s,'2026-12-05');s.clock=10;assert.equal(sim.raining(s),false,'not by day');
 toNight(s);assert.equal(sim.raining(s),true);assert.equal(sim.gatherRoom(s),'parlor');
 assert.deepEqual(events(s).filter(e=>e==='rain'),['rain']);
 assert.deepEqual(s.dolls.map(d=>d.room),['kitchen','bedroom','studio'],'each doll keeps her own room');
 toNight(s);assert.deepEqual(events(s).filter(e=>e==='rain'),[],'announced once');
 sim.markVisit(s,'2026-12-06');assert.equal(sim.raining(s),false,'one rain night only');
});

test('jasmine thread is hung night by night, and on the seventh visit Noor is given her keepsake at nightfall',()=>{
 const s=sim.createState();
 assert.deepEqual([0,1,2,3,4,5,6,7,8].map(n=>{const x=sim.createState();visit(x,n);return sim.garlands(x)}),
  [0,0,0,0,0,1,2,3,3]);
 visit(s,7);s.clock=10;sim.step(s,.1);assert.equal(s.arc.keepsake,false,'waits for the evening');
 assert.equal(sim.arcGreeting(s),'arcNoorDay');
 toNight(s);assert.equal(s.arc.keepsake,true);assert.deepEqual(events(s).filter(e=>e==='anniversary'),['anniversary']);
 assert.deepEqual(s.gifts,[],'never one of the visitor\'s gifts (The Fifth Room)');
 toNight(s);assert.deepEqual(events(s),[]);assert.equal(sim.arcGreeting(s),null);
});

test('an older save without the arc, and a corrupt arc, start it fresh; a good one survives',()=>{
 const old=sim.createState();delete old.arc;old.day=40;
 assert.deepEqual(sim.restore(JSON.stringify(old)).arc,{visits:0,last:'',rain:false,keepsake:false});
 const bad=sim.createState();bad.arc={visits:-3,last:'yesterday',rain:'yes',keepsake:1};
 assert.deepEqual(sim.restore(JSON.stringify(bad)).arc,{visits:0,last:'',rain:false,keepsake:false});
 const good=sim.createState();visit(good,6);good.arc.rain=true;
 assert.deepEqual(sim.restore(JSON.stringify(good)).arc,{visits:6,last:'2026-12-06',rain:true,keepsake:false});
 const big=sim.createState();big.arc={visits:1e9,last:'2026-02-31',rain:false,keepsake:false};
 assert.equal(sim.restore(JSON.stringify(big)).arc.visits,999);
});

test('every arc line exists in English and Arabic, and the Arabic calls them hearts, never spirits',()=>{
 for(const key of ['arcRainComing','arcThreadHung','arcNoorDay','arcRain','arcAnniversary','arcKeepsakeTitle',
  'arcKeepsakeText','arcKeepsakes','arcShare','arcCardRain','arcCardNoor'])
  for(const lang of ['en','ar']){const line=translate(lang,key);
   assert.ok(line&&line!==key,`${lang}:${key}`);if(lang==='ar')assert.doesNotMatch(line,/أرواح|روح/)}
});

test('the journal shows Noor\'s ribbon once given, in both languages, beside the free story memories',async()=>{
 const {journalMarkup}=await import('../src/panels-ui.js');const {button}=await import('../src/shell-markup.js');
 const s=sim.createState();
 for(const lang of ['en','ar']){const t=k=>translate(lang,k),c={t,n:String,button};
  assert.ok(!journalMarkup(s,c).includes(t('arcKeepsakeTitle')));
  s.arc.keepsake=true;const html=journalMarkup(s,c);s.arc.keepsake=false;
  assert.ok(html.includes(t('arcKeepsakeTitle'))&&html.includes('<svg class="gift-art"'),lang);
 }
});

test('the rain look cools and dims the house\'s own light and is nothing when dry',async()=>{
 const {rainLook}=await import('../src/render/visual-policy.js');
 assert.deepEqual(rainLook(0),{ambient:1,key:1,fog:1,tint:0x6f86b0,tintAmount:0,glass:0});
 const wet=rainLook(1);assert.ok(wet.ambient<1&&wet.key<wet.ambient&&wet.fog>1&&wet.tintAmount>0);
 assert.deepEqual(rainLook(NaN),rainLook(0));
});

test('the rain loop is made locally, the same every time, and its ends meet without a click',async()=>{
 const {rainBuffer}=await import('../src/rain-sound.js');
 const context={sampleRate:8000,createBuffer:(c,n)=>{const d=new Float32Array(n);return {getChannelData:()=>d}}};
 const a=rainBuffer(context).getChannelData(),b=rainBuffer(context).getChannelData();
 assert.deepEqual(a,b);assert.equal(a[0],0);assert.equal(a.at(-1),0);
 assert.ok(a.some(x=>Math.abs(x)>.05)&&a.every(x=>Math.abs(x)<=1.5));
});

test('the share card names the rain night and Noor\'s night, and otherwise the day',async()=>{
 const {cardLines}=await import('../src/share-card.js');
 for(const lang of ['en','ar']){const t=k=>translate(lang,k),s=sim.createState();s.settings.locale=lang;
  assert.ok(cardLines(s,t,String).detail.startsWith(t('day')));
  s.arc.visits=5;assert.ok(cardLines(s,t,String).detail.startsWith(t('day')),'not before the rain comes');
  s.arc.rain=true;assert.ok(cardLines(s,t,String).detail.startsWith(t('arcCardRain')),lang);
  s.arc.visits=7;s.arc.keepsake=true;assert.ok(cardLines(s,t,String).detail.startsWith(t('arcCardNoor')),lang);
 }
});
