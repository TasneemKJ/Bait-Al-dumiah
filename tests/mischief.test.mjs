import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as sim from '../src/simulation.js';
import {MISCHIEF_ITEMS,MISCHIEF_SPOTS,MISCHIEF_GRACE,ROOMS,DOLLS} from '../src/content.js';
import {strings} from '../src/i18n.js';
import {mischiefLines,whereKey,placeLine,lineSeconds} from '../src/mischief-ui.js';

// The midnight visitor (src/sim-mischief.js): take, hide, find, miss, elegy and the save.
const wait=(s,seconds)=>{for(let i=0;i<seconds;i++)sim.step(s,1)};
const events=(s,type)=>s.events.splice(0).filter(e=>e.type===type);
// Live the day until nightfall (clock 120), as a player who leaves the house open would.
const toNight=s=>wait(s,Math.ceil((120-s.clock+240)%240)+1);
const fresh=()=>{const s=sim.createState();for(const d of s.dolls)d.comfort=50;return s};
const roomY=id=>ROOMS.find(r=>r.id===id).y;

test('nothing is taken by day; the first night takes Lina’s teaspoon and hides it by the kettle, glinting',()=>{
 const s=fresh();wait(s,110);assert.equal(sim.missing(s),null);
 toNight(s);const m=sim.missing(s);
 assert.deepEqual([m.item,m.doll,m.home,m.spot,m.room,m.scope,m.glint],
   ['teaspoon','lina','kitchen','kettle','kitchen','first',true]);
 assert.equal(events(s,'mischief-take').length,1);
 wait(s,60);assert.equal(s.mischief.nights,1,'one thing a night');
});

test('hurrying dusk with the light control takes nothing until the day has been lived',()=>{
 const s=fresh();sim.changeLight(s);assert.ok(sim.isNight(s));wait(s,2);assert.equal(sim.missing(s),null);
 wait(s,60);assert.equal(sim.missing(s)?.item,'teaspoon','a lived minute later, the visitor comes');
 // Hurrying through dawn and dusk again never loses it: the next day must be lived and the grace must pass.
 sim.changeLight(s);sim.changeLight(s);wait(s,2);assert.equal(sim.missing(s)?.item,'teaspoon');
});

test('a wrong place says only whether the thing is in this room; the right place brings it home',()=>{
 const s=fresh();
 assert.equal(sim.search(s,'kettle').empty,true,'nothing is missing yet');
 assert.equal(sim.search(s,'nowhere').ok,false);
 toNight(s);
 const far=sim.search(s,'hearth'),near=sim.search(s,'jars');
 assert.deepEqual([far.found,far.near,near.found,near.near],[false,false,false,true]);
 const lina=s.dolls.find(d=>d.id==='lina'),comfort=lina.comfort,bond=lina.bond,buttons=s.buttons;
 const found=sim.search(s,'kettle');
 assert.deepEqual([found.found,found.item,found.doll,found.home],[true,'teaspoon','lina','kitchen']);
 assert.equal(sim.missing(s),null);assert.equal(lina.comfort,comfort+10);assert.equal(lina.bond,bond+4);
 assert.equal(s.buttons,buttons,'brightening pays in closeness and comfort, never buttons');
 assert.deepEqual(s.mischief.log,[{item:'teaspoon',day:1,found:true,elegy:0}]);
 assert.equal(sim.search(s,'kettle').empty,true,'found once');
});

test('the quilt hides things inside the moon bed: the story object doubles as a hiding place',()=>{
 assert.equal(sim.spotForObject('prop:moon-bed')?.id,'quilt');assert.equal(sim.spotForObject('prop:tea-set'),null);
 for(const p of MISCHIEF_SPOTS)assert.ok(p.prop||p.at&&p.size,p.id);
});

test('missed by the next nightfall: an elegy, a quiet day for its owner, and the thing returns at dawn',()=>{
 const s=fresh();toNight(s);s.events.length=0;
 wait(s,100);assert.ok(sim.missing(s),'still the same night: nothing lost yet');
 toNight(s);
 const [lost]=events(s,'mischief-lost');
 assert.deepEqual([lost.item,lost.doll,lost.elegy],['teaspoon','lina',0]);
 assert.equal(sim.missing(s),null);assert.equal(sim.goneItem(s),'teaspoon');
 assert.ok(sim.quietDoll(s,'lina'));assert.ok(!sim.quietDoll(s,'noor'));
 assert.equal(s.mischief.quiet.lina,s.day+1);
 wait(s,60);assert.equal(sim.missing(s),null,'no new mischief on a night that has just cost something');
 const day=s.day;wait(s,240-s.clock+1);assert.equal(s.day,day+1);
 assert.equal(sim.goneItem(s),null,'back on its hook at dawn');assert.ok(sim.quietDoll(s,'lina'),'quiet for a day');
 toNight(s);assert.ok(sim.missing(s),'the visitor comes again the next night');
 wait(s,240-s.clock+1);assert.ok(!sim.quietDoll(s,'lina'),'the quiet day ends');
 assert.ok(MISCHIEF_GRACE>=120);
});

