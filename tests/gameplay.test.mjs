import test from 'node:test';
import assert from 'node:assert/strict';
import * as sim from '../src/simulation.js';
import {DOLLS,MILESTONES,SEW_SECONDS,SEW_DAILY,SECRET_COZY,BASKET_MAX} from '../src/content.js';
import {strings} from '../src/i18n.js';
const fresh=()=>sim.createState();
const runDay=(s)=>{sim.changeLight(s);sim.changeLight(s)};
const wait=(s,seconds)=>{for(let i=0;i<seconds;i++)sim.step(s,1)};

test('day one keeps the authored wishes and later days rotate through personal wishes',()=>{
 const s=fresh();assert.deepEqual(DOLLS.map(d=>sim.wishFor(s,d.id)),DOLLS.map(d=>d.wish));
 const seen=Object.fromEntries(DOLLS.map(d=>[d.id,new Set()]));
 for(let day=1;day<=12;day++){s.day=day;for(const d of DOLLS){const w=sim.wishFor(s,d.id);assert.ok(d.wishes.includes(w));seen[d.id].add(w)}}
 for(const d of DOLLS)assert.ok(seen[d.id].size>=3,d.id);
 assert.equal(sim.wishFor(s,'nobody'),null);
});
test('every rotating wish has copy in both languages',()=>{
 for(const d of DOLLS)for(const action of d.wishes){const key=action===d.wish?d.id+'Wish':d.id+'Wish_'+action;for(const locale of ['en','ar'])assert.ok(strings[locale][key],locale+':'+key)}
});
test('a wished-for action is welcome even when its need is nearly full',()=>{
 const s=fresh();s.dolls[0].hunger=99;assert.equal(sim.care(s,'lina','tea').ok,true);assert.deepEqual(s.wishes,['lina']);
 s.elapsed+=5;s.dolls[0].hunger=99;assert.equal(sim.care(s,'lina','tea').reason,'enough');
});
test('the rotated wish, not the authored one, earns the reward on later days',()=>{
 const s=fresh();runDay(s);assert.equal(s.day,2);const want=sim.wishFor(s,'lina');assert.notEqual(want,'tea');
 s.dolls[0].hunger=50;const before=s.buttons;sim.care(s,'lina','tea');assert.equal(s.buttons,before-2);assert.deepEqual(s.wishes,[]);
 s.elapsed+=5;assert.equal(sim.care(s,'lina',want).ok,true);assert.deepEqual(s.wishes,['lina']);
});
test('closeness grows with care, levels up with a gift and raises wish rewards',()=>{
 const s=fresh(),lina=s.dolls[0];assert.equal(sim.wishReward(lina),8);
 sim.care(s,'lina','tea');assert.equal(lina.bond,8);
 const before=s.buttons;s.elapsed+=5;lina.comfort=10;sim.care(s,'lina','soothe');assert.equal(sim.bondLevel(lina.bond),0);
 s.elapsed+=5;lina.comfort=10;sim.care(s,'lina','soothe');assert.equal(sim.bondLevel(lina.bond),1);assert.equal(s.buttons,before+5);
 assert.ok(s.events.some(e=>e.type==='bond'&&e.id==='lina'&&e.level===1));assert.equal(sim.wishReward(lina),10);
 assert.equal(sim.nextBond(lina.bond),35);assert.equal(sim.nextBond(100),null);
});
test('care in a favourite room brings the resident closer faster',()=>{
 const a=fresh(),b=fresh();sim.moveDoll(b,'sami','kitchen');a.dolls[2].comfort=b.dolls[2].comfort=10;
 sim.care(a,'sami','soothe');sim.care(b,'sami','soothe');assert.ok(b.dolls[2].bond>a.dolls[2].bond);
 assert.equal(sim.moveDoll(fresh(),'lina','parlor').favorite,true);
});
test('a favourite room slows fading comfort without ever raising it',()=>{
 const a=fresh(),b=fresh();sim.moveDoll(b,'lina','parlor');wait(a,50);wait(b,50);
 assert.ok(b.dolls[0].comfort>a.dolls[0].comfort);assert.ok(b.dolls[0].comfort<=70);
});
test('granting all three wishes pays a full-house bonus and builds a daily streak',()=>{
 const s=fresh();const grant=()=>{for(const d of DOLLS){const doll=s.dolls.find(x=>x.id===d.id);doll.hunger=doll.energy=doll.comfort=40;s.elapsed+=5;assert.equal(sim.care(s,d.id,sim.wishFor(s,d.id)).ok,true)}};
 grant();assert.equal(s.streak,1);assert.equal(s.lastFullDay,1);assert.ok(s.events.some(e=>e.type==='full-house'&&e.reward===6));
 runDay(s);grant();assert.equal(s.streak,2);runDay(s);grant();assert.equal(sim.currentStreak(s),3);
 runDay(s);runDay(s);assert.equal(sim.currentStreak(s),0);grant();assert.equal(s.streak,1);
});
test('content residents sew into a bounded basket that only pays when collected',()=>{
 const s=fresh();for(const d of s.dolls)d.hunger=d.energy=d.comfort=100;
 const money=s.buttons;wait(s,SEW_SECONDS);assert.equal(s.basket,3);assert.equal(s.buttons,money);
 wait(s,SEW_SECONDS*3);assert.equal(s.basket,SEW_DAILY);assert.equal(s.sewnToday,SEW_DAILY);
 const r=sim.collectBasket(s);assert.equal(r.reward,SEW_DAILY);assert.equal(s.buttons,money+SEW_DAILY);assert.equal(sim.collectBasket(s).ok,false);
 runDay(s);assert.equal(s.sewnToday,0);
});
test('uncomfortable residents never sew and never lose anything for it',()=>{
 const s=fresh();for(const d of s.dolls){d.hunger=20;d.energy=100;d.comfort=100}const money=s.buttons;wait(s,SEW_SECONDS*2);assert.equal(s.basket,0);assert.equal(s.buttons,money);
});
test('a treasured keepsake nearby makes contentment easier and is announced on placement',()=>{
 const s=fresh();s.buttons=100;const lina=s.dolls[0];assert.equal(sim.contentThreshold(s,lina),55);
 const r=sim.place(s,'musicbox','kitchen',0);assert.deepEqual(r.loved,['lina']);assert.equal(sim.delighted(s,lina),true);assert.equal(sim.contentThreshold(s,lina),45);
 assert.deepEqual(sim.place(s,'plant','kitchen',1).loved,[]);
});
test('milestones are reached automatically but pay only once when collected',()=>{
 const s=fresh();const money=s.buttons;sim.care(s,'lina','tea');assert.ok(s.achieved.includes('first-care'));assert.equal(s.buttons,money-2+8);
 assert.deepEqual(sim.unclaimed(s).map(m=>m.id),['first-care']);
 assert.equal(sim.claim(s,'first-care').reward,5);assert.equal(sim.claim(s,'first-care').reason,'claimed');assert.equal(sim.claim(s,'family').reason,'invalid');assert.equal(sim.claim(s,'bogus').reason,'invalid');
 assert.equal(s.buttons,money-2+8+5);
});
test('filling a room makes the house cozier and completes room milestones',()=>{
 const s=fresh();s.buttons=200;for(const slot of [0,1,2])sim.place(s,'plant','studio',slot);
 assert.equal(sim.fullRooms(s),1);assert.ok(s.achieved.includes('room-complete'));
 const withFull=sim.coziness(s);sim.remove(s,s.decor[2].id);assert.ok(withFull-sim.coziness(s)>=4+4-1);
});
test('later whispers wait for a cozier house and explain what the visitor needs',()=>{
 const s=fresh();for(let i=0;i<2;i++){sim.changeLight(s);assert.equal(sim.discover(s).ok,true);sim.changeLight(s)}
 sim.changeLight(s);for(const d of s.dolls)d.comfort=0;const r=sim.discover(s);assert.equal(r.reason,'shy');assert.equal(r.needed,SECRET_COZY[2]);assert.equal(s.journal.length,2);
 s.buttons=200;for(const slot of [0,1,2])sim.place(s,'musicbox','parlor',slot);assert.equal(sim.discover(s).ok,true);
});
test('every milestone and closeness level has copy in both languages',()=>{
 for(const locale of ['en','ar']){for(const m of MILESTONES)for(const part of ['Title','Text'])assert.ok(strings[locale]['ms-'+m.id+part],m.id);for(let i=0;i<5;i++)assert.ok(strings[locale]['bond'+i]);for(const d of DOLLS)for(const i of [1,2,3])assert.ok(strings[locale][d.id+'Memory'+i])}
});
test('earlier version-1 saves without the new fields restore safely',()=>{
 const legacy={version:1,elapsed:50,clock:30,day:4,buttons:80,unease:10,cares:12,dolls:[{id:'lina',hunger:50,energy:50,comfort:50,bond:40,room:'kitchen'}],decor:[{id:1,item:'plant',room:'kitchen',slot:0}],wishes:['lina'],journal:['music-box'],lastSecretDay:3,settings:{locale:'ar'}};
 const s=sim.restore(JSON.stringify(legacy));assert.equal(s.version,1);assert.equal(s.streak,0);assert.equal(s.basket,0);assert.deepEqual(s.milestones,[]);assert.deepEqual(s.events,[]);assert.equal(sim.bondLevel(s.dolls[0].bond),2);
 sim.step(s,.1);for(const id of ['first-care','first-keepsake','first-friend'])assert.ok(s.achieved.includes(id),id);assert.equal(s.buttons,80);
});
test('new progression fields roundtrip and reject tampering',()=>{
 const s=fresh();sim.care(s,'lina','tea');sim.claim(s,'first-care');s.basket=4;s.streak=2;s.lastFullDay=1;s.sewnToday=3;
 const r=sim.restore(JSON.stringify(s));assert.deepEqual(r.milestones,['first-care']);assert.deepEqual(r.achieved,['first-care']);assert.equal(r.basket,4);assert.equal(r.streak,2);assert.equal(r.sewnToday,3);assert.deepEqual(r.events,[]);
 const bad=sim.restore(JSON.stringify({...s,basket:1e9,streak:-5,lastFullDay:999,sewnToday:99,milestones:['bogus','family','family'],achieved:'x'}));
 assert.equal(bad.basket,BASKET_MAX);assert.equal(bad.lastFullDay,1);assert.equal(bad.sewnToday,SEW_DAILY);assert.deepEqual(bad.milestones,['family']);assert.deepEqual(bad.achieved,['family']);
 assert.equal(sim.claim(bad,'family').reason,'claimed');
});
test('an uncollected basket stops sewing at its cap and reloads without losing buttons',()=>{
 const s=fresh();for(let day=0;day<4;day++){for(let i=0;i<130;i++){for(const d of s.dolls)d.hunger=d.energy=d.comfort=100;sim.step(s,1)}sim.changeLight(s);if(sim.isNight(s))sim.changeLight(s)}
 assert.equal(s.basket,BASKET_MAX);assert.equal(sim.restore(JSON.stringify(s)).basket,BASKET_MAX);
});
test('packing a keepsake away returns the comfort it gave, so place/refund loops earn nothing',()=>{
 const s=fresh();s.dolls[0].comfort=10;for(let i=0;i<5;i++){sim.place(s,'musicbox','kitchen',0);sim.remove(s,s.decor[0].id)}
 assert.equal(s.dolls[0].comfort,10);assert.equal(s.buttons,36);
});
