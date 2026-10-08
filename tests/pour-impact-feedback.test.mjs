import test from 'node:test';import assert from 'node:assert/strict';import * as T from 'three';import {createTeaTable} from '../src/render/tea-table.js';import {createState,beginActivity,controlTea,releaseTea} from '../src/simulation.js';import {TEA_TABLE} from '../src/content.js';import {textureCanvas} from './helpers/render-node.mjs';
// Break caught: flow looking the same at every tilt, contact persisting after release, or unsafe ripple bounds.
test('actual pour flow controls stream weight and only its receiving cup ripples',t=>{
 textureCanvas(t);const s=createState();beginActivity(s,'tea');s.elapsed=10;const cup=s.activities.active.cups[0];cup.fill=.3;
 const table=createTeaTable(new T.Group()),stream=table.root.getObjectByName('tea-pouring-stream'),liquid=table.root.getObjectByName('tea-cup-0').getObjectByName('tea-liquid-surface');
 controlTea(s,{aim:cup.x/TEA_TABLE.aimSpan,tilt:.3,pressed:true});const before=JSON.stringify(s);table.update(s);const thin=stream.scale.x;assert.ok(thin<.8);assert.equal(JSON.stringify(s),before);
 controlTea(s,{aim:cup.x/TEA_TABLE.aimSpan,tilt:1,pressed:true});table.update(s);assert.ok(stream.scale.x>thin);assert.ok(Math.abs(liquid.scale.x-1)>0&&Math.abs(liquid.scale.x-1)<=.0141);
 const other=table.root.getObjectByName('tea-cup-1').getObjectByName('tea-liquid-surface');assert.equal(other.scale.x,1);
 s.settings.reducedMotion=true;table.update(s);assert.equal(liquid.scale.x,1);s.settings.reducedMotion=false;releaseTea(s);table.update(s);assert.equal(stream.visible,false);assert.equal(liquid.scale.x,1);
});
