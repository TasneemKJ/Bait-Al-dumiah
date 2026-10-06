import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const run=bot=>JSON.parse(execFileSync(process.execPath,['scripts/pacing-curve.mjs','3'],{env:{...process.env,MINUTES:'8',BOT:bot,JSON:'1'},encoding:'utf8'}));

test('pacing script reports a monotone, bounded curve for both bots',()=>{
 for(const bot of ['expert','newcomer']){
  const {rows,firsts}=run(bot).bots[bot];assert.equal(rows.length,8);
  rows.forEach((r,i)=>{assert.ok(r.buttons>=0&&r.buttons<=9999);assert.ok(r.cozy>=0&&r.cozy<=100);if(i)assert.ok(r.earned>=rows[i-1].earned,'earnings never decrease')});
  assert.ok(firsts.firstCare!=null&&firsts.firstCare<2,bot+' cares within two minutes');
 }
});
test('the newcomer is never faster than the expert to the first whisper or decor',()=>{
 const e=run('expert').bots.expert.firsts,n=run('newcomer').bots.newcomer.firsts;
 assert.ok(n.firstDecor>=e.firstDecor);assert.ok((n.firstWhisper??99)>=(e.firstWhisper??99));
});
test('pacing runs are deterministic for the same seeds',()=>{
 assert.deepEqual(run('newcomer'),run('newcomer'));
});
