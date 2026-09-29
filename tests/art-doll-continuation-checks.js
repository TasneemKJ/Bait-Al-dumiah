import * as T from 'three';
import {createDolls} from '../src/render/dolls.js';
import {createState} from '../src/simulation.js';
const cases=[];
const test=(name,run)=>cases.push({name,run});
const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const fixture=(id='lina')=>{const state=createState(),view=createDolls(new T.Group());return {state,view,doll:view.dolls.find(d=>d.id===id),resident:state.dolls.find(d=>d.id===id)}};
const named=(root,name)=>{const a=[];root.traverse(o=>{if(o.name===name)a.push(o)});return a};
export async function runArtChecks(){const results=[];for(const {name,run} of cases){try{await run();results.push({name,passed:true})}catch(e){results.push({name,passed:false,error:e.message})}}return results}

test("D41: Cup-to-hand attachment",()=>{

const {state,view,doll,resident}=fixture();resident.action='tea';resident.lastCare=0;
for(const t of [.1,.45,1.3,2.6,3.8]){state.elapsed=t;view.update(state,.1,'lina');doll.root.updateMatrixWorld(true);const wrist=doll.tea.parent.getWorldPosition(new T.Vector3()),saucer=doll.tea.getWorldPosition(new T.Vector3()),offset=saucer.clone().sub(wrist);assert(offset.y<-.010&&offset.y>-.026,'saucer floats above wrist');assert(offset.z>.062&&offset.z<.083,'cup is not supported in front of hand');assert(offset.length()<.088,'cup has detached from the hand');const up=new T.Vector3(0,1,0).applyQuaternion(doll.tea.getWorldQuaternion(new T.Quaternion()));assert(up.y>.999,'tea cup is tilted')}
state.elapsed=1.3;view.update(state,.1,'lina');doll.root.updateMatrixWorld(true);const lip=doll.mouth.getWorldPosition(new T.Vector3()),cup=doll.tea.getWorldPosition(new T.Vector3());assert(cup.y+.13*.85<lip.y+.018,'cup rim intersects lips above the sip');assert(cup.z-.075*.85>lip.z-.09,'cup body is buried in the chin');

});

test("D42: Tea wrist alignment",()=>{

const {view,state,doll,resident}=fixture();resident.action='tea';resident.lastCare=0;state.elapsed=1.3;view.update(state,.1,'lina');doll.root.updateMatrixWorld(true);const normals=doll.arms.map(arm=>new T.Vector3(0,0,1).applyQuaternion(arm.hand.getWorldQuaternion(new T.Quaternion())));assert(normals[0].y>.98,'supporting palm faces away from the saucer');assert(normals[1].z>.85,'holding palm points away from the cup');const hand=doll.arms[0].hand.getWorldPosition(new T.Vector3()),cup=doll.tea.getWorldPosition(new T.Vector3());assert(hand.y<cup.y&&cup.y-hand.y<.024,'supporting hand sits above or far below the saucer');resident.action='idle';view.update(state,.1,'lina');assert(doll.arms.every(a=>a.hand.quaternion.angleTo(new T.Quaternion())<1e-6),'idle wrists keep the tea grip');

});

test("D43: Grounded idle shoes",()=>{

const {view,state,doll}=fixture();state.settings.reducedMotion=true;view.update(state,.1,'lina');doll.root.updateMatrixWorld(true);const body=doll.body.getWorldPosition(new T.Vector3());for(const leg of doll.legs){const foot=leg.foot;foot.updateMatrixWorld(true);const box=new T.Box3().setFromObject(foot);assert(Math.abs(box.min.y-body.y)<.004,'idle shoes hover above their grounding plane')}state.settings.reducedMotion=false;for(const t of [1,2,3]){state.elapsed=t;view.update(state,.1,'lina');assert(doll.body.position.y===0,'idle breath lifts both feet off the floor')}state.dolls[0].action='play';view.update(state,.1,'lina');assert(doll.body.position.y>0,'grounding removed the playful hop');

});

