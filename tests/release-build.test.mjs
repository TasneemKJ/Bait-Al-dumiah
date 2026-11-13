import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtempSync,readFileSync,existsSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';

// The shipped copy is one minified bundle with no readable source tree and no debug seam.
function built(env={}){
 const out=mkdtempSync(path.join(tmpdir(),'bait-build-'));
 execFileSync(process.execPath,['scripts/build.mjs',out],{cwd:new URL('..',import.meta.url),env:{...process.env,...env},stdio:'pipe'});
 return out;
}
test('a production build ships game.js and game.css, no src/, and no window.dollhouse',()=>{
 const out=built({BAIT_DEBUG:''});
 try{
  assert.equal(existsSync(path.join(out,'src')),false,'no readable source tree');
  const html=readFileSync(path.join(out,'index.html'),'utf8'),js=readFileSync(path.join(out,'game.js'),'utf8');
  assert.match(html,/src="\.\/game\.js"/);assert.match(html,/href="\.\/game\.css"/);assert.doesNotMatch(html,/\.\/src\//);
  assert.match(html,/"three":"\.\/vendor\/three\.module\.min\.js"/,'three stays beside it through the importmap');
  assert.doesNotMatch(js,/window\.dollhouse|\.dollhouse=|location\.search/);
  assert.ok(!js.includes('The animation frame, visibility and keyboard'),'comments stripped');assert.doesNotMatch(js,/sourceMappingURL/);
 }finally{rmSync(out,{recursive:true,force:true})}
});
test('BAIT_DEBUG=1 keeps the seam for the browser checks',()=>{
 const out=built({BAIT_DEBUG:'1'});
 try{assert.match(readFileSync(path.join(out,'game.js'),'utf8'),/dollhouse/)}finally{rmSync(out,{recursive:true,force:true})}
});
