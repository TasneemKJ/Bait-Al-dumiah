import test from 'node:test';
import assert from 'node:assert/strict';
import {bootHome} from './helpers/main-home-harness.mjs';
import {translate} from '../src/i18n.js';
import {createState} from '../src/simulation.js';
import {SECRETS} from '../src/content.js';

// Owner council (2026-11-13): a touched soul reacts at once, with nothing to read; a second touch opens her sheet.
test('the first touch on a doll greets the player; the second opens her sheet',()=>{
 const game=bootHome();game.button('play').click();game.frame(1000);
 game.pick({doll:'noor'});
 assert.equal(game.ui().panel,null,'the house stays in view so the reaction can be seen');
 assert.ok(game.greeted?.().includes('noor'),'the doll waves');
 assert.ok(game.audioEvents.includes('effect'),'and makes a small sound');
 game.pick({doll:'noor'});assert.equal(game.ui().panel,'household','a second touch opens her sheet');
 game.ui().close();game.pick({doll:'sami'});assert.equal(game.ui().panel,null,'another doll greets first too');
});

test('a found whisper says how many of the set are found',()=>{
 const s=createState();s.clock=130;s.cares=1;
 const game=bootHome({saved:JSON.stringify(s)});game.button('play').click();game.frame(1000);
 game.dispatch()('discover');for(let t=2000;t<12000;t+=500)game.frame(t);
 const line=game.notices.find(n=>n.startsWith(translate('en','newSecret')));
 assert.ok(line,'the whisper is announced');assert.match(line,new RegExp(`1/${SECRETS.length}`));
});

test('in Arabic the dolls are warm little hearts, never spirits',()=>{
 for(const key of ['introReveal','filmLine6'])assert.doesNotMatch(translate('ar',key),/أرواح/,key);
});

// Studio gate cold play (2026-11-13): the first reward came 93-114 s after Play, behind the whole first story chapter.
// The very first clue is now Lina's tea (the intro has just said "Lina has the kettle on"): one tap, +8 buttons.
test('the first clue in a new house is a wish that pays at once; the story follows',async()=>{
 const {nextStep}=await import('../src/objective-ui.js');const t=key=>translate('en',key),n=String;
 const s=createState();const first=nextStep(s,t,n,'');
 assert.equal(first.action,'care');assert.equal(first.value.id,'lina');
 s.cares=1;assert.notEqual(nextStep(s,t,n,'').action,'care','after the first kindness the story leads');
});

// Play-through finding: after tonight's whisper the journal still offered "Greet the visitor", which only answered
// "That is all for tonight". It now offers the morning, like the clue does.
test('after tonight\'s whisper the journal offers the morning, not another greeting',async()=>{
 const {journalMarkup}=await import('../src/panels-ui.js');const {button}=await import('../src/shell-markup.js');
 const s=createState();s.clock=130;s.journal=['music-box'];s.lastSecretDay=s.day;
 const html=journalMarkup(s,{t:k=>translate('en',k),n:String,button});
 assert.doesNotMatch(html,/data-action="discover"/);assert.match(html,/data-action="light"/);
 s.lastSecretDay=0;assert.match(journalMarkup(s,{t:k=>translate('en',k),n:String,button}),/data-action="discover"/);
});
