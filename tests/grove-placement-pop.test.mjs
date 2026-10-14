import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import * as sim from '../src/simulation.js';
import {createDecorSync,landingPop,POP_SECONDS} from '../src/render/decor-sync.js';
import {textureCanvas} from './helpers/render-node.mjs';

test('a landing drops in, squashes, overshoots and settles within the pop; reduced motion is still',()=>{
 assert.ok(landingPop(0,false).drop>.2);assert.equal(landingPop(.2,false).drop,0);
 const squashes=Array.from({length:30},(_,i)=>landingPop(.16+i*.018,false).squash);
 assert.ok(Math.min(...squashes)<.9&&Math.max(...squashes)>1.02,'squash then overshoot');
 assert.deepEqual(landingPop(POP_SECONDS,false),{drop:0,squash:1,dust:0});
 assert.deepEqual(landingPop(.2,true),{drop:0,squash:1,dust:0});assert.ok(landingPop(.3,false).dust>0);
});
test('saved keepsakes stand still on load; a new or moved keepsake pops with dust',t=>{
 textureCanvas(t);const s=sim.createState();sim.place(s,'plant','kitchen',0);
 const root=new T.Group(),sync=createDecorSync(root);s.elapsed=10;sync.add(s);
 sync.place(s,{reducedMotion:false,nightMix:0});const saved=sync.items.get(s.decor[0].id);assert.equal(saved.scale.y,1);
 sim.place(s,'lamp','parlor',1);sync.add(s);s.elapsed=10.3;sync.place(s,{reducedMotion:false,nightMix:0});
 const lamp=sync.items.get(s.decor[1].id);assert.notEqual(lamp.scale.y,1);assert.equal(sync.dust.visible,true);
 s.elapsed=12;sync.place(s,{reducedMotion:false,nightMix:0});assert.equal(lamp.scale.y,1);assert.equal(sync.dust.visible,false);
 sim.moveDecor(s,s.decor[0].id,'studio',2);sync.place(s,{reducedMotion:false,nightMix:0});s.elapsed=12.3;
 sync.place(s,{reducedMotion:false,nightMix:0});assert.notEqual(saved.scale.y,1,'a move lands again');
});
