// The decor placer: which item is being placed or moved, and the room and slot it is aimed at.
import {slotTaken} from './simulation.js';
import {placementMarkup} from './panels-ui.js';
import {button} from './shell-markup.js';

export function createPlacementFlow(host,getState,dispatch,{t,n,closeSheet}){
 let placement=null,moveId=null,room='kitchen',slot=0;
 const focusRoomPicker=()=>host.querySelector('#place-room')?.focus();
 const firstFreeSlot=()=>[0,1,2].find(i=>!slotTaken(getState(),room,i,moveId))??0;
 function render(){
  const root=host.querySelector('.placement');if(!root)return;root.hidden=!placement;if(!placement)return;
  root.innerHTML=placementMarkup(getState(),{t,n,button,placement,moveId,room,slot});
 }
 const preview=()=>dispatch('placement-preview',{item:placement,room,slot,moveId});
 function begin(item,id,fromRoom,fromSlot){
  closeSheet();placement=item;moveId=id;room=fromRoom;slot=fromSlot;
  dispatch('placement',item);preview();render();focusRoomPicker();
 }
 function clear(){placement=null;moveId=null;render()}
 return {
  get item(){return placement},get moveId(){return moveId},render,clear,
  // A sheet opening over the placer cancels it, so the world never keeps a stale ghost.
  cancelIfActive(){if(!placement)return;clear();dispatch('placement-cancel')},
  chooseItem(id){begin(id,null,'kitchen',0)},
  beginMove(id){const d=getState().decor.find(d=>d.id===id);if(!d)return false;
   begin(d.item,id,d.room,d.slot);return true},
  cancel(){clear();dispatch('placement-cancel')},
  confirm(){dispatch(moveId!==null?'relocate-object':'place',{id:moveId,item:placement,room,slot})},
  changeRoom(next){room=next;slot=firstFreeSlot();preview();render();focusRoomPicker()},
  changeSlot(next){slot=next;preview()},
 };
}
