import * as T from 'three';
import {ROOMS,MUSIC_BOXES,KEY_REST,WIND_TURNS} from '../content.js';
import {musicStatus,isNight} from '../simulation.js';
import {box,ball,cylinder,palette} from './primitives.js';
import {softTexture} from './textiles.js';
import {compactStatic} from './batching.js';

// The music box key (DESIGN.md #49, src/sim-musicbox.js): a small walnut box in each doll's room, one brass
// key. The key sits in the box of the room it was carried to (or lies on the music cabinet by day) and turns
// as the box is wound. At midnight a wound box opens and its tiny dancer turns while its doll dances in the
// dark; a box left to run down stands half open, the dancer stopped mid-turn, and its doll stays still.
const WALNUT=0x8e5f45,BRASS=0xe0b463,GLINT=0xffd79a,BOX_SCALE=1.35,KEY_SCALE=1.7;
const local=(room,[x,y,z])=>{const r=ROOMS.find(q=>q.id===room);return new T.Vector3(r.x+x,r.y+y,z)};

function buildBox(root,def){
 const g=new T.Group();g.position.copy(local(def.room,def.at));g.rotation.y=def.at[0]<0?.5:-.5;
 // Mirrored on the right-hand walls, so the winding stem always faces into the room, never the wall.
 const mirror=def.at[0]>0;g.scale.set(mirror?-BOX_SCALE:BOX_SCALE,BOX_SCALE,BOX_SCALE);root.add(g);
 // The still body (walnut, a brass band, four brass feet, the winding stem) is merged into one draw per material;
 // only the lid and the dancer move. Small parts cast no shadow (round 9: the restored house's triangle budget).
 const body=new T.Group();g.add(body);
 box(body,0,.11,0,.34,.19,.24,WALNUT);box(body,0,.12,.122,.30,.03,.006,palette.gold);
 for(const x of [-.14,.14])for(const z of [-.09,.09])box(body,x,.012,z,.04,.024,.04,palette.gold);
 // The lid hinges at the back; a rose inlay on top and a brass clasp at the front.
 const lid=new T.Group();lid.position.set(0,.205,-.12);g.add(lid);
 box(lid,0,.018,.12,.36,.036,.26,WALNUT);box(lid,0,.038,.12,.22,.006,.15,palette.rose);
 box(lid,0,.012,.252,.04,.03,.008,palette.gold);
 // The dancer inside, on her brass pin: a cream skirt and a small porcelain head.
 const dancer=new T.Group();dancer.position.set(0,.2,0);g.add(dancer);
 cylinder(dancer,0,.035,0,.045,.07,palette.cream,1.6);ball(dancer,0,.09,0,.022,.024,.022,0xf2dcd0);
 cylinder(dancer,0,.0,0,.006,.04,BRASS);
 // The winding stem on the side the key fits into.
 const stem=new T.Vector3(.2,.11,0);cylinder(body,.185,.11,0,.018,.03,BRASS).rotation.z=Math.PI/2;
 for(const part of [body,lid,dancer]){part.traverse(o=>{if(o.isMesh)o.castShadow=false});compactStatic(part)}
 body.children[0]&&(body.children[0].castShadow=true);
 const glint=new T.Sprite(new T.SpriteMaterial({map:softTexture(),color:GLINT,transparent:true,opacity:0,
   depthWrite:false,blending:T.AdditiveBlending}));glint.scale.setScalar(.75);glint.position.set(0,.3,.05);g.add(glint);
 const hit=new T.Mesh(new T.BoxGeometry(.62,.5,.5),new T.MeshBasicMaterial({visible:false}));
 hit.position.set(0,.16,0);hit.userData={musicBox:def.doll,room:def.room};g.add(hit);
 return {def,g,lid,dancer,stem,glint,hit,mirror,open:0};
}
function buildKey(root){
 const key=new T.Group();key.scale.setScalar(KEY_SCALE);root.add(key);const spin=new T.Group();key.add(spin);
 // Bow, shaft and bit, along +x: the shaft goes into a box's stem and the bow turns outside it.
 const brass=new T.MeshStandardMaterial({color:BRASS,metalness:.48,roughness:.39});
 const bow=new T.Mesh(new T.TorusGeometry(.045,.011,5,16),brass);
 bow.position.x=.17;bow.rotation.y=Math.PI/2;spin.add(bow);
 cylinder(spin,.07,0,0,.011,.13,BRASS).rotation.z=Math.PI/2;
 box(spin,.01,-.022,0,.03,.03,.012,BRASS);ball(spin,.125,0,0,.016,.016,.016,BRASS);
 const halo=new T.Sprite(new T.SpriteMaterial({map:softTexture(),color:GLINT,transparent:true,opacity:0,
   depthWrite:false,blending:T.AdditiveBlending}));halo.scale.setScalar(.55);halo.position.x=.1;key.add(halo);
 const hit=new T.Mesh(new T.SphereGeometry(.2,8,6),new T.MeshBasicMaterial({visible:false}));
 hit.position.x=.1;hit.userData={musicKey:true};key.add(hit);
 return {key,spin,halo,hit};
}

