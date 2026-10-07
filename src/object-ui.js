import {INTERACTIVE_PROPS,CATALOG} from './content.js';
import {icon} from './icons.js';
import {storyStatus} from './simulation.js';
const usable=new Set(['plant','lamp','musicbox','mobile']);
function useLabel(o){return o.item==='lamp'?`use-lamp-${o.active?'off':'on'}`:'use-'+o.item}
function statusLabel(s,o){
 if(o.item==='plant')return o.tendedDay===s.day?'status-watered':null;
 if(o.item==='lamp')return o.active?'status-lamp-on':'status-lamp-off';
 if(['musicbox','mobile'].includes(o.item)&&o.tendedDay===s.day)return 'status-tended';
 return null;
}
export function objectInfo(s,key){
 if(typeof key!=='string')return null;
 const prop=INTERACTIVE_PROPS.find(p=>'prop:'+p.id===key);
 if(prop){const story=storyStatus(s),earned=prop.id==='music-cabinet'&&story.index>=2||prop.id==='jasmine-window'&&(story.index>=3||story.index===2&&
   story.step>=2)||prop.id==='moon-bed'&&story.index>=1||prop.id==='doorstep'&&story.finished;
 return {...prop,prop:true,title:'object-'+prop.id+(earned&&prop.id==='music-cabinet'?'Restored':''),
   story:'object-'+prop.id+(earned?'RestoredStory':'Story')}};
 const decor=s.decor.find(d=>'decor:'+d.id===key);if(decor){const c=CATALOG.find(c=>c.id===decor.item);
 return {...decor,prop:false,title:decor.item,story:decor.item+'Desc',icon:c.icon,price:c.price}}
 return null;
}
// One source for the physical second-touch action and its accessible equivalent.
export function sceneObjectAction(s,key){
 const o=objectInfo(s,key);if(!o)return null;
 const story=storyStatus(s);
 if(o.prop&&story.next?.object===o.id)return {action:'story-interact',value:key,
   label:`story-${story.chapter.id}-${story.step}-action`,icon:story.next.icon};
 if(o.prop&&story.held)return {action:'story-interact',value:key,label:'storyUseHeld',item:story.held,icon:'arrow'};
 if(o.prop&&(o.id==='music-cabinet'&&story.index>=2||o.id==='moon-bed'&&story.index>=1||o.id==='doorstep'&&
   story.finished))return {action:'play-story-keepsake',value:key,label:'story-play-'+o.id,icon:o.icon};
 if(o.prop&&o.activity)return {action:'begin-activity',value:o.activity,label:'activity-'+o.activity,icon:'play'};
 if(o.prop&&o.care)return {action:'care',value:{id:o.resident,action:o.care},label:o.care,icon:o.icon};
 if(!o.prop&&usable.has(o.item))return {action:'use-object',value:o.id,label:useLabel(o),icon:o.icon,disabled:o.item==='plant'&&o.tendedDay===s.day};
 return {action:'inspect-object',value:key,label:'storyInspect',icon:'plus'};
}
export function objectMarkup(s,key,t,n,button){
 const o=objectInfo(s,key);if(!o)return `<h2 id="sheet-title">${t('roomObjects')}</h2><p>${t('objectGone')}</p>`;
 const status=!o.prop&&statusLabel(s,o),story=storyStatus(s);
 const storyAction=o.prop&&story.next?.object===o.id?button('story-interact',
   t(`story-${story.chapter.id}-${story.step}-action`),story.next.icon,`data-object="${key}" class="primary"`):'';
 const propActions=`<div class="object-actions">${storyAction}${o.activity?button('begin-activity',t('activity-'+o.activity),'play',
   `data-id="${o.activity}"`):''}${o.care?button('care',t(o.care)+' · '+t(o.resident),o.icon,
     `data-id="${o.resident}" data-care="${o.care}"`):''}</div>`;
 const decorActions=`<p class="object-orientation">${t('objectOrientation')} ${n((o.rotation??0)*90)}°</p>${status?
   `<p class="object-tended" role="status">${icon('check')}<span>${t(status)}</span></p>`:''}${usable.has(o.item)?
   `<div class="object-actions object-use">${button('use-object',t(useLabel(o)),o.icon,`data-id="${o.id}" class="primary" ${o.item==='plant'&&
   o.tendedDay===s.day?'disabled':''}`)}</div>`:''}<div class="object-actions">${button('rotate-object',t('rotateObject'),'resume',
   `data-id="${o.id}"`)}${button('move-object',t('moveObject'),'home',`data-id="${o.id}" class="primary"`)}${button('pack-object',
   t('refund')+' +'+n(o.price),'button',`data-id="${o.id}"`)}</div><p class="sheet-intro">${t('objectMoveNote')}</p>`;
 return `<section class="object-detail"><div class="object-emblem">${icon(o.icon)}</div><p
   class="eyebrow">${t(o.room)} · ${t('selectedObject')}</p><h2 id="sheet-title">${t(o.title)}</h2><p
     class="sheet-intro">${t(o.story)}</p>${o.prop?propActions:decorActions}</section>`;
}
