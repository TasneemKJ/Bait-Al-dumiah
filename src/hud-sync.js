import {nextStep} from './objective-ui.js';
import {daySweepDegrees} from './readouts.js';
import {isNight,coziness,unclaimed,storyStatus,hasBasket,visitorWaiting} from './simulation.js';
import {updateActivityStatus} from './activities-ui.js';
import {icon} from './icons.js';

// HTML serialization expands self-closing SVG tags; compare authored content.
const authoredMarkup=new WeakMap();
function setMarkup(node,
  markup){if(authoredMarkup.get(node)!==markup){node.innerHTML=markup;authoredMarkup.set(node,markup)}}

// Language, direction, title, theme colour and accessibility classes follow the saved settings.
export function applyDocumentState(s,t){
 document.documentElement.lang=s.settings.locale;document.documentElement.dir=s.settings.locale==='ar'?'rtl':'ltr';
 document.title=t('title')+' · '+t('subtitle');
 document.querySelector('meta[name="theme-color"]').content=isNight(s)?'#302638':'#f1e7dd';
 document.body.classList.toggle('reduced-motion',s.settings.reducedMotion);
 document.body.classList.toggle('large-text',s.settings.largeText);
 document.querySelector('#world').setAttribute('aria-label',t('canvasLabel'));
}

// Per-frame HUD sync: night class, clock face, counters, next clue, light and pause buttons.
export function syncHud(host,s,{t,n,panel,placement,selected}){
 document.body.classList.toggle('night',isNight(s));
 if(panel==='activities')updateActivityStatus(host,s,t,n);
 host.style.setProperty('--day-progress',daySweepDegrees(s)+'deg');
 const story=storyStatus(s),values={buttons:n(s.buttons),cozy:n(coziness(s))+'%',wishes:story.finished?
   `${n(s.wishes.length)} / ${n(3)}`:`${n(story.index+1)} / ${n(3)}`,
     day:t('day')+' '+n(s.day),time:t(isNight(s)?'evening':'morning')};
 const heading=host.querySelector('[data-story-heading]'),headingText=t(story.finished?
   'objectiveLabel':'story-'+story.chapter.id+'-title');
 if(heading&&heading.textContent!==headingText)heading.textContent=headingText;
 for(const [key,value] of Object.entries(values)){const el=host.querySelector(`[data-value="${key}"]`);
 if(el&&el.textContent!==value)el.textContent=value}
 const {copy,label,ico,arrived}=nextStep(s,t,n,host.dataset.focusRoom);
 host.querySelector('.objective').dataset.arrived=String(Boolean(arrived));
 const objective=host.querySelector('#objective-copy');if(objective.textContent!==copy)objective.textContent=copy;
 const action=host.querySelector('#objective-action');
 const content=icon(ico)+`<span>${label}</span>`+icon('arrow');setMarkup(action,content);
 const light=host.querySelector('#light-button'),lightHtml=icon(isNight(s)?
   'sun':'moon')+`<span>${t(isNight(s)?'dawn':'night')}</span>`;setMarkup(light,lightHtml);
 host.querySelector('.visitor-hint').hidden=!visitorWaiting(s)||Boolean(placement);
 host.querySelector('.dock [data-action="panel-household"]')?.classList.toggle('has-news',hasBasket(s));
 host.querySelector('.dock [data-action="panel-journal"]')?.classList.toggle('has-news',unclaimed(s).length>0);
 host.querySelector('.pause-overlay').hidden=!s.paused||Boolean(panel);
 const pauseButton=host.querySelector('.dock [data-action="pause"]'),pauseLabel=t(s.paused?'resume':'pause');
 if(pauseButton.getAttribute('aria-pressed')!==String(s.paused)||pauseButton.title!==pauseLabel){
  pauseButton.setAttribute('aria-pressed',String(s.paused));pauseButton.title=pauseLabel;
  pauseButton.innerHTML=icon(s.paused?'resume':'pause')+`<span>${pauseLabel}</span>`;
 }

 for(const el of host.querySelectorAll('[data-need]')){
   const d=s.dolls.find(v=>v.id===selected);if(d){el.value=d[el.dataset.need];
 host.querySelector(`[data-need-text="${el.dataset.need}"]`).textContent=n(d[el.dataset.need])}}
}

