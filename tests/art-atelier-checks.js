import * as T from 'three';
import {createDolls} from '../src/render/dolls.js';
import {createState} from '../src/simulation.js';
const cases=[],test=(name,run)=>cases.push({name,run});
const assert=(ok,message)=>{if(!ok)throw Error(message)};
const size=g=>{g.computeBoundingBox();return g.boundingBox.getSize(new T.Vector3())};
const fixture=(id='lina')=>{const state=createState(),view=createDolls(new T.Group());return {state,view,doll:view.dolls.find(d=>d.id===id),resident:state.dolls.find(d=>d.id===id)}};
export async function runArtChecks(){const out=[];for(const c of cases){try{await c.run();out.push({name:c.name,passed:true})}catch(e){out.push({name:c.name,passed:false,error:e.message})}}return out}

test("A01: Balance the head against the clothed body", ()=>{const {view}=fixture();for(const d of view.dolls){d.root.updateMatrixWorld(true);const face=new T.Box3().setFromObject(d.faceHull).getSize(new T.Vector3());assert(face.x<.57&&face.x>.46,d.id+' still has an oversized horizontal head');assert(d.head.scale.y>d.head.scale.x,'head should not flatten into a wide disk')}});

test("A02: Sculpt a rounded chin below the cheeks instead of a wide lower-face shelf", ()=>{const {view}=fixture();for(const d of view.dolls){const p=d.faceHull.geometry.attributes.position;let widest=0,chin=0;for(let i=0;i<p.count;i++){widest=Math.max(widest,Math.abs(p.getX(i)));if(p.getY(i)<-.185&&p.getY(i)>-.213)chin=Math.max(chin,Math.abs(p.getX(i)))}const r=chin/widest;assert(r>.62&&r<.75,`${d.id} lower face ratio ${r}`)}});

test("A03: Seat eyes and smiles on the sculpt rather than floating in front of it", ()=>{const {view}=fixture();for(const d of view.dolls){d.root.updateMatrixWorld(true);for(const eye of d.eyes){const p=eye.iris.getWorldPosition(new T.Vector3()),ray=new T.Raycaster(p.clone().add(new T.Vector3(0,0,1)),new T.Vector3(0,0,-1));const h=ray.intersectObject(d.faceHull,false)[0];assert(h&&h.distance>1&&h.distance<1.009,`${d.id} eye gap ${h?.distance-1}`)}}});

test("A04: Keep painted eyes softly convex without turning them into glossy beads", ()=>{for(const d of fixture().view.dolls)for(const e of d.eyes){const s=size(e.iris.geometry);assert(s.y>.060&&s.y<.073&&s.z>.003&&s.z<.006,'painted eye lost its small softly convex form');assert(e.iris.material.roughness>=.60&&!e.iris.material.transparent,'painted iris returned to a glossy bead finish')}});

test("A05: Add fine upper-lid strokes that close with the painted eyes", ()=>{const {doll,view,state,resident}=fixture();for(const e of doll.eyes){assert(e.upperLid?.geometry.type==='TubeGeometry','upper eyelid stroke missing');assert(e.upperLid.geometry.parameters.radius<.002,'eyelid reads as a heavy ring')}resident.action='rest';state.settings.reducedMotion=true;view.update(state,.1,'lina');assert(doll.eyes.every(e=>!e.upperLid.visible&&e.closedLid.visible),'sleep shows an open upper lash')});

test("A06: Give each resident an individual gently asymmetric smile", ()=>{const mouths=fixture().view.dolls.map(d=>d.mouth.getObjectByName('painted-smile').geometry.attributes.position.array);for(let a=0;a<3;a++)for(let b=a+1;b<3;b++)assert(mouths[a].some((v,i)=>Math.abs(v-mouths[b][i])>.0008),'all three smiles are the same stamp')});

test("A07: Blend the button nose into the face instead of attaching a separate bead", ()=>{for(const d of fixture().view.dolls){const g=d.nose.geometry;g.computeBoundingBox();assert(g.type==='BufferGeometry'&&g.boundingBox.min.z>=0&&g.boundingBox.max.z>.01,'nose is still a separate intersecting bead');assert(size(g).y<.034&&size(g).x<.045,'nose has lost toy proportions')}});

test("A08: Tuck the ear lobes into the hair silhouette with quieter recesses", ()=>{for(const d of fixture().view.dolls){d.root.updateMatrixWorld(true);for(const e of d.ears){const s=new T.Box3().setFromObject(e).getSize(new T.Vector3());assert(s.y<.077&&e.position.z<.016,'ear sticks out as a large separate bead');assert(e.getObjectByName('ear-recess').scale.z<=.003,'ear recess is a raised spot')}}});

test("A09: Paint individual warm complexions with diffused blush instead of dark cheek spots", ()=>{const maps=fixture().view.dolls.map(d=>d.faceHull.material.map.image);const colors=maps.map(m=>Array.from(m.getContext('2d').getImageData(230,60,1,1).data).slice(0,3).join(','));assert(new Set(colors).size===3,'complexions all use the same flat base');for(const m of maps){const c=m.getContext('2d'),a=c.getImageData(76,282,1,1).data,b=c.getImageData(230,60,1,1).data;assert(a[1]>135&&Math.abs(a[0]-b[0])<40,'blush is muddy instead of feathered')}});

test("A10: Expose a short neck above the collar while keeping the head seated", ()=>{for(const d of fixture().view.dolls){d.faceHull.geometry.computeBoundingBox();const chin=d.head.position.y+d.faceHull.geometry.boundingBox.min.y*d.head.scale.y;assert(chin>.866&&chin<.90,'chin still sits directly on the collar');assert(d.root.getObjectByName('bisque-neck-joint'),'neck joint missing')}});
