import * as fabric from '../src/render/fabric-shapes.js';
import * as T from 'three';
import * as textiles from '../src/render/textiles.js';
import * as primitives from '../src/render/primitives.js';
import {createHouse} from '../src/render/house.js';
const cases=[];
const test=(name,run)=>cases.push({name,run});
const assert=(condition,message)=>{if(!condition)throw new Error(message)};
export async function runArtChecks(){
 const results=[];
 for(const {name,run} of cases){try{await run();results.push({name,passed:true})}catch(error){results.push({name,passed:false,error:String(error.message)})}}
 return results;
}
test('01: lamp halos and doll contact shadows share one radial texture',()=>{
 const masks=Array.from({length:24},()=>textiles.softTexture());
 assert(new Set(masks).size===1,'identical soft-light masks allocate 24 separate textures');
 assert(masks[0].image.width<=128,'radial mask must stay within 128px budget');
});
test('02: static material batching reduces calls and preserves transformed geometry and excluded objects',()=>{
 const root=new T.Group();root.position.set(2,1,-1);const nested=new T.Group();nested.position.set(1,2,.5);nested.rotation.z=.21;root.add(nested);
 const material=new T.MeshStandardMaterial({color:0xaabbcc});
 const a=new T.Mesh(new T.BoxGeometry(.2,.6,.9),material);a.position.x=1;nested.add(a);
 const b=new T.Mesh(new T.SphereGeometry(.3,8,6),material);b.position.z=-1;root.add(b);
 root.updateMatrixWorld(true);const before=new T.Box3().setFromObject(root);
 const triangleCount=[a,b].reduce((n,m)=>n+m.geometry.index.count/3,0);
 const excluded=new T.Mesh(new T.BoxGeometry(.1,.1,.1),material);excluded.userData.noBatch=true;root.add(excluded);
 const transparent=new T.Mesh(new T.PlaneGeometry(1,1),new T.MeshBasicMaterial({transparent:true,opacity:.2}));root.add(transparent);
 primitives.batch(root);const meshes=[];root.traverse(o=>{if(o.isMesh&&o!==excluded&&o!==transparent)meshes.push(o)});
 assert(meshes.length===1,'different geometries sharing one material still issue separate calls');
 assert(meshes[0].geometry.index.count/3===triangleCount,'batch must retain every triangle');
 const after=new T.Box3().setFromObject(meshes[0]);assert(before.min.distanceTo(after.min)<1e-5&&before.max.distanceTo(after.max)<1e-5,'world transforms changed during batching');
 assert(excluded.parent===root&&transparent.parent===root,'animation and alpha layers must remain independently controlled');
});
test('03: walnut finish has restrained non-color grain relief',()=>{
 const m=textiles.craftMaterial(0x745343,'wood');
 assert(m.bumpMap,'wood is still flat printed color');assert(m.bumpMap!==m.map,'color grain is not a linear height map');
 assert(m.bumpScale>0&&m.bumpScale<=.03,'grain relief must remain miniature-scale');
 assert(m.bumpMap.colorSpace===T.NoColorSpace,'height data must not be sRGB');
});
test('04: fabric has a shared fine weave relief distinct from wood grain',()=>{
 const fabric=textiles.craftMaterial(0xa17f9e),other=textiles.craftMaterial(0x9bac99),wood=textiles.craftMaterial(0x745343,'wood');
 assert(fabric.bumpMap,'fabric remains flat');assert(fabric.bumpMap===other.bumpMap&&fabric.bumpMap!==wood.bumpMap,'thread pattern must be shared only with fabrics');
 assert(fabric.bumpScale>0&&fabric.bumpScale<.012,'thread relief overwhelms tiny clothing');
 const a=fabric.bumpMap.image.data,b=wood.bumpMap.image.data;assert(a.some((v,i)=>v!==b[i]),'cloth must not inherit directional wood grain');
});
test('05: tea cups use a nonmetallic porcelain glaze rather than chalky matte paint',()=>{
 const group=new T.Group();primitives.cup(group,0,0,0);const body=group.children.find(o=>Math.abs(o.scale.y-.13)<.0001);
 assert(body.material.isMeshPhysicalMaterial,'cup has no glaze layer');assert(body.material.clearcoat>.2,'porcelain needs restrained clearcoat');
 assert(body.material.metalness===0&&body.material.roughness>=.2&&body.material.roughness<.4,'cup should not look like metal or flat chalk');
});
test('06: lamps have open pleated shades with no solid top cap',()=>{
 const {shade}=primitives.lamp(new T.Group(),0,0,0);
 assert(shade.geometry.type==='LatheGeometry','solid capped cone still blocks the shade opening');
 const p=shade.geometry.attributes.position;let min=Infinity,max=0;
 for(let i=0;i<p.count;i++){const r=Math.hypot(p.getX(i),p.getZ(i));min=Math.min(min,r);max=Math.max(max,r)}
 assert(min>.17&&max<.39,'shade aperture or diameter is invalid');assert(shade.material.side===T.DoubleSide,'inner fabric must be visible');
});
test('07: all three miniature windows have independently articulated fabric curtains',()=>{
 const scene=new T.Group();createHouse(scene);const curtains=[];scene.traverse(o=>{if(o.name==='draped-curtain')curtains.push(o)});
 assert(curtains.length===6,'six draped curtain panels are not present');
 for(const c of curtains){const p=c.geometry.attributes.position;const zs=[];for(let i=0;i<p.count;i++)zs.push(p.getZ(i));assert(Math.max(...zs)-Math.min(...zs)>.03,'curtain has no folds');assert(c.userData.noBatch===true,'moving curtain cannot be baked into static walls')}
});
test('08: window valances have a scalloped edge without covering the pane',()=>{
 assert(typeof fabric.valance==='function','scalloped valances are missing');
 const g=new T.Group(),v=fabric.valance(g,0,0,0);v.geometry.computeBoundingBox();const size=v.geometry.boundingBox.getSize(new T.Vector3());
 assert(size.x>1.2&&size.x<1.7&&size.y<.3,'valance must stay above the playable window');
 assert(v.geometry.attributes.position.count>30,'curved hem is not modeled');
});
test('09: tea doilies retain real transparent lace holes and sit flat',()=>{
 assert(typeof fabric.doily==='function','lace doilies are missing');
 const d=fabric.doily(new T.Group(),0,.78,0,.65);const image=d.material.map.image;
 const data=image.getContext('2d').getImageData(0,0,image.width,image.height).data;
 let clear=0,ink=0;for(let i=3;i<data.length;i+=4){if(data[i]===0)clear++;if(data[i]>100)ink++}
 assert(clear>data.length/8&&ink>100,'lace should not be an opaque white disk');assert(d.rotation.x===-Math.PI/2&&!d.material.depthWrite,'lace must not cover the cup or write an opaque depth square');
});
test('10: carved roof eaves use a slim continuous cutout rather than beads',()=>{
 assert(typeof fabric.eaveScallop==='function','roof trim remains a row of beads');
 const e=fabric.eaveScallop(new T.Group(),0,0,0,0);e.geometry.computeBoundingBox();const size=e.geometry.boundingBox.getSize(new T.Vector3());
 assert(size.z<.075&&size.x>.16&&size.y<.27,'scallop must read as thin carved wood');assert(e.geometry.type==='ExtrudeGeometry','carved profile is missing');
});
