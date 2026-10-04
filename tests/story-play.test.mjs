import test from 'node:test';
import assert from 'node:assert/strict';
import * as sim from '../src/simulation.js';
import * as content from '../src/content.js';

const route=[
 ['mint-tin','red-thread',0,'mended-friend'],
 ['sewing-machine','mended-bear',0,'mended-friend'],
 ['moon-bed',null,12,'mended-friend'],
 ['parlor-sofa','brass-key',0,'lost-song'],
 ['music-cabinet','bent-cylinder',0,'lost-song'],
 ['sewing-machine','repaired-cylinder',0,'lost-song'],
 ['music-cabinet',null,16,'lost-song'],
 ['wash-basin','water-ewer',0,'guest-tea'],
 ['jasmine-window','jasmine-sprig',0,'guest-tea'],
 ['tea-set','guest-cup',0,'guest-tea'],
 ['doorstep',null,20,'guest-tea'],
];
const use=(s,id)=>sim.interactStory(s,'prop:'+id);
const saved=s=>JSON.stringify(s);

test('fresh house offers an empty-handed first discovery without prerequisites',()=>{
 const s=sim.createState();
 assert.deepEqual(s.story,{chapter:0,step:0,lastAction:null,lastActionAt:-10});
 assert.equal(typeof sim.storyStatus,'function');
 const status=sim.storyStatus(s);
 assert.equal(status.chapter.id,'mended-friend');assert.equal(status.index,0);assert.equal(status.step,0);
 assert.equal(status.next.object,'mint-tin');assert.equal(status.held,null);
 assert.deepEqual(status.completed,[]);assert.equal(status.finished,false);assert.equal(status.progress,0);assert.equal(status.totalSteps,11);
});

test('eleven deliberate object actions carry one item and pay exactly 48 once-only buttons',()=>{
 const s=sim.createState();s.buttons=0;
 let earned=0;
 for(let i=0;i<route.length;i++){
  const [id,held,reward,chapterId]=route[i],step=i<3?i:i<7?i-3:i-7;
  s.elapsed=i+1;
  const result=use(s,id);earned+=reward;
  assert.deepEqual(result,{ok:true,chapterComplete:reward>0,reward,chapterId,step,message:`story-${chapterId}-${step}-done`,effect:id,held});
  assert.equal(s.buttons,earned);assert.equal(s.earnedToday,earned);
  assert.equal(s.story.lastAction,'prop:'+id);assert.equal(s.story.lastActionAt,i+1);
  const status=sim.storyStatus(s);assert.equal(status.held,held);assert.equal(status.progress,i+1);
  assert.deepEqual(status.completed,i<2?[]:i<6?['mended-friend']:i<10?['mended-friend','lost-song']:['mended-friend','lost-song','guest-tea']);
 }
 const status=sim.storyStatus(s);
 assert.equal(s.buttons,48);assert.equal(status.finished,true);assert.equal(status.chapter,null);assert.equal(status.next,null);assert.equal(status.index,3);assert.equal(status.step,0);
 const before=saved(s);
 for(const [id] of route)assert.equal(use(s,id).reason,'storyFinished');
 assert.equal(saved(s),before);
});

test('wrong destinations, unknown keys and repeats preserve carried items and all state',()=>{
 const s=sim.createState();
 for(const key of [null,{},42,'mint-tin','prop:missing','decor:1','prop:__proto__']){
  const before=saved(s);assert.deepEqual(sim.interactStory(s,key),{ok:false,reason:'invalid'});assert.equal(saved(s),before);
 }
 for(const [id] of route){
  const status=sim.storyStatus(s),wrong=status.next.object==='tea-set'?'moon-bed':'tea-set',before=saved(s);
  assert.equal(use(s,wrong).reason,'storyNotHere');assert.equal(saved(s),before);
  assert.equal(use(s,id).ok,true);
  const after=saved(s),finished=sim.storyStatus(s).finished;
  assert.equal(use(s,id).reason,finished?'storyFinished':'storyNotHere');assert.equal(saved(s),after);
 }
});

