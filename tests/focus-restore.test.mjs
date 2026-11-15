import test from 'node:test';
import assert from 'node:assert/strict';
import {focusOrigin,restoreFocus} from '../src/hud-sync.js';

// Round 9 (story_check): since the bar went, closing a sheet left keyboard focus nowhere: the origin it mapped to
// (Tools, the Things toggle) no longer exists. Focus returns to the opener, or the nearest visible control.
function el(name,{connected=true,visible=true,inRibbon=false,panel=false}={}){
 return {name,isConnected:connected,getClientRects:()=>visible?[1]:[],focus(){focused.push(name)},
  matches:s=>panel&&s.includes('panel-'),closest:s=>inRibbon&&s.includes('object-ribbon')?{}:null};
}
let focused=[];
const ring=el('house key'),world=el('world');
const host={querySelector:s=>s.includes('key-ring')?ring:null};
globalThis.document={querySelector:s=>s==='#world'?world:null,activeElement:null};

test('a sheet opened from a ring key, or from the object ribbon, gives focus back to that very control',()=>{
 const key=el('fuse key',{panel:true});document.activeElement=key;focused=[];
 const origin=focusOrigin(host);assert.equal(origin,key);restoreFocus(host,origin,false);assert.deepEqual(focused,['fuse key']);
 const inspect=el('inspect',{inRibbon:true});document.activeElement=inspect;focused=[];
 restoreFocus(host,focusOrigin(host),false);assert.deepEqual(focused,['inspect']);
});
test('when the opener is gone or hidden, focus lands on the House key, or the house itself during a ritual',()=>{
 focused=[];restoreFocus(host,el('gone',{connected:false}),false);assert.deepEqual(focused,['house key']);
 focused=[];restoreFocus(host,el('hidden',{visible:false}),false);assert.deepEqual(focused,['house key']);
 focused=[];restoreFocus(host,null,true);assert.deepEqual(focused,['world']);
 focused=[];restoreFocus({querySelector:()=>null},null,false);assert.deepEqual(focused,['world'],'no ring: the house');
});
