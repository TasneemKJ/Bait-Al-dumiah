import {rigParts} from '../src/render/doll-rig-batch.js';
import * as T from 'three';
import {createDolls} from '../src/render/dolls.js';
import {createState} from '../src/simulation.js';
const cases=[];
const test=(name,run)=>cases.push({name,run});
const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const fixture=(id='lina')=>{const state=createState(),view=createDolls(new T.Group());return {state,view,doll:view.dolls.find(d=>d.id===id),resident:state.dolls.find(d=>d.id===id)}};
const named=rigParts;
export async function runArtChecks(){const results=[];for(const {name,run} of cases){try{await run();results.push({name,passed:true})}catch(e){results.push({name,passed:false,error:e.message})}}return results}

test("D11: Swept hair cap",()=>{
const {doll}=fixture();const cap=doll.hairStyle?.cap;assert(cap,'hair remains an ellipsoid covered in bead fringe');const p=cap.geometry.attributes.position;assert(p.count<1200,'hair cap wastes geometry');let forehead=Infinity;for(let i=0;i<p.count;i++)if(p.getZ(i)>.255)forehead=Math.min(forehead,p.getY(i));assert(forehead>.10,'new hairline covers the eyes');assert(cap.material.roughness>.5,'hair cap has an oily highlight');
});

test("D12: Lina plaits",()=>{
const {doll}=fixture();assert(doll.hairStyle.tails.length===2,'Lina has no paired plaits');for(const braid of doll.hairStyle.tails){assert(braid.strands?.length===3,'plait is not interwoven');const p=braid.strands[0].geometry.attributes.position;let low=Infinity,high=-Infinity;for(let i=0;i<p.count;i++){low=Math.min(low,p.getZ(i));high=Math.max(high,p.getZ(i))}assert(high-low>.07,'braid has no overlapping depth');assert(braid.userData.noBatch,'braid cannot follow the head independently')}
});

test("D13: Noor braided bun",()=>{
const {doll}=fixture('noor');const bun=doll.hairStyle.bun;assert(bun?.strands.length===3,'Noor still wears a plain bead bun');assert(bun.strands.every(s=>s.geometry.type==='TubeGeometry'),'bun wrap is not braided');assert(doll.hairStyle.temples?.length===2,'bun has no shaped temple locks');const size=new T.Box3().setFromObject(bun).getSize(new T.Vector3());assert(size.x<.36&&size.y<.32,'bun overpowers the head');
});

test("D14: Sami side part",()=>{
const {doll}=fixture('sami');const locks=doll.hairStyle.fringe;assert(locks?.length===6,'Sami has no individual side-part fringe');assert(locks.every(o=>o.geometry.type==='BufferGeometry'),'fringe is not a lofted, tapered mass');let front=0;for(const lock of locks){lock.geometry.computeBoundingBox();front=Math.max(front,lock.geometry.boundingBox.max.z)}assert(front>.24,'side-swept locks are buried in the scalp');
});

test("D15: Fabric ribbon folds",()=>{
const {doll}=fixture();const bows=doll.hairStyle.bows;assert(bows?.length===2,'braid ties have no cloth bows');for(const bow of bows){const loops=named(bow,'folded-bow-loop'),tails=named(bow,'split-ribbon-tail');assert(loops.length===2&&tails.length===2,'bow does not have folded loops and split tails');loops[0].geometry.computeBoundingBox();assert(loops[0].geometry.boundingBox.getSize(new T.Vector3()).z>.04,'bow cloth is completely flat');assert(loops[0].material.side===T.DoubleSide,'backs of bow folds disappear')}
});

test("D16: Lina embroidered apron",()=>{
const {doll}=fixture();const apron=doll.garments?.apron,pocket=doll.garments?.pocket;assert(apron?.material.map?.isCanvasTexture,'Lina still has a blank oval apron');assert(pocket?.geometry&&pocket.position.z>.20,'apron pocket is not sewn onto the front');const p=apron.geometry.attributes.position;let dz=0;for(let i=0;i<p.count;i++)dz=Math.max(dz,p.getZ(i));assert(dz>.25,'apron does not follow the flared skirt');assert(apron.material.bumpMap,'linen weave was lost');
});

test("D17: Noor moon pinafore",()=>{
const {doll}=fixture('noor');assert(doll.garments?.apron,'Noor has no fitted moon pinafore');const clasp=doll.garments.clasp;assert(clasp?.geometry.type==='ExtrudeGeometry','moon clasp is not a shaped crescent');assert(doll.garments.apron.material.map!==fixture().doll.garments.apron.material.map,'Noor uses the rose hostess embroidery');assert(clasp.scale.x<.5,'moon clasp is too large for the collar');
});

test("D18: Sami tailored dungarees",()=>{
const {doll}=fixture('sami');const g=doll.garments;assert(g?.buckles?.length===2,'Sami still has button-only braces');assert(g.buckles.every(b=>b.geometry.parameters.shapes.holes.length===1),'brass buckles have no openings');assert(g.bib.material.map&&g.bib.material.bumpMap,'dungarees have no twill fabric');assert(g.pocket.geometry&&g.pocket.position.z>g.bib.position.z,'dungaree pocket is not layered over the bib');
});

test("D19: Character-specific shoes",()=>{
const view=createDolls(new T.Group());const shoes=view.dolls.map(d=>d.legs[0].foot);assert(shoes.every(f=>f?.sole&&f.upper),'residents still have a single shoe bead');assert(new Set(shoes.map(s=>s.name)).size===3,'all three dolls still wear the same shoes');assert(shoes[0].strap,'Mary Jane straps are missing');assert(shoes[2].laces?.length===3,'Sami boots have no laces');for(const s of shoes){assert(s.sole.scale.y<s.upper.scale.y,'sole is not thinner than the upper')}
});

test("D20: Knitted socks",()=>{
const {doll}=fixture();for(const leg of doll.legs){const sock=leg.sock;assert(sock?.geometry.type==='CylinderGeometry','shin has no knitted sock');assert(sock.material.bumpMap,'knitted sock has no fibre relief');const a=sock.geometry.attributes.position;const radii=[];for(let i=0;i<25;i++)radii.push(Math.hypot(a.getX(i),a.getZ(i)));assert(Math.max(...radii)-Math.min(...radii)>.001,'cuff is not ribbed');assert(leg.knee?.geometry,'made-doll knee joint is missing')}
});
