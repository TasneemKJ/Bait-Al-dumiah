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

test('golden hour is a bounded bump before night, zero for the rest of the day',async()=>{
 const {duskGlow}=await import('../src/render/visual-policy.js');
 for(const c of [0,30,60,90,95,126,130,180,239.9])assert.equal(duskGlow(c),0,'clock '+c);
 const samples=[];for(let c=96;c<=126;c+=1)samples.push(duskGlow(c));
 assert.ok(samples.every(v=>v>=0&&v<=1));assert.ok(Math.max(...samples)>.9,'reaches nearly full glow');
 assert.ok(duskGlow(105)<duskGlow(112)&&duskGlow(112)>duskGlow(122),'rises then falls');
 for(const bad of [NaN,undefined,-5,Infinity])assert.ok(Number.isFinite(duskGlow(bad)));
});
