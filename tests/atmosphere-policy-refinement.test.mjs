import test from 'node:test';
import assert from 'node:assert/strict';
import {framing,lighting,nightSky,fog} from '../src/render/visual-policy.js';
import {nightFrame} from '../src/night-score.js';

test('portrait whole-house framing keeps the miniature large enough to read',()=>{
 const portrait=framing(390,844);
 assert.ok(portrait.height>=22 && portrait.height<=24,`portrait height ${portrait.height}`);
 assert.deepEqual(portrait.target,[0,3.65,0]);
});

test('night lighting deepens exterior contrast while keeping rooms warm',()=>{
 const night=lighting(1);
 assert.ok(night.ambient<=.50,`ambient ${night.ambient}`);
 assert.ok(night.key<=.50,`key ${night.key}`);
 assert.ok(night.lamps>=8.1 && night.lamps<=8.8,`lamps ${night.lamps}`);
 assert.ok(night.exposure<=1.05,`exposure ${night.exposure}`);
});

test('night dread remains restrained instead of a strong human silhouette or door flash',()=>{
 let maxShadow=0,maxDoor=0;
 for(let t=0;t<144;t+=.25){const f=nightFrame(t,1,false);maxShadow=Math.max(maxShadow,f.shadow);maxDoor=Math.max(maxDoor,f.door)}
 assert.ok(maxShadow<=.18,`shadow ${maxShadow}`);
 assert.ok(maxDoor<=.24,`door ${maxDoor}`);
});

test('midnight sky preserves a darker top than horizon and a low glow',()=>{
 const sky=nightSky();
 const sum=a=>a.reduce((x,y)=>x+y,0);
 assert.ok(sum(sky.top)<sum(sky.bottom));
 assert.ok(sum(sky.glow)<sum(sky.bottom));
});

test('night depth haze stays subtle and deterministic',()=>{
 const day=fog(0),night=fog(1);
 assert.ok(day.density<=.002,`day density ${day.density}`);
 assert.ok(night.density>=.008&&night.density<=.012,`night density ${night.density}`);
 assert.notEqual(day.color,night.color);
 assert.deepEqual(fog(-2),day);
 assert.deepEqual(fog(5),night);
});
