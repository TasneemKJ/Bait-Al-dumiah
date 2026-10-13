import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createToaster} from '../src/hud-sync.js';
import {toastDOM} from './helpers/toast-dom.mjs';

const source=path=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8');

test('first render snaps to the saved day/night state before damping later transitions',()=>{
 const frame=source('src/render/world-frame.js'),world=source('src/render/world.js');
 assert.match(world,/lightingReady:false/);
 assert.match(frame,/if\(!st\.lightingReady\)\{st\.nightMix=Number\(night\);st\.lightingReady=true\}/);
});

test('renderer pixel density updates even when the quality tier stays the same',()=>{
 const frame=source('src/render/world-frame.js'),world=source('src/render/world.js');
 assert.match(world,/pixelRatio:0/);
 assert.match(frame,/st\.pixelRatio!==budget\.pixelRatio/);
 assert.match(frame,/renderer\.setPixelRatio\(budget\.pixelRatio\)/);
});

test('Home preview is deliberately paced instead of repainting every animation frame',()=>{
 const loop=source('src/app-loop.js');
 assert.match(loop,/HOME_FRAME_MS/);
 assert.match(loop,/now-lastHomePaint>=HOME_FRAME_MS/);
});

test('transient sheet notices stay with the sheet where they originated',t=>{
 t.mock.timers.enable({apis:['setTimeout']});
 const dom=toastDOM(),previousDocument=globalThis.document;globalThis.document=dom.document;
 let panel='settings';const toaster=createToaster(dom.host,()=>panel);
 t.after(()=>{toaster.dispose();globalThis.document=previousDocument});
 toaster.show('Saved from settings');
 assert.equal(dom.note.textContent,'Saved from settings');
 panel='household';dom.newSheet();toaster.refresh();
 assert.equal(dom.note.textContent,'','a transient from Settings must not appear in Household');
});

test('persistent save warnings remain global across sheet changes',t=>{
 t.mock.timers.enable({apis:['setTimeout']});
 const dom=toastDOM(),previousDocument=globalThis.document;globalThis.document=dom.document;
 let panel='settings';const toaster=createToaster(dom.host,()=>panel);
 t.after(()=>{toaster.dispose();globalThis.document=previousDocument});
 toaster.setWarning('Storage unavailable');
 panel='household';dom.newSheet();toaster.refresh();
 assert.equal(dom.note.textContent,'Storage unavailable');
 assert.equal(dom.note.dataset.saveWarning,'true');
});

test('Home has an authored night surface rather than daytime paper over a night house',()=>{
 const css=source('src/home.css');
 assert.match(css,/\.night #app\[data-screen="home"\]/);
 assert.match(css,/\.night #home \.home-title/);
 assert.match(css,/\.night #home \.home-notice/);
});