test('paused object interaction cannot progress the story or consume a carried item',()=>{
 const s=sim.createState();use(s,'mint-tin');s.paused=true;const before=saved(s);
 assert.equal(use(s,'sewing-machine').reason,'pausedActivity');assert.equal(saved(s),before);
 s.paused=false;assert.equal(use(s,'sewing-machine').ok,true);assert.equal(sim.storyStatus(s).held,'mended-bear');
});

test('stories do not mutate care, bond, mastery, needs, wishes or owned decorations',()=>{
 const s=sim.createState();sim.place(s,'lamp','parlor',0);sim.care(s,'lina','tea');
 const before=structuredClone(s);
 for(const [id] of route)assert.equal(use(s,id).ok,true);
 for(const key of Object.keys(before))if(!['story','buttons','earnedToday'].includes(key))assert.deepEqual(s[key],before[key],key);
 assert.equal(s.buttons,before.buttons+48);assert.equal(s.earnedToday,before.earnedToday+48);
});

test('every carried item and completed chapter persists through version-one reload',()=>{
 let s=sim.createState();
 for(let i=0;i<route.length;i++){
  const [id,held]=route[i];assert.equal(use(s,id).ok,true);
  const status=sim.storyStatus(s),story=structuredClone(s.story),buttons=s.buttons;
  s=sim.restore(saved(s));assert.equal(s.version,1);assert.deepEqual(s.story,story);
  assert.deepEqual(sim.storyStatus(s),status);assert.equal(sim.storyStatus(s).held,held);assert.equal(s.buttons,buttons);
 }
 assert.equal(use(s,'doorstep').reason,'storyFinished');assert.equal(s.buttons,84);
});

test('old and malformed story records load safe defaults with no extra reward',()=>{
 const baseline=sim.createState();delete baseline.story;
 const defaults={chapter:0,step:0,lastAction:null,lastActionAt:-10};
 for(const story of [undefined,null,[],true,'chapter',{}]){
  const s=sim.restore(JSON.stringify({...baseline,story}));assert.deepEqual(s.story,defaults);assert.equal(s.buttons,36);
 }
 const invalid=sim.restore(JSON.stringify({...baseline,story:{chapter:'2',step:{},lastAction:'prop:unknown',lastActionAt:'later',held:'guest-cup',completed:['guest-tea']}}));
 assert.deepEqual(invalid.story,defaults);assert.equal(sim.storyStatus(invalid).held,null);assert.deepEqual(sim.storyStatus(invalid).completed,[]);
});

test('restored story indices and timestamps stay within valid current chapter bounds',()=>{
 const base=sim.createState();base.elapsed=15;
 const fixtures=[
  [{chapter:-9,step:-3,lastAction:'prop:mint-tin',lastActionAt:-99},{chapter:0,step:0,lastAction:'prop:mint-tin',lastActionAt:-10}],
  [{chapter:1,step:999,lastAction:'prop:music-cabinet',lastActionAt:99},{chapter:1,step:3,lastAction:'prop:music-cabinet',lastActionAt:15}],
  [{chapter:2.8,step:2.9,lastAction:'prop:tea-set',lastActionAt:7},{chapter:2,step:2,lastAction:'prop:tea-set',lastActionAt:7}],
  [{chapter:999,step:999,lastAction:'prop:doorstep',lastActionAt:15},{chapter:3,step:0,lastAction:'prop:doorstep',lastActionAt:15}],
 ];
 for(const [story,want] of fixtures)assert.deepEqual(sim.restore(JSON.stringify({...base,story})).story,want);
 const finished=sim.restore(JSON.stringify({...base,story:{chapter:999,step:999}}));
 assert.equal(sim.storyStatus(finished).held,null);assert.equal(use(finished,'mint-tin').reason,'storyFinished');assert.equal(finished.buttons,36);
});

test('dawn, optional rituals and keepsake reuse cannot reset chapters or repeat story rewards',()=>{
 const s=sim.createState();for(const [id] of route)use(s,id);
 const story=structuredClone(s.story),buttons=s.buttons;
 sim.changeLight(s);sim.changeLight(s);assert.deepEqual(s.story,story);
 assert.equal(use(s,'doorstep').reason,'storyFinished');assert.equal(s.buttons,buttons);
 sim.beginActivity(s,'tea');sim.activityInput(s,(s.activities.active.pattern[0]+1)%4);
 assert.deepEqual(s.story,story);assert.equal(use(s,'mint-tin').reason,'storyFinished');
});

