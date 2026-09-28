import * as T from 'three';
import {compactStatic} from './batching.js';
const coloredMaterials=new Map();
const coloredGeometry=new WeakMap();
// Plain matte colors can share a material through linear vertex colors. Mapped,
// glazed, metallic and translucent surfaces keep their authored material response.
function vertexColored(mesh){
 const m=mesh.material;
 if(!m?.isMeshStandardMaterial||m.isMeshPhysicalMaterial||m.map||m.bumpMap||m.normalMap||m.transparent||m.vertexColors||m.metalness||m.emissive.getHex()!==0)return;
 const key=[m.roughness,m.side,m.depthWrite].join(':');
 if(!coloredMaterials.has(key))coloredMaterials.set(key,new T.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:m.roughness,side:m.side,depthWrite:m.depthWrite}));
 let palette=coloredGeometry.get(mesh.geometry);if(!palette){palette=new Map();coloredGeometry.set(mesh.geometry,palette)}
 const shade=m.color.getHexString();let g=palette.get(shade);
 if(!g){g=mesh.geometry.clone();const count=g.attributes.position.count,colors=new Float32Array(count*3);for(let i=0;i<count;i++){colors[i*3]=m.color.r;colors[i*3+1]=m.color.g;colors[i*3+2]=m.color.b}g.setAttribute('color',new T.BufferAttribute(colors,3));palette.set(shade,g)}
 mesh.geometry=g;mesh.material=coloredMaterials.get(key);
}
export function batchDoll(doll){
 const pivots=[doll.body,doll.head,...doll.arms,...doll.legs,...doll.legs.map(l=>l.shin),...doll.arms.flatMap(a=>[a.forearm,a.hand]),...doll.eyes,...doll.hairStyle.tails,doll.tea,...doll.hairStyle.bows];
 for(const root of pivots)if(root)root.userData.noBatch=true;
 const groups=[];doll.body.traverse(o=>{if(o.isMesh&&!Array.isArray(o.material)&&o.material.visible&&!o.material.transparent){o.castShadow=true;o.receiveShadow=true;vertexColored(o)}if(o.isGroup)groups.push(o)});
 for(const root of groups.reverse())compactStatic(root);
 return doll;
}
// Inspect a semantic component after rigid compaction. Each retained source is
// backed by a checked range of the merged vertex buffer, not an extra draw object.
export function rigParts(root,name){
 const found=[];
 const visit=o=>{if(o.name===name)found.push(o);if(o.bakedParts)for(const part of o.bakedParts){if(part.vertexCount<1||part.vertexStart+part.vertexCount>o.geometry.attributes.position.count)throw Error('Invalid baked part range');visit(part.source)}};
 root.traverse(visit);return found;
}
