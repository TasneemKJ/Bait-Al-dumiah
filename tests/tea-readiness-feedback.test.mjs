import test from 'node:test';import assert from 'node:assert/strict';import * as T from 'three';import {createTeaTable} from '../src/render/tea-table.js';import {createState,beginActivity} from '../src/simulation.js';import {textureCanvas} from './helpers/render-node.mjs';
// Break caught: ready cups lacking a material signal, stale glow after overfill or reentry.
test('the actual fill band glows on readiness, settles and resets without writing the cup',t=>{
 textureCanvas(t);const s=createState();beginActivity(s,'tea');s.elapsed=10;const table=createTeaTable(new T.Group()),cup=s.activities.active.cups[0];
 table.update(s);const band=table.root.getObjectByName('tea-cup-0').getObjectByName('tea-target-band');assert.equal(band.material.emissiveIntensity,0);
 cup.fill=cup.target;const before=JSON.stringify(s);table.update(s);assert.ok(band.material.emissiveIntensity>.3);assert.equal(JSON.stringify(s),before);
 s.elapsed=11;table.update(s);assert.ok(band.material.emissiveIntensity>0&&band.material.emissiveIntensity<.2);
 cup.fill=1.1;table.update(s);assert.equal(band.material.emissiveIntensity,0);s.activities.active=null;table.update(s);assert.equal(band.material.emissiveIntensity,0);
});
