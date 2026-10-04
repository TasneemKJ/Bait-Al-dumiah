import test from 'node:test';
import assert from 'node:assert/strict';
import {INTERACTIVE_PROPS} from '../src/content.js';
import {strings} from '../src/i18n.js';
import {objectInfo,objectMarkup} from '../src/object-ui.js';
import {createState,place} from '../src/simulation.js';
test('all object actions and distinct ritual instructions exist in English and Arabic',()=>{
 const keys=['roomObjects','selectObject','selectedObject','objectGone','objectOrientation','rotateObject','moveObject','objectMoved','objectRotated','objectMoveNote','recallReady','showHint','hideHint','hiddenThread','studyFirst',...['tea','stitch','lullaby'].map(a=>'activityRule-'+a),...INTERACTIVE_PROPS.flatMap(p=>['object-'+p.id,'object-'+p.id+'Story'])];
 for(const lang of ['en','ar'])for(const k of keys)assert.ok(strings[lang][k],`${lang}: ${k}`);
});
test('object context exposes care/ritual and manipulation only for valid owned objects',()=>{
 const s=createState();assert.equal(objectInfo(s,'decor:999'),null);assert.equal(objectInfo(s,'prop:tea-set').activity,'tea');place(s,'plant','kitchen',0);
 const html=objectMarkup(s,'decor:1',k=>k,n=>n,(a,l)=>`<button data-action="${a}">${l}</button>`);assert.match(html,/rotate-object/);assert.match(html,/move-object/);assert.match(html,/pack-object/);
});
