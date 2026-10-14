import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import * as sim from '../src/simulation.js';
import {TRINKETS} from '../src/content-grove.js';
import {INTERACTIVE_PROPS} from '../src/content.js';
import {strings} from '../src/i18n.js';
import {objectMarkup} from '../src/object-ui.js';
import {todayMarkup} from '../src/grove-ui.js';
import {createTrinketGlint,glintLook,glintPosition} from '../src/render/trinket-glint.js';
import {textureCanvas} from './helpers/render-node.mjs';

const t=k=>strings.en[k]??k,button=(a,l,i,x='')=>`<button data-action="${a}" ${x}>${l}</button>`;
test('one trinket a day hides at a fixed prop; inspecting it there finds the next one, once',()=>{
 const s=sim.createState(),prop=sim.trinketProp(s),other=INTERACTIVE_PROPS.find(p=>p.id!==prop).id;
 assert.equal(sim.findTrinket(s,other).reason,'nothingHere');
 assert.match(objectMarkup(s,'prop:'+prop,t,String,button),/data-action="find-trinket"/);
 const r=sim.findTrinket(s,prop);assert.deepEqual(r,{ok:true,trinket:TRINKETS[0],count:1});
 assert.equal(sim.findTrinket(s,prop).reason,'foundToday');assert.doesNotMatch(objectMarkup(s,'prop:'+prop,t,String,button),/find-trinket/);
 sim.changeLight(s);sim.changeLight(s);assert.equal(sim.foundToday(s),true,'hurrying dawn finds nothing new');
 sim.changeLight(s);s.dayTime=999;sim.changeLight(s);assert.equal(sim.findTrinket(s,sim.trinketProp(s)).trinket,TRINKETS[1]);
});
test('finds restore whitelisted; Today hints the room; every trinket is named in both languages',()=>{
 const s=sim.createState();sim.findTrinket(s,sim.trinketProp(s));const raw=JSON.parse(JSON.stringify(s));
 raw.grove.trinkets.push('cursed-idol');raw.grove.findDay=1e9;const r=sim.restore(JSON.stringify(raw));
 assert.deepEqual(r.grove.trinkets,[TRINKETS[0]]);assert.equal(r.grove.findDay,1);
 const fresh=sim.createState();assert.match(todayMarkup(fresh,{t,n:String,button}),/find-note/);
 for(const id of TRINKETS){assert.ok(strings.en['trinket-'+id]);assert.match(strings.ar['trinket-'+id],/[؀-ۿ]/)}
});
test('the glint sits above today\'s prop, twinkles only with motion, and goes out once found',tc=>{
 textureCanvas(tc);const s=sim.createState(),parent=new T.Group(),glint=createTrinketGlint(parent);
 glint.update(s);assert.equal(glint.glint.visible,true);assert.deepEqual(glint.glint.position.toArray(),glintPosition(sim.trinketProp(s)));
 assert.deepEqual(glintLook(1,true),glintLook(9,true));assert.notDeepEqual(glintLook(.3,false),glintLook(.9,false));
 sim.findTrinket(s,sim.trinketProp(s));glint.update(s);assert.equal(glint.glint.visible,false);
});
