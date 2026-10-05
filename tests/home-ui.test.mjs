import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createState} from '../src/simulation.js';
import {strings} from '../src/i18n.js';
import {homeDOM} from './helpers/home-dom.mjs';
let createHomeUI;try{({createHomeUI}=await import('../src/home-ui.js'))}catch(error){if(error.code!=='ERR_MODULE_NOT_FOUND')throw error}
function setup(canContinue=false){assert.equal(typeof createHomeUI,'function','Home must be a distinct accessible surface');const dom=homeDOM(),state=createState(),actions=[];const ui=createHomeUI(dom.root,()=>state,(...args)=>actions.push(args),{canContinue,loadStatus:'new'});return {...dom,state,actions,ui}}
const buttons=root=>root.all().filter(n=>n.tagName==='BUTTON'&&n.visible);
const find=(root,action)=>root.all().find(n=>n.getAttribute('data-home-action')===action);
test('Home exposes only one Play/Continue and Preferences with no gameplay menu',()=>{
 for(const returning of [false,true]){const {root,ui}=setup(returning);ui.ready();const controls=buttons(root);assert.deepEqual(controls.map(n=>n.getAttribute('data-home-action')),['play','preferences']);assert.equal(controls[0].textContent,returning?'Continue':'Play');}
});
test('a single real button event requests entry and no initial event starts gameplay',()=>{
 const {root,actions,ui}=setup();assert.deepEqual(actions,[]);find(root,'play').click();assert.deepEqual(actions,[]);ui.ready();find(root,'play').click();assert.deepEqual(actions,[['home-play']]);
});
test('Preferences is flat, names each action and Back restores focus',()=>{
 const {root,document,ui}=setup();ui.ready();find(root,'preferences').click();assert.deepEqual(buttons(root).map(n=>n.getAttribute('data-home-action')),['sound','language','back']);assert.equal(document.activeElement,find(root,'sound'));find(root,'back').click();assert.equal(buttons(root).length,2);assert.equal(document.activeElement,find(root,'preferences'));
});
test('preference changes preserve nodes, dispatch explicit language and use bilingual visible copy',()=>{
 const {root,state,actions,ui}=setup();ui.ready();find(root,'preferences').click();const sound=find(root,'sound'),language=find(root,'language');language.click();assert.deepEqual(actions,[['home-language','ar']]);state.settings.locale='ar';state.settings.muted=false;ui.refresh();assert.equal(find(root,'sound'),sound);assert.match(sound.textContent,/[؀-ۿ]/);assert.equal(language.textContent,'English');language.click();assert.deepEqual(actions.at(-1),['home-language','en']);sound.click();assert.deepEqual(actions.at(-1),['home-sound']);
});
test('Escape leaves flat Preferences and hidden Home is inert',()=>{
 const {root,ui}=setup();ui.ready();find(root,'preferences').click();let prevented=false;root.listeners.keydown({key:'Escape',preventDefault(){prevented=true}});assert.equal(prevented,true);assert.equal(buttons(root).length,2);ui.hide();assert.equal(root.hidden,true);assert.equal(root.inert,true);
});
test('essential save-read failure is non-interactive and translated',()=>{
 for(const key of ['homePlay','homeContinue','homePreferences','homeBack','homeSoundOn','homeSoundOff','homeReadFailed','homeInvalidSave'])for(const locale of ['en','ar']){assert.ok(strings[locale][key]?.trim(),locale+key);if(locale==='ar')assert.match(strings[locale][key],/[؀-ۿ]/)}
});
test('Home CSS reserves its own native scene stage with touch, small-phone, landscape and safe-area rules',()=>{
 const path=new URL('../src/home.css',import.meta.url);assert.ok(existsSync(path),'Home needs its own presentation layout');const css=readFileSync(path,'utf8');assert.match(css,/safe-area-inset/);assert.match(css,/min-height:44px/);assert.match(css,/orientation:landscape/);assert.match(css,/\[data-screen="home"\] #world/);assert.match(css,/#home\[hidden\]/);
});
