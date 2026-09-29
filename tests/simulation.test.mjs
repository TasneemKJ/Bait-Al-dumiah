import test from 'node:test';
import assert from 'node:assert/strict';
import * as sim from '../src/simulation.js';
const fresh = () => sim.createState();
test('new house has three residents, four rooms, spendable buttons', () => {
 const s=fresh(); assert.equal(s.dolls.length,3); assert.equal(s.buttons,36); assert.equal(s.version,1); assert.equal(s.decor.length,0);
});
test('care satisfies a need, completes a wish and earns its reward once', () => {
 const s=fresh(), before=s.buttons; const r=sim.care(s,'lina','tea');
 assert.equal(r.ok,true); assert.ok(s.dolls[0].hunger>40); assert.equal(s.buttons,before-2+8); assert.equal(s.wishes.length,1);
 s.elapsed+=5; sim.care(s,'lina','tea'); assert.equal(s.wishes.length,1);
});
test('care rejects unknown ids, cooldown and full needs without spending',()=>{
 const s=fresh(); assert.equal(sim.care(s,'bad','tea').ok,false); assert.equal(sim.care(s,'lina','bad').ok,false);
 sim.care(s,'lina','tea'); const money=s.buttons; assert.equal(sim.care(s,'lina','tea').ok,false); assert.equal(s.buttons,money);
 s.elapsed+=5; s.dolls[0].hunger=100; assert.equal(sim.care(s,'lina','tea').ok,false); assert.equal(s.buttons,money);
});
test('a paid care action requires funds',()=>{const s=fresh();s.buttons=0;assert.equal(sim.care(s,'lina','tea').ok,false);assert.equal(s.dolls[0].hunger,40)});
test('simulation ages needs and respects pause',()=>{
 const s=fresh();const h=s.dolls[0].hunger;sim.step(s,1);assert.ok(s.dolls[0].hunger<h);
 s.paused=true;const t=s.elapsed;sim.step(s,10);assert.equal(s.elapsed,t);
});
test('nonfinite and negative deltas cannot corrupt state',()=>{const s=fresh();for(const dt of [-1,NaN,Infinity])sim.step(s,dt);assert.equal(s.elapsed,0)});
test('time step is bounded after a suspended frame',()=>{const s=fresh();sim.step(s,9999);assert.ok(s.elapsed<=1)});
test('placement spends only on valid unoccupied slots',()=>{
 const s=fresh();assert.equal(sim.place(s,'plant','kitchen',0).ok,true);assert.equal(s.buttons,28);assert.equal(s.decor.length,1);
 assert.equal(sim.place(s,'lamp','kitchen',0).ok,false);assert.equal(s.buttons,28);
 for(const args of [['bad','kitchen',1],['plant','bad',1],['plant','kitchen',99],['plant','kitchen',.5]])assert.equal(sim.place(s,...args).ok,false);
});
test('unaffordable furniture cannot be placed',()=>{const s=fresh();s.buttons=0;assert.equal(sim.place(s,'lamp','parlor',0).ok,false);assert.equal(s.decor.length,0)});
test('packing away refunds original price exactly once',()=>{const s=fresh();sim.place(s,'plant','kitchen',0);const id=s.decor[0].id;assert.equal(sim.remove(s,id).ok,true);assert.equal(s.buttons,36);assert.equal(sim.remove(s,id).ok,false);assert.equal(s.buttons,36)});
test('furnishings improve household coziness',()=>{const s=fresh();const c=sim.coziness(s);sim.place(s,'plant','kitchen',0);assert.ok(sim.coziness(s)>c)});
test('nightfall reveals one mystery and dawn does not punish absent players',()=>{
 const s=fresh();assert.equal(sim.discover(s).ok,false);sim.changeLight(s);assert.equal(sim.isNight(s),true);assert.equal(sim.discover(s).ok,true);assert.equal(s.journal.length,1);assert.equal(sim.discover(s).ok,false);
 const hunger=s.dolls[0].hunger;sim.changeLight(s);assert.equal(sim.isNight(s),false);assert.equal(s.day,2);assert.equal(s.dolls[0].hunger,hunger);
});
test('all six secrets can be discovered in a cozy house, without duplicates or unlimited rewards',()=>{const s=fresh();s.buttons=9999;for(const room of ['kitchen','parlor','studio','bedroom'])for(const slot of [0,1,2])sim.place(s,'musicbox',room,slot);for(let i=0;i<10;i++){sim.changeLight(s);sim.discover(s);sim.changeLight(s)}assert.equal(s.journal.length,6);assert.equal(new Set(s.journal).size,6)});
test('room assignment validates room and doll',()=>{const s=fresh();assert.equal(sim.moveDoll(s,'lina','bedroom').ok,true);assert.equal(s.dolls[0].room,'bedroom');assert.equal(sim.moveDoll(s,'lina','void').ok,false)});
test('save roundtrip retains ownership, needs, journal and settings',()=>{const s=fresh();sim.place(s,'plant','kitchen',0);s.settings.locale='ar';sim.changeLight(s);sim.discover(s);const saved=sim.restore(JSON.stringify(s));assert.equal(saved.settings.locale,'ar');assert.deepEqual(saved.decor,s.decor);assert.deepEqual(saved.journal,s.journal);assert.equal(saved.paused,false)});
test('malformed saves safely start fresh',()=>{for(const x of ['bad','null','[]','{"version":99}','{}'])assert.equal(sim.restore(x).buttons,36)});
test('save sanitization rejects fake furniture, duplicate slots and invalid ids',()=>{const s=fresh();s.decor=[{id:1,item:'plant',room:'kitchen',slot:0},{id:2,item:'plant',room:'kitchen',slot:0},{id:3,item:'bad',room:'kitchen',slot:1}];s.buttons=-999;s.dolls[0].hunger=999;const r=sim.restore(JSON.stringify(s));assert.equal(r.buttons,0);assert.equal(r.dolls[0].hunger,100);assert.equal(r.decor.length,1)});
test('save sanitization whitelists locales and never trusts authored prose',()=>{const s=fresh();s.settings.locale='<script>';s.dolls[0].name='<img>';s.journal=['bad','music-box','music-box'];const r=sim.restore(JSON.stringify(s));assert.equal(r.settings.locale,'en');assert.equal(r.dolls[0].name,undefined);assert.deepEqual(r.journal,['music-box'])});
test('save sanitization normalizes duplicate furniture ids for safe refund',()=>{const s=fresh();s.decor=[{id:1,item:'plant',room:'kitchen',slot:0},{id:1,item:'lamp',room:'parlor',slot:0}];const r=sim.restore(JSON.stringify(s));assert.equal(new Set(r.decor.map(x=>x.id)).size,2)});
