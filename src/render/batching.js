import * as T from 'three';

// Bake only opaque, static meshes in this local coordinate system. Animated
// subtrees and alpha layers keep their own transforms and draw ordering.
export function compactStatic(root){
 root.updateMatrixWorld(true);
 const inverse=root.matrixWorld.clone().invert(),groups=new Map();
 root.traverse(mesh=>{
  if(!mesh.isMesh||mesh.isInstancedMesh||mesh.isSkinnedMesh||Array.isArray(mesh.material))return;
  if(!mesh.visible||!mesh.material.visible||mesh.material.transparent||mesh.morphTargetInfluences)return;
  for(let node=mesh;node&&node!==root;node=node.parent)if(node.userData.noBatch||!node.visible)return;
  const g=mesh.geometry;
  if(!g.attributes.position||!g.attributes.normal||!g.attributes.uv||
    Object.keys(g.attributes).some(k=>!['position','normal','uv','color'].includes(k)))return;
  if(g.drawRange.start!==0||g.drawRange.count!==Infinity)return;
  const key=[mesh.material.uuid,mesh.castShadow,mesh.receiveShadow,mesh.renderOrder,
    Boolean(g.attributes.color)].join(':');
  if(!groups.has(key))groups.set(key,[]);groups.get(key).push(mesh);
 });
 for(const meshes of groups.values()){
  if(meshes.length<2)continue;
  const positions=[],normals=[],uvs=[],colors=[],indices=[],sourceParts=[];let offset=0;
  for(const mesh of meshes){
   const transform=inverse.clone().multiply(mesh.matrixWorld);
   const geometry=mesh.geometry.clone().applyMatrix4(transform);
   const p=geometry.attributes.position,n=geometry.attributes.normal,
     uv=geometry.attributes.uv,c=geometry.attributes.color;
   for(let i=0;i<p.count;i++){positions.push(p.getX(i),p.getY(i),p.getZ(i));
   normals.push(n.getX(i),n.getY(i),n.getZ(i));uvs.push(uv.getX(i),uv.getY(i));
   if(c)colors.push(c.getX(i),c.getY(i),c.getZ(i))}
   const count=geometry.index?.count??p.count,index=i=>(geometry.index?geometry.index.getX(i):i)+offset;
   const mirrored=transform.determinant()<0;
   for(let i=0;i<count;i+=3)indices.push(index(i),index(i+(mirrored?2:1)),index(i+(mirrored?1:2)));
   sourceParts.push({source:mesh,vertexStart:offset,vertexCount:p.count});offset+=p.count;
   geometry.dispose();mesh.removeFromParent();
  }
  const geometry=new T.BufferGeometry();
  geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));
  geometry.setAttribute('normal',new T.Float32BufferAttribute(normals,3));
  geometry.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));
  if(colors.length)geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));geometry.setIndex(indices);
  geometry.computeBoundingSphere();geometry.computeBoundingBox();
  const merged=new T.Mesh(geometry,meshes[0].material);
  merged.name='static-material-batch';merged.bakedParts=sourceParts;
  merged.castShadow=meshes[0].castShadow;merged.receiveShadow=meshes[0].receiveShadow;
  merged.renderOrder=meshes[0].renderOrder;
  root.add(merged);
 }
 return root;
}
