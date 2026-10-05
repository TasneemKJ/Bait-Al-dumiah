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
test('forty-pass dollhouse refinement exposes eight five-pass groups',async()=>{
 const mod=await import('../src/render/visual-policy.js');
 assert.equal(typeof mod.houseRefinement40,'function');
 if(typeof mod.houseRefinement40!=='function')return;
 const full=mod.houseRefinement40('studio',1,'high',false),low=mod.houseRefinement40('studio',1,'low',false);
 const stillA=mod.houseRefinement40('studio',1,'high',true),stillB=mod.houseRefinement40('studio',1,'high',true);
 const groups=['depth','light','materials','air','motion','grounding','mobile','signature'];
 assert.equal(groups.flatMap(k=>full[k]).length,40);
 groups.forEach(k=>assert.equal(full[k].length,5));
 assert.ok(low.mobile[0]<full.mobile[0]);
 assert.deepEqual(stillA.motion,stillB.motion);
});
