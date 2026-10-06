import test from 'node:test';
import assert from 'node:assert/strict';
const api=await import('../src/render/visual-policy.js').catch(()=>({}));
function policy(){assert.equal(typeof api.lighting,'function');return api;}
test('night lighting is cool and subdued outside with stronger practical lights',()=>{const {lighting}=policy(),day=lighting(0),night=lighting(1);assert.ok(night.key<day.key*.3);assert.ok(night.ambient<day.ambient*.6);assert.ok(night.lamps>day.lamps*3);assert.ok(night.exposure>=1)});
test('lighting interpolation is bounded for invalid visual inputs',()=>{const {lighting}=policy();assert.deepEqual(lighting(-10),lighting(0));assert.deepEqual(lighting(100),lighting(1));assert.deepEqual(lighting(NaN),lighting(0));for(const v of Object.values(lighting(.5)))assert.ok(Number.isFinite(v))});
test('automatic landscape phones keep the mobile rendering budget',()=>{const {detail}=policy();assert.equal(detail(844,390,'auto',3).level,'low');assert.equal(detail(390,844,'auto',3).level,'low');assert.equal(detail(1440,1000,'auto',2).level,'high')});
test('quality requests cap pixel density without disabling scene details',()=>{const {detail}=policy();assert.equal(detail(390,844,'high',3).pixelRatio,1.75);assert.equal(detail(1440,1000,'low',3).pixelRatio,1.25);assert.equal(detail(0,0,'broken',0).pixelRatio,1)});
test('room camera pose is validated and bounded on both viewports',()=>{const {framing}=policy();for(const [w,h] of [[390,844],[1440,1000],[844,390]]){const home=framing(w,h),room=framing(w,h,'kitchen');assert.ok(room.zoom>home.zoom);assert.ok(room.zoom<=3.5);assert.deepEqual(framing(w,h,'bad'),home);assert.ok(room.target[0]<0);assert.ok(room.target[1]<3)}});
test('upper rooms retain their physical height above ground-floor framing',()=>{const {framing}=policy();assert.ok(Math.abs(framing(390,844,'bedroom').target[1]-framing(390,844,'parlor').target[1]-3.2)<1e-9);assert.deepEqual(framing(390,844).target,[0,3.65,0]);assert.ok(Number.isFinite(framing(0,0).height))});
test('night sky is explicitly linear and keeps cream HUD text readable even at maximum glow',()=>{
 assert.equal(typeof api.nightSky,'function');const sky=api.nightSky();
 for(const key of ['bottom','top']){const rgb=sky[key].map((v,i)=>v+sky.glow[i]);const y=rgb.reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0);assert.ok(y<.075,'avoid a washed-out gray night sky');assert.ok((.8+.05)/(y+.05)>7,'cream HUD remains readable')}
});
test('night lighting preserves a gentle front light on porcelain faces',()=>{const {lighting}=policy();assert.ok(lighting(1).key>=.50);assert.ok(lighting(1).ambient>=.50)});

test('quality governor lightens once after a sustained slow window and never flaps back',async()=>{
 const {createQualityGovernor,detail}=await import('../src/render/visual-policy.js');
 const g=createQualityGovernor({threshold:20,window:10});
 for(let i=0;i<9;i++)assert.equal(g.note(40),false,'not before a full window');
 assert.equal(g.note(40),true);assert.equal(g.degraded,true);
 for(let i=0;i<50;i++)g.note(2);assert.equal(g.degraded,true,'stays lighter');
 assert.equal(detail(1024,768,'auto',2,true).level,'low');assert.equal(detail(1024,768,'auto',2,false).level,'high');
 assert.equal(detail(1024,768,'high',2,true).level,'high','an explicit choice is respected');
});
test('quality governor ignores one-off spikes, bad samples and healthy frames',async()=>{
 const {createQualityGovernor}=await import('../src/render/visual-policy.js');
 const g=createQualityGovernor({threshold:20,window:10});
 for(let i=0;i<40;i++)g.note(i%10===0?90:6);for(const bad of [NaN,Infinity,-3,0,undefined])g.note(bad);
 assert.equal(g.degraded,false);g.reset();assert.equal(g.degraded,false);
});
test('lightening copy exists in English and Arabic',async()=>{
 const {strings}=await import('../src/i18n.js');assert.ok(strings.en.qualityLightened);assert.match(strings.ar.qualityLightened,/[؀-ۿ]/);
});
