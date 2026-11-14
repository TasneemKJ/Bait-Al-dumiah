// Owner rule (2026-11-14): no Arabic word that could be read wrongly. A tap is «انقر», never a form of ل-م-س.
// docs/ keeps the old review tables as a record and ships with nothing, so it is left out.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execSync} from 'node:child_process';

const LAMS=new RegExp('(?<![ء-يـ])(?:[وفب]?(?:ال)?لمس(?:ة|ات|تين|ت|ته|تها|ه|ها|هم|ك|ي)?|[وف]?المس(?:ه|ها|هم|هما|ي|وا)?'+
 '|[وفس]?[يتن]لمس(?:ه|ها|هم|ون|ين|ان)?|[وف]?ملمس(?:ه|ها)?)(?![ء-يـ])');

test('the pattern catches the forms it is meant to, and leaves other words alone',()=>{
 for(const w of ['المس','المسه','المسها','لمسة','بلمسة','لمستها','يلمس','تلمس','اللمس','ملمس','نلمسها','والمس'])
  assert.match(w,LAMS,w);
 for(const w of ['انقر','أمسك','الأمس','مسحة','سلّم','ملابس'])assert.doesNotMatch(w,LAMS,w);
});

test('no player-facing file uses the root ل-م-س',()=>{
 const files=execSync('git ls-files src ios index.html film',{encoding:'utf8'}).split('\n')
  .filter(f=>/\.(js|mjs|json|html|md|srt|strings|xcstrings|swift)$/.test(f));
 assert.ok(files.length>50);
 const hits=files.flatMap(f=>readFileSync(f,'utf8').split('\n').filter(l=>LAMS.test(l))
  .map(l=>`${f}: ${l.trim().slice(0,80)}`));
 assert.deepEqual(hits,[]);
});
