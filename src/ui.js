import {shellMarkup} from './shell-markup.js';
import {nextStep} from './objective-ui.js';
import {householdMarkup,decorateMarkup,journalMarkup,settingsMarkup} from './panels-ui.js';
import {objectMarkup,objectInfo} from './object-ui.js';
import {portraitMarkup} from './resident-portraits.js';
import {activityMarkup,updateActivityStatus} from './activities-ui.js';
import {ROOMS,CATALOG} from './content.js';
import {translate,number} from './i18n.js';
import {daySweepDegrees,isNight,coziness,unclaimed,storyStatus} from './simulation.js';
import {icon} from './icons.js';
export function createUI(host,getState,dispatch){
 let panel=null,selected='lina',placement=null,placementRoom='kitchen',placementSlot=0,previousFocus=null,toastTimer,resetConfirm=false;
 let portraits={};
 const authoredMarkup=new WeakMap();
 // HTML serialization expands self-closing SVG tags; compare authored content.
 function setMarkup(node,markup){if(authoredMarkup.get(node)!==markup){node.innerHTML=markup;authoredMarkup.set(node,markup)}}
 let activityResult=null,selectedObject=null,moveId=null,toolsExpanded=false,clueExpanded=false,readClue='';
 const t=key=>translate(getState().settings.locale,key),n=value=>number(getState().settings.locale,value);
 const button=(action,label,ico,extra='')=>`<button type="button" data-action="${action}" ${extra}>${ico?icon(ico):''}<span>${label}</span></button>`;
 function avatar(id){const portrait=portraitMarkup(id,portraits[id]);if(portrait)return portrait;
 return `<span class="avatar ${id}" aria-hidden="true"><span class="hair"></span><span class="face"><i></i><i></i></span><span class="dress"></span></span>`}
 function build(){
  const s=getState();document.documentElement.lang=s.settings.locale;document.documentElement.dir=s.settings.locale==='ar'?'rtl':'ltr';
  document.title=t('title')+' · '+t('subtitle');document.querySelector('meta[name="theme-color"]').content=isNight(s)?'#302638':'#f1e7dd';
  document.body.classList.toggle('reduced-motion',s.settings.reducedMotion);document.body.classList.toggle('large-text',s.settings.largeText);
  document.querySelector('#world').setAttribute('aria-label',t('canvasLabel'));
  host.innerHTML=shellMarkup(s,{t,n,button,clueExpanded,toolsExpanded});
  const sheet=host.querySelector('#sheet');sheet.addEventListener('cancel',event=>{event.preventDefault();close()});
  sheet.addEventListener('click',event=>{if(event.target===sheet){const r=sheet.getBoundingClientRect();
  if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)close()}});
  if(panel){renderPanel();sheet.showModal()}renderPlacement();tick();
 }
 function open(name,id){if(placement){placement=null;moveId=null;renderPlacement();dispatch('placement-cancel')}panel=name;resetConfirm=false;if(id)selected=id;previousFocus=document.activeElement;
  if(previousFocus?.matches('[data-action^="panel-"]'))previousFocus=host.querySelector('[data-action="toggle-tools"]');
  if(previousFocus?.closest('.object-ribbon'))previousFocus=host.querySelector('[data-object-toggle]');
  toolsExpanded=false;host.querySelector('.dock').dataset.expanded='false';host.querySelector('[data-action="toggle-tools"]').setAttribute('aria-expanded','false');
  renderPanel();host.querySelector('#sheet').showModal();dispatch('panel-state',name);host.querySelector('#sheet [data-action="close"]').focus()}
 function close(){const sheet=host.querySelector('#sheet');sheet?.close();panel=null;renderedPanel=null;resetConfirm=false;
 dispatch('panel-state',null);
 const fallback=['tea','stitch','lullaby'].includes(getState().activities.active?.id)?
   document.querySelector('#world'):host.querySelector('[data-action="toggle-tools"]');
 const origin=previousFocus?.isConnected&&previousFocus.getClientRects().length?previousFocus:fallback;origin?.focus({preventScroll:true})}
 let renderedPanel=null;
 function renderPanel(){
  const s=getState(),root=host.querySelector('#sheet-content');if(!panel)return;
  // Re-rendering the same sheet keeps its latest notice, so a collected reward stays visible.
  const notice=renderedPanel===panel?root.querySelector('.panel-notice')?.textContent:null;renderedPanel=panel;
  if(panel==='object')root.innerHTML=objectMarkup(s,selectedObject,t,n,button);
  if(panel==='activities')root.innerHTML=activityMarkup(s,t,n,button,activityResult);
  if(panel==='household')root.innerHTML=householdMarkup(s,{t,n,button,avatar,selected});
  if(panel==='decorate')root.innerHTML=decorateMarkup(s,{t,n,button});
  if(panel==='journal')root.innerHTML=journalMarkup(s,{t,n,button});
  if(panel==='settings')root.innerHTML=settingsMarkup(s,{t,button,resetConfirm});
  if(notice){const note=document.createElement('p');note.className='panel-notice';note.setAttribute('role','status');note.textContent=notice;root.prepend(note)}
 }
 function renderPlacement(){const root=host.querySelector('.placement');if(!root)return;root.hidden=!placement;if(!placement)return;
 const entry=CATALOG.find(c=>c.id===placement);
 root.innerHTML=`<div class="placement-head">${icon(entry.icon)}<div><strong>${t(placement)} · ${moveId!==null?
   t('moveObject'):n(entry.price)+' '+t('buttons')}</strong><p>${t('placeHint')}</p></div>${button('placement-cancel',t('cancel'),'close',
   'class="icon-button"')}</div><div class="placement-fields"><label class="sr-only" for="place-room">${t('room')}</label><select id="place-room"
   data-field="place-room">${ROOMS.map(r=>`<option value="${r.id}" ${r.id===placementRoom?
   'selected':''}>${t(r.id)}</option>`).join('')}</select><label class="sr-only" for="place-slot">${t('placeTitle')}</label><select id="place-slot"
   data-field="place-slot">${['leftSpot','middleSpot','rightSpot'].map((v,i)=>`<option value="${i}" ${placementSlot===i?
   'selected':''} ${getState().decor.some(d=>d.id!==moveId&&d.room===placementRoom&&d.slot===i)?
   'disabled':''}>${t(v)}</option>`).join('')}</select>${button('place-confirm',t('placeConfirm'),'plus','class="primary"')}</div>`}
 function previewPlacement(){dispatch('placement-preview',{item:placement,room:placementRoom,slot:placementSlot,moveId})}
 function chooseItem(id){close();moveId=null;placement=id;placementRoom='kitchen';placementSlot=0;dispatch('placement',id);previewPlacement();
 renderPlacement();host.querySelector('#place-room').focus()}
 function clearPlacement(){placement=null;moveId=null;renderPlacement()}
 function beginMove(id){const d=getState().decor.find(d=>d.id===id);if(!d)return false;close();placement=d.item;moveId=id;placementRoom=d.room;
 placementSlot=d.slot;dispatch('placement',d.item);previewPlacement();renderPlacement();host.querySelector('#place-room').focus();return true}
 function tick(){
  const s=getState();document.body.classList.toggle('night',isNight(s));
  if(panel==='activities')updateActivityStatus(host,s,t,n);
  host.style.setProperty('--day-progress',daySweepDegrees(s)+'deg');
  const story=storyStatus(s),values={buttons:n(s.buttons),cozy:n(coziness(s))+'%',wishes:story.finished?
    `${n(s.wishes.length)} / ${n(3)}`:`${n(story.index+1)} / ${n(3)}`,day:t('day')+' '+n(s.day),time:t(isNight(s)?'evening':'morning')};
  const heading=host.querySelector('[data-story-heading]'),headingText=t(story.finished?'objectiveLabel':'story-'+story.chapter.id+'-title');
  if(heading&&heading.textContent!==headingText)heading.textContent=headingText;
  for(const [key,value] of Object.entries(values)){const el=host.querySelector(`[data-value="${key}"]`);if(el&&el.textContent!==value)el.textContent=value}
  const {copy,label,ico,arrived}=nextStep(getState(),t,n,host.dataset.focusRoom);host.querySelector('.objective').dataset.arrived=String(Boolean(arrived));
  const objective=host.querySelector('#objective-copy');if(objective.textContent!==copy)objective.textContent=copy;setClue(clueExpanded);
  const action=host.querySelector('#objective-action');const content=icon(ico)+`<span>${label}</span>`+icon('arrow');setMarkup(action,content);
  const light=host.querySelector('#light-button'),lightHtml=icon(isNight(s)?'sun':'moon')+`<span>${t(isNight(s)?'dawn':'night')}</span>`;setMarkup(light,lightHtml);
  host.querySelector('.visitor-hint').hidden=!isNight(s)||s.lastSecretDay===s.day||s.journal.length===6||Boolean(placement);
  host.querySelector('.dock [data-action="panel-household"]')?.classList.toggle('has-news',s.basket>0);
  host.querySelector('.dock [data-action="panel-journal"]')?.classList.toggle('has-news',unclaimed(s).length>0);
  host.querySelector('.pause-overlay').hidden=!s.paused||Boolean(panel);
  const pauseButton=host.querySelector('.dock [data-action="pause"]'),pauseLabel=t(s.paused?'resume':'pause');
  if(pauseButton.getAttribute('aria-pressed')!==String(s.paused)||pauseButton.title!==pauseLabel){
   pauseButton.setAttribute('aria-pressed',String(s.paused));pauseButton.title=pauseLabel;
   pauseButton.innerHTML=icon(s.paused?'resume':'pause')+`<span>${pauseLabel}</span>`;
  }

  for(const el of host.querySelectorAll('[data-need]')){const d=s.dolls.find(v=>v.id===selected);if(d){el.value=d[el.dataset.need];
  host.querySelector(`[data-need-text="${el.dataset.need}"]`).textContent=n(d[el.dataset.need])}}
 }
 function toast(message){if(panel){let note=host.querySelector('.panel-notice');if(!note){note=document.createElement('p');
 note.className='panel-notice';note.setAttribute('role','status');
 host.querySelector('#sheet-content').prepend(note)}note.textContent=message}const el=host.querySelector('#toast');clearTimeout(toastTimer);
 el.textContent=message;el.classList.add('visible');toastTimer=setTimeout(()=>el.classList.remove('visible'),4500)}
 function refresh(){const wasPanel=panel;if(wasPanel){host.querySelector('#sheet')?.close()}build()}
 function setTools(expanded){toolsExpanded=expanded;host.querySelector('.dock').dataset.expanded=String(expanded);
 host.querySelector('[data-action="toggle-tools"]').setAttribute('aria-expanded',String(expanded));dispatch('tools-state',expanded)}
 // Phone portrait shows the clue as a compact chip; the copy opens on demand and a dot marks an unread clue.
 function setClue(expanded){const aside=host.querySelector('.objective'),copy=host.querySelector('#objective-copy')?.textContent??'';if(!aside)return;
 clueExpanded=expanded;if(expanded)readClue=copy;const value=String(expanded),unread=String(copy!==readClue);
 if(aside.dataset.expanded!==value)aside.dataset.expanded=value;if(aside.dataset.unread!==unread)aside.dataset.unread=unread;
 host.querySelector('#objective-detail').hidden=!expanded;const toggle=aside.querySelector('.clue-toggle');
 if(toggle&&toggle.getAttribute('aria-expanded')!==value)toggle.setAttribute('aria-expanded',value);toggle?.setAttribute('aria-label',t(expanded?'storyFoldClue':'storyReadClue'))}
 const click=event=>{
  const target=event.target.closest('[data-action]');if(!target||target.disabled)return;const action=target.dataset.action;
  if(action==='toggle-tools'){setTools(!toolsExpanded);return}
  if(action==='toggle-clue'){setClue(!clueExpanded);return}
  if(action==='objective')setClue(false);
  if(action==='story-interact'){dispatch(action,target.dataset.object);return}
  if(action.startsWith('panel-'))return open(action.slice(6));
  if(action==='close')return close();
  if(action==='select'){selected=target.dataset.id;dispatch('select',selected);renderPanel();host.querySelector(`[data-action="select"][data-id="${selected}"]`)?.focus();return}
  if(action==='choose-item')return chooseItem(target.dataset.id);
  if(action==='placement-cancel'){clearPlacement();dispatch(action);return}
  if(action==='place-confirm'){dispatch(moveId!==null?'relocate-object':'place',{id:moveId,item:placement,room:placementRoom,slot:placementSlot});return}
  if(action==='focus-doll'){dispatch(action,target.dataset.id);return}
  if(action==='begin-activity'||action==='restore-room'){dispatch(action,target.dataset.id);return}
  if(action==='activity-input'){dispatch(action,Number(target.dataset.choice));return}
  if(['use-object','rotate-object','move-object','pack-object'].includes(action)){dispatch(action,Number(target.dataset.id));return}
  if(['recall-ready','activity-hint'].includes(action)){dispatch(action);return}
  if(action==='end-activity'){dispatch(action);return}
  if(action==='care'){dispatch('care',{id:target.dataset.id,action:target.dataset.care});return}
  if(action==='remove'){dispatch('remove',Number(target.dataset.id));renderPanel();return}
  if(action==='claim'||action==='collect-basket'||action==='mend-door'||action==='gift'){dispatch(action,target.dataset.id);if(panel)renderPanel();return}
  if(action==='reset-prompt'||action==='reset-no'){resetConfirm=action==='reset-prompt';renderPanel();return}
  dispatch(action);
 };
 const change=event=>{const el=event.target;if(!el.dataset.field)return;
  if(el.dataset.field==='place-room'){placementRoom=el.value;
  placementSlot=[0,1,2].find(i=>!getState().decor.some(d=>d.id!==moveId&&d.room===placementRoom&&d.slot===i))??0;previewPlacement();renderPlacement();host.querySelector('#place-room').focus();return}
  if(el.dataset.field==='place-slot'){placementSlot=Number(el.value);previewPlacement();return}
  if(el.dataset.field==='doll-room'){dispatch('move',{id:el.dataset.id,room:el.value});return}
  if(el.dataset.field==='save-import'){const file=el.files?.[0];el.value='';if(file)dispatch('save-import',file);return}
  dispatch('setting',{key:el.dataset.field,value:el.type==='checkbox'?el.checked:el.value});
 };
 host.addEventListener('click',click);host.addEventListener('change',change);build();
 return {collapseTools(){if(toolsExpanded)setTools(false)},openObject(key){if(!objectInfo(getState(),key))return false;selectedObject=key;
 open('object');return true},clearObject(){selectedObject=null},beginMove,get moveId(){return moveId},open,close,refresh,tick,toast,
   objective:()=>nextStep(getState(),t,n,host.dataset.focusRoom),clearPlacement,setActivityResult(result){activityResult=result;
 const choice=host.querySelector('#sheet [data-choice]:focus')?.dataset.choice;renderPanel();
 host.querySelector(result?.complete?'.ritual-result button':choice!==undefined?
   `#sheet [data-choice="${choice}"]`:'#sheet [data-action="recall-ready"], #sheet [data-choice], #sheet [data-action="begin-activity"]')?.focus()},
   setPortraits(values){portraits=values??{};
 if(panel==='household')renderPanel()},get selected(){return selected},get panel(){return panel},get placement(){return placement},get t(){return t},
   get n(){return n},dispose(){clearTimeout(toastTimer);host.removeEventListener('click',click);host.removeEventListener('change',change)}};
}
