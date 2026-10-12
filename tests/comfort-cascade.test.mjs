import test from 'node:test';import assert from 'node:assert/strict';import * as T from 'three';import {createComfortHearts} from '../src/render/resident-effects.js';
// Break caught: reassurance hearts running forever or starting midway through a global-clock loop.
test('comfort begins at the care event and its cascade ends without looping',()=>{
 const hearts=createComfortHearts(new T.Group());hearts.update(10,true,false,10);assert.equal(hearts.root.visible,true);
 const initial=hearts.root.children.map(o=>[o.position.y,o.material.opacity]);hearts.update(10.2,true,false,10);assert.notDeepEqual(hearts.root.children.map(o=>[o.position.y,o.material.opacity]),initial);
 hearts.update(12.1,true,false,10);assert.equal(hearts.root.visible,false);hearts.update(30,true,false,10);assert.equal(hearts.root.visible,false);
 hearts.update(30,true,false,30);assert.equal(hearts.root.visible,true);hearts.update(30.1,false,false,30);assert.equal(hearts.root.visible,false);
});
test('reduced motion holds the comfort emblem still and also retires it',()=>{
 const hearts=createComfortHearts(new T.Group());hearts.update(10.1,true,true,10);const pose=hearts.root.children.map(o=>o.position.toArray());hearts.update(10.9,true,true,10);assert.deepEqual(hearts.root.children.map(o=>o.position.toArray()),pose);hearts.update(12.1,true,true,10);assert.equal(hearts.root.visible,false);
});
