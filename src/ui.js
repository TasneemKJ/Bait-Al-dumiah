import {slotTaken} from './simulation.js';
import {createUIEvents} from './ui-events.js';
import {shellMarkup,button} from './shell-markup.js';
import {setDock,prependNotice,wireSheet,focusOrigin,restoreFocus,applyDocumentState,syncHud,syncClue,
  createToaster,focusActivityControl} from './hud-sync.js';
import {nextStep} from './objective-ui.js';
import {sheetMarkup,placementMarkup} from './panels-ui.js';
import {objectInfo} from './object-ui.js';
import {avatarMarkup} from './resident-portraits.js';
import {translate,number} from './i18n.js';
export function createUI(host,getState,dispatch){
 let panel=null,selected='lina',placement=null,placementRoom='kitchen',placementSlot=0,
   previousFocus=null,resetConfirm=false;
 let portraits={};
 let activityResult=null,selectedObject=null,moveId=null,toolsExpanded=false,clueExpanded=false,readClue='';
 const t=key=>translate(getState().settings.locale,key),n=value=>number(getState().settings.locale,value);
 const avatar=id=>avatarMarkup(id,portraits[id]);
 function build(){
  const s=getState();applyDocumentState(s,t);
  host.innerHTML=shellMarkup(s,{t,n,button,clueExpanded,toolsExpanded});
  const sheet=wireSheet(host,close);
  if(panel){renderPanel();sheet.showModal()}renderPlacement();tick();
 }
 function open(name,id){if(placement){placement=null;moveId=null;renderPlacement();
 dispatch('placement-cancel')}panel=name;resetConfirm=false;if(id)selected=id;previousFocus=focusOrigin(host);
  toolsExpanded=false;setDock(host,false);
  renderPanel();host.querySelector('#sheet').showModal();dispatch('panel-state',name);
  host.querySelector('#sheet [data-action="close"]').focus()}
 function close(){const sheet=host.querySelector('#sheet');sheet?.close();panel=null;
 renderedPanel=null;resetConfirm=false;
 dispatch('panel-state',null);
 restoreFocus(host,previousFocus,['tea','stitch','lullaby'].includes(getState().activities.active?.id))}
 let renderedPanel=null;
 function renderPanel(){
  const s=getState(),root=host.querySelector('#sheet-content');if(!panel)return;
  // Re-rendering the same sheet keeps its latest notice, so a collected reward stays visible.
  const notice=renderedPanel===panel?root.querySelector('.panel-notice')?.textContent:null;renderedPanel=panel;
  root.innerHTML=sheetMarkup(panel,s,{t,n,button,avatar,selected,selectedObject,activityResult,resetConfirm});
  if(notice)prependNotice(root,notice);
 }
 function renderPlacement(){
  const root=host.querySelector('.placement');if(!root)return;root.hidden=!placement;if(!placement)return;
  root.innerHTML=placementMarkup(getState(),{t,n,button,placement,moveId,room:placementRoom,slot:placementSlot});
 }
 function previewPlacement(){dispatch('placement-preview',{item:placement,
   room:placementRoom,slot:placementSlot,moveId})}
 function chooseItem(id){close();moveId=null;placement=id;placementRoom='kitchen';
 placementSlot=0;dispatch('placement',id);previewPlacement();
 renderPlacement();host.querySelector('#place-room').focus()}
 function clearPlacement(){placement=null;moveId=null;renderPlacement()}
 function beginMove(id){const d=getState().decor.find(d=>d.id===id);if(!d)return false;
 close();placement=d.item;moveId=id;placementRoom=d.room;
 placementSlot=d.slot;dispatch('placement',d.item);previewPlacement();renderPlacement();
 host.querySelector('#place-room').focus();return true}
 function tick(){
 const s=getState();
 syncHud(host,s,{t,n,panel,placement,selected});setClue(clueExpanded);
 }
 const toaster=createToaster(host),toast=message=>toaster.show(message,Boolean(panel));
 function refresh(){const wasPanel=panel;if(wasPanel){host.querySelector('#sheet')?.close()}build()}
 function setTools(expanded){toolsExpanded=expanded;setDock(host,expanded);dispatch('tools-state',expanded)}
 // Phone portrait shows the clue as a compact chip; the copy opens on demand and a dot marks an unread clue.
 function setClue(expanded){const read=syncClue(host,t,expanded,readClue);
 if(read===null)return;clueExpanded=expanded;readClue=read}
 const unbindEvents=createUIEvents(host,{dispatch,open,close,renderPanel,panelOpen:()=>Boolean(panel),
  toggleTools:()=>setTools(!toolsExpanded),toggleClue:()=>setClue(!clueExpanded),collapseClue:()=>setClue(false),
  select(id){selected=id;dispatch('select',id);renderPanel();
  host.querySelector(`[data-action="select"][data-id="${id}"]`)?.focus()},
  chooseItem,cancelPlacement(){clearPlacement();dispatch('placement-cancel')},
  confirmPlacement(){dispatch(moveId!==null?'relocate-object':'place',{id:moveId,
    item:placement,room:placementRoom,slot:placementSlot})},
  askReset(on){resetConfirm=on;renderPanel()},
  changeRoom(room){placementRoom=room;placementSlot=firstFreeSlot();previewPlacement();
  renderPlacement();host.querySelector('#place-room').focus()},
  changeSlot(slot){placementSlot=slot;previewPlacement()}});
 const firstFreeSlot=()=>[0,1,2].find(i=>!slotTaken(getState(),placementRoom,i,moveId))??0;
 build();
 return {collapseTools(){if(toolsExpanded)setTools(false)},
   openObject(key){if(!objectInfo(getState(),key))return false;selectedObject=key;
 open('object');return true},clearObject(){selectedObject=null},beginMove,
   get moveId(){return moveId},open,close,refresh,tick,toast,
   objective:()=>nextStep(getState(),t,n,host.dataset.focusRoom),clearPlacement,
     setActivityResult(result){activityResult=result;
 const choice=host.querySelector('#sheet [data-choice]:focus')?.dataset.choice;renderPanel();
 focusActivityControl(host,result,choice)},
   setPortraits(values){portraits=values??{};
 if(panel==='household')renderPanel()},get selected(){return selected},
   get panel(){return panel},get placement(){return placement},get t(){return t},
   get n(){return n},dispose(){toaster.dispose();unbindEvents()}};
}
