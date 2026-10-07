import {strings} from '../src/i18n.js';
import * as T from 'three';
import {createDolls} from '../src/render/dolls.js';
import {createState} from '../src/simulation.js';
const cases=[];
const test=(name,run)=>cases.push({name,run});
const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const fixture=(id='lina')=>{const state=createState(),view=createDolls(new T.Group());return {state,view,doll:view.dolls.find(d=>d.id===id),resident:state.dolls.find(d=>d.id===id)}};
export async function runArtChecks(){const results=[];for(const {name,run} of cases){try{await run();results.push({name,passed:true})}catch(e){results.push({name,passed:false,error:e.message})}}return results}

test("D39: Rigid detail batching",()=>{
const {view,state,doll}=fixture();view.update(state,.1,'lina');let calls=0;for(const d of view.dolls)d.root.traverseVisible(o=>{if(o.isMesh&&o.material.visible)calls++});assert(calls<164,'rigid doll detail needs more than 163 visible mesh submissions');assert(doll.arms[0].hand.parent===doll.arms[0].forearm&&doll.legs[0].shin.parent===doll.legs[0],'batch flattened an animated joint');state.elapsed=2;view.update(state,.1,'lina',.3);assert(doll.eyes[0].iris.position.x>.001,'batch erased eye gaze');assert(doll.hairStyle.tails.every(t=>t.parent===doll.hairStyle.root),'batch lost separate braid pivots');
});

test("D31: Playful clapping",()=>{
const {view,state,doll,resident}=fixture('sami');resident.action='play';resident.lastCare=0;const distance=t=>{state.elapsed=t;view.update(state,.1,'sami');doll.root.updateMatrixWorld(true);return doll.arms[0].hand.getWorldPosition(new T.Vector3()).distanceTo(doll.arms[1].hand.getWorldPosition(new T.Vector3()))};const open=distance(0),closed=distance(.3125);assert(closed<.06&&open>closed+.055,'play hands do not close together for a clap');assert(doll.expression==='delighted','clap lacks a happy face');resident.action='idle';view.update(state,.1,'sami');assert(doll.arms.every(a=>Math.abs(a.rotation.y)<1e-8&&a.hand.quaternion.angleTo(new T.Quaternion())<1e-6),'clap leaves twisted wrists or shoulders after play');
});

test("D32: Selection greeting",()=>{
const {view,state,doll}=fixture();state.elapsed=1;view.update(state,.1,'noor');state.elapsed=1.1;view.update(state,.1,'lina');state.elapsed=1.5;view.update(state,.1,'lina');assert(doll.greeting===true,'newly selected resident never waves');assert(doll.arms[1].hand.position.y===-.129&&doll.arms[1].forearm.quaternion.angleTo(new T.Quaternion())>.2,'greeting does not articulate the arm');state.elapsed=4;view.update(state,.1,'lina');assert(!doll.greeting,'greeting loops after selection');state.elapsed=5;view.update(state,.1,'noor');state.settings.reducedMotion=true;state.elapsed=5.1;view.update(state,.1,'lina');assert(!doll.greeting,'reduced motion waves');
});

test("D33: Nighttime curiosity",()=>{
const {view,state,doll}=fixture();state.clock=150;state.elapsed=11;view.update(state,.1,null);assert(doll.curiosity>.05&&doll.curiosity<.17,'night brings no quiet curious glance');assert(Math.abs(doll.head.rotation.y)<.30,'night glance becomes a jump-scare turn');state.clock=20;view.update(state,.1,null);assert(doll.curiosity===0,'curious night glance leaks into daylight');state.clock=150;state.settings.reducedMotion=true;view.update(state,.1,null);assert(doll.curiosity===0,'night curiosity ignores reduced motion');
});

test("D34: Hair follow-through",()=>{
const {view,state,doll}=fixture();state.elapsed=2;view.update(state,.1,'lina',.3);state.elapsed=2.5;view.update(state,.1,'lina',-.3);assert(doll.hairStyle.tails.some(p=>Math.abs(p.rotation.x)+Math.abs(p.rotation.z)>.002),'braids remain rigid when the head turns');assert(doll.hairStyle.bows.some(p=>Math.abs(p.rotation.x)>.003),'ribbons have no follow-through');const pose=doll.hairStyle.tails[0].quaternion.clone();state.paused=true;state.elapsed=100;view.update(state,.1,'lina');assert(pose.angleTo(doll.hairStyle.tails[0].quaternion)<1e-6,'paused braids continue settling');state.paused=false;state.settings.reducedMotion=true;view.update(state,.1,'lina');assert(doll.hairStyle.tails.every(p=>p.rotation.x===0&&p.rotation.z===0),'still mode leaves displaced braids');
});

test("D35: Cloth follow-through",()=>{
const {view,state,doll}=fixture();assert(doll.skirt?.parent===doll.body&&doll.skirt.userData.noBatch,'skirt is still baked into the torso');state.elapsed=3;view.update(state,.1,'lina');assert(Math.abs(doll.skirt.rotation.z)>.001&&Math.abs(doll.skirt.rotation.z)<.05,'skirt has no restrained follow-through');assert(doll.garments.root.parent===doll.skirt,'apron does not follow its skirt');state.settings.reducedMotion=true;view.update(state,.1,'lina');assert(doll.skirt.rotation.z===0&&doll.skirt.rotation.x===0,'still skirt continues swaying');
});

