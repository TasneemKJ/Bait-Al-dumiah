import test from 'node:test';
import assert from 'node:assert/strict';
import {beginActivity,care,createState,endActivity,step,wishFor} from '../src/simulation.js';
import {installFeedback} from '../src/app-feedback.js';
import {installView} from '../src/app-view.js';
import {translate} from '../src/i18n.js';

// Exercise real simulation events through the production notice adapter. Only
// the final DOM toast is replaced so its delivery can be observed.
function feedback(t,locale='en'){
 let now=0;t.mock.method(performance,'now',()=>now);
 const state=createState();state.settings.locale=locale;
 const shown=[],app={state,session:{entered:true},audio:{effect(){}},host:{querySelector(){return null}},
  ui:{t:id=>translate(locale,id),n:String,toast:message=>shown.push(message)}};
 installFeedback(app);installView(app);
 function announce(){for(const event of state.events.splice(0))app.announce(event)}
 function advance(seconds){for(let i=0;i<seconds;i++){now+=1000;step(state,1);announce()}}
 function deliver(){now=Math.max(now,app.noticeAt);app.showNotice(now);return now}
 return {state,shown,app,announce,advance,deliver};
}

for(const locale of ['en','ar'])for(const [eventType,key,clock] of [
 ['calm','calmDayOne',89.9],['first-night','firstNightHint',119.9],
])test(`${locale}: ${eventType} reaches the player immediately and once in the house`,t=>{
 const {state,shown,announce}=feedback(t,locale);state.clock=clock;state.cares=1;
 state.achieved=['first-care'];
 step(state,.2);
 assert.equal(state.events.filter(event=>event.type===eventType).length,1,'the simulation schedules the existing hint');
 announce();
 assert.deepEqual(shown,[translate(locale,key)],'the scheduled bilingual hint must be displayed');
 step(state,1);
 announce();
 assert.deepEqual(shown,[translate(locale,key)],'later frames must not repeat the hint');
});

for(const locale of ['en','ar'])for(const activity of ['tea','stitch','lullaby'])
 test(`${locale}: ${activity} defers rewards and onboarding notices until exit, then delivers once in order`,t=>{
  const {state,shown,app,announce,advance,deliver}=feedback(t,locale),tr=app.ui.t;
  assert.equal(care(state,'lina',wishFor(state,'lina')).ok,true);
  assert.equal(beginActivity(state,activity).ok,true);
  assert.equal(app.physicalActivity(),activity,'use the production ritual visibility detector');
  announce();advance(125);
  const expected=[`${tr('milestoneReached')} ${tr('ms-first-careTitle')} · +5 ${tr('buttons')}`,
   tr('sewnHint'),tr('calmDayOne'),tr('firstNightHint')];
  assert.deepEqual(state.hints,{night:true,calm:true},'both one-time simulation events have occurred');
  assert.deepEqual(shown,[],'a hidden ritual toast must not consume notices');
  assert.deepEqual(app.notices,expected,'keep earlier rewards ahead of both localized hints');
  assert.equal(app.noticeAt,0,'deferring a hidden notice must not start its display interval');
  deliver();
  assert.deepEqual(shown,[],'direct dequeue calls must also respect ritual visibility');
  assert.deepEqual(app.notices,expected);
  const rewards=structuredClone({buttons:state.buttons,mastery:state.activities.mastery,
   completed:state.activities.completed});
  assert.equal(endActivity(state).ok,true);
  assert.equal(app.physicalActivity(),null);
  for(let i=0;i<expected.length;i++){
   const now=deliver();
   assert.deepEqual(shown,expected.slice(0,i+1),'deliver one notice at a time in original order');
   assert.equal(app.noticeAt,now+2400,'preserve the existing notice interval');
  }
  assert.deepEqual({buttons:state.buttons,mastery:state.activities.mastery,
   completed:state.activities.completed},rewards,'notice delivery must not change rewards');
  advance(1);deliver();
  assert.deepEqual(shown,expected,'the consumed one-time hints must not reappear');
  assert.deepEqual(app.notices,[]);
 });

test('a physical ritual preserves the eight-notice cap and oldest-first delivery',t=>{
 const {state,shown,app,deliver}=feedback(t);
 assert.equal(beginActivity(state,'tea').ok,true);
 const messages=Array.from({length:9},(_,i)=>`notice ${i+1}`);
 for(const message of messages)app.say(message);
 assert.deepEqual(shown,[]);
 assert.deepEqual(app.notices,messages.slice(0,8));
 endActivity(state);
 for(let i=0;i<8;i++)deliver();
 assert.deepEqual(shown,messages.slice(0,8));
 assert.deepEqual(app.notices,[]);
});
