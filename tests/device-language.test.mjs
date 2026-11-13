import test from 'node:test';
import assert from 'node:assert/strict';
import {createHomeSession} from '../src/home-session.js';
import {SAVE_KEY} from '../src/content.js';
import {createState} from '../src/simulation.js';
import {createRoomFrame} from '../src/render/room-frame.js';
import * as T from 'three';

// Hand-play (2026-11-13): on an Arabic iPhone the first launch opened in English.
const memory=(raw=null)=>{const m=new Map();if(raw!==null)m.set(SAVE_KEY,raw);return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)}};
test('a first launch follows the device language; a saved choice always wins',()=>{
 assert.equal(createHomeSession({storage:memory(),deviceLocale:'ar-SA'}).state.settings.locale,'ar');
 assert.equal(createHomeSession({storage:memory(),deviceLocale:'en-GB'}).state.settings.locale,'en');
 assert.equal(createHomeSession({storage:memory(),deviceLocale:'fr-FR'}).state.settings.locale,'en','other languages read English');
 const s=createState();s.settings.locale='en';
 assert.equal(createHomeSession({storage:memory(JSON.stringify(s)),deviceLocale:'ar-SA'}).state.settings.locale,'en');
});

// Hand-play: in a room view the neighbouring room shared the screen; now it recedes behind a soft veil.
test('the selected room is the subject: its neighbours recede, and nothing is veiled in the whole-house view',()=>{
 const parent=new T.Group(),frame=createRoomFrame(parent);
 frame.show('kitchen');frame.tint(0,1,true);
 const o=id=>frame.veils.find(v=>v.id===id).m.material.opacity;
 assert.equal(o('kitchen'),0);assert.ok(o('studio')>.3&&o('parlor')>.3);
 frame.show(null);frame.tint(0,1,true);assert.ok(frame.veils.every(v=>!v.m.visible));
});
