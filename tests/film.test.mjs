import test from 'node:test';
import assert from 'node:assert/strict';
import {filmShot,FILM_SECONDS} from '../src/render/film-scene.js';
import {createFilmSound} from '../src/film-sound.js';
import {strings} from '../src/i18n.js';

test('film has seven distinct readable shots, ends at sixty, and reduced motion freezes each pose',()=>{
 assert.equal(FILM_SECONDS,60);
 assert.deepEqual([3,12,22,30,39,47,57].map(t=>filmShot(t).index),[0,1,2,3,4,5,6]);
 for(const t of [1,9,18,27,36,45,53]){
  const shot=filmShot(t);assert.ok(shot.end-shot.start>=6);
  assert.deepEqual(filmShot(t,true).eye,filmShot(t+3,true).eye);
  assert.notDeepEqual(shot.eye,filmShot(t+3).eye);
 }
 assert.equal(filmShot(-10).index,0);assert.equal(filmShot(60).index,6);
});
test('film copy is authored in both languages',()=>{
 for(const key of Object.keys(strings.en).filter(key=>key.startsWith('film'))){
  assert.ok(strings.ar[key]);assert.match(strings.ar[key],/[\u0600-\u06ff]/);
 }
});
test('a late audio unlock after disposal cannot revive a closed film',async()=>{
 let resolveResume,closed=0;
 const original=globalThis.AudioContext;
 globalThis.AudioContext=class {
  currentTime=0;state='running';destination={};
  createGain(){return {connect(){},gain:{setTargetAtTime(){}}};}
  resume(){return new Promise(resolve=>{resolveResume=resolve;});}
  close(){closed++;return Promise.resolve();}
 };
 try{const sound=createFilmSound(),pending=sound.enable();sound.dispose();resolveResume();
  assert.equal(await pending,false);assert.equal(closed,1);sound.tick(4);sound.dispose();}
 finally{globalThis.AudioContext=original;}
});

test('muting and closing retire active film voices; a later muted visit produces no sound',async()=>{
 let started=0,stopped=0,closed=0;
 const original=globalThis.AudioContext;
 globalThis.AudioContext=class {
  currentTime=0;state='running';destination={};
  createGain(){return {connect(){},gain:{setTargetAtTime(){},setValueAtTime(){},
   linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}}};}
  createOscillator(){return {frequency:{value:0},connect(){},start(){started++;},stop(){stopped++;}};}
  resume(){return Promise.resolve();}close(){closed++;return Promise.resolve();}
 };
 try{const sound=createFilmSound();await sound.enable();sound.tick(0);assert.ok(started>0);
  const played=started,scheduledStops=stopped;sound.mute();assert.ok(stopped>scheduledStops);
  sound.tick(3);assert.equal(started,played);sound.dispose();assert.equal(closed,1);
  sound.tick(6);assert.equal(started,played);}
 finally{globalThis.AudioContext=original;}
});


test('muting while audio unlock is pending keeps the screening silent',async()=>{
 let finish;
 const original=globalThis.AudioContext;
 globalThis.AudioContext=class {
  currentTime=0;state='running';destination={};
  createGain(){return {connect(){},gain:{setTargetAtTime(){}}};}
  resume(){return new Promise(resolve=>{finish=resolve;});}
  close(){return Promise.resolve();}
 };
 try{const sound=createFilmSound(),unlock=sound.enable();sound.mute();finish();
  assert.equal(await unlock,false);sound.tick(3);sound.dispose();}
 finally{globalThis.AudioContext=original;}
});