test('a quiet doll still accepts care, a little softer: three quarters of the need, half the closeness',()=>{
 const run=quiet=>{const s=fresh();const d=s.dolls.find(x=>x.id==='noor');d.comfort=20;d.bond=0;
  if(quiet)s.mischief.quiet.noor=s.day;s.elapsed=100;const r=sim.care(s,'noor','soothe');
  return {r,comfort:d.comfort,bond:d.bond}};
 const glad=run(false),quiet=run(true);
 assert.ok(glad.r.ok&&quiet.r.ok);assert.equal(quiet.r.quiet,true);
 assert.equal(glad.comfort-20,24);assert.equal(quiet.comfort-20,18);
 assert.equal(quiet.bond,Math.round(glad.bond*.5));
});

test('hiding places widen over the visitor’s own first week: room, then floor, then the whole house',()=>{
 const s=fresh();const seen=[];
 for(let n=0;n<14;n++){toNight(s);const m=sim.missing(s);seen.push(m);sim.search(s,m.spot);wait(s,10)}
 assert.deepEqual(seen.map(m=>m.scope),['first','room','room','floor','floor',...Array(9).fill('house')]);
 for(const m of seen.slice(1,3))assert.equal(m.room,m.home);
 for(const m of seen.slice(3,5))assert.equal(roomY(m.room),roomY(m.home));
 assert.ok(new Set(seen.slice(5).map(m=>m.room)).size>=3,'later nights hide anywhere in the house');
 assert.deepEqual(new Set(seen.map(m=>m.doll)),new Set(DOLLS.map(d=>d.id)),'every doll takes a turn');
 for(let i=1;i<seen.length;i++)assert.notEqual(seen[i].item,seen[i-1].item,'never the same thing twice running');
});

test('the visitor is deterministic: the same house hides the same thing in the same place, without Math.random',()=>{
 const run=()=>{const s=fresh();const out=[];for(let n=0;n<8;n++){toNight(s);const m=sim.missing(s);
  out.push(m.item+'@'+m.spot);sim.search(s,m.spot)}return out};
 assert.deepEqual(run(),run());
 assert.doesNotMatch(readFileSync(new URL('../src/sim-mischief.js',import.meta.url),'utf8'),/Math\.random/);
});

test('an old save meets the visitor gently: its first night is taught, whatever its day count',()=>{
 const s=fresh();s.day=40;s.hints.night=true;delete s.mischief;
 const old=sim.restore(JSON.stringify(s));assert.deepEqual(old.mischief,sim.createState().mischief);
 old.dayTime=100;old.clock=119;wait(old,2);assert.equal(sim.missing(old)?.scope,'first');
});

test('every thing has its missing, found and elegy lines in both languages, and 8-12 elegies in all',()=>{
 let elegies=0;
 for(const item of MISCHIEF_ITEMS){
  const keys=['mischief-item-'+item.id,'mischief-missing-'+item.id,'mischief-found-'+item.id];
  for(let i=0;i<sim.ELEGIES[item.id];i++){keys.push(`elegy-${item.id}-${i}`);elegies++}
  for(const k of keys)for(const lang of ['en','ar'])assert.ok(strings[lang][k],`${lang} ${k}`);
 }
 assert.ok(elegies>=8&&elegies<=12,String(elegies));
 const ar=Object.entries(strings.ar).filter(([k])=>k.startsWith('elegy-'));
 assert.equal(new Set(ar.map(([,v])=>v)).size,ar.length,'no elegy repeats another');
 for(const [k,v] of Object.entries(strings.ar).filter(([k])=>/^(elegy-|mischief)/.test(k))){
  assert.match(v,/[؀-ۿ]/,k);assert.doesNotMatch(v,/[A-Za-z0-9]/,k);
  assert.doesNotMatch(v,/(^|\s)(شو|هيك|مش|ليش|كمان|شوي|عم|رح|بدّ?ه)(\s|$)/,k);
 }
 for(const d of ['lina','noor','sami'])assert.ok(strings.ar['mischief-quiet-'+d]);
 assert.match(strings.ar['mischief-quiet-sami'],/صامت /);assert.match(strings.ar['mischief-quiet-noor'],/صامتة/);
});

