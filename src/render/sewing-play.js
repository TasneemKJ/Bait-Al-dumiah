import * as T from 'three';
import {ROOMS,STITCH_TABLE} from '../content.js';
import {stitchStatus} from '../simulation.js';
import {mat,palette as P,texture,batch} from './primitives.js';

const silver=new T.MeshStandardMaterial({color:0xa9b6b5,metalness:.45,roughness:.32});
function mesh(parent,geometry,material,position=[0,0,0],name=''){
 const o=new T.Mesh(geometry,material);o.position.fromArray(position);o.name=name;o.castShadow=false;o.receiveShadow=true;parent.add(o);return o;
}
function group(parent,name){const o=new T.Group();o.name=name;o.userData.noBatch=true;parent.add(o);return o}
function box(parent,size,material,position,name=''){return mesh(parent,new T.BoxGeometry(...size),material,position,name)}
function torus(parent,r,tube,material,position,flat=false){const o=mesh(parent,new T.TorusGeometry(r,tube,4,24),material,position);if(flat)o.rotation.x=-Math.PI/2;return o}
function cylinder(parent,r,h,material,position,name=''){return mesh(parent,new T.CylinderGeometry(r,r,h,20),material,position,name)}
function emptyGeometry(){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute([],3));
g.setAttribute('normal',new T.Float32BufferAttribute([],3));g.setAttribute('uv',new T.Float32BufferAttribute([],2));return g}
// Small raised rectangular strands follow the exact supplied polyline. No
// curve smoothing, pointer prediction or coverage decisions live in the art.
function strandGeometry(points,scale,width,bottom,height){
 const positions=[],uvs=[];
 function triangle(a,b,c){for(const p of [a,b,c]){positions.push(...p);uvs.push(p[0],p[2])}}
 for(let i=1;i<points.length;i++){
  const a=points[i-1],b=points[i],dx=(b[0]-a[0])*scale,dz=(b[1]-a[1])*scale,len=Math.hypot(dx,dz);if(len<1e-8)continue;
  const nx=-dz/len*width/2,nz=dx/len*width/2,ax=a[0]*scale,az=a[1]*scale,bx=b[0]*scale,bz=b[1]*scale;
  const v=[[ax+nx,bottom,az+nz],[ax-nx,bottom,az-nz],[bx-nx,bottom,bz-nz],[bx+nx,bottom,bz+nz],[ax+nx,bottom+height,az+nz],[ax-nx,bottom+height,
    az-nz],[bx-nx,bottom+height,bz-nz],[bx+nx,bottom+height,bz+nz]];
  for(const [a,b,c,d] of [[4,7,6,5],[0,1,2,3],[0,4,5,1],[1,5,6,2],[2,6,7,3],[3,7,4,0]]){triangle(v[a],v[b],v[c]);triangle(v[a],v[c],v[d])}
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));
 g.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));g.computeVertexNormals();if(positions.length){g.computeBoundingBox();g.computeBoundingSphere()}return g;
}
function allPoints(sections){const result=[];for(const section of sections)for(const p of section){const last=result.at(-1);if(!last||last[0]!==p[0]||last[1]!==p[1])result.push(p)}return result}

