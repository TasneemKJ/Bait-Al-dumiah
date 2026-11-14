// The opt-in debug seam (?debug=1) for reproducible browser checks. A production build
// (scripts/build.mjs) replaces this module with an empty installDebug, so a shipped copy has none.
import * as sim from './simulation.js';

export function installDebug(app){
 // Explicit opt-in diagnostics for reproducible browser verification, never enabled by default.
 if(new URLSearchParams(location.search).get('debug')==='1'){
  window.dollhouse={state:()=>structuredClone(app.state),stats:()=>({calls:app.world?.renderer.info.render.calls,
    triangles:app.world?.renderer.info.render.triangles,
      geometries:app.world?.renderer.info.memory.geometries,textures:app.world?.renderer.info.memory.textures}),
    project:(id,height)=>app.world?.project(id,height),visual:()=>app.world?.visualStatus(),
      objects:()=>app.world?.objectPositions(),tea:()=>sim.teaStatus(app.state),
    teaObjects:()=>app.world?.teaPositions(),stitch:()=>sim.stitchStatus(app.state),
      stitchObjects:()=>app.world?.stitchPositions(),projectStitch:(x,y,
    height)=>app.world?.projectStitch(x,y,height),chimes:()=>sim.chimeStatus(app.state),
      chimeObjects:()=>app.world?.chimePositions(),chimePullSpan:()=>app.world?.chimePullSpan(),
      film:()=>app.film?.status()??null,
      intro:()=>({active:Boolean(app.intro?.active),beat:app.intro?.beat??-1}),
    // The midnight visitor: what is missing, where its places are on screen, the line showing, and a
    // way to let simulated time pass (the light control's hurry rule still applies to it).
    mischief:()=>({missing:sim.missing(app.state),gone:sim.goneItem(app.state),line:app.mischief?.line??null,
      spots:app.world?.mischiefSpots()??[]}),
    mischiefPoint:(kind,id)=>app.world?.mischiefPoint(kind,id),
    // The canary (drawn only for a subscriber): where it keeps watch, and a song on demand to see its notes.
    canary:()=>({watch:sim.canaryWatch(app.state),forecast:sim.forecast(app.state),point:app.world?.canaryPoint?.()}),
    canarySing:()=>app.world?.canarySing?.(app.state.elapsed,sim.isNight(app.state)),
    advance:seconds=>{for(let i=0;i<Math.min(2000,seconds);i++)sim.step(app.state,1);return sim.missing(app.state)}};
 }
}
