import * as T from 'three';
import {createState} from '../src/simulation.js';
import {lamp} from '../src/render/primitives.js';
const cases=[];
const test=(name,run)=>cases.push({name,run});
const assert=(condition,message)=>{if(!condition)throw new Error(message)};
async function view(){const module=await import('../src/render/story-props.js').catch(()=>({}));assert(typeof module.createStoryProps==='function','authored story prop renderer is missing');return module.createStoryProps(new T.Group())}
export async function runArtChecks(){const results=[];for(const {name,run} of cases){try{await run();results.push({name,passed:true})}catch(error){results.push({name,passed:false,error:String(error.message)})}}return results}
test('S1: authored story objects use actual pick-aligned room landmarks',async()=>{
 const v=await view();
 const points={'story-mint-tin':[-2.7,1.04,-1.04],'story-music-cabinet':[4.06,.13,.25],'story-jasmine-window':[1.5,1.03,-1.43],'story-doorstep':[2.6,.13,1.95]};
 for(const [name,position] of Object.entries(points)){const object=v.root.getObjectByName(name);assert(object?.isGroup,`${name} has no authored landmark`);assert(object.position.distanceTo(new T.Vector3(...position))<.00001,`${name} misses the permanent target`);assert(new T.Box3().setFromObject(object).getSize(new T.Vector3()).length()>.2,`${name} contains no visible geometry`)}
 assert(v.root.getObjectByName('story-basin-water'),'existing sink has no water counterpart');
});
test('S2: story earned outcomes survive state adaptation without gameplay mutations',async()=>{
 const v=await view(),state=createState();state.story={chapter:0,step:0,lastAction:null,lastActionAt:-10};v.update(state,0);assert(!v.status().tinOpen&&!v.status().bearVisible&&!v.status().cabinetOpen&&!v.status().guestVisible,'unearned story tableaux appeared');
 state.story.step=1;v.update(state,0);assert(v.status().tinOpen,'taking the thread did not visibly open the mint tin');
 state.story={chapter:1,step:2,lastAction:'prop:music-cabinet',lastActionAt:0};v.update(state,0);assert(v.status().bearVisible&&v.status().cabinetOpen&&!v.status().musicRepaired,'cabinet discovery or mended bear has no physical result');
 state.story={chapter:2,step:2,lastAction:'prop:jasmine-window',lastActionAt:0};v.update(state,1);assert(v.status().musicRepaired&&v.status().jasmineBloomed&&!v.status().guestVisible,'earned melody and jasmine did not persist');
 state.story={chapter:3,step:0,lastAction:'prop:doorstep',lastActionAt:0};const before=JSON.stringify(state);v.update(state,1);assert(v.status().guestVisible&&v.root.getObjectByName('story-guest-tea').visible,'guest cup and welcome lamp are missing');assert(JSON.stringify(state)===before,'visual adapter mutated the save');
});
test('S3: pause freezes mechanical poses and reduced motion keeps stable readable outcomes',async()=>{
 const v=await view(),state=createState();state.story={chapter:3,step:0,lastAction:'prop:doorstep',lastActionAt:0};state.elapsed=1;v.update(state,1);const mechanism=v.root.getObjectByName('story-music-cylinder'),angle=mechanism.rotation.x;state.paused=true;state.elapsed=80;v.update(state,1);assert(mechanism.rotation.x===angle,'paused music cylinder still turns');state.paused=false;state.settings.reducedMotion=true;v.update(state,1);const still=mechanism.rotation.x;state.elapsed=100;v.update(state,1);assert(mechanism.rotation.x===still&&v.status().guestVisible,'reduced motion hides earned scene or continues movement');
 state.settings.reducedMotion=false;state.story={chapter:0,step:1,lastAction:'prop:mint-tin',lastActionAt:0};state.elapsed=.8;v.update(state,0);const lid=v.root.getObjectByName('story-mint-tin-lid'),lidPose=lid.rotation.x;state.paused=true;state.elapsed=30;v.update(state,0);assert(lid.rotation.x===lidPose,'pausing removed the tin input pose');
});
test('S4: full story tableaux stay within local geometry and draw-call budgets',async()=>{
 const v=await view(),state=createState();state.story={chapter:3,step:0,lastAction:null,lastActionAt:-10};v.update(state,1);let triangles=0,calls=0,lights=0;v.root.traverse(o=>{if(o.isLight)lights++;if(!o.isMesh)return;for(let node=o;node;node=node.parent)if(!node.visible)return;triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;calls++;assert(!o.castShadow,'story art adds shadow-pass geometry')});assert(triangles<8000,`story tableaux add ${triangles} triangles`);assert(calls<20,`story tableaux add ${calls} mesh calls`);assert(lights===0,'story accents add new lights');
});
test('S5: cabinet door clears the saved right slot both shut and fully open',async()=>{
 const v=await view(),state=createState(),slot=new T.Box3(new T.Vector3(3.45,.13,.65),new T.Vector3(4.35,1.43,1.55));
 for(const chapter of [0,3]){state.story={chapter,step:0,lastAction:null,lastActionAt:-10};v.update(state,0);v.root.updateWorldMatrix(true,true);const bounds=new T.Box3().setFromObject(v.root.getObjectByName('story-music-cabinet-door'));assert(!bounds.intersectsBox(slot),`${chapter===0?'closed':'open'} cabinet door intersects the right keepsake slot`)}
});
test('S6: jasmine landmark clears the actual original parlor lampshade radius',async()=>{
 const v=await view(),center=v.root.getObjectByName('story-jasmine-window').position,lampView=lamp(new T.Group(),-1.67,0,-.83,1.65),p=lampView.shade.geometry.attributes.position;let radius=0;
 for(let i=0;i<p.count;i++)radius=Math.max(radius,Math.hypot(p.getX(i),p.getZ(i))*1.65);
 const lampX=2.4-1.67,lampZ=-.83,closestX=T.MathUtils.clamp(lampX,center.x-.31,center.x+.31),closestZ=T.MathUtils.clamp(lampZ,center.z-.18,center.z+.18);
 assert(Math.hypot(closestX-lampX,closestZ-lampZ)>radius,'jasmine branches and sill intersect the broad original lampshade');
});
test('S7: earned music and guest replay physically then settle with stable pause and reduced motion',async()=>{
 const v=await view(),state=createState();state.story={chapter:3,step:0,lastAction:'prop:music-cabinet',lastActionAt:0};state.elapsed=1;v.update(state,1);const cylinder=v.root.getObjectByName('story-music-cylinder'),playing=cylinder.rotation.x;assert(Math.abs(playing-.22)>.1,'replaying earned cabinet does not turn the cylinder');state.paused=true;state.elapsed=30;v.update(state,1);assert(cylinder.rotation.x===playing,'pause advances music replay');state.paused=false;state.elapsed=7;v.update(state,1);const settled=cylinder.rotation.x;state.elapsed=9;v.update(state,1);assert(settled===.22&&cylinder.rotation.x===settled,'music cabinet never settles after its short replay');state.story.lastActionAt=9;state.elapsed=10;v.update(state,1);assert(cylinder.rotation.x!==settled,'a later earned replay does not restart music');state.settings.reducedMotion=true;v.update(state,1);assert(cylinder.rotation.x===settled,'reduced motion does not use a stable music pose');
 state.settings.reducedMotion=false;state.story.lastAction='prop:doorstep';state.story.lastActionAt=10;state.elapsed=11;v.update(state,1);const guest=v.root.getObjectByName('story-shy-guest');assert(Math.abs(guest.rotation.z)>.06,'guest replay has no greeting tilt');state.elapsed=13;v.update(state,1);assert(Math.abs(guest.rotation.z)<=.028,'guest greeting never settles back to gentle idle');
});
test('S8: an initially paused restored view does not replay an expired basin input',async()=>{
 const v=await view(),state=createState();state.paused=true;state.elapsed=100;state.story={chapter:2,step:1,lastAction:'prop:wash-basin',lastActionAt:10};v.update(state,0);assert(!v.root.getObjectByName('story-basin-ripple').visible,'first paused update replays a long-expired wash ripple');
});