test('each lost thing gets its next elegy, and the journal keeps the record',()=>{
 const s=fresh();const said=[];
 for(let n=0;n<12;n++){toNight(s);const lost=events(s,'mischief-lost')[0];if(lost)said.push(lost)}
 assert.ok(said.length>=4);
 for(const e of said)assert.ok(strings.en[`elegy-${e.item}-${e.elegy}`],e.item);
 assert.ok(s.mischief.log.length<=12&&s.mischief.log.every(e=>e.found===false));
 const t=k=>strings.ar[k]??k,lines=mischiefLines({type:'mischief-lost',...said[0]},t);
 assert.equal(lines.length,2);assert.equal(lines[1],strings.ar['mischief-quiet-'+said[0].doll]);
});

test('the save keeps what is missing and whitelists and clamps every visitor field',()=>{
 const s=fresh();toNight(s);const saved=sim.restore(JSON.stringify(s));
 assert.deepEqual(saved.mischief,s.mischief);assert.deepEqual(sim.missing(saved),sim.missing(s));
 const hostile={...s,mischief:{nights:-4,item:'<img>',spot:'kettle',takenDay:1e9,takenAt:-5,lastDay:1e9,losses:'x',
  gone:'piano',goneDay:-1,quiet:{lina:1e9,ghost:3},log:[null,{item:'bell',day:1e9,found:'yes',elegy:99},
  {item:'piano'},...Array(40).fill({item:'thimble',day:1,found:true})],extra:'drop me'}};
 const m=sim.restore(JSON.stringify(hostile)).mischief;
 assert.deepEqual([m.nights,m.item,m.spot,m.lastDay,m.losses,m.gone],[0,'','',1,0,'']);
 assert.equal(m.quiet.lina,s.day+1);assert.ok(!('ghost' in m.quiet));assert.ok(!('extra' in m));
 assert.equal(m.log.length,12);assert.ok(m.log.every(e=>e.item==='thimble'||e.item==='bell'));
 const valid={...s,mischief:{...s.mischief,log:[{item:'bell',day:1e9,found:'yes',elegy:99}]}};
 assert.deepEqual(sim.restore(JSON.stringify(valid)).mischief.log,[{item:'bell',day:s.day,found:false,elegy:0}]);
 for(const bad of [null,'x',[],42])assert.deepEqual(sim.restore(JSON.stringify({...s,mischief:bad})).mischief,
   sim.createState().mischief);
 const noSpot={...s,mischief:{...s.mischief,spot:'attic'}};assert.equal(sim.missing(sim.restore(JSON.stringify(noSpot))),null);
 assert.equal(sim.restore('{not json').mischief.item,'');
});

test('the visitor’s line sits clear of the HUD, inside the phone, and reads for a few seconds',()=>{
 const at=placeLine({x:5,y:5},260,60,390,844);assert.ok(at.x>=16+130&&at.y>=176);
 const low=placeLine({x:385,y:840},260,60,390,844);assert.ok(low.x<=390-16-130&&low.y+60<=844-236);
 assert.ok(placeLine(null,260,60,390,844).y>0);
 assert.ok(lineSeconds('short')>=3.5&&lineSeconds('x'.repeat(400))<=8);
 assert.equal(whereKey({scope:'floor',home:'studio'}),'mischief-where-floor-1');
 assert.equal(whereKey({scope:'floor',home:'kitchen'}),'mischief-where-floor-0');
 assert.equal(whereKey({scope:'room',home:'bedroom'}),'mischief-where-room-bedroom');
});

test('a search the browser cannot save still brings the thing home and warns, without losing the house',async()=>{
 const {bootHome}=await import('./helpers/main-home-harness.mjs');
 const s=fresh();s.cares=1;toNight(s);s.events.length=0;
 const game=bootHome({saved:JSON.stringify(s),writeFails:true});game.button('play').click();
 assert.equal(game.state().mischief.item,'teaspoon','the missing thing survived the reload');
 game.dispatch()('search','jars');assert.equal(game.state().mischief.item,'teaspoon');
 game.dispatch()('search','kettle');assert.equal(game.state().mischief.item,'');
 assert.ok(game.notices.some(n=>/Saving is unavailable/.test(n)));
});
