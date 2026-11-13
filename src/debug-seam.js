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
      intro:()=>({active:Boolean(app.intro?.active),beat:app.intro?.beat??-1})};
 }
}
