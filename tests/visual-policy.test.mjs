import test from 'node:test';
import assert from 'node:assert/strict';
const api=await import('../src/render/visual-policy.js').catch(()=>({}));
function policy(){assert.equal(typeof api.lighting,'function');return api;}
test('night lighting is cool and subdued outside with stronger practical lights',()=>{const {lighting}=policy(),day=lighting(0),night=lighting(1);assert.ok(night.key<day.key*.3);assert.ok(night.ambient<day.ambient*.6);assert.ok(night.lamps>day.lamps*3);assert.ok(night.exposure>=1)});
test('lighting interpolation is bounded for invalid visual inputs',()=>{const {lighting}=policy();assert.deepEqual(lighting(-10),lighting(0));assert.deepEqual(lighting(100),lighting(1));assert.deepEqual(lighting(NaN),lighting(0));for(const v of Object.values(lighting(.5)))assert.ok(Number.isFinite(v))});
test('automatic landscape phones keep the mobile rendering budget',()=>{const {detail}=policy();assert.equal(detail(844,390,'auto',3).level,'low');assert.equal(detail(390,844,'auto',3).level,'low');assert.equal(detail(1440,1000,'auto',2).level,'high')});
test('quality requests cap pixel density without disabling scene details',()=>{const {detail}=policy();assert.equal(detail(390,844,'high',3).pixelRatio,3);assert.equal(detail(390,844,'auto',3).pixelRatio,3,'a 3x phone draws every pixel');assert.equal(detail(390,844,'auto',4).pixelRatio,3);assert.equal(detail(390,844,'low',3).pixelRatio,1.25);assert.equal(detail(1440,1000,'low',3).pixelRatio,1.25);assert.equal(detail(0,0,'broken',0).pixelRatio,1)});
test('room camera pose is validated and bounded on both viewports',()=>{const {framing}=policy();for(const [w,h] of [[390,844],[1440,1000],[844,390]]){const home=framing(w,h),room=framing(w,h,'kitchen');assert.ok(room.zoom>home.zoom);assert.ok(room.zoom<=3.5);assert.deepEqual(framing(w,h,'bad'),home);assert.ok(room.target[0]<0);assert.ok(room.target.every(Number.isFinite));assert.ok(Math.abs(room.target[1])<5,'room center remains within a bounded presentation offset')}});
test('upper rooms retain their physical height above ground-floor framing',()=>{const {framing}=policy();assert.ok(Math.abs(framing(390,844,'bedroom').target[1]-framing(390,844,'parlor').target[1]-3.2)<1e-9);assert.deepEqual(framing(390,844).target,[0,3.65,0]);assert.ok(Number.isFinite(framing(0,0).height))});
test('night sky is explicitly linear and keeps cream HUD text readable even at maximum glow',()=>{
 assert.equal(typeof api.nightSky,'function');const sky=api.nightSky();
 for(const key of ['bottom','top']){const rgb=sky[key].map((v,i)=>v+sky.glow[i]);const y=rgb.reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0);assert.ok(y<.075,'avoid a washed-out gray night sky');assert.ok((.8+.05)/(y+.05)>7,'cream HUD remains readable')}
});
test('night lighting preserves a gentle front light on porcelain faces',()=>{const {lighting}=policy();assert.ok(lighting(1).key>=.50);assert.ok(lighting(1).ambient>=.50)});

test('golden hour is a bounded bump before night, zero for the rest of the day',async()=>{
 const {duskGlow}=await import('../src/render/visual-policy.js');
 for(const c of [0,30,60,90,95,126,130,180,239.9])assert.equal(duskGlow(c),0,'clock '+c);
 const samples=[];for(let c=96;c<=126;c+=1)samples.push(duskGlow(c));
 assert.ok(samples.every(v=>v>=0&&v<=1));assert.ok(Math.max(...samples)>.9,'reaches nearly full glow');
 assert.ok(duskGlow(105)<duskGlow(112)&&duskGlow(112)>duskGlow(122),'rises then falls');
 for(const bad of [NaN,undefined,-5,Infinity])assert.ok(Number.isFinite(duskGlow(bad)));
});

test('the pixel governor keeps full sharpness on fast frames and steps down only while frames are slow',async()=>{
 const {pixelGovernor,PIXEL_STEP,SLOW_HOLD,FAST_HOLD,WARM_UP}=await import('../src/render/visual-policy.js');
 const run=(g,max,dt,seconds)=>{let r=g.ratio(max,dt);for(let s=0;s<seconds;s+=dt)r=g.ratio(max,dt);return r};
 const g=pixelGovernor();
 assert.equal(run(g,3,1/60,60),3,'a minute at 60 fps never softens');
 const slow=pixelGovernor();
 assert.equal(run(slow,3,.05,WARM_UP-.1),3,'shader compiles at the start are ignored');
 assert.equal(run(slow,3,.05,SLOW_HOLD+.6),3-PIXEL_STEP,'one quarter step after a slow stretch');
 assert.equal(run(slow,3,.05,60),1,'never below 1x');
 assert.equal(run(slow,3,1/60,FAST_HOLD+1),1,'a level that was too slow waits longer before it is tried again');
 assert.equal(run(slow,3,1/60,FAST_HOLD),1+PIXEL_STEP,'fast again: it climbs back one step at a time');
 assert.equal(run(slow,3,1/60,120),3,'and returns to full sharpness');
 const seesaw=pixelGovernor();run(seesaw,3,1/60,WARM_UP+1);
 // A phone too slow at 3x but smooth at 2.75x: it settles there, and only rarely tries 3x again.
 let r=3,changes=0,atTop=0;for(let s=0;s<600;s+=1/60){const dt=r>2.9?.03:1/60,next=seesaw.ratio(3,dt);
  if(next!==r)changes++;if(next>2.9)atTop+=dt;r=next}
 assert.equal(r,2.75);assert.ok(changes<=14,`${changes} changes in ten minutes`);assert.ok(atTop<30,`${atTop}s slow`);
 const stall=pixelGovernor();run(stall,3,1/60,WARM_UP+1);
 for(let i=0;i<20;i++){stall.ratio(3,.1);run(stall,3,1/60,1)}
 assert.equal(stall.ratio(3,1/60),3,'a stall now and then is not a slow stretch');
 assert.equal(run(stall,3,.1,5),2.25,'a device under 10 fps (dt clamped) is slow too');
 assert.equal(run(pixelGovernor(),3,Number.NaN,5),3,'no clock, no change');
 const capped=pixelGovernor();assert.equal(capped.ratio(2,1/60),2);assert.equal(capped.ratio(1.25,1/60),1.25,'a lower ceiling applies at once');
 assert.equal(capped.ratio(9,1/60),1.25,'a higher ceiling is earned by fast frames, not jumped to');
 assert.equal(run(capped,9,1/60,FAST_HOLD+WARM_UP+.5),1.5);
});
