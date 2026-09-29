import * as T from 'three';
import {createDolls} from '../src/render/dolls.js';
import {createState} from '../src/simulation.js';
import {DOLLS} from '../src/content.js';
import {rigParts} from '../src/render/doll-rig-batch.js';
const cases=[],test=(name,run)=>cases.push({name,run});
const assert=(ok,message)=>{if(!ok)throw Error(message)};
const size=g=>{g.computeBoundingBox();return g.boundingBox.getSize(new T.Vector3())};
const fixture=(id='lina')=>{const state=createState(),view=createDolls(new T.Group());return {state,view,doll:view.dolls.find(d=>d.id===id),resident:state.dolls.find(d=>d.id===id)}};
export async function runArtChecks(){const out=[];for(const c of cases){try{await c.run();out.push({name:c.name,passed:true})}catch(e){out.push({name:c.name,passed:false,error:e.message})}}return out}

test("A11: Lower and shape the scalp dome to fit the smaller heads", ()=>{for(const d of fixture().view.dolls){const g=d.hairStyle.cap.geometry;g.computeBoundingBox();assert(g.boundingBox.max.y<.303&&g.boundingBox.max.y>.28,'scalp still forms a tall separate helmet');assert(g.boundingBox.max.x<.317,'scalp overhang is too wide')}});

test("A12: Flatten and taper fringe locks so they read as hair rather than leaves", async()=>{const {sweptLock}=await import('project/src/render/doll-couture.js');const g=sweptLock([[0,.3,0],[0,.2,0],[0,.1,0],[0,0,0]],.06,.02);const p=g.attributes.position;let rootWidth=0;for(let i=0;i<13;i++)rootWidth=Math.max(rootWidth,Math.abs(p.getX(i)));assert(rootWidth>.008,'lock begins with a detached needle point');assert(size(g).z<.028,'lock has a swollen round cross section')});

test("A13: Resculpt Lina with six interlocking curtain-fringe sections", ()=>{const {doll}=fixture();assert(doll.hairStyle.fringe.length===6,'Lina still has four swollen fringe lobes');for(const l of doll.hairStyle.fringe){const s=size(l.geometry);assert(s.y>.08&&s.x>.07&&s.z>.025,'curtain fringe is not a swept silhouette')}});

test("A14: Give Noor a continuous five-section side sweep rather than a four-lobed cap", ()=>{const {doll}=fixture('noor');assert(doll.hairStyle.fringe.length===5,'Noor fringe has not been resculpted');assert(doll.hairStyle.bun&&doll.hairStyle.temples.length===2,'Noor identity was lost');for(const l of doll.hairStyle.fringe){const p=l.geometry.attributes.position;assert([...p.array].every(Number.isFinite),'invalid sweep surface')}});

test("A15: Break Sami\u2019s heavy fringe into six fine swept sections above the glasses", ()=>{const {doll}=fixture('sami');assert(doll.hairStyle.fringe.length===6,'Sami still has four heavy hair lobes');for(const l of doll.hairStyle.fringe){l.geometry.computeBoundingBox();assert(l.geometry.boundingBox.max.z>.24,'fringe buried in cap')}assert(doll.spectacles.temples.length===2,'glasses identity lost')});

test("A16: Replace rope-like plaits with three-strand braids tapered toward the ties", ()=>{const {doll}=fixture();for(const b of doll.hairStyle.tails){assert(b.strands.length===3,'braid still has only two uniform ropes');for(const s of b.strands){const p=s.geometry.attributes.position,path=s.geometry.parameters.path;let top=0,tip=0;for(let i=0;i<7;i++){top=Math.max(top,new T.Vector3().fromBufferAttribute(p,i).distanceTo(path.getPointAt(0)));tip=Math.max(tip,new T.Vector3().fromBufferAttribute(p,p.count-7+i).distanceTo(path.getPointAt(1)))}assert(tip<top*.65,'hair strand does not taper')}}});

