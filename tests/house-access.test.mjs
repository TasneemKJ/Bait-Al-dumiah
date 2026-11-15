import test from 'node:test';
import assert from 'node:assert/strict';
import * as sim from '../src/simulation.js';
import {translate} from '../src/i18n.js';
import {INTERACTIVE_PROPS,ROOMS,DOLLS,MUSIC_BOXES} from '../src/content.js';
import {bootHome} from './helpers/main-home-harness.mjs';

// Round 5: the bar's object list was the only DOM route into the house for keyboard and VoiceOver. It comes back
// as a visually hidden, focusable list of every room, doll and thing the house can act on, in both languages.
const access=await import('../src/house-access.js').catch(()=>({}));
const names=(s,lang)=>access.accessEntries(s).map(e=>access.accessName(e,k=>translate(lang,k)));

test('every room, doll and story object has a name in English and Arabic, on a fresh night one',()=>{
 assert.equal(typeof access.accessEntries,'function');
 const s=sim.createState(),entries=access.accessEntries(s);
 for(const r of ROOMS)assert.ok(entries.some(e=>e.pick.roomTap===r.id),r.id);
 for(const p of INTERACTIVE_PROPS)assert.ok(entries.some(e=>e.pick.object==='prop:'+p.id),p.id);
 for(const d of DOLLS)assert.ok(entries.some(e=>e.pick.doll===d.id),d.id);
 for(const lang of ['en','ar'])for(const [i,n] of names(s,lang).entries()){
  assert.ok(n&&!/undefined|object-|musicBox-|^\s*·|·\s*$/.test(n),`${lang} ${i}: ${n}`);
  if(lang==='ar')assert.match(n,/[؀-ۿ]/,n)}
 assert.ok(names(s,'en').includes(`${translate('en','kitchen')} · ${translate('en','object-tea-set')}`));
 assert.equal(new Set(names(s,'en')).size,names(s,'en').length,'every name is distinct');
});

test('on a music night the three boxes and the brass key join the list, with their own names',()=>{
 const s=sim.createState();s.day=2;s.music={key:'parlor',night:2,done:false,wind:{lina:0,noor:0,sami:0},
  result:{lina:'',noor:'',sami:''},nights:1};s.clock=130;s.dayTime=200;
 const e=access.accessEntries(s);
 for(const b of MUSIC_BOXES)assert.ok(e.some(x=>x.pick.musicBox===b.doll&&x.pick.room===b.room),b.doll);
 assert.ok(e.some(x=>x.pick.musicKey));
 for(const lang of ['en','ar'])assert.ok(names(s,lang).every(n=>!/musicBox-|musicKeyName/.test(n)));
 assert.equal(access.accessEntries(sim.createState()).some(x=>x.pick.musicKey),false,'not before the boxes run');
});

test('the list is in the page for Tab and VoiceOver, hidden from sight until it holds focus',async()=>{
 const html=access.accessMarkup(access.accessEntries(sim.createState()),k=>translate('ar',k),'ar');
 assert.match(html,/<nav class="house-access" aria-label="[^"]+"/);
 assert.equal((html.match(/<button type="button"/g)||[]).length,access.accessEntries(sim.createState()).length);
 assert.doesNotMatch(html,/tabindex="-1"|aria-hidden="true"/);
 const css=(await import('node:fs')).readFileSync(new URL('../src/hud.css',import.meta.url),'utf8');
 assert.match(css,/#ui \.house-access:not\(:focus-within\)\{[^}]*clip-path:inset\(50%\)/);
});

test('activating an entry does what a touch on that thing does',()=>{
 const game=bootHome();game.button('play').click();const press=e=>game.access(e.pick);
 const e=access.accessEntries(game.state());
 press(e.find(x=>x.pick.roomTap==='studio'));assert.equal(game.focuses.at(-1),'studio');
 press(e.find(x=>x.pick.doll==='noor'));assert.ok(game.greeted().includes('noor'));
 press(e.find(x=>x.pick.doll==='noor'));assert.ok(game.opens.includes('household'));
});

// The three routes that replaced the bar, as behaviour.
test('a touch on a room turns the camera to it',()=>{
 const game=bootHome();game.button('play').click();game.pick({roomTap:'bedroom'});assert.equal(game.focuses.at(-1),'bedroom');
 game.pick({roomTap:'parlor'});assert.equal(game.focuses.at(-1),'parlor');
});
test('a doll\'s first touch greets her, the second opens the household sheet',()=>{
 const game=bootHome();game.button('play').click();game.pick({doll:'sami'});
 assert.deepEqual([game.greeted().includes('sami'),game.opens.includes('household')],[true,false]);
 game.pick({doll:'sami'});assert.ok(game.opens.includes('household'));
});
test('the clue leads to the rituals sheet when a ritual is the next thing to learn',()=>{
 const s=sim.createState();s.buttons=99;for(const d of s.dolls)sim.care(s,d.id,sim.wishFor(s,d.id));
 s.story.chapter=3;sim.place(s,'plant','kitchen',0);for(const id of [...s.achieved])sim.claim(s,id);
 const game=bootHome({saved:JSON.stringify(s)});game.button('play').click();
 game.dispatch()('objective');assert.ok(game.opens.includes('activities'),JSON.stringify(game.opens));
});

// The rating ask (TasKit requestReview) follows only a won climax.
test('the story\'s end asks for a rating once; a replayed keepsake, a purchase and a lost night never do',()=>{
 const s=sim.createState();s.story={chapter:2,step:3,lastAction:null,lastActionAt:-10};s.cares=1;
 const game=bootHome({saved:JSON.stringify(s)});game.button('play').click();
 game.dispatch()('store-buy','fifthRoom');assert.equal(game.reviews(),0,'a purchase never asks');
 game.dispatch()('story-interact','prop:doorstep');assert.equal(sim.storyStatus(game.state()).finished,true);
 assert.equal(game.reviews(),1,'the end of the house\'s story asks');
 game.dispatch()('play-story-keepsake','prop:doorstep');assert.equal(game.reviews(),1,'a replay never asks');
 const lost=sim.createState();for(const d of lost.dolls)d.comfort=50;for(let i=0;i<122;i++)sim.step(lost,1);
 Object.assign(lost,{day:2,clock:125,dayTime:200,elapsed:1000});lost.mischief.takenAt=400;lost.cares=1;
 const night=bootHome({saved:JSON.stringify(lost)});night.button('play').click();
 for(let t=0;t<3000;t+=100)night.frame(t);
 assert.ok(night.state().mischief.losses>=1,'the visitor kept it');assert.equal(night.reviews(),0,'a loss never asks');
});
