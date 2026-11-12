import test from 'node:test';
import assert from 'node:assert/strict';
import {pressFeedback} from '../src/app-touch.js';
import {DollhouseAudio} from '../src/audio.js';

// Studio gate (2026-11-13): every press has a sound and a haptic that fit the place, and sound comes back after an
// interruption (a call, Siri) on the next touch.
function press(target){return {target:{closest:sel=>sel==='button'&&target.button?target:null,...target}}}
test('a press on a control taps softly and buzzes once; a press on nothing does neither',()=>{
 const events=[],buzz=[],app={audio:{press(){events.push('press')},wake(){events.push('wake')}}};
 const nav={vibrate:ms=>buzz.push(ms)};
 pressFeedback(app,press({button:true}),nav);
 assert.deepEqual(events,['wake','press']);assert.deepEqual(buzz,[8]);
 pressFeedback(app,press({button:false}),nav);assert.deepEqual(buzz,[8],'the canvas has its own feedback');
 pressFeedback(app,press({button:true,disabled:true}),nav);assert.deepEqual(buzz,[8],'a disabled control is silent');
 pressFeedback({audio:{}},press({button:true}),{});
});
test('an interrupted audio context resumes on the next touch, unless sound is off or paused',()=>{
 const audio=new DollhouseAudio();let resumed=0;
 audio.context={state:'interrupted',resume(){resumed++;return Promise.resolve()}};audio.enabled=true;
 audio.wake();assert.equal(resumed,1);
 audio.context.state='running';audio.wake();assert.equal(resumed,1);
 audio.context.state='suspended';audio.paused=true;audio.wake();assert.equal(resumed,1,'pause keeps it quiet');
 audio.paused=false;audio.enabled=false;audio.wake();assert.equal(resumed,1,'muted stays muted');
});
test('the canary sings inside the synth range, so its trill is a melody, not one clamped note',()=>{
 const tones=[],audio=new DollhouseAudio();audio.context={currentTime:0};audio.enabled=true;
 audio.tone=f=>tones.push(f);assert.equal(audio.canary(),true);
 assert.ok(tones.length>3&&tones.every(f=>f>=65&&f<=1800),String(tones));assert.ok(new Set(tones).size>2);
});
