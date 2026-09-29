import * as T from 'three';
import * as dollsArt from '../src/render/dolls.js';
import {createState} from '../src/simulation.js';
const cases=[];
const test=(name,run)=>cases.push({name,run});
const assert=(condition,message)=>{if(!condition)throw new Error(message)};
export async function runArtChecks(){const results=[];for(const {name,run} of cases){try{await run();results.push({name,passed:true})}catch(error){results.push({name,passed:false,error:String(error.message)})}}return results;}
const residentFixture=()=>{const state=createState(),view=dollsArt.createDolls(new T.Group());return {state,view,doll:view.dolls[1]}};
test('21: sleepy resident rests their head and brings a hand closer without changing simulation',()=>{
 const {state,view,doll}=residentFixture();state.dolls[1].action='rest';state.settings.reducedMotion=true;const before=JSON.stringify(state);view.update(state,.1,'noor');
 assert(doll.head.rotation.x>.18&&Math.abs(doll.head.rotation.z)>.10,'rest pose still stands at attention');assert(doll.arms.some(a=>a.rotation.x<-.65),'resting hands remain hanging down');assert(doll.body.position.y>=0,'sleep pose sinks into the floor');assert(JSON.stringify(state)===before,'presentation changed the saved state');
});
test('22: walking articulates independent legs, with no gait when paused or motion is reduced',()=>{
 const {state,view,doll}=residentFixture();state.elapsed=3;view.update(state,.1,'noor');assert(doll.legs?.length===2,'legs are still part of one static body batch');
 assert(doll.legs[0].rotation.x*doll.legs[1].rotation.x<0,'walk cycle does not alternate the feet');const rotations=doll.legs.map(l=>l.rotation.x);state.paused=true;state.elapsed=20;view.update(state,.1,'noor');assert(doll.legs.every((l,i)=>l.rotation.x===rotations[i]),'paused gait moved');
 state.paused=false;state.settings.reducedMotion=true;view.update(state,.1,'noor');assert(doll.legs.every(l=>l.rotation.x===0),'reduced-motion gait must be still');
});
test('23: the selected resident looks gently toward the caretaker and paused poses stay fixed',()=>{
 const {state,view,doll}=residentFixture();state.elapsed=3;view.update(state,1,'noor',.24);assert(doll.head.rotation.y>.20&&doll.head.rotation.y<.28,'selected gaze ignores the caretaker angle');
 const before=[...doll.root.position,...doll.head.rotation.toArray(),...doll.body.position];state.paused=true;state.elapsed=100;view.update(state,1,'noor',-.24);const after=[...doll.root.position,...doll.head.rotation.toArray(),...doll.body.position];assert(JSON.stringify(before)===JSON.stringify(after),'pausing snaps the resident to a different pose');
});
test('24: blinks close smoothly, are staggered per resident and reject invalid time',()=>{
 assert(typeof dollsArt.blinkOpen==='function','blink timing is still a one-frame threshold');const blink=dollsArt.blinkOpen;assert(blink(4.525,0)>.2&&blink(4.525,0)<.8,'eyelids have no intermediate closure');assert(blink(4.57,0)<.15&&blink(4.57,1)>.9,'residents blink in synchrony');assert(blink(NaN,0)===1,'invalid time corrupts eyelids');for(let t=0;t<10;t+=.017)assert(blink(t,2)>=.1&&blink(t,2)<=1,'blink scale is out of bounds');
});
test('25: tea care reveals three curved steam wisps that respect reduced motion',()=>{
 const {state,view,doll}=residentFixture();state.dolls[1].action='tea';view.update(state,.1,'noor');const steam=doll.tea.getObjectByName('tea-steam');assert(steam&&steam.children.length===3,'held tea has no steam');assert(steam.children.every(o=>o.geometry.type==='TubeGeometry'&&o.material.opacity<.5),'steam should be soft curved wisps, not opaque particles');
 const up=new T.Vector3(0,1,0).applyQuaternion(doll.tea.getWorldQuaternion(new T.Quaternion()));assert(up.y>.97,'held cup and rising steam rotate sideways with the wrist');
 state.settings.reducedMotion=true;view.update(state,.1,'noor');const y=steam.children.map(o=>o.position.y);state.elapsed=10;view.update(state,.1,'noor');assert(steam.children.every((o,i)=>o.position.y===y[i]),'reduced-motion steam is moving');state.dolls[1].action='idle';view.update(state,.1,'noor');assert(!steam.visible,'steam remains after the cup is put away');
});
test('26: reassurance shows readable hearts instead of generic diamonds',()=>{
 const {state,view,doll}=residentFixture();state.dolls[1].action='soothe';view.update(state,.1,'noor');const hearts=doll.root.getObjectByName('comfort-hearts');assert(hearts?.visible&&hearts.children.length===3,'reassurance has no heart reaction');assert(hearts.children.every(o=>o.geometry.type==='ShapeGeometry'),'comfort is still represented by diamonds');assert(!doll.sparkles.visible,'two effect systems compete over the resident');state.dolls[1].action='idle';view.update(state,.1,'noor');assert(!hearts.visible,'hearts persist outside reassurance');
});
test('27: sleeping feedback is a small crescent that is hidden after the nap',()=>{
 const {state,view,doll}=residentFixture();state.dolls[1].action='rest';view.update(state,.1,'noor');const sleep=doll.root.getObjectByName('sleep-crescent');assert(sleep?.visible,'sleep feedback is missing');const moon=sleep.getObjectByName('sleep-moon');assert(moon?.geometry.type==='ExtrudeGeometry','sleep moon needs a real crescent profile');const size=new T.Box3().setFromObject(sleep).getSize(new T.Vector3());assert(size.x<.6&&size.y<.5,'sleep feedback obscures the room');state.dolls[1].action='idle';view.update(state,.1,'noor');assert(!sleep.visible,'sleeping crescent remains after rest');
});
test('28: the shy visitor responds to a greeting with a smile and still remains hidden by day',()=>{
 const ghost=dollsArt.createGhost(new T.Group());ghost.update(1,true,true,0);const smile=ghost.root.getObjectByName('visitor-smile');assert(smile&&!smile.visible,'visitor has no separate welcoming expression');ghost.update(2,true,true,1);assert(smile.visible&&ghost.root.userData.greeted,'visitor ignores discovered journal entries');ghost.update(3,false,true,1);assert(!ghost.root.visible,'visitor remains in daylight');
});
test('29: fireplace flames have warm layered silhouettes and pause without strobing',async()=>{
 const effects=await import('project/src/render/room-effects.js').catch(()=>({}));assert(typeof effects.createRoomEffects==='function','fireplace is still three white blobs');const parent=new T.Group(),view=effects.createRoomEffects(parent),state=createState();const flames=[];parent.traverse(o=>{if(o.name==='hearth-flame')flames.push(o)});assert(flames.length===3&&flames.every(f=>f.children.length===2),'each flame requires an amber outer shape and warm inner core');
 view.update(state,1);const outer=flames[0].children[0];assert(outer.material.color.r>outer.material.color.b*3,'fireplace outer flame is not warm');state.elapsed=2;view.update(state,1);const y=flames[0].scale.y;state.paused=true;state.elapsed=40;view.update(state,1);assert(flames[0].scale.y===y,'paused fire moved');assert(y>.85&&y<1.15,'flames flicker too strongly');
});
test('30: draped curtains move slowly, freeze on pause and become still with reduced motion',async()=>{
 const effects=await import('project/src/render/room-effects.js');const fabric=await import('project/src/render/fabric-shapes.js');const root=new T.Group(),curtain=fabric.drapedCurtain(root,0,1,0,1);const view=effects.createRoomEffects(root),state=createState();view.update(state,0);state.elapsed=4;view.update(state,0);assert(Math.abs(curtain.rotation.x)>.003,'fabric curtains never move');const x=curtain.rotation.x;state.paused=true;state.elapsed=20;view.update(state,0);assert(curtain.rotation.x===x,'curtain moves while paused');state.paused=false;state.settings.reducedMotion=true;view.update(state,0);assert(curtain.rotation.x===0&&curtain.rotation.z===0,'reduced-motion curtain must be still');
});
