import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,readSave,restore,migrate,SAVE_VERSION,care} from '../src/simulation.js';
import {SAVE_KEY} from '../src/content.js';

test('save key and version stay at the released format',()=>{assert.equal(SAVE_KEY,'bait-al-dumiah.v1');assert.equal(SAVE_VERSION,1);assert.equal(createState().version,1)});
test('a played house round-trips through export text',()=>{
 const s=createState();s.buttons=77;s.day=4;care(s,'lina','tea');const text=JSON.stringify(s);
 const back=readSave(text);assert.equal(back.ok,true);assert.equal(back.state.buttons,s.buttons);assert.equal(back.state.day,4);assert.deepEqual(back.state.wishes,s.wishes);
});
test('empty storage is a normal fresh start, not a recovery',()=>{for(const raw of [null,''])assert.deepEqual({ok:readSave(raw).ok,empty:readSave(raw).empty},{ok:true,empty:true})});
test('corrupt, foreign or newer saves are refused so the caller keeps a backup',()=>{
 for(const raw of ['not json','null','[]','{}','{"version":0}','{"version":"1"}','42'])assert.equal(readSave(raw).ok,false,raw);
 assert.equal(readSave('{"version":2}').reason,'newer');assert.equal(readSave('{').reason,'corrupt');
 assert.deepEqual(restore('{"version":2}'),createState());
});
test('migrations upgrade step by step and reject gaps or bad steps',()=>{
 const steps={1:v=>({...v,version:2,added:true}),2:v=>({...v,version:3})};
 assert.deepEqual(migrate({version:1,a:1},steps,3),{version:3,a:1,added:true});
 assert.equal(migrate({version:1},{2:v=>v},3),null);
 assert.equal(migrate({version:1},{1:v=>({...v,version:5})},3),null);
 assert.equal(migrate({version:4},steps,3),null);
 const original={version:1,nested:{x:1}};migrate(original,{1:v=>{v.nested.x=9;return {...v,version:2}}},2);assert.equal(original.nested.x,1,'migration never mutates the stored object');
 assert.deepEqual(migrate({version:1,b:2}),{version:1,b:2});
});
test('save-file copy exists in both languages',async()=>{
 const {translate}=await import('../src/i18n.js');
 for(const key of ['saveFile','saveFileHelp','saveExport','saveImport','saveExported','saveExportFailed','saveImported','saveImportFailed','saveRecovered']){const en=translate('en',key),ar=translate('ar',key);assert.ok(en&&en!==key,key);assert.ok(/[؀-ۿ]/.test(ar),key)}
});
