import * as T from 'three';
import {isNight,stitchStatus} from '../simulation.js';
import {detail} from './visual-policy.js';
import {applyLighting} from './world-lighting.js';

// One animation frame: sync every layer with the state, then draw. `w` holds the scene parts and the world's
// mutable view state.
export function renderFrame(w,state,dt,selected){
 const {st,canvas,renderer,scene,camera,controls,depthFog,hemi,key,fill,house,residents,
   ghost,courtyard,details,atmosphere,roomEffects,roomFrame,
   preview,restoration,objects,storyProps,teaTable,sewingPlay,moonChimes,decorSync,slots,
     cameraMove,working,setWorkActivity,resize,focusPose}=w;
 if(st.disposed||st.lost)return;st.reducedMotion=state.settings.reducedMotion;
 setWorkActivity(state.activities.active?.id);
 st.stitchSections=st.stitchActive?(stitchStatus(state)?.sections??[]):[];
 if(!state.paused)cameraMove.tick(dt,st.reducedMotion);
 const budget=detail(canvas.clientWidth,canvas.clientHeight,state.settings.quality,window.devicePixelRatio||1);
 if(st.quality!==budget.level){st.quality=budget.level;
 renderer.setPixelRatio(budget.pixelRatio);renderer.shadowMap.enabled=budget.shadows;resize()}
 decorSync.add(state);
 decorSync.place(state,{reducedMotion:st.reducedMotion,nightMix:st.nightMix,hiddenId:st.previewPose?.moveId});
 objects.update(state,working());
 decorSync.prune(state);slots.refresh(state,st.previewPose?.moveId);
 // Exponential interpolation is frame-rate independent; reduced motion switches instantly.
 const night=isNight(state);
 st.nightMix=state.settings.reducedMotion?Number(night):T.MathUtils.damp(st.nightMix,Number(night),2.2,dt);
 applyLighting({renderer,depthFog,hemi,key,fill,house,courtyard},{state,
   nightMix:st.nightMix,focusedRoom:st.focusedRoom});
 details.update(st.nightMix);atmosphere.update(state,st.nightMix,st.quality);
 roomEffects.update(state,st.nightMix);restoration.update(state,st.nightMix);
 storyProps.update(state,st.nightMix);teaTable.update(state);sewingPlay.update(state);
 moonChimes.update(state,st.chimeSelection);
 roomFrame.show(working()?null:st.focusedRoom);preview.update(st.previewPose,state);
 residents.update(state,dt,selected,Math.atan2(camera.position.x-controls.target.x,
   camera.position.z-controls.target.z));
 for(const doll of residents.dolls){const room=state.dolls.find(d=>d.id===doll.id)?.room;
 doll.root.visible=!(st.teaActive&&room==='kitchen'||st.stitchActive&&room==='studio'||
   st.chimeActive&&room==='bedroom')}
 if(st.focusedDoll){const room=state.dolls.find(d=>d.id===st.focusedDoll)?.room;
 if(room!==scene.userData.portraitRoom){scene.userData.portraitRoom=room;
 cameraMove.moveTo(focusPose(),st.reducedMotion)}}else scene.userData.portraitRoom=null;
 ghost.update(state.elapsed,night,state.settings.reducedMotion||state.paused,state.journal.length);
 if(working())ghost.root.visible=false;
 controls.enableDamping=!working()&&!state.settings.reducedMotion;controls.update();renderer.render(scene,camera);
}
