import assert from 'node:assert/strict';
import * as sim from '../src/simulation.js';
// Complete a service through real controls and bounded simulation ticks.
export function fillTea(s){
 for(const cup of sim.teaStatus(s).cups){
  assert.equal(sim.controlTea(s,{aim:cup.x/.45,tilt:1,pressed:true}).ok,true);
  let remaining=(cup.target-cup.fill)/.55;
  while(remaining>1e-9){const dt=Math.min(1,remaining);sim.step(s,dt);remaining-=dt}
  sim.releaseTea(s);
 }
 assert.equal(sim.teaStatus(s).ready,true);
}
export function finishTea(s){fillTea(s);return sim.serveTea(s)}
export function storyAction(s,id){
 const result=sim.interactStory(s,'prop:'+id);
 if(!result.startedActivity)return result;
 const served=finishTea(s);sim.endActivity(s);return served.storyResult;
}
