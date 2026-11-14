import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Store compliance (2026-11-14): no keywords aimed at children or mismatched to the game, and the
// offline claim is exact (the game plays offline; purchases go through the App Store).
const listing = JSON.parse(readFileSync(new URL('../ios/store/listing.json', import.meta.url), 'utf8'));

test('the listing keywords and offline claim are honest in both languages', () => {
  for (const loc of ['ar-SA', 'en-US']) {
    const l = listing.locales[loc];
    const words = l.keywords.split(',').map((k) => k.trim().toLowerCase());
    assert.ok(!words.includes('بنات') && !words.includes('pet'), loc);
    assert.doesNotMatch(l.description, /never goes online|لا تتصل بالإنترنت/);
  }
  assert.match(listing.locales['en-US'].description, /plays offline; purchases use the App Store/);
  assert.match(listing.locales['ar-SA'].description, /تُلعب دون اتصال، والمشتريات عبر App Store/);
});
