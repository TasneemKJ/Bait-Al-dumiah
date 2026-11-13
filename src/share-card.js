// The share card (iPhone app): the player's own house as the renderer draws it at night, cropped 4:5, with both
// names, the day and the dolls' names on a plum band. No account, no network: the app's share sheet takes the PNG.
import {DOLLS} from './content.js';
import {translate} from './i18n.js';

export const CARD=Object.freeze({width:1080,height:1350,band:230});
export function cardLines(s,t,n){
 const locale=s.settings.locale;
 return {title:t('title'),alt:translate(locale==='ar'?'en':'ar','title'),
  detail:`${t('day')} ${n(s.day)} · ${DOLLS.map(d=>t(d.id)).join(' · ')}`};
}
// `source` is the WebGL canvas straight after a render (its buffer is only valid in that same task).
export function composeCard(source,lines,makeCanvas=()=>document.createElement('canvas'),rtl=false){
 const canvas=makeCanvas();canvas.width=CARD.width;canvas.height=CARD.height;const c=canvas.getContext('2d');
 const sw=source.width,sh=Math.min(source.height,sw*CARD.height/CARD.width),sy=Math.max(0,(source.height-sh)/2);
 c.fillStyle='#282336';c.fillRect(0,0,CARD.width,CARD.height);
 c.drawImage(source,0,sy,sw,sh,0,0,CARD.width,CARD.height);
 const top=CARD.height-CARD.band,shade=c.createLinearGradient(0,top-90,0,CARD.height);
 shade.addColorStop(0,'rgba(40,35,54,0)');shade.addColorStop(.3,'rgba(40,35,54,.82)');shade.addColorStop(1,'#282336');
 c.fillStyle=shade;c.fillRect(0,top-90,CARD.width,CARD.band+90);
 c.textAlign='center';c.direction=rtl?'rtl':'ltr';const x=CARD.width/2;
 c.fillStyle='#f5e1d1';c.font='64px Georgia,"Times New Roman",serif';c.fillText(lines.title,x,top+78);
 c.fillStyle='#c1aab8';c.font='30px Georgia,"Times New Roman",serif';c.fillText(lines.alt,x,top+126);
 c.fillStyle='#edd3ab';c.font='34px "Trebuchet MS",Tahoma,sans-serif';c.fillText(lines.detail,x,top+186);
 return canvas.toDataURL('image/png');
}
