import assert from 'node:assert/strict';
import * as sim from '../src/simulation.js';
// Unit fixtures call the same commands as real gestures, never submitted scores.
export function listenChimes(s){for(let i=0;i<100&&s.activities.active?.phase==='listen';i++)sim.step(s,.1);assert.equal(s.activities.active?.phase,'echo')}
export function pluckChime(s,note){assert.equal(sim.grabChime(s,note).ok,true);assert.equal(sim.pullChime(s,.7).ok,true);return sim.releaseChime(s)}
export function finishChimes(s){listenChimes(s);let result;for(const note of [...s.activities.active.pattern].reverse())result=pluckChime(s,note);return result}