export function createMusicBoxes(root){
 const boxes=MUSIC_BOXES.map(def=>buildBox(root,def)),k=buildKey(root),at=new T.Vector3();let held=false;
 // By day the key hangs on a brass nail on the sitting-room wall.
 const nail=local(KEY_REST.room,KEY_REST.at);ball(root,nail.x,nail.y+.2,nail.z-.04,.018,.018,.03,BRASS);
 return {boxes,targets:[...boxes.map(b=>b.hit),k.hit],
  hold(on){held=Boolean(on)},get held(){return held},
  // Where a box (or the key) is on screen, for the winding circle and for checks.
  point(kind,id){const b=boxes.find(x=>x.def.doll===id);
   if(kind==='key'){k.key.getWorldPosition(at);return at.clone()}
   if(!b)return null;b.g.localToWorld(at.set(0,.16,0));return at.clone()},
  update(state,dt,residents){
   const m=musicStatus(state);if(!m)return;const motion=!state.settings.reducedMotion&&!state.paused,t=state.elapsed;
   const night=isNight(state),pulse=motion?.55+.45*Math.sin(t*3):.8;
   for(const b of boxes){const r=m.result[b.def.doll],wound=(m.wind[b.def.doll]??0)>=1;
    const want=r==='dance'?1:r==='still'?.45:0;
    b.open=motion?T.MathUtils.damp(b.open,want,3,dt):want;b.lid.rotation.x=-1.25*b.open;
    b.dancer.visible=b.open>.2;b.dancer.rotation.y=r==='dance'&&motion?t*2.4:.7;
    // Tonight's unwound box glints where the key is, so the player sees what is waiting.
    b.glint.material.opacity=m.open&&!wound&&m.key===b.def.room?.7*pulse:m.open&&!wound?.35*pulse:0}
   // The key: in the box of its room, turning with the wind; on the cabinet in the sitting room.
   const b=boxes.find(x=>x.def.room===m.key);
   if(b){b.g.localToWorld(at.copy(b.stem));k.key.position.copy(at);
    k.key.rotation.set(0,b.g.rotation.y+(b.mirror?Math.PI:0),0);
    k.spin.rotation.x=(m.wind[b.def.doll]??0)*WIND_TURNS*Math.PI*2}
   else{k.key.position.copy(local(KEY_REST.room,KEY_REST.at));k.key.rotation.set(0,.4,Math.PI/2);k.spin.rotation.x=0}
   if(held)k.key.position.y+=.14;
   k.halo.material.opacity=held?.9*pulse:m.open?.5*pulse:0;
   for(const v of residents.dolls){const r=m.result[v.id],home=MUSIC_BOXES.find(x=>x.doll===v.id)?.room;
    const floor=ROOMS.find(q=>q.id===v.room);if(!floor)continue;const y=floor.y+.12;
    if(!night||v.room!==home||!r){if(v.musicPosed){v.musicPosed=false;v.root.rotation.y=0;v.root.position.y=y}
     v.stillX=null;continue}
    v.musicPosed=true;
    if(r==='dance'){v.stillX=null;v.root.rotation.y=motion?Math.sin(t*1.7)*.55:0;
     v.root.position.y=y+(motion?Math.abs(Math.sin(t*3.4))*.045:0)}
    else{v.stillX??=v.root.position.x;v.root.position.x=v.stillX;v.root.position.y=y;
     v.legs?.forEach(leg=>{leg.rotation.x=0})}}
  }};
}
