// Game Center on the iPhone (TasKit). The native side evaluates PROGRESS_SCRIPT inside the snapshot that
// also copies the save to the vault, so a script that breaks the snapshot loses the save backup too. These
// tests run it inside the same one-line wrapper TasKit builds (TasBootScripts.snapshot) against a fake
// localStorage, over houses the real simulation played into, and over broken and hostile saves.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as sim from '../src/simulation.js';
import {SAVE_KEY,ROOMS,CATALOG,SECRETS,SLOTS,STORY_CHAPTERS,MILESTONES,DOLLS} from '../src/content.js';
import {storyAction,finishTea} from './tea-test-helpers.mjs';
import * as gc from '../ios/game-center/progress.js';

const read=f=>readFileSync(new URL('../'+f,import.meta.url),'utf8');
const SWIFT=read('ios/BaitAlDumiah/BaitConfig.swift');

/** TasKit's snapshot, reduced to the progress part, run the way WebKit would. */
function snapshot(storage){
 const wrapper=`(function(){var out={storage:{},progress:null};try{out.progress=(${gc.PROGRESS_SCRIPT});}`+
  'catch(e){}return JSON.stringify(out);})()';
 return JSON.parse(new Function('localStorage',`return ${wrapper};`)(storage)).progress;
}
const progressOf=raw=>snapshot({getItem:k=>k===SAVE_KEY&&raw!==undefined?raw:null});
const of=s=>progressOf(JSON.stringify(s));
const none=Object.fromEntries(gc.ACHIEVEMENTS.map(a=>[a.key,false]));
const earned=s=>Object.entries(of(s).achievements).filter(([,v])=>v).map(([k])=>k);
const wait=(s,seconds)=>{for(let i=0;i<seconds;i++)sim.step(s,1)};
const toNight=s=>wait(s,Math.ceil((120-s.clock+240)%240)+1);
const rich=()=>{const s=sim.createState();s.buttons=9999;return s};

