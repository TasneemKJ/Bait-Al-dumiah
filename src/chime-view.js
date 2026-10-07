import {icon} from './icons.js';
const names=['chimeMoon','chimeStar','chimeJasmine','chimeHeart'];
const text=(el,value)=>{if(el.textContent!==value)el.textContent=value};

// Builds the chime strip beside the canvas and returns it with the elements it updates.
export function mountChimeSurface(host){
 const root=document.createElement('section');root.className='chime-playfield';root.hidden=true;
 root.innerHTML=`<header class="chime-heading"><h2></h2><p
   class="chime-progress"></p></header><div class="chime-work-strip"><div><p
   id="chime-instructions" class="chime-long"></p><p class="chime-short"
     aria-hidden="true"></p><p id="chime-status"></p></div><button type="button"
   class="chime-exit">${icon('arrow')}<span></span></button></div><p class="sr-only"
     id="chime-readout"></p><p class="sr-only"
   id="chime-demonstration"></p><p class="sr-only chime-announcement" role="status" aria-live="polite"></p>`;
 host.append(root);
 const parts={title:root.querySelector('h2'),
   progress:root.querySelector('.chime-progress'),instructions:root.querySelector('#chime-instructions'),
   short:root.querySelector('.chime-short'),status:root.querySelector('#chime-status'),
     exit:root.querySelector('button'),
   readout:root.querySelector('#chime-readout'),demo:root.querySelector('#chime-demonstration'),
     announcement:root.querySelector('.chime-announcement')};
 return {root,parts};
}

// Writes the chime strip: title, progress, instructions, status and the spoken readouts. Returns the strings
// the announcer reuses.
export function renderChimeStrip(parts,a,{t,n,input,selection}){
 const listening=a.phase==='listen',done=a.phase==='finished';
 text(parts.title,t('chimeTitle'));text(parts.progress,t(listening?'chimeListen':done?'chimeDone':'chimeEcho'));
 const full=t(done?'chimeDoneHelp':listening?'chimeListenHelp':input==='keyboard'?'chimeKeyboard':'chimeEchoHelp');
 text(parts.instructions,full);
 text(parts.short,t(done?'chimeDoneShort':listening?'chimeListenShort':input==='keyboard'?
   'chimeKeysShort':'chimeShort'));
 const progress=t('chimeProgress').replace('{done}',n(a.cursor)).replace('{total}',n(a.pattern.length));
 const status=done?(a.result?.practice?t('chimePractice'):t('chimeReward').replace('{reward}',
   n((a.result?.reward??0)+(a.result?.bonus??0)))):listening&&a.listenTime<0?t('chimeMistake'):progress;
 text(parts.status,status);text(parts.exit.querySelector('span'),t('chimeExit'));
 parts.exit.setAttribute('aria-label',t('chimeExit'));
 const selected=t('chimeSelected').replace('{name}',t(names[selection]));
 text(parts.readout,selected+'. '+t('chimePullReadout').replace('{pull}',n(a.pull*100)));
 text(parts.demo,t('chimeDemonstration').replace('{notes}',a.pattern.map(id=>t(names[id])).join('، ')));
 return {status,full,selected};
}

// True when the event lands on the canvas itself, not on a control floating above it.
export function pointOnCanvas(canvas,e){
  const r=canvas.getBoundingClientRect();
  return Number.isFinite(e.clientX)&&Number.isFinite(e.clientY)&&e.clientX>=r.left&&e.clientX<=r.right
    &&e.clientY>=r.top&&e.clientY<=r.bottom&&document.elementFromPoint(e.clientX,e.clientY)===canvas;
}
