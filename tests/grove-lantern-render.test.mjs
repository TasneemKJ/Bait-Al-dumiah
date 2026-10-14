import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as T from 'three';
import {createState} from '../src/simulation.js';
import {lanternLook,createLantern,moteCount,MAX_MOTES,flareStrength,FLARE_SECONDS} from '../src/render/lantern.js';
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
test('light motes return after dark with each lantern level, never by day',()=>{
 assert.equal(moteCount(5,0),0);assert.equal(moteCount(0,1),0);
 for(let l=1;l<=5;l++)assert.ok(moteCount(l,1)>moteCount(l-1,1));assert.ok(moteCount(5,1)<=MAX_MOTES);
 assert.equal(moteCount(NaN,1),0);
});
test('the scene draws only the motes the lantern has earned and keeps them still under reduced motion',t=>{
 textureCanvas(t);const parent=new T.Group(),lantern=createLantern(parent),s=createState();s.grove.warmth=15;
 lantern.update(s,1);assert.equal(lantern.status.motes,moteCount(3,1));
 const motes=parent.getObjectByName('returning-motes');assert.equal(motes.geometry.drawRange.count,moteCount(3,1));
 s.settings.reducedMotion=true;s.elapsed=40;lantern.update(s,1);const p=motes.position.clone();
 s.elapsed=90;lantern.update(s,1);assert.ok(motes.position.equals(p));
 lantern.update(s,0);assert.equal(motes.visible,false);
});
test('tending flares the flame and sends sparks up, briefly; reduced motion keeps only the flare',t=>{
 assert.equal(flareStrength(-1),0);assert.equal(flareStrength(FLARE_SECONDS),0);assert.ok(flareStrength(.2)>flareStrength(1.2));
 textureCanvas(t);const parent=new T.Group(),lantern=createLantern(parent),s=createState();s.grove.warmth=8;s.elapsed=10;
 lantern.update(s,1);assert.equal(lantern.status.flare,0);lantern.flare();s.elapsed=10.2;lantern.update(s,1);
 s.elapsed=10.4;lantern.update(s,1);assert.ok(lantern.status.flare>0);
 const sparks=parent.getObjectByName('lantern-sparks');assert.equal(sparks.visible,true);
 s.settings.reducedMotion=true;lantern.update(s,1);assert.equal(sparks.visible,false);assert.ok(lantern.status.flare>0);
 s.elapsed=20;lantern.update(s,1);assert.equal(lantern.status.flare,0);
 const cmd=readFileSync(new URL('../src/cmd-grove.js',import.meta.url),'utf8');assert.match(cmd,/flareLantern\(\)/);
 assert.match(readFileSync(new URL('../src/audio.js',import.meta.url),'utf8'),/kind==='lantern'/);
});
