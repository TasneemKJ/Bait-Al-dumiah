import test from 'node:test';
import assert from 'node:assert/strict';
import {strings} from '../src/i18n.js';
import {createState,place,useDecor} from '../src/simulation.js';
import {objectMarkup} from '../src/object-ui.js';
const button=(a,l,i,x='')=>`<button data-action="${a}" ${x}>${l}</button>`;
test('reactive keepsakes have complete English and Shami Arabic actions, status and feedback',()=>{const keys=['use-plant','use-lamp-on','use-lamp-off','use-musicbox','use-mobile','status-watered','status-lamp-on','status-lamp-off','status-tended','keepsake-watered','keepsake-lit','keepsake-dimmed','keepsake-wound','keepsake-rocked','alreadyTended','notInteractive'];for(const lang of ['en','ar'])for(const key of keys)assert.ok(strings[lang][key],`${lang}: ${key}`)});
test('owned interactive object sheet exposes its action and persistent text status',()=>{const s=createState();s.buttons=999;place(s,'lamp','kitchen',0);let html=objectMarkup(s,'decor:1',k=>k,n=>n,button);assert.match(html,/data-action="use-object"/);assert.match(html,/use-lamp-on/);assert.match(html,/status-lamp-off/);useDecor(s,1);html=objectMarkup(s,'decor:1',k=>k,n=>n,button);assert.match(html,/use-lamp-off/);assert.match(html,/status-lamp-on/)});
test('watered plant becomes a disabled completed action for the current day',()=>{const s=createState();s.buttons=999;place(s,'plant','kitchen',0);useDecor(s,1);const html=objectMarkup(s,'decor:1',k=>k,n=>n,button);assert.match(html,/status-watered/);assert.match(html,/data-action="use-object"[^>]*disabled/)});
