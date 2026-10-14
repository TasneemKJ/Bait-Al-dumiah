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
import {householdMarkup} from '../src/panels-ui.js';
import {tasteNotebook} from '../src/grove-ui.js';
test('the household notebook shows what each resident has shown about every dish',()=>{
 const s=sim.createState();let html=tasteNotebook(s,'lina',t);assert.equal((html.match(/class="unknown"/g)||[]).length,4);
 sim.cook(s,'maamoul');html=tasteNotebook(s,'lina',t);assert.match(html,/class="love"/);assert.ok(html.includes(strings.en['taste-love']));
 assert.match(tasteNotebook(s,'noor',t),/class="meh"/);
 assert.match(householdMarkup(s,{t,n:String,button:()=>'',avatar:()=>'',selected:'sami'}),/class="taste-list"/);
 for(const k of ['love','like','meh','unknown'])assert.match(strings.ar['taste-'+k],/[؀-ۿ]/);
});
import * as T from 'three';
import {createSupper,supperLook,SUPPER_STEAM_SECONDS} from '../src/render/supper.js';
import {textureCanvas} from './helpers/render-node.mjs';
test('the day\'s dish waits on the kitchen table and steams for a while after cooking',t=>{
 textureCanvas(t);const s=sim.createState(),parent=new T.Group(),supper=createSupper(parent);
 supper.update(s);assert.equal(supper.status.shown,false);
 s.elapsed=100;sim.cook(s,'knafeh');supper.update(s);assert.deepEqual(supper.status,{shown:true,steam:true});
 s.elapsed=100+SUPPER_STEAM_SECONDS+1;supper.update(s);assert.deepEqual(supper.status,{shown:true,steam:false});
 sim.changeLight(s);s.dayTime=999;sim.changeLight(s);supper.update(s);assert.equal(supper.status.shown,false,'a fresh day clears the table');
 const raw=JSON.parse(JSON.stringify(s));raw.grove.dish='<img>';raw.grove.dishAt=1e12;const r=sim.restore(JSON.stringify(raw));
 assert.equal(r.grove.dish,null);assert.ok(r.grove.dishAt<=r.elapsed);assert.equal(supperLook(r).shown,false);
});
import {WALL_PAINTS} from '../src/content-grove.js';
import {decorateMarkup} from '../src/panels-ui.js';
import {createWallPaint} from '../src/render/wall-paint.js';
test('every room can be repapered in four colours, free and reversible, and the scene hangs only chosen papers',tc=>{
 const s=sim.createState(),buttons=s.buttons;assert.equal(sim.paintWall(s,'parlor',2).ok,true);assert.equal(s.buttons,buttons);
 assert.equal(sim.wallPaint(s,'parlor'),2);sim.paintWall(s,'parlor',0);assert.equal(sim.wallPaint(s,'parlor'),0);
 for(const bad of [['attic',1],['parlor',4],['parlor',1.5],['parlor',-1]])assert.equal(sim.paintWall(s,...bad).ok,false);
 sim.paintWall(s,'studio',3);const raw=JSON.parse(JSON.stringify(s));raw.grove.walls.kitchen=9;raw.grove.walls.attic=1;
 assert.deepEqual(sim.restore(JSON.stringify(raw)).grove.walls,{studio:3});
 const html=decorateMarkup(s,{t,n:String,button:()=>''});assert.equal((html.match(/data-action="paint-wall"/g)||[]).length,16);
 assert.match(html,/data-room="studio" data-paint="3"[^>]*aria-pressed="true"/);
 for(const room of Object.keys(WALL_PAINTS))assert.equal(WALL_PAINTS[room].length,4);
 textureCanvas(tc);const parent=new T.Group(),walls=createWallPaint(parent);walls.update(s);
 assert.equal(parent.children.length,1,'only the painted room adds a paper');assert.equal(parent.children[0].visible,true);
 sim.paintWall(s,'studio',0);walls.update(s);assert.equal(parent.children[0].visible,false);
 for(let i=0;i<4;i++)assert.match(strings.ar['paint'+i],/[؀-ۿ]/);
});
