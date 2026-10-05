import test from 'node:test';
import assert from 'node:assert/strict';
import {VISITOR_GIFTS} from '../src/content.js';
import {giftArt,GIFT_ART_IDS} from '../src/gift-art.js';
import {strings} from '../src/i18n.js';

test('every visitor gift has local art and bilingual copy',()=>{
 for(const g of VISITOR_GIFTS){
  assert.ok(GIFT_ART_IDS.includes(g),g+' art');assert.match(giftArt(g),/^<svg class="gift-art"/);
  for(const k of ['Title','Text']){assert.ok(strings.en['gift-'+g+k]);assert.match(strings.ar['gift-'+g+k],/[؀-ۿ]/)}
 }
});
test('art is decorative, local and script-free',()=>{
 for(const g of GIFT_ART_IDS){const svg=giftArt(g);assert.match(svg,/aria-hidden="true"/);assert.doesNotMatch(svg,/<script|href=|http|on\w+=/i)}
 assert.equal(giftArt('unknown'),'');
});
