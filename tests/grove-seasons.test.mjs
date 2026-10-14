import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as T from 'three';
import * as sim from '../src/simulation.js';
import {createSeasons,driftPoint,SEASON_LOOK} from '../src/render/seasons.js';
import {textureCanvas} from './helpers/render-node.mjs';

test('the device month picks the Levant season; bad months fall back safely',()=>{
 assert.equal(sim.seasonFor(9),'autumn');assert.equal(sim.seasonFor(0),'winter');assert.equal(sim.seasonFor(3),'spring');
 assert.equal(sim.seasonFor(6),'summer');assert.equal(sim.seasonFor(11),'winter');assert.equal(sim.seasonFor(42),'winter');
 for(let m=0;m<12;m++)assert.ok(SEASON_LOOK[sim.seasonFor(m)]);
});
test('seasonal drift falls and wraps inside the courtyard, and holds still under reduced motion',()=>{
 const look=SEASON_LOOK.autumn;for(let t=0;t<60;t+=3.7)for(let i=0;i<10;i++){const [,y]=driftPoint(i,t,look,false);
  assert.ok(y>=-.1-1e-9&&y<=5.2+1e-9)}
 assert.deepEqual(driftPoint(3,0,look,true),driftPoint(3,99,look,true));
 assert.notDeepEqual(driftPoint(3,0,look,false),driftPoint(3,2,look,false));
});
test('the world shows the season it is given, fewer summer flowers after dark, and nothing for an unknown season',t=>{
 textureCanvas(t);const parent=new T.Group(),seasons=createSeasons(parent),s=sim.createState();
 seasons.update(s,0);assert.equal(seasons.points.visible,false);
 seasons.setSeason('summer');seasons.update(s,0);const day=seasons.status.count;seasons.update(s,1);assert.ok(seasons.status.count<day);
 seasons.setSeason('monsoon');seasons.update(s,0);assert.equal(seasons.points.visible,false);
 const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
 assert.match(main,/app\.month=new Date\(\)\.getMonth\(\);app\.world\?\.setSeason\?\.\(sim\.seasonFor\(app\.month\)\)/,'the calendar is read only in the composition root');
});
import {createAtmosphere,seasonTint,SEASON_TINT} from '../src/render/atmosphere.js';
test('each season casts a soft tint on the daytime sky only; unknown seasons stay neutral',t=>{
 for(const [season,tint] of Object.entries(SEASON_TINT)){assert.ok(SEASON_LOOK[season]);
  for(const c of tint)assert.ok(c>=.88&&c<=1.06,season+' stays subtle')}
 assert.deepEqual(seasonTint('monsoon'),[1,1,1]);
 textureCanvas(t);const scene=new T.Scene(),atmosphere=createAtmosphere(scene);atmosphere.setSeason('winter');
 const sky=scene.children.find(o=>o.material?.uniforms?.tint);assert.deepEqual(sky.material.uniforms.tint.value.toArray(),SEASON_TINT.winter);
 assert.match(sky.material.fragmentShader,/smoothstep\(0\.,\.7,vUv\.y\)\)\*tint/,'only the day gradient is tinted');
 assert.match(readFileSync(new URL('../src/render/world.js',import.meta.url),'utf8'),/parts\.atmosphere\.setSeason\(season\)/);
});
