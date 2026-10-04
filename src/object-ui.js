import {INTERACTIVE_PROPS,CATALOG} from './content.js';
import {icon} from './icons.js';
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
 const prop=INTERACTIVE_PROPS.find(p=>'prop:'+p.id===key);if(prop)return {...prop,prop:true,title:'object-'+prop.id,story:'object-'+prop.id+'Story'};
 const decor=s.decor.find(d=>'decor:'+d.id===key);if(decor){const c=CATALOG.find(c=>c.id===decor.item);return {...decor,prop:false,title:decor.item,story:decor.item+'Desc',icon:c.icon,price:c.price}}
 return null;
}
export function objectMarkup(s,key,t,n,button){
 const o=objectInfo(s,key);if(!o)return `<h2 id="sheet-title">${t('roomObjects')}</h2><p>${t('objectGone')}</p>`;
 const status=!o.prop&&statusLabel(s,o);
 return `<section class="object-detail"><div class="object-emblem">${icon(o.icon)}</div><p class="eyebrow">${t(o.room)} · ${t('selectedObject')}</p><h2 id="sheet-title">${t(o.title)}</h2><p class="sheet-intro">${t(o.story)}</p>${o.prop?`<div class="object-actions">${o.activity?button('begin-activity',t('activity-'+o.activity),'play',`data-id="${o.activity}" class="primary"`):''}${button('care',t(o.care)+' · '+t(o.resident),o.icon,`data-id="${o.resident}" data-care="${o.care}"`)}</div>`:`<p class="object-orientation">${t('objectOrientation')} ${n((o.rotation??0)*90)}°</p>${status?`<p class="object-tended" role="status">${icon('check')}<span>${t(status)}</span></p>`:''}${usable.has(o.item)?`<div class="object-actions object-use">${button('use-object',t(useLabel(o)),o.icon,`data-id="${o.id}" class="primary" ${o.item==='plant'&&o.tendedDay===s.day?'disabled':''}`)}</div>`:''}<div class="object-actions">${button('rotate-object',t('rotateObject'),'resume',`data-id="${o.id}"`)}${button('move-object',t('moveObject'),'home',`data-id="${o.id}" class="primary"`)}${button('pack-object',t('refund')+' +'+n(o.price),'button',`data-id="${o.id}"`)}</div><p class="sheet-intro">${t('objectMoveNote')}</p>`}</section>`;
}
