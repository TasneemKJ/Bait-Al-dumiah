// Saving, the notice queue and the fatal error screen.
import {DOLLS} from './content.js';

export function installFeedback(app){
 const {session,audio,host}=app;
 function save(){if(!session.entered)return false;if(session.save(app.state))return true;
 if(!app.saveWarning&&app.ui){app.ui.toast(app.ui.t('savingFailed'));
 app.saveWarning=true;const note=host.querySelector('.saved-note span');if(note)note.textContent=app.ui.t('savingFailed')}return false}
 function saveSettings(){const saved=session.savePreferences(app.state.settings);
 if(session.entered)save();else if(!saved)app.homeUI?.notify(app.ui.t('savingFailed'))}
 function notify(result,success){if(!result.ok){say(app.ui.t(result.reason));
 return false}if(success)say(app.ui.t(success));save();app.ui.tick();return true}
 // Notices queue so a reward, a level-up and a milestone never overwrite one another.
 app.notices=[];app.noticeAt=0;
 function say(message){if(app.notices.length<8)app.notices.push(message);
 if(app.notices.length===1&&performance.now()>=app.noticeAt)showNotice(performance.now())}
 function showNotice(now){if(!app.notices.length)return;app.ui.toast(app.notices.shift());app.noticeAt=now+2400}
 function announce(event){
  const t=app.ui.t,n=app.ui.n;
  if(event.type==='milestone')say(`${t('milestoneReached')} ${t('ms-'+event.id+'Title')} · +${n(event.reward)} ${t('buttons')}`);
  if(event.type==='bond'){
    say(`${t('bondUp')} ${t(event.id)} · ${t('bond'+event.level)} · +${n(event.reward)} ${t('buttons')}`);audio.effect('secret')}
  if(event.type==='full-house')say(`${t('fullHouse')} +${n(event.reward)} ${t('buttons')} · ${t('streakLabel')}: ${n(event.streak)}`);
  if(event.type==='dawn')say(event.fresh?`${t('dawnRecap')} ${n(event.wishes)} / ${n(DOLLS.length)}`:t('dawnTooSoon'));
  if(event.type==='sewn')say(t('sewnHint'));
 }
 function showError(kind){app.fatal=true;app.syncPause();save();app.homeUI?.hide();
 document.querySelector('#loading')?.remove();if(app.ui?.panel)app.ui.close();
 const error=document.createElement('section');error.className='error-screen';error.setAttribute('role','alert');
 const h=document.createElement('h2'),p=document.createElement('p'),b=document.createElement('button');
 h.textContent=app.ui.t(kind==='context'?'contextTitle':'webglTitle');p.textContent=app.ui.t(kind==='context'?'contextHelp':'webglHelp');
 b.textContent=app.ui.t('reload');b.addEventListener('click',()=>location.reload());error.append(h,p,b);document.querySelector('#app').append(error)}
 Object.assign(app,{save,saveSettings,notify,say,showNotice,announce,showError});
}
