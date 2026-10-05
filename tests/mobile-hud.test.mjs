import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('objective step counter never wraps below its title on narrow cards',()=>{
 const css=readFileSync(new URL('../src/story.css',import.meta.url),'utf8');
 assert.match(css,/\.objective-head \.wish-count\{[^}]*white-space:nowrap/);
});
test('objective card leaves room for the time control at 360px wide',()=>{
 const css=readFileSync(new URL('../src/story.css',import.meta.url),'utf8');
 assert.match(css,/max-width:360px\)\{[^\n]*\.objective\{width:calc\(100% - 150px\)\}/);
});
import {houseFraming,HOUSE_SPAN} from '../src/render/house-framing.js';
import {framing} from '../src/render/visual-policy.js';
test('phone-portrait whole-house view fits the full house width, roof included',()=>{
 for(const [w,h] of [[360,640],[390,844],[412,915]]){const pose=houseFraming(w,h);assert.ok(pose.height*w/h>=HOUSE_SPAN-1e-9,`${w}x${h}`);assert.deepEqual(pose.target,framing(w,h).target)}
});
test('room views and landscape keep their existing scale',()=>{
 for(const [w,h] of [[390,844],[844,390],[1440,1000]])assert.deepEqual(houseFraming(w,h,'kitchen'),framing(w,h,'kitchen'));
 for(const [w,h] of [[844,390],[1280,800]])assert.deepEqual(houseFraming(w,h),framing(w,h));
 assert.ok(houseFraming(NaN,NaN).height>0);
});
test('phone-portrait clue folds into a 44px chip and an unread dot',()=>{
 const css=readFileSync(new URL('../src/hud.css',import.meta.url),'utf8');
 assert.match(css,/orientation:portrait\)\{[^]*\.objective\[data-expanded=false\] \.objective-head,\.objective\[data-expanded=false\] #objective-copy\{display:none\}/);
 assert.match(css,/\.objective-toggle\{[^}]*width:44px;height:44px/);
 assert.match(css,/\.objective\[data-unread=true\] \.clue-dot\{display:block\}/);
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');assert.ok(html.indexOf('hud.css')>html.indexOf('chime.css'),'hud.css loads last');
});
test('clue toggle copy exists in English and Arabic',async()=>{
 const {translate}=await import('../src/i18n.js');
 assert.equal(translate('en','clueToggle'),'Read the clue');assert.ok(/[؀-ۿ]/.test(translate('ar','clueToggle')));
});
test('Arabic flips the objective arrow and short landscape cards keep a gutter',()=>{
 const css=readFileSync(new URL('../src/hud.css',import.meta.url),'utf8');
 assert.match(css,/\[dir=rtl\] #objective-action \.icon:last-child\{transform:scaleX\(-1\)\}/);
 assert.match(css,/max-height:560px\) and \(orientation:landscape\)\{[^}]*\.objective\{top:52px\}[^}]*\.time-tools\{top:72px\}/);
});
