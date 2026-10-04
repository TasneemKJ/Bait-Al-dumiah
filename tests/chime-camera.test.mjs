import test from 'node:test';import assert from 'node:assert/strict';
import {chimeFraming} from '../src/render/chime-camera.js';
for(const [w,h] of [[320,568],[390,844],[667,320],[844,390],[1280,900],[1440,1000]])test(`moon instrument keeps 44px grabs and reserved chrome at ${w}x${h}`,()=>{
 const f=chimeFraming(w,h),span=f.height/f.zoom,pixelDiameter=.66*h/span;
 assert.ok(pixelDiameter>=44,`diameter ${pixelDiameter}`);assert.ok(span*f.aspect>=3.25-1e-9);
 assert.ok(2.75*h/span<=h-f.safeArea.top-f.safeArea.bottom+1e-9);
 assert.ok(f.target.every(Number.isFinite));
});
