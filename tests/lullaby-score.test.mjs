import test from 'node:test';
import assert from 'node:assert/strict';
const score=await import('../src/lullaby-score.js').catch(()=>({}));

test('night lullaby has two deliberate rests and room for environmental sounds',()=>{
 assert.equal(typeof score.lullabyBeat,'function');
 const phrase=Array.from({length:16},(_,i)=>score.lullabyBeat(i,true));
 assert.equal(phrase.filter(b=>b.rest).length,2);
 assert.ok(phrase.filter(b=>b.rest).every(b=>b.volume===0&&b.delay>=2.5&&!b.drone));
});
test('day and night melodies repeat deterministically without growing louder',()=>{
 assert.equal(typeof score.lullabyBeat,'function');
 for(const night of [false,true])for(let i=0;i<160;i++){
  const beat=score.lullabyBeat(i,night);assert.deepEqual(beat,score.lullabyBeat(i+16,night));
  assert.ok(beat.frequency>=65&&beat.frequency<400);
  assert.ok(beat.volume>=0&&beat.volume<=.052&&beat.delay>=.8&&beat.delay<=3);
 }
 assert.equal(score.lullabyBeat(15,false).rest,false);
 assert.ok(score.lullabyBeat(15,false).delay>score.lullabyBeat(14,false).delay);
});
test('invalid score positions fall back to the first beat with finite fields',()=>{
 assert.equal(typeof score.lullabyBeat,'function');
 for(const value of [NaN,Infinity,-Infinity,-1,undefined]){
  const beat=score.lullabyBeat(value,true);assert.deepEqual(beat,score.lullabyBeat(0,true));
 }
});
