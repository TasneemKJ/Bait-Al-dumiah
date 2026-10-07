// Routes clicks and field changes inside #ui to commands. The shell supplies the few
// operations that touch its own state; everything else is forwarded to dispatch.
const IDS=['focus-doll','begin-activity','restore-room'];
const NUMBERS=['use-object','rotate-object','move-object','pack-object','remove'];
const COLLECT=['claim','collect-basket','mend-door','gift'];

export function createUIEvents(host,ctx){
 const {dispatch}=ctx;
 const routes={
  'toggle-tools':()=>ctx.toggleTools(),
  'toggle-clue':()=>ctx.toggleClue(),
  'objective':()=>{ctx.collapseClue();dispatch('objective')},
  'story-interact':el=>dispatch('story-interact',el.dataset.object),
  'close':()=>ctx.close(),
  'select':el=>ctx.select(el.dataset.id),
  'choose-item':el=>ctx.chooseItem(el.dataset.id),
  'placement-cancel':()=>ctx.cancelPlacement(),
  'place-confirm':()=>ctx.confirmPlacement(),
  'activity-input':el=>dispatch('activity-input',Number(el.dataset.choice)),
  'care':el=>dispatch('care',{id:el.dataset.id,action:el.dataset.care}),
  'reset-prompt':()=>ctx.askReset(true),
  'reset-no':()=>ctx.askReset(false),
 };
 for(const action of IDS)routes[action]=el=>dispatch(action,el.dataset.id);
 for(const action of NUMBERS)routes[action]=el=>{dispatch(action,Number(el.dataset.id));if(action==='remove')ctx.renderPanel()};
 for(const action of COLLECT)routes[action]=el=>{dispatch(action,el.dataset.id);if(ctx.panelOpen())ctx.renderPanel()};
 const click=event=>{
  const target=event.target.closest('[data-action]');
  if(!target||target.disabled)return;
  const action=target.dataset.action;
  if(action.startsWith('panel-'))return ctx.open(action.slice(6));
  if(routes[action])routes[action](target);else dispatch(action);
 };
 const fields={
  'place-room':el=>ctx.changeRoom(el.value),
  'place-slot':el=>ctx.changeSlot(Number(el.value)),
  'doll-room':el=>dispatch('move',{id:el.dataset.id,room:el.value}),
  'save-import':el=>{const file=el.files?.[0];el.value='';if(file)dispatch('save-import',file)},
 };
 const change=event=>{
  const el=event.target,field=el.dataset.field;
  if(!field)return;
  if(fields[field])fields[field](el);
  else dispatch('setting',{key:field,value:el.type==='checkbox'?el.checked:el.value});
 };
 host.addEventListener('click',click);host.addEventListener('change',change);
 return ()=>{host.removeEventListener('click',click);host.removeEventListener('change',change)};
}
