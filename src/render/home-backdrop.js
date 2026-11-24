import * as T from 'three';
// Home's room around the dollhouse (2026-11-24 redesign): the miniature stands on a rosewood table against a
// papered wall, lit by a warm lamp pool behind the roof. Everything is drawn in the backdrop shader in the
// house's own palette (cream paper, rose, gold; plum and lamplight at night), in screen pixels so the paper
// pattern keeps one size on every device. `home` eases to 0 on Play, which leaves the play backdrop untouched.
// Room colours are written as sRGB and linearised (pow 2.2) before the shader's colour-space step.
export const HOME_GLSL=`
uniform float home; uniform float horizon; uniform vec2 focus; uniform vec2 res; uniform float dpr;
float boxSd(vec2 p,float s){vec2 d=abs(p)-vec2(s);return length(max(d,0.))+min(max(d.x,d.y),0.);}
// An eight-point star (khatam): two squares, one turned an eighth of a turn.
float khatam(vec2 p,float s){vec2 r=vec2(p.x-p.y,p.x+p.y)*.7071;return min(boxSd(p,s),boxSd(r,s));}
vec3 homeWall(vec2 px,vec2 uv,float night){
 vec3 top=mix(vec3(.93,.86,.80),vec3(.19,.15,.23),night),low=mix(vec3(.84,.73,.71),vec3(.13,.11,.17),night);
 vec3 c=mix(low,top,smoothstep(horizon,1.,uv.y));
 vec2 cell=vec2(76.,88.),id=floor(px/cell),q=px-(id+.5)*cell;
 if(mod(id.y,2.)>.5)q.x=mod(px.x+cell.x*.5,cell.x)-cell.x*.5;
 float aa=1.;float star=1.-smoothstep(-aa,aa,khatam(q,5.));
 float stripe=1.-smoothstep(.4,1.4,cell.x*.5-abs(mod(px.x,cell.x)-cell.x*.5));
 vec3 ink=mix(vec3(.70,.50,.50),vec3(.78,.62,.40),night);
 c=mix(c,ink,star*mix(.13,.16,night));c=mix(c,ink,stripe*mix(.08,.07,night));
 vec2 d=(uv-focus)*vec2(res.x/res.y,1.);
 float pool=exp(-dot(d,d)*mix(5.,7.,night));
 c+=pool*mix(vec3(.05,.035,.02),vec3(.16,.10,.05),night);
 float edge=smoothstep(.35,1.05,length((uv-vec2(.5,.55))*vec2(1.,1.15)));
 return c*(1.-edge*mix(.16,.42,night));
}
vec3 homeTable(vec2 px,vec2 uv,float night){
 float depth=clamp((horizon-uv.y)/max(horizon,.05),0.,1.);
 vec3 c=mix(mix(vec3(.55,.38,.33),vec3(.25,.17,.17),night),mix(vec3(.36,.24,.22),vec3(.12,.08,.09),night),depth);
 float plank=log(1.+depth*9.)*6.;float seam=1.-smoothstep(0.,.06,abs(fract(plank)-.5)*2.-.9);
 float grain=sin(px.x*.045+sin(plank*7.1)*3.+sin(px.x*.011)*2.)*.5+.5;
 c*=1.-seam*.18;c*=.95+grain*.06;
 vec2 d=(uv-vec2(focus.x,horizon))*vec2(res.x/res.y*.6,2.4);
 c+=exp(-dot(d,d)*3.)*mix(vec3(.05,.035,.025),vec3(.16,.09,.04),night);
 float rim=1.-smoothstep(0.,2.5,(horizon-uv.y)*res.y);
 return mix(c,mix(vec3(.75,.60,.52),vec3(.45,.33,.26),night),rim*.5);
}
vec3 homeRoom(vec3 play,float night){
 if(home<=0.)return play;
 vec2 uv=gl_FragCoord.xy/(res*dpr),px=gl_FragCoord.xy/dpr;
 vec3 room=uv.y>horizon?homeWall(px,uv,night):homeTable(px,uv,night);
 room=pow(max(room,vec3(0.)),vec3(2.2));
 return mix(play,room,home);
}`;
export function homeUniforms(){return {home:{value:0},horizon:{value:.3},focus:{value:new T.Vector2(.5,.55)},
 res:{value:new T.Vector2(390,844)},dpr:{value:1}}}
const back=new T.Vector3(),middle=new T.Vector3(),size=new T.Vector2();
// The table's far edge sits just behind the house's plinth, and the lamp pool behind the middle of the house.
export function updateHomeUniforms(u,{mix=0,camera,renderer}={}){
 u.home.value=mix;if(!(mix>0)||!camera||!renderer)return;
 renderer.getSize(size);u.res.value.set(Math.max(1,size.x),Math.max(1,size.y));u.dpr.value=renderer.getPixelRatio();
 back.set(0,-.7,-3.4).project(camera);middle.set(0,6.2,0).project(camera);
 u.horizon.value=T.MathUtils.clamp(back.y*.5+.5,.04,.9);
 u.focus.value.set(middle.x*.5+.5,middle.y*.5+.5);
}