test("D36: Matching resident portraits",()=>{
return import('project/src/render/doll-portraits.js').catch(()=>({})).then(m=>{assert(typeof m.createPortraitScene==='function','resident portraits do not reuse the game models');const {doll}=fixture();const before=doll.root.matrixWorld.clone(),portrait=m.createPortraitScene(doll);assert(portrait.scene.isScene&&portrait.camera.isOrthographicCamera,'portrait has no controlled studio framing');const head=portrait.model.getObjectByName('porcelain-head');assert(head&&head.geometry===doll.faceHull.geometry&&head.material===doll.faceHull.material,'portrait rebuilt substitute art instead of sharing the source');assert(doll.root.matrixWorld.equals(before),'portrait preparation moved the live resident');const canvas=document.createElement('canvas'),png=canvas.toDataURL('image/png'),html=m.portraitMarkup('lina',png);assert(html.includes('<img')&&html.includes(png),'UI portrait does not embed the captured model');assert(!m.portraitMarkup('lina','https://untrusted.test/image.png'),'portrait accepts external images');});
});

test("D37: Doll close-up control",()=>{
return import('project/src/ui.js').then(({createUI})=>{const wrap=document.createElement('div');wrap.innerHTML='<canvas id="world"></canvas><div id="resident-ui"></div>';document.body.append(wrap);if(!document.querySelector('meta[name="theme-color"]')){const meta=document.createElement('meta');meta.name='theme-color';document.head.append(meta)}const state=createState(),events=[],ui=createUI(wrap.lastElementChild,()=>state,(action,value)=>events.push({action,value}));try{ui.open('household','sami');let button=wrap.querySelector('[data-action="focus-doll"]');assert(button&&button.dataset.id==='sami','resident has no look-closer action');button.click();assert(events.some(e=>e.action==='focus-doll'&&e.value==='sami'),'portrait control loses the resident ID');const c=document.createElement('canvas'),png=c.toDataURL('image/png');ui.setPortraits({lina:png,noor:png,sami:png});assert(wrap.querySelectorAll('.has-portrait img').length===4,'actual-model portraits were not installed in the resident UI');state.settings.locale='ar';ui.refresh();button=wrap.querySelector('[data-action="focus-doll"]');assert(button.textContent.includes(strings.ar.lookCloser),'look-closer action is not translated');assert(wrap.querySelectorAll('.has-portrait img').length===4,'language refresh loses portraits')}finally{ui.close();ui.dispose();wrap.remove()}});
});

test("D38: Responsive portrait camera",()=>{
return import('project/src/render/doll-camera.js').catch(()=>({})).then(m=>{assert(typeof m.portraitFraming==='function','portrait camera still uses whole-house phone framing');for(const [w,h] of [[390,844],[844,390],[1440,1000],[320,568]]){const pose=m.portraitFraming(w,h,[2.4,3.58,.88]);assert(pose&&pose.target.every(Number.isFinite),'portrait camera contains invalid coordinates');const pixels=1.52/(pose.height/pose.zoom)*h;assert(pixels>h*.30&&pixels<h*.75,'doll is tiny or clipped in portrait framing');assert(pose.zoom<=3.5&&pose.target[1]>3.58,'camera zoom or elevated-room target is invalid')}assert(m.portraitFraming(390,844,[NaN,0,0])===null,'invalid resident position reaches camera');});
});

test("D40: Reusable portrait resources",()=>{
return import('project/src/render/doll-portraits.js').then(m=>{assert(typeof m.createPortraitCache==='function','portrait images are rendered again for every panel');const {view,doll}=fixture();let captures=0;const png=document.createElement('canvas').toDataURL('image/png'),cache=m.createPortraitCache(view,()=>{captures++;return png}),first=cache.getAll();for(let i=0;i<12;i++)assert(cache.getAll()===first,'portrait cache changes on repeated panel opens');assert(captures===3&&cache.size===3,'resident portraits allocate repeatedly');cache.dispose();assert(cache.size===0&&Object.keys(cache.getAll()).length===0&&captures===3,'disposed portrait provider regenerates resources');const previous=new T.WebGLRenderTarget(8,8);let active=previous,released=0;const fake={autoClear:false,shadowMap:{enabled:true},getRenderTarget:()=>active,getViewport:v=>v.set(1,2,3,4),getScissor:v=>v.set(5,6,7,8),getScissorTest:()=>true,getClearColor:c=>c.set(0x123456),getClearAlpha:()=>.4,setRenderTarget:t=>{active=t;if(t!==previous)t.addEventListener('dispose',()=>released++)},setViewport:()=>{},setScissor:()=>{},setScissorTest:()=>{},setClearColor:()=>{},render:()=>{throw Error('injected portrait fault')}};let failed=false;try{m.renderPortrait(fake,doll)}catch{failed=true}assert(failed&&released===1&&active===previous&&fake.autoClear===false&&fake.shadowMap.enabled,'portrait failure leaks its target or corrupts the live renderer');previous.dispose();});
});
