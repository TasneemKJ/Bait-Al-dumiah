import test from 'node:test';import assert from 'node:assert/strict';import * as T from 'three';import {createMoonChimes} from '../src/render/moon-chimes.js';import {createState,beginActivity,grabChime,pullChime,releaseChime} from '../src/simulation.js';import {textureCanvas} from './helpers/render-node.mjs';
// Break caught: accepted echo and recovery appearing identical, or stale response on replay.
function play(correct){const s=createState();beginActivity(s,'lullaby');s.elapsed=10;s.activities.active.phase='echo';const a=s.activities.active,id=correct?a.pattern.at(-1):(a.pattern.at(-1)+1)%4;grabChime(s,id);pullChime(s,.7);releaseChime(s);return {s,id};}
test('an accepted charm opens a warm echo halo; recovery contracts gently and both settle',t=>{
 textureCanvas(t);const good=play(true),bad=play(false),v=createMoonChimes(new T.Group());
 const before=JSON.stringify(good.s);v.update(good.s);const gh=v.root.getObjectByName('chime-note-halo-'+good.id);assert.ok(gh.scale.x>1);const warm=gh.material.color.getHex();assert.equal(JSON.stringify(good.s),before);
 v.update(bad.s);const bh=v.root.getObjectByName('chime-note-halo-'+bad.id);assert.ok(bh.scale.x<1);assert.notEqual(bh.material.color.getHex(),warm);
 bad.s.elapsed=11;v.update(bad.s);assert.equal(bh.scale.x,1);bad.s.activities.active=null;v.update(bad.s);assert.equal(v.root.visible,false);
 good.s.settings.reducedMotion=true;v.update(good.s);const still=gh.scale.x;good.s.elapsed=10.2;v.update(good.s);assert.equal(gh.scale.x,still);good.s.elapsed=11;v.update(good.s);assert.equal(gh.scale.x,1);
});
