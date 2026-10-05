import test from 'node:test';
import assert from 'node:assert/strict';
import * as storyUI from '../src/story-ui.js';

// Actual 360px native bounds: top controls end at 125px, a crowded bilingual
// ribbon is about 144px tall; held-item and room edges leave its bottom at 450px.
test('the short-phone ribbon yields to the selected prop instead of covering it',()=>{
 assert.equal(typeof storyUI.ribbonEdge,'function');
 assert.equal(storyUI.ribbonEdge(347,137,450,144),'top','held tea stays reachable at its retained camera position');
 assert.equal(storyUI.ribbonEdge(300,137,450,144),'top','a near-midline target needs measured clearance, not a screen-half guess');
 assert.equal(storyUI.ribbonEdge(220,137,450,144),'bottom','upper props retain their direct touch target');
 assert.equal(storyUI.ribbonEdge(526,137,718,144),'top','ordinary tin double-touch never lands in the newly opened ribbon');
});
test('placement is deterministic and invalid targets keep the normal accessible ribbon',()=>{
 assert.equal(typeof storyUI.ribbonEdge,'function');
 assert.equal(storyUI.ribbonEdge(NaN,137,450,144),'bottom');
 for(const y of [220,300,347,526])assert.equal(storyUI.ribbonEdge(y,137,450,144),storyUI.ribbonEdge(y,137,450,144));
});