test("D44: Sculpted smile contours",()=>{

const {view,state,doll,resident}=fixture();const mouth=doll.mouth.children[0],positions=mouth.geometry.attributes.position,base=positions.array.slice(),other=view.dolls[1].mouth.children[0].geometry.attributes.position.array.slice();state.settings.reducedMotion=true;resident.action='play';view.update(state,.1,'lina');let lift=0,count=0;for(let i=0;i<positions.count;i++)if(Math.abs(base[i*3])>.025){lift+=positions.getY(i)-base[i*3+1];count++}assert(lift/count>.004&&lift/count<.013,'delight only stretches the mouth instead of lifting its corners');assert(view.dolls[1].mouth.children[0].geometry.attributes.position.array.every((v,i)=>v===other[i]),'Lina smile changes Noor mouth geometry');resident.action='idle';resident.comfort=10;view.update(state,.1,'lina');assert(doll.mouth.smileValue<0,'worried lip corners are not lowered');state.paused=true;const paused=positions.array.slice();state.elapsed=500;view.update(state,.1,'lina');assert(positions.array.every((v,i)=>v===paused[i]),'paused mouth keeps changing shape');

});

test("D45: Fitted spectacles",()=>{

const {doll}=fixture('sami');const glasses=doll.spectacles;assert(glasses?.temples?.length===2,'spectacles float without temple arms');for(const bar of glasses.temples){bar.geometry.computeBoundingBox();const b=bar.geometry.boundingBox;assert(b.max.z>.28&&b.min.z<.025,'glasses do not reach from the lenses to the ears');assert(Math.max(Math.abs(b.max.x),Math.abs(b.min.x))>.30,'glasses arms cut straight through the cheeks');assert(bar.geometry.attributes.position.count<250,'tiny glasses arm exceeds its geometry budget')}assert(!fixture().doll.spectacles,'Lina acquired Sami spectacles');

});

test("D46: Sculpted finger silhouettes",()=>{

return import('project/src/render/doll-rig-batch.js').then(({rigParts})=>{const {doll}=fixture();for(const arm of doll.arms){const fingers=rigParts(arm.hand,'porcelain-finger');assert(fingers.length===4,'hand silhouette has no separate fingertips');assert(new Set(fingers.map(f=>f.position.x)).size===4,'fingers are stacked at one point');const lengths=fingers.map(f=>{f.geometry.computeBoundingBox();return f.geometry.boundingBox.getSize(new T.Vector3()).y});assert(Math.max(...lengths)>Math.min(...lengths)+.004,'all fingers have identical lengths');assert(fingers.every(f=>f.geometry.attributes.position.count<250),'tiny fingers exceed their geometry budget')}let calls=0;doll.root.traverseVisible(o=>{if(o.isMesh&&o.material.visible)calls++});assert(calls<70,'adding fingers caused a new draw call per finger');});

});

test("D47: Fine sculpted hair grain",()=>{

const {doll}=fixture();const m=doll.hairStyle.cap.material;assert(m.bumpMap?.isCanvasTexture,'hair cap still has a uniform helmet surface');assert(m.bumpScale>.001&&m.bumpScale<.005,'strand relief is absent or exaggerated');const c=m.bumpMap.image.getContext('2d'),data=c.getImageData(0,0,256,256).data;let low=255,high=0;for(let i=0;i<data.length;i+=4){low=Math.min(low,data[i]);high=Math.max(high,data[i])}assert(high-low>35&&high-low<180,'sculpted hair grain has no restrained strand variation');const repeat=fixture().doll;assert(repeat.hairStyle.cap.material.bumpMap===m.bumpMap,'hair grain texture is rebuilt for each resident construction');

});

test("D48: Lace skirt edging",()=>{

const {doll}=fixture();const hem=doll.skirt.getObjectByName('openwork-cotton-hem');assert(hem?.geometry,'skirt still has a beaded hem');const g=hem.geometry;assert(g.attributes.position.count<500,'lace edging spends too many vertices');g.computeBoundingBox();const size=g.boundingBox.getSize(new T.Vector3());assert(size.y<.05&&size.x>.50&&size.x<.59,'lace is heavy or too small for the skirt');assert(hem.material.alphaTest>.1&&hem.material.map?.isCanvasTexture,'lace has no cut-out openwork');const c=hem.material.map.image.getContext('2d'),data=c.getImageData(0,0,128,64).data;let clear=0,thread=0;for(let i=3;i<data.length;i+=4){if(data[i]<20)clear++;if(data[i]>200)thread++}assert(clear>100&&thread>100,'lace is a solid ribbon or entirely transparent');assert(fixture('noor').doll.skirt.getObjectByName('openwork-cotton-hem').material===hem.material,'lace materials are not shared');

});

