import test from 'node:test';import assert from 'node:assert/strict';import * as T from 'three';import {createSewingPlay} from '../src/render/sewing-play.js';import {createState,beginActivity} from '../src/simulation.js';import {textureCanvas} from './helpers/render-node.mjs';
// Break caught: section arrival being silent visually, or repair guidance sticking after unpick.
test('completed sections briefly warm the next guide and loose thread names the real repair spool',t=>{
 textureCanvas(t);const s=createState();beginActivity(s,'stitch');const table=createSewingPlay(new T.Group());table.update(s);
 const guide=table.root.getObjectByName('stitch-next-guide-point'),spool=table.root.getObjectByName('stitch-repair-grip');
 s.elapsed=2;s.activities.active.section=1;const before=JSON.stringify(s);table.update(s);assert.ok(guide.scale.x>1.3);assert.equal(JSON.stringify(s),before);
 s.elapsed=2.1;s.activities.active=null;beginActivity(s,'stitch');table.update(s);assert.equal(guide.scale.x,1,'direct replay drops the previous section pulse');
 s.elapsed=3;table.update(s);assert.equal(guide.scale.x,1);
 s.activities.active.loose=true;table.update(s);assert.ok(spool.material.emissiveIntensity>.1);s.activities.active.loose=false;table.update(s);assert.equal(spool.material.emissiveIntensity,0);
 s.activities.active=null;table.update(s);beginActivity(s,'stitch');table.update(s);assert.equal(guide.scale.x,1);
});
