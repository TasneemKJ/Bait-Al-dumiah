import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as T from 'three';
import {createState} from '../src/simulation.js';
import {lanternLook,createLantern} from '../src/render/lantern.js';
import {textureCanvas} from './helpers/render-node.mjs';

test('a cold wick shows no flame; each level is brighter and wider, and stronger after dark',()=>{
 const off=lanternLook(0,1,3,true);assert.equal(off.flame,0);assert.equal(off.glow,0);assert.equal(off.pool,0);
 for(let l=1;l<5;l++){const a=lanternLook(l,1,0,true),b=lanternLook(l+1,1,0,true);
  assert.ok(b.flame>a.flame&&b.glow>a.glow&&b.glowSize>a.glowSize&&b.pool>a.pool)}
 assert.ok(lanternLook(3,1,0,true).glow>lanternLook(3,0,0,true).glow);
 for(const bad of [NaN,-3,99])assert.ok(Number.isFinite(lanternLook(bad,.5,1,false).flame));
});
test('the flame flickers only with motion allowed',()=>{
 assert.equal(lanternLook(3,1,0,true).flame,lanternLook(3,1,7.7,true).flame);
 assert.notEqual(lanternLook(3,1,0,false).flame,lanternLook(3,1,.37,false).flame);
});
test('the courtyard lantern follows the saved warmth and is a touch target for Today',t=>{
 textureCanvas(t);const parent=new T.Group(),lantern=createLantern(parent),s=createState();
 lantern.update(s,1);assert.equal(lantern.status.level,0);
 s.grove.warmth=15;lantern.update(s,1);assert.equal(lantern.status.level,3);assert.equal(lantern.hit.userData.lantern,true);
 assert.match(readFileSync(new URL('../src/main.js',import.meta.url),'utf8'),/data\.lantern\)ui\.open\('today'\)/);
});