export function createSewingPlay(parent){
 const table=STITCH_TABLE,room=ROOMS.find(r=>r.id===table.room),root=new T.Group();root.name='physical-sewing-table';root.visible=false;
 root.position.set(room.x+table.x,room.y+table.y,table.z);parent.add(root);
 const cream=new T.MeshStandardMaterial({color:P.cream,roughness:.86}),wood=mat(P.wood),brass=mat(P.gold);
 const linen=new T.MeshStandardMaterial({color:0xffffff,map:texture('fabric',['#f1e1c7','#dccbab']),roughness:1,side:T.DoubleSide});
 const threadMaterial=new T.MeshStandardMaterial({color:0xa74345,roughness:.60,side:T.DoubleSide});
 const guideMaterial=new T.MeshStandardMaterial({color:0x947989,roughness:1,side:T.DoubleSide});
 const staticArt=group(root,'stitch-static-workboard');
 box(staticArt,table.boardSize,cream,[0,-.041,0],'stitch-working-board');
 // These feet support the forward extension without hiding the old machine.
 const supportTop=-.071,supportBottom=.11-table.y,supportHeight=supportTop-supportBottom;
 for(const x of [-.55,.55])box(staticArt,[.04,supportHeight,.04],wood,[x,(supportTop+supportBottom)/2,.47],x<0?'stitch-front-support-left':'stitch-front-support-right');
 torus(staticArt,table.hoopRadius-.014,.014,wood,[0,-.004,0],true);
 box(staticArt,[.075,.025,.10],brass,[0,.006,-table.hoopRadius-.012],'stitch-hoop-clamp');
 cylinder(staticArt,.025,.037,brass,[0,.024,-table.hoopRadius-.012]);
 batch(staticArt);
 const cloth=mesh(root,new T.CircleGeometry(table.hoopRadius-.025,48),linen,[0,0,0],'stitch-working-cloth');cloth.rotation.x=-Math.PI/2;
 const mendPatch=mesh(root,new T.CircleGeometry(.20,24),new T.MeshStandardMaterial({color:0xc5a080,roughness:1,side:T.DoubleSide}),[0,.002,0],
   'stitch-bear-mending-patch');mendPatch.rotation.x=-Math.PI/2;mendPatch.scale.set(1.45,.70,1);
 const guide=mesh(root,emptyGeometry(),guideMaterial,[0,0,0],'stitch-contour-guide');
 const trail=mesh(root,emptyGeometry(),threadMaterial,[0,0,0],'stitch-accepted-thread');
 const guideBead=mesh(root,new T.SphereGeometry(.014,10,6),brass,[0,.021,0],'stitch-next-guide-point');
 const needle=group(root,'stitch-held-needle'),metal=group(needle,'stitch-needle-metal');
 const tip=mesh(metal,new T.ConeGeometry(.007,.027,8),silver,[0,.0135,0],'stitch-needle-tip');tip.rotation.z=Math.PI;
 cylinder(metal,.006,table.gripHeight-.027,silver,[0,(table.gripHeight+.027)/2,0],'stitch-needle-shaft');batch(metal);
 const grip=mesh(needle,new T.SphereGeometry(table.gripDiameter/2,20,12),brass,[0,table.gripHeight,0],'stitch-needle-grip');grip.userData.stitch='needle';
 const inlay=mesh(needle,new T.CircleGeometry(.055,16),cream,[0,table.gripHeight,table.gripDiameter/2+.003],'stitch-grip-cream-inlay');
 const tipAnchor=new T.Object3D();tipAnchor.name='stitch-tip-anchor';needle.add(tipAnchor);
 const spool=group(root,'stitch-repair-spool');spool.position.set(table.spoolOffset[0],table.spoolOffset[1],table.spoolOffset[2]);
 // A single closed surface avoids coplanar caps and touching decorative rings.
 // End flanges keep the full pick envelope; the red thread sits visibly inset.
 const radius=table.spoolDiameter/2,profile=[[0,-.13],[radius,-.13],[radius,-.114],[.153,-.106],[.142,-.098],[.142,.098],[.153,.106],[radius,.114],[radius,.13],[0,.13]];
 const reelGeometry=new T.LatheGeometry(profile.map(([r,y])=>new T.Vector2(r,y)),24).toNonIndexed(),reelColors=[];
 const reelPalette=[new T.Color(P.cream),new T.Color(P.wood),new T.Color(0xa74345)],reelPosition=reelGeometry.attributes.position;
 for(let i=0;i<reelPosition.count;i+=3){
  const y=(reelPosition.getY(i)+reelPosition.getY(i+1)+reelPosition.getY(i+2))/3,color=Math.abs(y)<.099?reelPalette[2]:Math.abs(y)<.113?reelPalette[1]:reelPalette[0];
  for(let j=0;j<3;j++)reelColors.push(color.r,color.g,color.b);
 }
 reelGeometry.setAttribute('color',new T.Float32BufferAttribute(reelColors,3));
 const reelMaterial=new T.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:.76});
 const spoolBody=mesh(spool,reelGeometry,reelMaterial,[0,.13,0],'stitch-repair-grip');spoolBody.userData.stitch='spool';
 const looseLoop=mesh(root,new T.TorusGeometry(.047,.006,4,24),threadMaterial,[0,.022,0],'stitch-loose-loop');looseLoop.rotation.x=-Math.PI/2;
 const finish=group(root,'stitch-finished-tableau');finish.position.set(table.finishOffset[0],table.finishOffset[1],table.finishOffset[2]);finish.visible=false;
 const finishCloth=mesh(finish,new T.PlaneGeometry(...table.finishSize),linen,[0,.003,0],'stitch-finished-cloth');finishCloth.rotation.x=-Math.PI/2;finishCloth.userData.stitch='cloth';
 const trim=group(finish,'stitch-finished-cloth-border');const [fw,fd]=table.finishSize;
 for(const x of [-fw/2+.009,fw/2-.009])box(trim,[.008,.003,fd-.014],brass,[x,.006,0]);
 for(const z of [-fd/2+.009,fd/2-.009])box(trim,[fw-.014,.003,.008],brass,[0,.006,z]);batch(trim);
 const finishedThread=mesh(finish,trail.geometry,threadMaterial,[0,.004,0],'stitch-finished-embroidery');finishedThread.scale.set(.43,1,.60);
 const targets=[grip,spoolBody,finishCloth];
 let patternKey=null,trailKey=null,actual={active:false,phase:null,patternId:null,needle:null,loose:false,section:0,completedSections:0,trail:[],nextGuidePoint:null,finishedClothVisible:false};
 function localPoint(o){root.updateWorldMatrix(true,true);return root.worldToLocal(o.getWorldPosition(new T.Vector3())).toArray()}
 return {root,targets,update(state){
  const stitch=stitchStatus(state);root.visible=Boolean(stitch);
  if(!stitch){actual={...actual,active:false,phase:null,patternId:null,needle:null,loose:false,trail:[],nextGuidePoint:null,finishedClothVisible:false};return}
  const key=JSON.stringify([stitch.patternId,stitch.sections]);
  if(key!==patternKey){const old=guide.geometry;guide.geometry=strandGeometry(allPoints(stitch.sections),table.clothScale,.010,.003,.002);old.dispose();patternKey=key}
  const nextTrailKey=JSON.stringify(stitch.acceptedTrail);
  if(nextTrailKey!==trailKey){const old=trail.geometry,newGeometry=strandGeometry(stitch.acceptedTrail,table.clothScale,.011,.008,.007);
  trail.geometry=newGeometry;finishedThread.geometry=newGeometry;old.dispose();trailKey=nextTrailKey}
  trail.visible=trail.geometry.attributes.position.count>0;finishedThread.visible=trail.visible;
  const lifted=stitch.pressed?0:.10;needle.position.set(stitch.needle.x*table.clothScale,lifted,stitch.needle.y*table.clothScale);
  mendPatch.visible=stitch.mode==='mend';threadMaterial.color.set(stitch.mode==='mend'?0xb44946:0xa74345);
  const complete=stitch.completedSections>=stitch.sections.length;
  finish.visible=complete||stitch.phase==='finished';looseLoop.visible=stitch.loose;looseLoop.position.set(needle.position.x+.030,.022,needle.position.z+.020);
  guideBead.visible=Boolean(stitch.nextGuidePoint)&&!complete;if(stitch.nextGuidePoint)guideBead.position.set(stitch.nextGuidePoint.x*table.clothScale,.021,stitch.nextGuidePoint.y*table.clothScale);
  actual={active:true,phase:stitch.phase,patternId:stitch.patternId,needle:{x:stitch.needle.x,y:stitch.needle.y,pressed:stitch.pressed,
    tip:localPoint(tipAnchor),grip:localPoint(grip)},loose:stitch.loose,section:stitch.section,completedSections:stitch.completedSections,
    trail:stitch.acceptedTrail.map(p=>[...p]),nextGuidePoint:stitch.nextGuidePoint?{...stitch.nextGuidePoint}:null,finishedClothVisible:finish.visible,
    board:{center:[0,-.041,0],size:[...table.boardSize]},spool:{center:localPoint(spoolBody),diameter:table.spoolDiameter},
    finish:{center:localPoint(finishCloth),size:[...table.finishSize],visible:finish.visible}};
 },points(){if(!root.visible)return [];root.updateWorldMatrix(true,true);
 const result=targets.filter(t=>{for(let o=t;o;o=o.parent)if(!o.visible)return false;
 return true}).map(t=>({key:t.userData.stitch,local:localPoint(t),world:t.getWorldPosition(new T.Vector3()).toArray()}));
 result.push({key:'tip',local:localPoint(tipAnchor),world:tipAnchor.getWorldPosition(new T.Vector3()).toArray()});return result},status(){return structuredClone(actual)}};
}