// Phone portrait shows the clue as a compact chip; the copy opens on demand and a dot marks an unread clue.
// Returns the clue text the player has read, or null when the clue card is not on screen.
export function syncClue(host,t,expanded,readClue){
 const aside=host.querySelector('.objective'),copy=host.querySelector('#objective-copy')?.textContent??'';
 if(!aside)return null;
 const read=expanded?copy:readClue,value=String(expanded),unread=String(copy!==read);
 if(aside.dataset.expanded!==value)aside.dataset.expanded=value;
 if(aside.dataset.unread!==unread)aside.dataset.unread=unread;
 host.querySelector('#objective-detail').hidden=!expanded;
 const toggle=aside.querySelector('.clue-toggle');
 if(toggle&&toggle.getAttribute('aria-expanded')!==value)toggle.setAttribute('aria-expanded',value);
 toggle?.setAttribute('aria-label',t(expanded?'storyFoldClue':'storyReadClue'));
 return read;
}

// Transient notices return to an unresolved save warning; both mirror into an open sheet.
export function createToaster(host,panelOpen=()=>false){
 let timer,transient='',warning='';
 function render(){
  const message=transient||warning,el=host.querySelector('#toast');
  if(el.textContent!==message)el.textContent=message;el.classList.toggle('visible',Boolean(message));
  if(panelOpen()&&message){
   let note=host.querySelector('.panel-notice');
   if(!note){note=document.createElement('p');note.className='panel-notice';
   note.setAttribute('role','status');host.querySelector('#sheet-content').prepend(note)}
   if(note.textContent!==message)note.textContent=message;
   note.dataset.saveWarning=String(!transient&&Boolean(warning));
  }
 }
 return {
  show(message){
   clearTimeout(timer);transient=message;render();
   timer=setTimeout(()=>{transient='';render()},4500);
  },
  setWarning(message){warning=message||'';
   if(!warning){const note=host.querySelector('.panel-notice');if(note?.dataset.saveWarning==='true')note.remove()}
   render();
  },
  refresh:render,
  dispose(){clearTimeout(timer)},
 };
}

// After a ritual answer the sheet re-renders; keep focus on the control the player was using.
export function focusActivityControl(host,result,choice){
 host.querySelector(result?.complete?'.ritual-result button':choice!==undefined?
   `#sheet [data-choice="${choice}"]`:'#sheet [data-action="recall-ready"], #sheet [data-choice], '+
     '#sheet [data-action="begin-activity"]')?.focus();
}

// The sheet dialog closes on Escape and on a click on its backdrop.
export function wireSheet(host,close){
 const sheet=host.querySelector('#sheet');
 sheet.addEventListener('cancel',event=>{event.preventDefault();close()});
 sheet.addEventListener('click',event=>{
  if(event.target!==sheet)return;
  const r=sheet.getBoundingClientRect();
  if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)close();
 });
 return sheet;
}

// Where focus should return after a sheet closes: the control that opened it, not a hidden dock button.
export function focusOrigin(host){
 const active=document.activeElement;
 if(active?.matches('[data-action^="panel-"]'))return host.querySelector('[data-action="toggle-tools"]');
 if(active?.closest('.object-ribbon'))return host.querySelector('[data-object-toggle]');
 return active;
}
export function restoreFocus(host,origin,ritualActive){
 const fallback=ritualActive?document.querySelector('#world'):host.querySelector('[data-action="toggle-tools"]');
 const target=origin?.isConnected&&origin.getClientRects().length?origin:fallback;
 target?.focus({preventScroll:true});
}

// Opens or folds the dock of sheet shortcuts and keeps its toggle's aria state in step.
export function setDock(host,expanded){
 host.querySelector('.dock').dataset.expanded=String(expanded);
 host.querySelector('[data-action="toggle-tools"]').setAttribute('aria-expanded',String(expanded));
}

// A status line at the top of a sheet, so a message stays visible behind the dialog.
export function prependNotice(root,message){
 const note=document.createElement('p');note.className='panel-notice';
 note.setAttribute('role','status');note.textContent=message;root.prepend(note);
}
