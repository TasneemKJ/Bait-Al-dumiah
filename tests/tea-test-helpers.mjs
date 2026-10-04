import assert from 'node:assert/strict';
import * as sim from '../src/simulation.js';
export function fillTea(s,advance=dt=>sim.step(s,dt)){
 for(const cup of sim.teaStatus(s).cups){
  assert.equal(sim.controlTea(s,{aim:cup.x/.45,tilt:1,pressed:true}).ok,true);
  let remaining=(cup.target-cup.fill)/.55;
  while(remaining>1e-9){const dt=Math.min(1,remaining);advance(dt);remaining-=dt}
  sim.releaseTea(s);
 }
 assert.equal(sim.teaStatus(s).ready,true);
}
export function finishTea(s,advance){fillTea(s,advance);return sim.serveTea(s)}
// Follow authored guide vertices through actual bounded movement; never write rule state.
export function fillStitch(s,dt=.05,advance=delta=>sim.step(s,delta)){
 let count=0;
 while(sim.stitchStatus(s).section<sim.stitchStatus(s).sections.length){
  const st=sim.stitchStatus(s),p=st.nextGuidePoint;
  assert.equal(sim.controlStitch(s,{x:p.x,y:p.y,pressed:true}).ok,true);
  advance(dt);assert.ok(++count<20000,'physical sewing must converge');
  if(sim.stitchStatus(s).loose)throw new Error('helper encountered a loose loop');
 }
 sim.releaseStitch(s);assert.equal(sim.stitchStatus(s).ready,true);
}
export function finishStitch(s,dt=.05,advance){fillStitch(s,dt,advance);return sim.finishStitch(s)}
export function storyAction(s,id,onStep){
 const result=sim.interactStory(s,'prop:'+id);if(!result.startedActivity)return result;
 const advance=dt=>{sim.step(s,dt);onStep?.(dt)};
 const completed=result.startedActivity==='tea'?finishTea(s,advance):result.startedActivity==='stitch'?finishStitch(s,.05,advance):null;
 assert.ok(completed,'unknown physical story activity');sim.endActivity(s);return completed.storyResult;
}