test('story targets correspond to unique permanent props and held-item definitions',()=>{
 assert.ok(Array.isArray(content.STORY_CHAPTERS),'authored chapters missing');
 assert.ok(Array.isArray(content.STORY_ITEMS),'authored held items missing');
 const keys=content.INTERACTIVE_PROPS.map(p=>p.id);assert.equal(new Set(keys).size,keys.length);
 for(const chapter of content.STORY_CHAPTERS)for(const step of chapter.steps){
  assert.ok(keys.includes(step.object),step.object);
  if(step.gives)assert.ok(content.STORY_ITEMS.some(i=>i.id===step.gives),step.gives);
 }
 for(const id of ['mint-tin','music-cabinet','wash-basin','jasmine-window','doorstep']){
  const prop=content.INTERACTIVE_PROPS.find(p=>p.id===id);assert.ok(prop,id);assert.equal(prop.story,true);
  assert.ok(prop.position.every(Number.isFinite));assert.ok(prop.size.every(v=>Number.isFinite(v)&&v>0));
  assert.equal(prop.care,undefined);assert.equal(prop.activity,undefined);
 }
});

test('earned story keepsakes replay only after their own chapter is complete',()=>{
 const s=sim.createState();
 assert.equal(typeof sim.playStoryKeepsake,'function');
 for(const key of ['prop:music-cabinet','prop:moon-bed','prop:doorstep']){
  const before=saved(s);assert.equal(sim.playStoryKeepsake(s,key).reason,'storyNotReady');assert.equal(saved(s),before);
 }
 for(const [id] of route.slice(0,3))use(s,id);
 assert.equal(sim.playStoryKeepsake(s,'prop:moon-bed').ok,true);
 assert.equal(sim.playStoryKeepsake(s,'prop:music-cabinet').reason,'storyNotReady');
 assert.equal(sim.playStoryKeepsake(s,'prop:doorstep').reason,'storyNotReady');
 for(const [id] of route.slice(3,7))use(s,id);
 assert.equal(sim.playStoryKeepsake(s,'prop:music-cabinet').ok,true);
 assert.equal(sim.playStoryKeepsake(s,'prop:doorstep').reason,'storyNotReady');
 for(const [id] of route.slice(7))use(s,id);
 assert.equal(sim.playStoryKeepsake(s,'prop:doorstep').ok,true);
});

test('story replay refreshes only visual timestamps and preserves carried items and all progression',()=>{
 const s=sim.createState();sim.place(s,'lamp','parlor',0);
 for(const [id] of route.slice(0,8))use(s,id);
 assert.equal(sim.storyStatus(s).held,'water-ewer');
 for(const key of ['prop:moon-bed','prop:music-cabinet','prop:moon-bed','prop:music-cabinet']){
  s.elapsed+=3;const before=structuredClone(s),id=key.slice(5);
  assert.deepEqual(sim.playStoryKeepsake(s,key),{ok:true,effect:id,message:'story-replay-'+id});
  assert.deepEqual(s,{...before,story:{...before.story,lastAction:key,lastActionAt:s.elapsed}});
  assert.equal(sim.storyStatus(s).held,'water-ewer');
 }
 for(const [id] of route.slice(8))use(s,id);
 for(let i=0;i<3;i++){
  s.elapsed++;const before=structuredClone(s);
  assert.equal(sim.playStoryKeepsake(s,'prop:doorstep').ok,true);
  assert.deepEqual(s,{...before,story:{...before.story,lastAction:'prop:doorstep',lastActionAt:s.elapsed}});
 }
});

test('paused and invalid story replay are rejected without any mutation',()=>{
 const s=sim.createState();for(const [id] of route)use(s,id);
 for(const key of [null,{},'doorstep','prop:missing','decor:1','prop:tea-set','prop:mint-tin']){
  const before=saved(s);assert.equal(sim.playStoryKeepsake(s,key).reason,'invalid');assert.equal(saved(s),before);
 }
 s.paused=true;const before=saved(s);
 assert.equal(sim.playStoryKeepsake(s,'prop:music-cabinet').reason,'pausedActivity');assert.equal(saved(s),before);
});
