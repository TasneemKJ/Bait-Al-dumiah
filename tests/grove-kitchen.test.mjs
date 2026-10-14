import test from 'node:test';
import assert from 'node:assert/strict';
import * as sim from '../src/simulation.js';
import {DISHES,TASTES} from '../src/content-grove.js';
import {strings} from '../src/i18n.js';
import {todayMarkup} from '../src/grove-ui.js';

const t=k=>strings.en[k]??k,button=()=>'';
test('one dish a day feeds everyone; a favourite comforts most and is remembered',()=>{
 const s=sim.createState(),before=s.dolls.map(d=>({...d})),buttons=s.buttons;
 const r=sim.cook(s,'maamoul');assert.equal(r.ok,true);assert.equal(s.buttons,buttons-6);
 assert.deepEqual(r.reactions.map(x=>x.taste),['love','meh','like']);
 s.dolls.forEach((d,i)=>assert.ok(d.hunger>before[i].hunger));
 assert.ok(s.dolls[0].comfort-before[0].comfort>s.dolls[1].comfort-before[1].comfort,'a favourite comforts most');
 assert.deepEqual(s.grove.tastes.lina,{maamoul:'love'});
 assert.deepEqual(sim.cook(s,'kaak'),{ok:false,reason:'cookedToday'});
});
test('cooking spends only on a real dish with enough buttons, and never resets by hurrying dawn',()=>{
 const s=sim.createState();assert.equal(sim.cook(s,'cake').ok,false);s.buttons=3;assert.equal(sim.cook(s,'kaak').reason,'funds');
 s.buttons=50;sim.cook(s,'kaak');sim.changeLight(s);sim.changeLight(s);assert.equal(sim.cook(s,'kaak').reason,'cookedToday');
 sim.changeLight(s);s.dayTime=999;sim.changeLight(s);assert.equal(sim.cook(s,'knafeh').ok,true);
});
test('every resident has exactly one favourite, tastes restore whitelisted, and the menu is bilingual',()=>{
 for(const id of Object.keys(TASTES))assert.equal(Object.values(TASTES[id]).filter(x=>x==='love').length,1);
 const s=sim.createState();sim.cook(s,'knafeh');const raw=JSON.parse(JSON.stringify(s));
 raw.grove.tastes.lina.poison='love';raw.grove.tastes.ghost={kaak:'love'};raw.grove.tastes.noor.knafeh='hate';
 const r=sim.restore(JSON.stringify(raw));assert.deepEqual(r.grove.tastes,{lina:{knafeh:'meh'},sami:{knafeh:'love'}});
 assert.equal(r.grove.dishDay,1);
 for(const d of DISHES)for(const k of ['','Text']){assert.ok(strings.en['dish-'+d.id+k]);assert.match(strings.ar['dish-'+d.id+k],/[؀-ۿ]/)}
 const html=todayMarkup(sim.createState(),{t,n:String,button});assert.equal((html.match(/data-action="cook"/g)||[]).length,4);
 assert.match(todayMarkup(s,{t,n:String,button}),/data-action="cook" data-id="kaak" class="dish" disabled/);
});
