import test from 'node:test';
import assert from 'node:assert/strict';
import * as sim from '../src/simulation.js';
import {LANTERN_LEVELS} from '../src/content-grove.js';
import {strings} from '../src/i18n.js';
import {todayMarkup,houseColour,syncHouseColour} from '../src/grove-ui.js';
import {readFileSync} from 'node:fs';

test('tending moves every held ember into the lantern and reports a level-up once',()=>{
 const s=sim.createState();assert.equal(sim.lanternLevel(s),0);
 assert.deepEqual(sim.tendLantern(s),{ok:false,reason:'noEmbers'});
 s.grove.embers=2;let r=sim.tendLantern(s);assert.deepEqual(r,{ok:true,added:2,level:0,grew:false});
 assert.equal(s.grove.embers,0);assert.equal(s.grove.warmth,2);assert.equal(s.events.filter(e=>e.type==='lantern').length,0);
 s.grove.embers=1;r=sim.tendLantern(s);assert.equal(r.level,1);assert.equal(r.grew,true);
 assert.deepEqual(s.events.filter(e=>e.type==='lantern'),[{type:'lantern',level:1}]);
 assert.equal(sim.nextLantern(s),LANTERN_LEVELS[2]);
});
test('the lantern tops out at its last level and never shrinks',()=>{
 const s=sim.createState();s.grove.warmth=9998;s.grove.embers=50;sim.tendLantern(s);
 assert.equal(s.grove.warmth,9999);assert.equal(sim.lanternLevel(s),LANTERN_LEVELS.length-1);assert.equal(sim.nextLantern(s),null);
 for(let i=0;i<500;i++)sim.step(s,1);assert.equal(s.grove.warmth,9999,'no offline or idle decay');
});
test('the lantern card names its level in both languages and disables Tend with no embers',()=>{
 const s=sim.createState(),t=k=>strings.en[k]??k,button=(a,l,i,x)=>`<button data-action="${a}" ${x}>${l}</button>`;
 for(let i=0;i<LANTERN_LEVELS.length;i++){assert.ok(strings.en['lantern'+i]);assert.match(strings.ar['lantern'+i],/[؀-ۿ]/)}
 let html=todayMarkup(s,{t,n:String,button});assert.match(html,/data-level="0"/);assert.match(html,/data-action="tend-lantern" class="primary" disabled/);
 s.grove.embers=3;html=todayMarkup(s,{t,n:String,button});assert.doesNotMatch(html,/tend-lantern" class="primary" disabled/);
});
test('colour returns to the house with each lantern level and is untouched at the top',()=>{
 for(let l=0;l<5;l++)assert.ok(houseColour(l+1)>houseColour(l));
 assert.equal(houseColour(5),1);assert.ok(houseColour(0)>=.85,'a gentle start, never grey');assert.equal(houseColour(NaN),houseColour(0));
 const vars={},root={style:{getPropertyValue:k=>vars[k]??'',setProperty:(k,v)=>{vars[k]=v}}},s=sim.createState();
 syncHouseColour(root,s);assert.equal(vars['--house-colour'],`saturate(${houseColour(0)})`);
 s.grove.warmth=99;syncHouseColour(root,s);assert.equal(vars['--house-colour'],'none');
 assert.match(readFileSync(new URL('../src/grove.css',import.meta.url),'utf8'),/#world\{filter:var\(--house-colour,none\)/);
});
test('a house saved before the lantern starts warm; a fresh one starts cold',()=>{
 const old=sim.createState();old.cares=12;const raw=JSON.parse(JSON.stringify(old));delete raw.grove;
 assert.equal(sim.lanternLevel(sim.restore(JSON.stringify(raw))),2);
 assert.equal(sim.lanternLevel(sim.restore(JSON.stringify(sim.createState()))),0);
 raw.grove={warmth:1};assert.equal(sim.restore(JSON.stringify(raw)).grove.warmth,1,'a saved lantern is kept as it was');
});
