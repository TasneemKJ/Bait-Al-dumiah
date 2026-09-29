import test from 'node:test';
import assert from 'node:assert/strict';
import * as sim from '../src/simulation.js';
import {DOOR_STEPS,GIFT_COST,VISITOR_GIFTS,SECRETS} from '../src/content.js';
import {strings} from '../src/i18n.js';
const rich=()=>{const s=sim.createState();s.buttons=9999;return s};
const night=s=>{if(!sim.isNight(s))sim.changeLight(s)};
const nextNight=s=>{sim.changeLight(s);night(s)};

test('the closed door is mended in order and spends each step exactly',()=>{
 const s=rich();assert.equal(sim.mendDoor(s).step,'hinge');assert.equal(s.buttons,9999-40);assert.equal(sim.mendDoor(s).step,'dust');assert.equal(s.door,2);
});
test('the key waits for closeness with Sami, and opening waits for the whole story',()=>{
 const s=rich();sim.mendDoor(s);sim.mendDoor(s);
 const blocked=sim.mendDoor(s);assert.equal(blocked.reason,'doorNeeds');assert.equal(blocked.needs,'sami-dear');assert.equal(s.door,2);assert.equal(s.buttons,9999-100);
 s.dolls[2].bond=60;assert.equal(sim.mendDoor(s).step,'key');assert.equal(sim.mendDoor(s).step,'lamp');
 assert.equal(sim.mendDoor(s).needs,'all-whispers');s.journal=[...SECRETS];assert.equal(sim.mendDoor(s).step,'open');
 assert.equal(sim.doorOpen(s),true);assert.equal(sim.mendDoor(s).reason,'doorDone');assert.ok(s.achieved.includes('door-open'));
});
test('the door requires funds and never goes into debt',()=>{const s=sim.createState();s.buttons=39;assert.equal(sim.mendDoor(s).reason,'funds');assert.equal(s.door,0);assert.equal(s.buttons,39)});
test('gifts need an open door, the night, and one per night',()=>{
 const s=rich();assert.equal(sim.leaveGift(s).reason,'doorClosed');
 s.door=DOOR_STEPS.length;assert.equal(sim.leaveGift(s).reason,'daylight');night(s);
 const r=sim.leaveGift(s);assert.equal(r.gift,VISITOR_GIFTS[0]);assert.equal(s.buttons,9999-GIFT_COST);assert.equal(sim.leaveGift(s).reason,'giftTomorrow');
 s.buttons=GIFT_COST-1;nextNight(s);assert.equal(sim.leaveGift(s).reason,'funds');
});
test('all eight gifts are collected without duplicates, then the ritual can continue',()=>{
 const s=rich();s.door=DOOR_STEPS.length;for(let i=0;i<10;i++){nextNight(s);assert.equal(sim.leaveGift(s).ok,true)}
 assert.deepEqual(s.gifts,VISITOR_GIFTS);assert.ok(s.achieved.includes('all-gifts'));
});
test('door and gift progress roundtrip and reject tampering',()=>{
 const s=rich();s.door=3;s.gifts=['blue-bead'];s.lastGiftDay=1;
 const r=sim.restore(JSON.stringify(s));assert.equal(r.door,3);assert.deepEqual(r.gifts,['blue-bead']);assert.equal(r.lastGiftDay,1);
 const bad=sim.restore(JSON.stringify({...s,door:99,gifts:['<img>','blue-bead','blue-bead'],lastGiftDay:500}));assert.equal(bad.door,DOOR_STEPS.length);assert.deepEqual(bad.gifts,['blue-bead']);assert.equal(bad.lastGiftDay,1);
 const legacy=sim.restore(JSON.stringify({version:1,day:3}));assert.equal(legacy.door,0);assert.deepEqual(legacy.gifts,[]);
});
test('every door step, requirement and gift has copy in both languages',()=>{
 for(const locale of ['en','ar']){for(const d of DOOR_STEPS){for(const part of ['Title','Text'])assert.ok(strings[locale]['door_'+d.id+part]);if(d.needs)assert.ok(strings[locale]['needs_'+d.needs])}for(const g of VISITOR_GIFTS)for(const part of ['Title','Text'])assert.ok(strings[locale]['gift-'+g+part],g)}
});
test('the fifth room keeps the mystery rather than explaining it away',()=>{
 assert.match(strings.en.door_openText,/beside you/);assert.doesNotMatch(strings.en.door_openText,/ghost|dead|haunt/i);
});
