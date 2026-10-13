// Structural regression only; browser/game acceptance is a separate gate.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
const css = readFileSync(new URL('../src/hud.css', import.meta.url), 'utf8');

test('expanded tools drawer centers between physical safe edges', () => {
  const rule = css.match(/#ui \.dock\[data-expanded=true\]\{([^}]+)\}/)?.[1];
  assert.ok(rule);
  assert.match(rule, /left:max\(12px,env\(safe-area-inset-left\)\)/);
  assert.match(rule, /right:max\(12px,env\(safe-area-inset-right\)\)/);
  assert.match(rule, /margin-inline:auto;transform:none/);
  assert.match(rule, /z-index:2/);
});
