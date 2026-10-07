import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,bondLevel} from '../src/simulation.js';
import {translate,number} from '../src/i18n.js';
import {icon} from '../src/icons.js';
import {DOLLS,CATALOG,MILESTONES,BASKET_MAX,ACTIONS} from '../src/content.js';
import {shellMarkup} from '../src/shell-markup.js';
import {householdMarkup,decorateMarkup,journalMarkup,settingsMarkup,placementMarkup,doorMarkup,wishKey} from '../src/panels-ui.js';

const button=(action,label,ico,extra='')=>`<button type="button" data-action="${action}" ${extra}>${ico?icon(ico):''}<span>${label}</span></button>`;
const view=(s)=>({t:key=>translate(s.settings.locale,key),n:value=>number(s.settings.locale,value),button});
const count=(text,pattern)=>(text.match(pattern)||[]).length;

test('the shell offers every sheet from the dock in both languages and never prints a missing value',()=>{
 for(const locale of ['en','ar']){
  const s=createState();s.settings.locale=locale;
  const html=shellMarkup(s,{...view(s),clueExpanded:false,toolsExpanded:false});
  for(const panel of ['household','activities','decorate','journal','settings'])assert.match(html,new RegExp(`data-action="panel-${panel}"`),`${locale} dock lacks ${panel}`);
  assert.match(html,/<dialog id="sheet"/);
  assert.match(html,new RegExp(view(s).t('title')));
  assert.doesNotMatch(html,/undefined|NaN|\[object/,`${locale} shell prints a missing value`);
 }
});

test('the shell reports whether the dock and the clue card are open',()=>{
 const s=createState(),v=view(s);
 const closed=shellMarkup(s,{...v,clueExpanded:false,toolsExpanded:false});
 const open=shellMarkup(s,{...v,clueExpanded:true,toolsExpanded:true});
 assert.match(closed,/class="dock" data-expanded="false"/);assert.match(open,/class="dock" data-expanded="true"/);
 assert.match(closed,/<aside class="objective" data-expanded="false"/);assert.match(open,/<aside class="objective" data-expanded="true"/);
 assert.match(closed,/<div id="objective-detail" hidden>/);assert.doesNotMatch(open,/<div id="objective-detail" hidden>/);
});

test('household shows every resident, marks only the selected one and offers each care action',()=>{
 const s=createState(),v=view(s),avatar=id=>`<i data-avatar="${id}"></i>`;
 const html=householdMarkup(s,{...v,avatar,selected:'sami'});
 for(const d of DOLLS)assert.match(html,new RegExp(`data-action="select"\\s+data-id="${d.id}"`));
 assert.equal(count(html,/aria-pressed="true"/g),1);
 assert.match(html,/data-id="sami"\s+class="selected"\s+aria-pressed="true"/);
 for(const key of Object.keys(ACTIONS))assert.match(html,new RegExp(`data-care="${key}"\\s+data-id="sami"`));
 assert.match(html,/data-field="doll-room"/);
});

test('household collects the basket only when it holds something',()=>{
 const s=createState(),v=view(s),avatar=()=>'';
 const empty=householdMarkup(s,{...v,avatar,selected:'lina'});
 assert.match(empty,/data-action="collect-basket"\s+disabled/);
 s.basket=3;
 const full=householdMarkup(s,{...v,avatar,selected:'lina'});
 assert.doesNotMatch(full,/data-action="collect-basket"\s+disabled/);
 assert.match(full,/\+3/);
});

test('a content resident with a full basket says so',()=>{
 const s=createState(),v=view(s),avatar=()=>'';
 s.basket=BASKET_MAX;
 for(const d of s.dolls){d.hunger=d.energy=d.comfort=100}
 const html=householdMarkup(s,{...v,avatar,selected:'lina'});
 assert.match(html,new RegExp(v.t('basketFull')));
 assert.match(html,/mood-note content/);
});

test('household memories unlock with closeness and wishes use their own copy key',()=>{
 const s=createState(),v=view(s),avatar=()=>'';
 s.dolls.find(d=>d.id==='lina').bond=100;
 const html=householdMarkup(s,{...v,avatar,selected:'lina'});
 assert.equal(bondLevel(100)>=3,true);
 for(const i of [1,2,3])assert.match(html,new RegExp(v.t('lina'+'Memory'+i).slice(0,20)));
 assert.equal(wishKey('lina','tea'),DOLLS.find(d=>d.id==='lina').wish==='tea'?'linaWish':'linaWish_tea');
});

test('the catalog disables what the buttons cannot buy and lists owned keepsakes with refunds',()=>{
 const s=createState(),v=view(s);
 s.buttons=0;
 const poor=decorateMarkup(s,v);
 assert.equal(count(poor,/data-action="choose-item"/g),CATALOG.length);
 assert.equal(count(poor,/class="catalog-item" disabled/g),CATALOG.length);
 assert.match(poor,new RegExp(v.t('emptyDecor')));
 s.buttons=9999;s.decor.push({id:1,item:CATALOG[0].id,room:'kitchen',slot:0});
 const rich=decorateMarkup(s,v);
 assert.equal(count(rich,/class="catalog-item" disabled/g),0);
 assert.match(rich,/data-action="remove"\s+data-id="1"/);
 assert.doesNotMatch(rich,new RegExp(v.t('emptyDecor')));
});

test('the journal counts secrets and offers a claim button only for earned milestones',()=>{
 const s=createState(),v=view(s);
 let html=journalMarkup(s,v);
 assert.match(html,new RegExp(v.t('noSecrets')));
 assert.equal(count(html,/data-action="claim"/g),0);
 s.achieved=[MILESTONES[0].id];
 html=journalMarkup(s,v);
 assert.equal(count(html,/data-action="claim"/g),1);
 assert.match(html,new RegExp(`data-id="${MILESTONES[0].id}"`));
 s.milestones=[MILESTONES[0].id];
 html=journalMarkup(s,v);
 assert.equal(count(html,/data-action="claim"/g),0);
 assert.match(html,/milestone claimed/);
});

test('the door shows its next mending step and no gifts while it stays shut',()=>{
 const s=createState(),v=view(s);
 const html=doorMarkup(s,v);
 assert.match(html,/data-action="mend-door"/);
 assert.doesNotMatch(html,/gift-grid/);
});

test('settings reflect the saved choices and ask before resetting',()=>{
 const s=createState(),v=view(s);
 s.settings.locale='ar';s.settings.reducedMotion=true;s.settings.quality='low';
 const html=settingsMarkup(s,{t:v.t,button,resetConfirm:false});
 assert.match(html,/<option\s+value="ar"\s+selected>/);
 assert.match(html,/data-field="motion" type="checkbox"\s+checked/);
 assert.match(html,/<option value="low" selected>/);
 assert.match(html,/data-action="reset-prompt"/);
 assert.doesNotMatch(html,/data-action="reset-yes"/);
 const confirm=settingsMarkup(s,{t:v.t,button,resetConfirm:true});
 assert.match(confirm,/data-action="reset-yes"/);assert.match(confirm,/data-action="reset-no"/);
 assert.doesNotMatch(confirm,/data-action="reset-prompt"/);
});

test('the placement bar names the keepsake, marks taken slots and says when it moves one',()=>{
 const s=createState(),v=view(s),item=CATALOG[0];
 s.decor.push({id:7,item:item.id,room:'kitchen',slot:1});
 const placing=placementMarkup(s,{...v,placement:item.id,moveId:null,room:'kitchen',slot:0});
 assert.match(placing,new RegExp(`${v.n(item.price)} ${v.t('buttons')}`));
 assert.match(placing,/<option value="0" selected\s*>/);
 assert.match(placing,/<option value="1"\s+disabled>/);
 const moving=placementMarkup(s,{...v,placement:item.id,moveId:7,room:'kitchen',slot:1});
 assert.match(moving,new RegExp(v.t('moveObject')));
 assert.doesNotMatch(moving,/<option value="1"\s+disabled>/);
});
