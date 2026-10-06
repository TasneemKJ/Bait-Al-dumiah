import test from 'node:test';
import assert from 'node:assert/strict';
import {framing,lighting,nightSky,fog,roomLighting} from '../src/render/visual-policy.js';
import {nightFrame} from '../src/night-score.js';

test('portrait whole-house framing keeps the miniature large enough to read',async()=>{
 // Room framing base stays 22-24; the phone whole-house view widens only enough to fit the roof and stair.
 const portrait=framing(390,844);
 assert.ok(portrait.height>=22 && portrait.height<=24,`portrait height ${portrait.height}`);
 assert.deepEqual(portrait.target,[0,3.65,0]);
 const {houseFraming}=await import('../src/render/house-framing.js');
 const home=houseFraming(390,844);assert.ok(home.height>portrait.height&&home.height<=28,`home height ${home.height}`);
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
test('ultra room practical-light policy gives each authored room a distinct restrained profile',async()=>{
 const {roomLighting}=await import('../src/render/visual-policy.js');
 const ids=['kitchen','parlor','studio','bedroom'];
 const night=ids.map(id=>roomLighting(id,1));
 assert.equal(new Set(night.map(p=>p.color)).size,4);
 for(const p of night){assert.ok(p.intensity>0&&p.intensity<=3.2);assert.ok(p.distance>=3&&p.distance<=6);}
 for(const id of ids)assert.ok(roomLighting(id,0).intensity<roomLighting(id,1).intensity);
 assert.deepEqual(roomLighting('missing',Infinity),roomLighting('kitchen',1));
});
test('each tagged room lamp gets its own profile, scaled by the night cue and focus',async()=>{
 const {practicalLight,roomLighting,lighting}=await import('../src/render/visual-policy.js');
 const lamps=lighting(1).lamps;
 const studio=practicalLight('studio',1,lamps),bedroom=practicalLight('bedroom',1,lamps);
 assert.equal(studio.color,roomLighting('studio',1).color);assert.equal(bedroom.distance,roomLighting('bedroom',1).distance);
 assert.notEqual(studio.color,bedroom.color);
 assert.ok(practicalLight('studio',1,lamps,1,true).intensity>studio.intensity);
 assert.equal(practicalLight('studio',1,lamps,0).intensity,0);
 for(const bad of [NaN,-5,Infinity])assert.ok(Number.isFinite(practicalLight('kitchen',1,bad,bad).intensity));
});
// The old eight-array/40-value placeholder had no renderer consumer and could
// pass with arbitrary numbers. The forty-item roadmap remains unfinished;
// this batch verifies the real safe-light contract rather than counting values.
test('room practicals reject inherited and malformed room identifiers',()=>{
 const warm=roomLighting('kitchen',1);
 for(const id of ['missing','constructor','toString','__proto__',null,undefined,{},[]]){
  assert.deepEqual(roomLighting(id,Infinity),warm,`unsafe room ${String(id)}`);
 }
});
test('each actual room keeps a finite monotonic practical across the day',()=>{
 for(const id of ['kitchen','parlor','studio','bedroom']){
  let prior=0;const night=roomLighting(id,1);
  for(const mix of [-10,0,.2,.5,.8,1,10]){
   const p=roomLighting(id,mix);
   assert.ok(Number.isFinite(p.intensity)&&p.intensity>=prior&&p.intensity<=3.2);
   assert.equal(p.color,night.color);assert.equal(p.distance,night.distance);prior=p.intensity;
  }
  for(const bad of [NaN,Infinity,-Infinity,undefined,null,'night',{},[]])assert.deepEqual(roomLighting(id,bad),night);
 }
});
