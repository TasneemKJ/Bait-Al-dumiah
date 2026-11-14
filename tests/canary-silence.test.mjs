import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import * as sim from '../src/simulation.js';
import {createAppStore,APP_NAMES} from '../src/app-store.js';
import {strings,translate} from '../src/i18n.js';
import {songGap,CANARY_MORNINGS} from '../src/cmd-store.js';
import {bootHome} from './helpers/main-home-harness.mjs';

// The canary's silence (the subscription): at dusk before the midnight visitor comes, the canary falls
// silent and faces the room the visitor comes to first. Free players get the visitor exactly as before.
const wait=(s,seconds)=>{for(let i=0;i<seconds;i++)sim.step(s,1)};
const toClock=(s,c)=>wait(s,Math.ceil((c-s.clock+240)%240));
const fresh=()=>{const s=sim.createState();for(const d of s.dolls)d.comfort=50;return s};
function store(owned={}){
 const w={};w.webkit={messageHandlers:{[APP_NAMES.handler]:{postMessage(){}}}};
 vm.runInNewContext(readFileSync(new URL('../public/tas-bridge.js',import.meta.url),'utf8'),{window:w});
 const s=createAppStore(w);w.baitApp.update({owned});return s;
}

test('the dusk forecast is what nightfall does: same thing, its own room, never the hiding place',()=>{
 const s=fresh();let warned=0,ordinary=0;
 for(let night=0;night<16;night++){
  toClock(s,sim.CANARY_DUSK-2);assert.equal(sim.forecast(s),null,'not before dusk');
  toClock(s,sim.CANARY_DUSK+4);const before=structuredClone(s),f=sim.forecast(s);
  assert.deepEqual(s,before,'read-only');
  if(f){assert.deepEqual(Object.keys(f).sort(),['doll','item','room']);
   assert.equal(f.room,sim.itemDef(f.item).room);assert.equal(sim.canaryWatch(s),f.room)}
  toClock(s,121);const m=sim.missing(s),taken=s.mischief.takenDay===s.day;
  if(f){warned++;assert.ok(taken&&m,'a warned night is a visitor night');
   assert.deepEqual([m.item,m.home],[f.item,f.room]);assert.equal(sim.canaryWatch(s),m.home,'it keeps watch')}
  else{ordinary++;assert.ok(!taken,'no visitor came unannounced')}
  assert.equal(sim.forecast(s),null,'never at night');
  // Find some, miss others (a missed thing makes the next night ordinary).
  if(m&&night%3!==1){assert.ok(sim.search(s,m.spot).found);assert.equal(sim.canaryWatch(s),null,'it relaxes')}
 }
 assert.ok(warned>=8&&ordinary>=3,`${warned} warned, ${ordinary} ordinary`);
});

test('a hurried day brings no visitor and no warning; a thing still out keeps dusk ordinary',()=>{
 const s=fresh();toClock(s,121);assert.ok(sim.missing(s));
 toClock(s,sim.CANARY_DUSK+2);assert.equal(sim.forecast(s),null,'last night’s thing is still out');
 toClock(s,121);assert.equal(sim.missing(s),null);
 sim.changeLight(s);sim.changeLight(s);assert.ok(sim.isNight(s));wait(s,3);assert.equal(sim.missing(s),null);
 s.clock=sim.CANARY_DUSK+2;s.dayTime=10;s.mischief.lastDay=0;assert.equal(sim.forecast(s),null,'a day not lived');
});

test('the canary is silent while it keeps watch and under its cloth; it sings at dusk on ordinary nights',()=>{
 const s=fresh();wait(s,40);assert.equal(songGap(s),38);
 toClock(s,sim.CANARY_DUSK+2);assert.ok(sim.forecast(s));assert.equal(songGap(s),null,'night one: silent');
 toClock(s,121);assert.equal(songGap(s),null,'watching while the thing is out');
 toClock(s,sim.CANARY_DUSK+2);assert.equal(sim.forecast(s),null);assert.equal(songGap(s),12,'an ordinary dusk');
 toClock(s,130);assert.equal(songGap(s),45,'softly, early in the night');
 toClock(s,sim.CANARY_SLEEP+1);assert.equal(songGap(s),null,'asleep under the cloth');
});

test('the morning after: a visitor night counts after a find and a reload; a loss night does not',()=>{
 const s=fresh();toClock(s,121);assert.ok(sim.search(s,sim.missing(s).spot).found);
 const back=sim.restore(JSON.stringify(s));toClock(back,1);assert.equal(back.day,2);
 assert.ok(sim.visitorLastNight(back),'found, saved, reopened: still a visitor night');
 toClock(back,121);assert.ok(sim.missing(back));toClock(back,1);toClock(back,121);
 assert.ok(sim.goneItem(back),'lost tonight');toClock(back,1);assert.equal(sim.visitorLastNight(back),false);
 toClock(back,121);toClock(back,1);assert.ok(sim.visitorLastNight(sim.restore(JSON.stringify(back))));
});

function playNights(owned){
 const game=bootHome({store:owned?store({canaryMonthly:true}):store()});game.button('play').click();
 let t=0,lines=new Set();const frames=n=>{for(let i=0;i<n;i++){t+=100;game.frame(t);
  const l=game.window.dollhouse.mischief().line;if(l)lines.add(l)}};
 frames(5);game.window.dollhouse.advance(125);frames(20);game.window.dollhouse.advance(120);frames(400);
 return {game,lines:[...lines],state:game.state()};
}
test('only the canary’s keeper hears its morning word; the house is the same for everyone',()=>{
 const free=playNights(false),kept=playNights(true),line=translate('en','canaryMorning-1');
 assert.equal(kept.state.day,2);assert.ok(sim.visitorLastNight(kept.state));
 assert.ok(kept.lines.includes(line),kept.lines.join(' | '));
 assert.ok(!free.lines.some(l=>/canary/i.test(l)),'no line and no teaser');
 assert.ok(!free.game.notices.some(l=>/canary/i.test(l)));
 const strip=s=>({...s,elapsed:0});assert.deepEqual(strip(free.state),strip(kept.state),'nothing held back');
});

test('the canary’s morning lines exist in both languages, plain and short',()=>{
 for(let n=0;n<CANARY_MORNINGS;n++)for(const lang of ['en','ar']){const v=strings[lang]['canaryMorning-'+n];
  assert.ok(v&&v.length<=100,`${lang} ${n}`);assert.doesNotMatch(v,/وبس|هلق|كتير|منيح|شو |birth|born|ولادة|وُلد/)}
 for(const lang of ['en','ar'])assert.match(strings[lang].canaryNote,lang==='en'?/falls silent at dusk/:/يصمت عند الغروب/);
});