test('the script is one expression TasKit can splice, reading the real save key and content',()=>{
 assert.doesNotMatch(gc.PROGRESS_SCRIPT,/["\\]/);
 assert.doesNotMatch(gc.PROGRESS_SCRIPT,/\/\/|\/\*/);
 assert.equal(gc.PROGRESS_SCRIPT.trim().endsWith(';'),false);
 assert.equal(gc.SAVE_KEY,SAVE_KEY);
 assert.ok(gc.PROGRESS_SCRIPT.includes(`'${SAVE_KEY}'`));
 assert.deepEqual([...gc.ROOM_IDS],ROOMS.map(r=>r.id));
 assert.deepEqual([...gc.KEEPSAKE_IDS],CATALOG.map(c=>c.id));
 assert.deepEqual([...gc.SECRET_IDS],SECRETS);
 assert.equal(gc.CORNERS,SLOTS.length);assert.equal(gc.CHAPTERS,STORY_CHAPTERS.length);
 for(const id of ['full-house','every-room','three-whispers','all-whispers'])
  assert.ok(MILESTONES.some(m=>m.id===id),id);
 for(const line of read('ios/game-center/progress.js').split('\n'))assert.ok(line.length<=120,line);
});

test('it is embedded in BaitConfig.swift byte for byte, with the same keys and IDs',()=>{
 const block=SWIFT.match(/static let progressScript = \[\n([\s\S]*?)\n {4}\]\.joined\(\)/);
 assert.ok(block,'progressScript in the Swift');
 assert.equal([...block[1].matchAll(/^ {8}"(.*)",$/gm)].map(m=>m[1]).join(''),gc.PROGRESS_SCRIPT);
 const pairs=[...SWIFT.matchAll(/\.init\(key: "([^"]+)", id: "([^"]+)"\)/g)].map(([,key,id])=>({key,id}));
 assert.deepEqual(pairs,[...gc.ACHIEVEMENTS.map(({key,id})=>({key,id})),{key:gc.LEADERBOARD.key,id:gc.LEADERBOARD.id}]);
 assert.ok(SWIFT.includes('gameCenter: BaitGameCenter.config,'));
 assert.match(read('ios/BaitAlDumiah/BaitAlDumiah.entitlements'),
   /<key>com\.apple\.developer\.game-center<\/key>\s*<true\/>/);
 const project=read('ios/BaitAlDumiah.xcodeproj/project.pbxproj');
 assert.equal(project.split('CODE_SIGN_ENTITLEMENTS = BaitAlDumiah/BaitAlDumiah.entitlements;').length-1,2);
});

test('with no save, a broken save or a storage that throws, nothing is earned and nothing thrown',()=>{
 const empty={achievements:none,scores:{}};
 assert.deepEqual(progressOf(),empty);
 for(const bad of ['','{not json','null','[]','42','"text"'])assert.deepEqual(progressOf(bad),empty,bad);
 for(const storage of [undefined,null,{getItem(){throw new Error('blocked')}}])assert.deepEqual(snapshot(storage),empty);
 const junk={lastFullDay:'3',achieved:'full-house',milestones:{0:'every-room'},journal:'jasmine',
  decor:{room:'kitchen'},activities:{teaRecords:'90',mastery:{tea:'4'}},story:{chapter:'3'},
  mischief:{nights:'4',log:'found'},arc:{rain:'yes',visits:'12'}};
 assert.deepEqual(of(junk),empty);
 const hostile={lastFullDay:-Infinity,achieved:[null,7,{}],journal:[...SECRETS.slice(0,2),SECRETS[0],SECRETS[1],'ghost'],
  decor:[null,{room:'kitchen',item:'throne',slot:0},{room:'attic',item:'lamp',slot:0},
   {room:'parlor',item:'lamp',slot:1.5},{room:'studio',item:'lamp',slot:7}],
  activities:{teaRecords:[NaN,null,'50'],mastery:{tea:Infinity}},story:{chapter:NaN},
  mischief:{nights:3,losses:9,item:'teaspoon',log:[{found:'true'},null]},arc:{rain:1,visits:-5}};
 assert.deepEqual(of(hostile),empty);
});

test('a fresh house, as the game first saves it, has earned nothing',()=>{
 assert.deepEqual(of(sim.createState()),{achievements:none,scores:{}});
 assert.deepEqual(of(sim.restore(null)),{achievements:none,scores:{}});
});

test('the first pour: a tea ritual served, never Lina’s wish for tea from the care buttons',()=>{
 const s=rich();sim.care(s,'lina','tea');assert.deepEqual(earned(s),[]);
 assert.equal(sim.beginActivity(s,'tea').ok,true);const result=finishTea(s);assert.equal(result.ok,true);
 sim.endActivity(s);assert.ok(earned(s).includes('firstTea'));
 const zero=sim.createState();zero.activities.teaRecords[0]=0;assert.ok(earned(zero).includes('firstTea'),'a poor pour is a pour');
});

test('three wishes in a day, a keepsake in every room, and the visitor’s thing found before nightfall',()=>{
 const s=rich();for(const d of DOLLS)sim.care(s,d.id,sim.wishFor(s,d.id));
 assert.equal(s.lastFullDay,1);assert.deepEqual(earned(s),['threeWishes']);
 const r=rich();ROOMS.slice(0,3).forEach(room=>sim.place(r,'plant',room.id,0));assert.deepEqual(earned(r),[]);
 sim.place(r,'plant',ROOMS[3].id,0);assert.deepEqual(earned(r),['everyRoom']);
 sim.remove(r,r.decor[0].id);assert.deepEqual(earned(r),['everyRoom'],'the recorded milestone stands in');
 const m=sim.createState();for(const d of m.dolls)d.comfort=50;toNight(m);
 const out=sim.missing(m);assert.ok(out);assert.deepEqual(earned(m),[],'taken, not yet found');
 assert.equal(sim.search(m,out.spot).found,true);assert.deepEqual(earned(m),['beforeNightfall']);
 m.mischief.log=[];assert.deepEqual(earned(m),['beforeNightfall'],'the count outlives the twelve-night log');
});

test('a night lost to the visitor is never counted as found',()=>{
 const s=sim.createState();for(const d of s.dolls)d.comfort=50;toNight(s);assert.ok(sim.missing(s));
 for(let i=0;i<3&&!s.mischief.losses;i++){wait(s,240)}
 assert.ok(s.mischief.losses>=1,'the visitor kept it');
 assert.equal(s.mischief.log.some(e=>e.found),false);assert.equal(earned(s).includes('beforeNightfall'),false);
});

test('three whispers heard, then the house’s story only when the game itself calls it complete',()=>{
 const s=rich();for(const room of ROOMS)for(const slot of SLOTS.keys())sim.place(s,'musicbox',room.id,slot);
 for(let i=0;i<2;i++){sim.changeLight(s);assert.equal(sim.discover(s).ok,true);sim.changeLight(s)}
 assert.deepEqual(earned(s),['everyRoom'],'two whispers are not yet three');
 sim.changeLight(s);assert.equal(sim.discover(s).ok,true);sim.changeLight(s);
 assert.deepEqual(earned(s),['everyRoom','threeWhispers']);
 for(let i=0;i<3;i++){sim.changeLight(s);assert.equal(sim.discover(s).ok,true);sim.changeLight(s)}
 assert.equal(s.journal.length,SECRETS.length);assert.equal(earned(s).includes('wholeStory'),false,'stories left');
 for(const chapter of STORY_CHAPTERS)for(const step of chapter.steps)assert.equal(storyAction(s,step.object).ok,true);
 assert.equal(sim.storyStatus(s).finished,true);
 assert.equal(sim.keepsakeWish(s),null,'every corner is furnished');
 assert.ok(earned(s).includes('wholeStory'));assert.ok(earned(s).includes('firstTea'),'the guest’s cup was poured');
 const gap=structuredClone(s);gap.decor.pop();assert.equal(earned(gap).includes('wholeStory'),false);
});

test('the rain night is earned only on the fifth visit’s night, and days kept count real visits',()=>{
 const s=sim.createState();
 for(let i=1;i<=4;i++)sim.markVisit(s,`2026-12-0${i}`);toNight(s);
 assert.deepEqual(of(s),{achievements:none,scores:{daysKept:4}});
 sim.changeLight(s);sim.changeLight(s);sim.changeLight(s);assert.equal(of(s).scores.daysKept,4,'dawns are not visits');
 sim.markVisit(s,'2026-12-05');s.clock=10;wait(s,1);assert.equal(s.arc.rain,false);
 toNight(s);assert.equal(s.arc.rain,true);assert.deepEqual(earned(s),['rainNight']);
 assert.deepEqual(of(s).scores,{daysKept:5});
 const old=sim.createState();old.arc.visits=1e9;assert.deepEqual(of(old).scores,{daysKept:999});
});

test('the store text fits App Store Connect and the house',()=>{
 for(const a of gc.ACHIEVEMENTS)for(const t of [a.en,a.ar]){
  assert.ok(t.name.length<=30,t.name);assert.ok(t.before.length<=200,t.before);assert.ok(t.after.length<=200,t.after);
 }
 for(const t of [gc.LEADERBOARD.en,gc.LEADERBOARD.ar])assert.ok(t.name.length<=30);
 const ids=gc.ACHIEVEMENTS.map(a=>a.id);
 assert.equal(new Set(ids).size,7);
 ids.forEach((id,i)=>assert.match(id,new RegExp(`^bait\\.milestone\\.${i+1}_[a-z_]+$`)));
 assert.match(gc.LEADERBOARD.id,/^bait\.[A-Za-z]+$/);
 assert.ok(gc.ACHIEVEMENTS.reduce((s,a)=>s+a.points,0)<=1000);
 for(const a of gc.ACHIEVEMENTS)assert.ok(a.points>0&&a.points<=100);
 assert.deepEqual(gc.ACHIEVEMENTS.filter(a=>a.hidden).map(a=>a.key),['rainNight']);
 const all=JSON.stringify([gc.ACHIEVEMENTS,gc.LEADERBOARD]);
 assert.doesNotMatch(all,/birth|reborn|born|newborn|ولادة|ميلاد|مولد|مولود|يولد|تولد|ولد من جديد/i);
 assert.doesNotMatch(all,/!|！/,'understated: no exclamation marks');
 for(const a of gc.ACHIEVEMENTS)for(const t of Object.values(a.ar))assert.match(t,/[\u0600-\u06FF]/);
 assert.deepEqual(Object.keys(of(sim.createState()).achievements),gc.ACHIEVEMENTS.map(a=>a.key));
});