test("D49: Sewn Peter Pan collars",()=>{

return import('project/src/render/doll-rig-batch.js').then(({rigParts})=>{const {doll}=fixture();const lobes=rigParts(doll.body,'linen-collar-lobe');assert(lobes.length===2,'collar still uses seven separate beads');for(const lobe of lobes){lobe.geometry.computeBoundingBox();const size=lobe.geometry.boundingBox.getSize(new T.Vector3());assert(size.x>.07&&size.x<.14&&size.z>.005,'collar has no soft curved fabric contour');assert(lobe.material.bumpMap,'collar linen has no weave');assert(lobe.geometry.attributes.position.count<180,'collar is over-tessellated')}assert(rigParts(doll.body,'collar-topstitch').length===2,'collar edging has no fine sewn detail');});

});

test("D50: Care-first facial reactions",()=>{

const {view,state,doll,resident}=fixture();state.settings.reducedMotion=true;resident.energy=1;resident.comfort=1;resident.hunger=1;for(const [action,expression] of [['play','delighted'],['soothe','comforted'],['tea','content'],['rest','sleepy'],['idle','sleepy']]){resident.action=action;view.update(state,.1,'lina');assert(doll.expression===expression,'low energy hides the '+action+' reaction')}resident.energy=90;resident.action='idle';view.update(state,.1,'lina');assert(doll.expression==='worried','passive low needs no longer show on the face');

});

test("D51: Proportioned braid ties",()=>{

const {doll,state,view,resident}=fixture();for(const t of doll.hairStyle.tails){const bounds=new T.Box3().setFromObject(t),size=bounds.getSize(new T.Vector3());assert(size.z<.22&&size.y<.60,'braid tie stretches far outside its plait')}resident.action='tea';resident.lastCare=0;state.elapsed=1.3;view.update(state,.1,'lina');for(const t of doll.hairStyle.tails){const size=new T.Box3().setFromObject(t).getSize(new T.Vector3());assert(size.y<.64&&size.z<.30,'bow or tie stretches across the portrait in a sipping pose')}

});

test("D52: Single-pass stitched collars",()=>{

const {view}=fixture();for(const d of view.dolls){const collar=d.body.getObjectByName('sewn-peter-pan-collar');assert(collar,'sewn collar is missing');const visible=[];collar.traverseVisible(o=>{if(o.isMesh&&o.material.visible)visible.push(o)});assert(visible.length===1,'collar stitching adds another draw submission');const m=visible[0];assert(m.material.vertexColors&&m.material.bumpMap,'thread or fabric appearance was dropped');const c=m.geometry.attributes.color;assert(c,'stitch colors were not preserved in the combined surface');let low=1,high=0;for(let i=0;i<c.count;i++){low=Math.min(low,c.getX(i));high=Math.max(high,c.getX(i))}assert(high-low>.15,'stitches no longer contrast with the collar')}

});

test("D53: Readable portrait controls",()=>{

return Promise.all(['styles.css','accessibility.css','visual-upgrade.css','doll-portraits.css'].map(n=>import('project/styles/'+n+'.js'))).then(async modules=>{
 const styles=modules.map(m=>{const s=document.createElement('style');s.textContent=m.default;document.head.append(s);return s}),wrap=document.createElement('div'),oldClass=document.body.className;
 wrap.innerHTML='<div id="ui" data-focus-doll="noor"><div class="time-tools"><button>Let night fall</button><div class="clock">Day 2</div></div></div>';document.body.append(wrap);
 const rgb=s=>(s.match(/[\d.]+/g)||[]).map(Number),luminance=c=>c.slice(0,3).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
 try{for(const night of [false,true]){document.body.classList.toggle('night',night);const plate=getComputedStyle(wrap.querySelector('.time-tools')),button=getComputedStyle(wrap.querySelector('button')),background=rgb(plate.backgroundColor),foreground=rgb(button.color);assert(background.length>=3&&(background.length===3||background[3]>=.95),'portrait time control has no opaque backing');const a=luminance(background),b=luminance(foreground);assert((Math.max(a,b)+.05)/(Math.min(a,b)+.05)>=4.5,'portrait time action is unreadable against its backing')}}finally{document.body.className=oldClass;wrap.remove();styles.forEach(s=>s.remove())}
});

});
