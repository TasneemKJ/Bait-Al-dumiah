#!/usr/bin/env node
/* Pacing curve, simulation only (no DOM, no minigames). Two bots play the pure
 * rules in src/simulation.js and the script prints one row per minute (median
 * over seeds) plus the first time each thing happens. Numbers only: the reading
 * lives in docs/audits/. Usage: node scripts/pacing-curve.mjs [seeds] ; env
 * MINUTES (default 30), BOT=expert|newcomer|both, JSON=1 for machine output.
 *
 * expert   : decides every tick, grants each resident's wish at once, claims
 *            every reward, keeps needs up, furnishes by cozy per button, greets
 *            the visitor every night, mends the door, leaves a gift every night.
 * newcomer : decides every ten seconds and skips a third of those decisions
 *            (seeded), claims rewards only every ninety seconds, furnishes
 *            after minute two, first greets the visitor after minute six, never
 *            touches the light control, never mends the door before minute
 *            fifteen. Seeds change only the newcomer's hesitation.
 * Excluded on purpose: the tea, sewing and chime minigames (they need real
 * touch input); their rewards are daily-capped, so this is a floor, not a total. */
import * as sim from '../src/simulation.js';
import {CATALOG,ROOMS,SLOTS,DOLLS,MILESTONES,SECRETS,VISITOR_GIFTS} from '../src/content.js';

const STEP=.25,MINUTES=Number(process.env.MINUTES)||30;
const seedsArg=Number(process.argv[2])||7,SEEDS=Array.from({length:seedsArg},(_,i)=>i+1);
const median=a=>{const s=[...a].sort((x,y)=>x-y),m=s.length>>1;return s.length?s.length%2?s[m]:(s[m-1]+s[m])/2:null};

function lcg(seed){let x=seed*7919+13;return()=>{x=(x*1103515245+12345)%2147483648;return x/2147483648}}

function run(kind,seed){
 const s=sim.createState(),rand=lcg(seed),first={},rows=[];
 const mark=(k,t)=>{if(first[k]==null)first[k]=+(t/60).toFixed(2)};
 const expert=kind==='expert';
 let earned=0,prevToday=0,prevDay=1,spent={decor:0,door:0,gifts:0,care:0};
 const claimAll=()=>{for(const m of sim.unclaimed(s))if(sim.claim(s,m.id).ok)mark('firstClaim',t)};
 let t=0;
 const spend=(key,before)=>{if(s.buttons<before)spent[key]+=before-s.buttons};
 for(let i=0;t<=MINUTES*60;i++,t+=STEP){
  sim.step(s,STEP);s.events.length=0;
  if(s.day!==prevDay){prevDay=s.day;prevToday=0}
  earned+=Math.max(0,s.earnedToday-prevToday);prevToday=s.earnedToday;
  const decide=expert||(i%40===0&&rand()>=1/3);
  if(decide){
   // Wishes first: the rewarding action for each resident.
   for(const d of s.dolls){
    const want=sim.wishFor(s,d.id);
    if(!s.wishes.includes(d.id)){const b=s.buttons,r=sim.care(s,d.id,want);if(r.ok){mark('firstCare',t);spend('care',b)}}
   }
   // Needs: top up the lowest need with a free action when below 55.
   if(expert||t>120){for(const d of s.dolls){
    const need=['hunger','energy','comfort'].map(k=>[k,d[k]]).sort((a,b)=>a[1]-b[1])[0];
    if(need[1]<55){const act=need[0]==='energy'?'rest':need[0]==='comfort'?'play':'tea';const b=s.buttons;if(sim.care(s,d.id,act).ok)spend('care',b)}
   }}
   if(s.basket>0&&(expert||t>60)){sim.collectBasket(s);mark('firstBasket',t)}
   if(expert||i%360===0)claimAll();
   // Furnish: best cozy per button that is affordable, only after minute two for a newcomer.
   if(expert||t>120){
    let best=null;
    for(const r of ROOMS)for(let slot=0;slot<SLOTS.length;slot++){
     if(s.decor.some(d=>d.room===r.id&&d.slot===slot))continue;
     for(const c of CATALOG){if(c.price>s.buttons)continue;const v=c.cozy/c.price;if(!best||v>best.v)best={r:r.id,slot,item:c.id,v}}
    }
    if(best){const b=s.buttons;if(sim.place(s,best.item,best.r,best.slot).ok){spend('decor',b);mark('firstDecor',t)}}
   }
   if(sim.isNight(s)&&(expert||t>360)){const r=sim.discover(s);if(r.ok)mark('firstWhisper',t)}
   if(expert||t>900){const b=s.buttons;if(sim.mendDoor(s).ok){spend('door',b);mark('firstDoorStep',t);if(sim.doorOpen(s))mark('doorOpen',t)}}
   if(expert&&sim.isNight(s)){const b=s.buttons;if(sim.leaveGift(s).ok){spend('gifts',b);mark('firstGift',t)}}
  }
  if(sim.isNight(s))mark('firstNight',t);
  if(s.wishes.length===DOLLS.length)mark('fullHouse',t);
  if(sim.fullRooms(s)>0)mark('firstFullRoom',t);
  if(s.journal.length===SECRETS.length)mark('allWhispers',t);
  if(s.gifts.length===VISITOR_GIFTS.length)mark('allGifts',t);
  if(s.achieved.length===MILESTONES.length)mark('allMilestones',t);
  const nothingToSpend=s.decor.length===ROOMS.length*SLOTS.length&&sim.doorOpen(s);
  if(i>0&&i%Math.round(60/STEP)===0){
   rows.push({min:Math.round(t/60),buttons:s.buttons,earned,cozy:sim.coziness(s),decor:s.decor.length,achieved:s.achieved.length,claimed:s.milestones.length,whispers:s.journal.length,bond:s.dolls.reduce((v,d)=>v+d.bond,0),door:s.door,gifts:s.gifts.length,day:s.day,spent:{...spent},floating:nothingToSpend?s.buttons:0});
  }
 }
 return {rows,first,spent,earned};
}

