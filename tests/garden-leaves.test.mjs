import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {plant,ball} from '../src/render/primitives.js';
const leafSegments=root=>{const s=[];root.traverse(o=>{if(o.isMesh&&o.geometry.type==='SphereGeometry')
 s.push(o.geometry.parameters.widthSegments)});return s};

// The restored house stays inside its 400k-triangle budget (scripts/expansion_check.py): a ball's tessellation
// follows its drawn size, so the garden's half-size plants (leaves .11 across) use the small sphere like any other
// ball that size, and full-size plants in the rooms keep the round one.
test('a half-size garden plant draws its leaves with the small sphere; a room plant keeps the round one',()=>{
 const garden=new T.Group(),room=new T.Group();plant(garden,0,0,0,.5);plant(room,0,0,0,.8);
 assert.deepEqual(leafSegments(garden),Array(7).fill(10));
 assert.deepEqual(leafSegments(room),Array(7).fill(16));
});
test('a ball without a drawn extent still sizes by its own radii',()=>{
 const g=new T.Group();ball(g,0,0,0,.13,.1,.1,0xffffff);ball(g,0,0,0,.2,.1,.1,0xffffff);
 assert.deepEqual(leafSegments(g),[10,16]);
});
