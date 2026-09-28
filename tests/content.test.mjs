import test from 'node:test';import assert from 'node:assert/strict';
import {strings} from '../src/i18n.js';import {ROOMS,DOLLS,CATALOG,SECRETS,ACTIONS} from '../src/content.js';
test('both languages cover the entire interface',()=>{assert.deepEqual(Object.keys(strings.ar).sort(),Object.keys(strings.en).sort());for(const [key,value] of Object.entries(strings.ar))assert.ok(value.length,key)});
test('all authored game content has names and descriptions in both languages',()=>{for(const locale of ['en','ar'])for(const id of [...ROOMS,...DOLLS,...CATALOG])assert.ok(strings[locale][id.id],id.id);for(const key of Object.keys(ACTIONS))assert.ok(strings.en[key+'Effect']);for(const id of SECRETS)for(const lang of ['en','ar'])assert.ok(strings[lang][id+'Text'])});
