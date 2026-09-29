import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const script=readFileSync(new URL('../scripts/play_check.py',import.meta.url),'utf8');

test('saved-house reload uses an app-readiness gate with its own navigation deadline',()=>{
  assert.match(script,/def reload_game\(page\):/);
  assert.match(script,/page\.reload\(wait_until='domcontentloaded',timeout=60000\)/);
  assert.match(script,/page\.wait_for_function\('window\.dollhouse\?\.state && !document\.querySelector\("#loading"\)',timeout=60000\)/);
  assert.doesNotMatch(script,/page\.reload\(wait_until='networkidle'\)/);
});
