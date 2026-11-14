// The midnight visitor on screen: no sheet, list or button. A short paper line appears beside the empty
// place (or the doll) and fades; the search is a touch on the house itself; the journal keeps the record.
import * as sim from './simulation.js';
import {ROOMS} from './content.js';

const MARGIN=16,TOP=176,BOTTOM=236;
// Where tonight's thing may be: its owner's room, its floor, or the whole house.
export function whereKey(m){
 if(m.scope==='first')return 'mischief-first';if(m.scope==='room')return 'mischief-where-room-'+m.home;
 if(m.scope==='floor')return 'mischief-where-floor-'+(ROOMS.find(r=>r.id===m.home).y>0?1:0);
 return 'mischief-where-house';
}
// The short lines an event says, one slip each: what is missing, then where to look; an elegy, then who is quiet.
export function mischiefLines(event,t){
 if(event.type==='mischief-take')return [t('mischief-missing-'+event.item),t(whereKey(event))];
 if(event.type==='mischief-lost')return [t(`elegy-${event.item}-${event.elegy}`),t('mischief-quiet-'+event.doll)];
 if(event.type==='mischief-found')return [t('mischief-found-'+event.item)];
 return [];
}
// Seconds a line stays: long enough to read twice, never a wall.
export const lineSeconds=text=>Math.min(8,3.6+text.length*.04);
// Clamp a centred paper slip of `w`x`h` above an anchor, inside the playfield and clear of the HUD.
export function placeLine(point,w,h,vw,vh){
 const x=Math.max(MARGIN+w/2,Math.min(vw-MARGIN-w/2,Number.isFinite(point?.x)?point.x:vw/2));
 const want=Number.isFinite(point?.y)?point.y-h-26:vh*.42;
 return {x,y:Math.max(TOP,Math.min(vh-BOTTOM-h,want))};
}

export function installMischief(app){
 const node=document.createElement('p');node.className='mischief-line';node.setAttribute('role','status');
 node.setAttribute('aria-live','polite');node.hidden=true;
 const queue=[];let current=null;
 const blocked=()=>Boolean(app.ui?.panel||app.physicalActivity?.()||app.state.paused||app.intro?.active||
   app.filmActive);
 function anchor(entry){const w=app.world;if(!w)return null;
  if(entry.doll){const p=w.project(entry.doll,1.75);if(p&&p.x>0&&p.x<window.innerWidth&&p.y>0&&
   p.y<window.innerHeight)return p}
  return w.mischiefPoint?.('home',entry.item)??null}
 function show(entry,now){
  current={...entry,until:now+lineSeconds(entry.text)*1000};if(!node.isConnected)app.host.append(node);
  node.dataset.kind=entry.kind;node.dir=app.state.settings.locale==='ar'?'rtl':'ltr';node.textContent=entry.text;
  node.hidden=false;node.dataset.state='enter';
 }
 function hide(){current=null;node.dataset.state='fading';
  setTimeout(()=>{if(!current)node.hidden=true},app.state.settings.reducedMotion?0:450)}
 function tick(now){
  if(current&&node.dataset.state==='enter')node.dataset.state='shown';
  // A sheet or ritual opening mid-line puts it back to wait, unless it has mostly been read.
  if(current&&blocked()&&current.until-now>2000)queue.unshift(current);
  if(current&&(now>=current.until||blocked()))hide();
  if(!current&&queue.length&&!blocked()&&now>=app.noticeAt&&!app.notices.length)show(queue.shift(),now);
  if(!current)return;
  const point=anchor(current),{x,y}=placeLine(point,node.offsetWidth,node.offsetHeight,window.innerWidth,
   window.innerHeight);
  if(node.style){node.style.left=x+'px';node.style.top=y+'px'}
 }
 function line(event,extra={}){
  for(const text of mischiefLines(event,app.ui.t))if(queue.length<6)queue.push({text,kind:event.type.slice(9),
   item:event.item,...extra})}
 function event(e){
  if(e.type==='mischief-take')line(e);
  if(e.type==='mischief-lost'){line(e,{doll:e.doll});app.audio.effect('elegy')}
 }
 // A touch on a hiding place in the focused room.
 function search(spot){
  const result=sim.search(app.state,spot);if(!result.ok)return result;
  if(result.found){app.world?.mischiefFound?.(result.item,result.spot);app.world?.greet?.(result.doll);
   app.audio.effect('found');queue.length=0;if(current)hide();
   line({type:'mischief-found',item:result.item});app.save();app.ui.tick()}
  else{app.world?.mischiefPuff?.(result.spot,result.near);app.audio.effect(result.near?'search-cold':'search-dust')}
  return result;
 }
 app.mischief={event,search,tick,get line(){return current?.text??null},get node(){return node}};
}
