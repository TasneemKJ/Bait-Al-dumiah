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
 assert.match(src('world.js'),/userData\.pool\.material\.opacity=poolOpacity/);
});
