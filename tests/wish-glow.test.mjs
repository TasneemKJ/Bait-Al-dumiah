import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,care,wishFor} from '../src/simulation.js';
import {wishGlowActive,wishGlowOpacity,WISH_GLOW_DAYS} from '../src/wish-glow.js';

test('glow marks idle residents with an unspoken wish in the first days',()=>{
 const s=createState();for(const d of s.dolls)assert.equal(wishGlowActive(s,d.id),true);
});
test('granting the wish puts the glow out for that resident only',()=>{
 const s=createState(),id=s.dolls[0].id;care(s,id,wishFor(s,id));
 assert.equal(s.wishes.includes(id),true);assert.equal(wishGlowActive(s,id),false);assert.equal(wishGlowActive(s,s.dolls[1].id),true);
});
test('glow retires after the teaching days and never shows while a doll is busy',()=>{
 const s=createState();s.day=WISH_GLOW_DAYS+1;assert.equal(wishGlowActive(s,s.dolls[0].id),false);
 const t=createState();t.dolls[0].action='tea';assert.equal(wishGlowActive(t,t.dolls[0].id),false);
 assert.equal(wishGlowActive(t,'nobody'),false);
});
test('glow is steady under reduced motion, breathes otherwise, and stays soft',()=>{
 assert.equal(wishGlowOpacity(false,3,false),0);
 assert.equal(wishGlowOpacity(true,0,true),wishGlowOpacity(true,9,true));
 const values=[0,1,2,3,4].map(t=>wishGlowOpacity(true,t,false));assert.ok(new Set(values).size>1);assert.ok(values.every(v=>v>0&&v<=.55));
});
import {wishGlowStrength,WISH_GLOW_IDLE_SECONDS} from '../src/wish-glow.js';
test('later days: quiet half-strength glow only in daylight after the player has been idle a while',()=>{
 const s=createState();s.day=WISH_GLOW_DAYS+2;s.clock=30;const id=s.dolls[0].id;
 s.elapsed=1000;for(const d of s.dolls)d.lastCare=1000-10;assert.equal(wishGlowStrength(s,id),0,'recently cared for');
 for(const d of s.dolls)d.lastCare=1000-WISH_GLOW_IDLE_SECONDS;assert.equal(wishGlowStrength(s,id),.5);
 s.clock=150;assert.equal(wishGlowStrength(s,id),0,'never at night');
 s.clock=30;s.wishes=[id];assert.equal(wishGlowStrength(s,id),0,'wish granted');
 s.wishes=[];s.dolls[0].action='tea';assert.equal(wishGlowStrength(s,id),0,'busy');
});
test('any care by any resident resets the later-day idle wait; a fresh load glows gently',()=>{
 const s=createState();s.day=9;s.clock=10;s.elapsed=500;assert.equal(wishGlowStrength(s,s.dolls[1].id),.5,'fresh load, lastCare unset');
 s.dolls[2].lastCare=s.elapsed-5;assert.equal(wishGlowStrength(s,s.dolls[1].id),0);
});
test('opacity scales with strength and stays steady when still',()=>{
 assert.equal(wishGlowOpacity(0,1,false),0);assert.equal(wishGlowOpacity(.5,0,true),wishGlowOpacity(1,0,true)/2);
 assert.ok(wishGlowOpacity(.5,1,false)<=.28);assert.equal(wishGlowOpacity(true,0,true),.45);
});
