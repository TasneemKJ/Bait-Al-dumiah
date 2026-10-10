import {physicalActivity} from './simulation.js';
import {createUIEvents} from './ui-events.js';
import {shellMarkup,button} from './shell-markup.js';
import {setDock,prependNotice,wireSheet,focusOrigin,restoreFocus,applyDocumentState,syncHud,syncClue,
  createToaster,focusActivityControl} from './hud-sync.js';
import {nextStep} from './objective-ui.js';
import {sheetMarkup} from './panels-ui.js';
import {createPlacementFlow} from './placement-flow.js';
import {objectInfo} from './object-ui.js';
import {avatarMarkup} from './resident-portraits.js';
import {translate,number} from './i18n.js';
export function createUI(host,getState,dispatch){
 let panel=null,selected='lina',previousFocus=null,resetConfirm=false,portraits={};
 let activityResult=null,selectedObject=null,toolsExpanded=false,clueExpanded=false,readClue='',renderedPanel=null;
 const t=key=>translate(getState().settings.locale,key),n=value=>number(getState().settings.locale,value);
 const avatar=id=>avatarMarkup(id,portraits[id]);
 const placer=createPlacementFlow(host,getState,dispatch,{t,n,closeSheet:()=>close()});
 function build(){
  const s=getState();applyDocumentState(s,t);
  host.innerHTML=shellMarkup(s,{t,n,button,clueExpanded,toolsExpanded});
  const sheet=wireSheet(host,close);
  if(panel){renderPanel();sheet.showModal()}placer.render();tick();toaster.refresh();
 }
 function open(name,id){placer.cancelIfActive();panel=name;resetConfirm=false;if(id)selected=id;
  previousFocus=focusOrigin(host);toolsExpanded=false;setDock(host,false);
  renderPanel();host.querySelector('#sheet').showModal();dispatch('panel-state',name);
  host.querySelector('#sheet [data-action="close"]').focus()}
 function close(){host.querySelector('#sheet')?.close();panel=null;renderedPanel=null;resetConfirm=false;
  dispatch('panel-state',null);restoreFocus(host,previousFocus,Boolean(physicalActivity(getState())))}
 function renderPanel(){
  const s=getState(),root=host.querySelector('#sheet-content');if(!panel)return;
  // Re-rendering the same sheet keeps its latest notice, so a collected reward stays visible.
  const notice=renderedPanel===panel?root.querySelector('.panel-notice')?.textContent:null;renderedPanel=panel;
  root.innerHTML=sheetMarkup(panel,s,{t,n,button,avatar,selected,selectedObject,activityResult,resetConfirm});
  if(notice)prependNotice(root,notice);toaster.refresh();
 }
 function tick(){syncHud(host,getState(),{t,n,panel,placement:placer.item,selected});setClue(clueExpanded)}
 const toaster=createToaster(host,()=>Boolean(panel)),toast=message=>toaster.show(message);
 function refresh(){if(panel)host.querySelector('#sheet')?.close();build()}
 function setTools(expanded){toolsExpanded=expanded;setDock(host,expanded);dispatch('tools-state',expanded)}
 // Phone portrait shows the clue as a compact chip; the copy opens on demand and a dot marks an unread clue.
 function setClue(expanded){const read=syncClue(host,t,expanded,readClue);
  if(read===null)return;clueExpanded=expanded;readClue=read}
 const unbindEvents=createUIEvents(host,{dispatch,open,close,renderPanel,panelOpen:()=>Boolean(panel),
  toggleTools:()=>setTools(!toolsExpanded),toggleClue:()=>setClue(!clueExpanded),collapseClue:()=>setClue(false),
  select(id){selected=id;dispatch('select',id);renderPanel();
   host.querySelector(`[data-action="select"][data-id="${id}"]`)?.focus()},
  chooseItem:placer.chooseItem,cancelPlacement:placer.cancel,confirmPlacement:placer.confirm,
  askReset(on){resetConfirm=on;renderPanel()},changeRoom:placer.changeRoom,changeSlot:placer.changeSlot});
 build();
 return {collapseTools(){if(toolsExpanded)setTools(false)},
  openObject(key){if(!objectInfo(getState(),key))return false;selectedObject=key;open('object');return true},
  clearObject(){selectedObject=null},beginMove:placer.beginMove,get moveId(){return placer.moveId},
  open,close,refresh,tick,toast,setSaveWarning:toaster.setWarning,
  objective:()=>nextStep(getState(),t,n,host.dataset.focusRoom),
  clearPlacement:placer.clear,
  setActivityResult(result){activityResult=result;
   const choice=host.querySelector('#sheet [data-choice]:focus')?.dataset.choice;renderPanel();
   focusActivityControl(host,result,choice)},
  setPortraits(values){portraits=values??{};if(panel==='household')renderPanel()},
  get selected(){return selected},get panel(){return panel},get placement(){return placer.item},
  get t(){return t},get n(){return n},dispose(){toaster.dispose();unbindEvents()}};
}
