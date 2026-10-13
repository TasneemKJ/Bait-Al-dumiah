import {translate} from '../i18n.js';

export function wideCamera(shot){
 const eye=[...shot.eye],target=[...shot.target];
 // A portrait's distant full-house view would waste the sides in widescreen.
 // Move the real camera forward; the resident closeups retain their room context.
 if(shot.index===0||shot.index===6){eye[2]*=.66;target[1]=3.7;}
 if(shot.index===5){const u=(shot.time-shot.start)/(shot.end-shot.start);
  eye.splice(0,3,-1.7+u*.5,2.2-u*.2,3.2-u*.5);target.splice(0,3,0,1.2,-1.4);}
 return {eye,target};
}
export function composeWide(ctx,canvas,shot,locale,{poster=false}={}){
 const ar=locale==='ar',font=ar?'"Noto Naskh Arabic", serif':'Georgia, serif';
 ctx.clearRect(0,0,1920,1080);ctx.drawImage(canvas,0,0,1920,1080);
 const gradient=ctx.createLinearGradient(0,650,0,1080);
 gradient.addColorStop(0,'#251c2e00');gradient.addColorStop(.65,'#251c2ec9');gradient.addColorStop(1,'#251c2ef5');
 ctx.fillStyle=gradient;ctx.fillRect(0,650,1920,430);
 const edge=ctx.createRadialGradient(960,460,380,960,500,1200);
 edge.addColorStop(0,'#150f2000');edge.addColorStop(1,'#150f2070');
 ctx.fillStyle=edge;ctx.fillRect(0,0,1920,1080);
 ctx.textAlign='center';ctx.direction=ar?'rtl':'ltr';ctx.fillStyle='#fbf4e9';
 const final=shot.index===6;
 if(!poster){ctx.font=`${ar?66:58}px ${font}`;
  ctx.fillText(translate(locale,'filmLine'+shot.index),960,final?845:963);}
 if(final||poster){ctx.fillStyle='#e4c797';ctx.font=`${poster?132:88}px ${font}`;
  ctx.fillText(translate(locale,'title'),960,poster?904:954);
  ctx.fillStyle='#fbf4e9';ctx.font=`${poster?52:38}px ${font}`;
  ctx.fillText(translate(locale,poster?'filmTitle':'filmEnd'),960,poster?986:1025);}
 if(!poster){const fade=Math.max(0,1-shot.time/1.2,(shot.time-59)/1);
  if(fade>0){ctx.fillStyle=`rgba(28,21,34,${Math.min(1,fade)})`;ctx.fillRect(0,0,1920,1080);}}
}