test("A17: Lower Noor\u2019s bun and flatten the braid wrap into a tied hair coil", ()=>{const {doll}=fixture('noor'),b=doll.hairStyle.bun;assert(b.position.y<=.26,'bun stands on top of the scalp');const s=new T.Box3().setFromObject(b).getSize(new T.Vector3());assert(s.y<.17&&s.x<.19,'bun remains a large bead');assert(b.strands.length===3,'braided wrap was removed')});

test("A18: Shape fine tapered temple locks on all three dolls without framing the eyes", ()=>{for(const d of fixture().view.dolls){assert(d.hairStyle.temples.length===2,d.id+' lacks soft side locks');for(const l of d.hairStyle.temples){assert(l.geometry.type==='BufferGeometry','temple is a round noodle');const s=size(l.geometry);assert(s.x<.080&&s.z<.12,'temple lock overwhelms the cheek')}}});

test("A19: Scale hair ribbons to sewn ties instead of oversized bow ornaments", ()=>{for(const d of fixture().view.dolls)for(const b of d.hairStyle.bows){const s=new T.Box3().setFromObject(b).getSize(new T.Vector3());assert(s.x<.153&&s.y<.105,'bow overpowers the hair');assert(rigParts(b,'folded-bow-loop').length===2,'fabric folds were removed')}});

test("A20: Paint directional hair tones with shared color maps rather than a single flat cap", ()=>{const a=fixture().view,b=fixture().view;for(let i=0;i<3;i++){const m=a.dolls[i].hairStyle.cap.material;assert(m.map?.isCanvasTexture,'hair has no directional painted tones');assert(m.map===b.dolls[i].hairStyle.cap.material.map,'hair color texture is recreated');const c=m.map.image.getContext('2d'),x=c.getImageData(25,15,1,1).data,y=c.getImageData(100,230,1,1).data;assert(x.some((v,k)=>k<3&&Math.abs(v-y[k])>3),'hair tone map is flat');assert(m.map.image.width<=256,'hair map exceeds budget')}});


test("Review: Noor's upper sweep has no see-through gap at a three-quarter angle", ()=>{
 const {view,state,doll}=fixture('noor');state.settings.reducedMotion=true;view.update(state,.1,'noor');doll.root.position.set(0,0,0);doll.root.rotation.y=.4;doll.root.updateMatrixWorld(true);
 const camera=new T.OrthographicCamera(-.43,.43,.43,-.43,.1,50);camera.position.set(0,1.23,8);camera.lookAt(0,1.11,0);camera.updateMatrixWorld(true);
 for(const [x,y] of [[680,240],[690,250],[686,246]]){const ray=new T.Raycaster();ray.setFromCamera(new T.Vector2(x/900*2-1,1-y/900*2),camera);const hits=ray.intersectObject(doll.hairStyle.root,true).filter(h=>h.object.material.visible);assert(hits.length>0,'background shows between the cap and the upper swept strand')}
});


test("Review: Sami's side-part layers join without background slits", ()=>{
 const {view,state,doll}=fixture('sami');state.settings.reducedMotion=true;view.update(state,.1,'sami');doll.root.position.set(0,0,0);doll.root.rotation.y=.4;doll.root.updateMatrixWorld(true);
 const camera=new T.OrthographicCamera(-.43,.43,.43,-.43,.1,50);camera.position.set(0,1.23,8);camera.lookAt(0,1.11,0);camera.updateProjectionMatrix();camera.updateMatrixWorld(true);
 const join=doll.hairStyle.root.getObjectByName('joined-side-sweep');assert(join,'side-part bridge is missing');
 const p=join.geometry.attributes.position,stride=9;
 for(const row of [3,7,11,15,19]){
  const point=new T.Vector3().fromBufferAttribute(p,row*stride+4);join.localToWorld(point);const ndc=point.clone().project(camera);
  const ray=new T.Raycaster();ray.setFromCamera(new T.Vector2(ndc.x,ndc.y),camera);
  const hits=ray.intersectObject(doll.hairStyle.root,true).filter(h=>h.object.material.visible);
  assert(hits.length>0,'background shows through the side-part bridge');
 }
});