const bots=process.env.BOT&&process.env.BOT!=='both'?[process.env.BOT]:['expert','newcomer'];
const out={minutes:MINUTES,seeds:SEEDS,bots:{}};
for(const kind of bots){
 const runs=SEEDS.map(seed=>run(kind,seed));
 const rows=Array.from({length:MINUTES},(_,m)=>{
  const at=runs.map(r=>r.rows[m]).filter(Boolean);const pick=k=>median(at.map(r=>r[k]));
  return {min:m+1,buttons:pick('buttons'),earned:pick('earned'),cozy:pick('cozy'),decor:pick('decor'),achieved:pick('achieved'),claimed:pick('claimed'),whispers:pick('whispers'),bond:pick('bond'),door:pick('door'),gifts:pick('gifts'),day:pick('day'),floating:pick('floating')};
 });
 const firsts={};for(const k of new Set(runs.flatMap(r=>Object.keys(r.first))))firsts[k]=median(runs.map(r=>r.first[k]).filter(v=>v!=null));
 const spent={};for(const k of ['decor','door','gifts','care'])spent[k]=median(runs.map(r=>r.spent[k]));
 out.bots[kind]={rows,firsts,spent,earned:median(runs.map(r=>r.earned))};
}
if(process.env.JSON){console.log(JSON.stringify(out,null,1))}else{
 for(const [kind,d] of Object.entries(out.bots)){
  console.log(`\n== ${kind} (median of ${SEEDS.length} seeds, ${MINUTES} min) ==`);
  console.log('min day buttons earned cozy decor ach claimed whisp bond door gifts floating');
  for(const r of d.rows)console.log([r.min,r.day,r.buttons,r.earned,r.cozy,r.decor,r.achieved,r.claimed,r.whispers,r.bond,r.door,r.gifts,r.floating].map(v=>String(v).padStart(5)).join(' '));
  console.log('first (minutes):',JSON.stringify(d.firsts));console.log('spent:',JSON.stringify(d.spent),'earned total:',d.earned);
 }
}
