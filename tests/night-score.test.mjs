import test from 'node:test';
import assert from 'node:assert/strict';
const score = await import('../src/night-score.js').catch(() => ({}));
test('night score is deterministic and stays bounded over a long session', () => {
 assert.equal(typeof score.nightFrame,'function');
 for(let t=0;t<10000;t+=.37){const f=score.nightFrame(t,1);assert.deepEqual(f,score.nightFrame(t,1));assert.ok(f.shadow>=0&&f.shadow<=.24);assert.ok(f.lamp>=.94&&f.lamp<=1.02);assert.ok(f.door>=0&&f.door<=.36);assert.ok(Object.values(f).every(Number.isFinite));}
});
test('daylight has no haunting; reduced motion retains a still warm door without a moving shadow', () => {
 assert.equal(typeof score.nightFrame,'function');
 assert.equal(score.nightFrame(18,0).shadow,0);
 assert.equal(score.nightFrame(18,0).door,0);
 assert.deepEqual(score.nightFrame(18,1,true),score.nightFrame(78,1,true));
 assert.equal(score.nightFrame(18,1,true).shadow,0);
});
test('night cues fade rather than flash and malformed input remains finite', () => {
 assert.equal(typeof score.nightFrame,'function');
 for(let t=0;t<80;t+=.01){const a=score.nightFrame(t,1),b=score.nightFrame(t+.01,1);assert.ok(Math.abs(a.shadow-b.shadow)<.002);assert.ok(Math.abs(a.door-b.door)<.002);}
 for(const t of [NaN,Infinity,-1,undefined])assert.ok(Object.values(score.nightFrame(t,NaN)).every(Number.isFinite));
});
