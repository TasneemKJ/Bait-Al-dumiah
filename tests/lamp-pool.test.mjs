import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {poolOpacity} from '../src/render/lamp-pool.js';

test('pool opacity is soft, bounded and rises with the lamp level',()=>{
 assert.equal(poolOpacity(0),.05);assert.ok(poolOpacity(1)<=.60+1e-9);
 assert.ok(poolOpacity(.2)<poolOpacity(.8));
 for(const bad of [NaN,undefined,-1,Infinity])assert.ok(poolOpacity(bad)>=.05&&poolOpacity(bad)<=.60+1e-9);
});
test('pools and kettle steam are wired without adding lights, and reduced motion keeps them still',()=>{
 const src=f=>readFileSync(new URL('../src/render/'+f,import.meta.url),'utf8');
 const pool=src('lamp-pool.js');assert.doesNotMatch(pool,/PointLight|SpotLight/);
 assert.match(src('house.js'),/createLampPool\(g,0,0,1\.15,\{y:\.03\}\)/);assert.match(src('house.js'),/kettle-steam-anchor/);
 assert.match(src('room-effects.js'),/Boolean\(lina\)&&lina\.action==='idle'/);assert.match(src('room-effects.js'),/reducedMotion\|\|state\.paused/);
 assert.match(src('decor-sync.js'),/userData\.pool\.material\.opacity=poolOpacity/);
});
import {puffPhase,puffLook,PUFFS} from '../src/render/kettle-steam.js';
test('kettle steam puffs are staggered, soft, bounded, and still under reduced motion',()=>{
 const ph=Array.from({length:PUFFS},(_,i)=>puffPhase(7.3,i,false));assert.equal(new Set(ph.map(p=>p.toFixed(3))).size,PUFFS);
 for(let t=0;t<30;t+=.7)for(let i=0;i<PUFFS;i++){const l=puffLook(puffPhase(t,i,false));assert.ok(l.opacity>=0&&l.opacity<=.55&&l.size>=.34&&l.size<=.84&&l.rise>=0&&l.rise<=.6)}
 for(let i=0;i<PUFFS;i++)assert.equal(puffPhase(0,i,true),puffPhase(99,i,true));
 assert.equal(puffLook(0).opacity,0);assert.equal(puffLook(1).opacity<1e-9,true);
});
