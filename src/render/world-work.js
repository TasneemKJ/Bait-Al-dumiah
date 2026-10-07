// Entering or leaving a physical ritual (tea, sewing, chimes): reframe the camera, hide the pieces the ritual
// replaces, and lock orbiting.
export function applyWorkActivity(w,id){
 const {st,presentation,tapGesture,cameraMove,objects,controls,house,courtyard,working,applyFraming}=w;
 const current=st.teaActive?'tea':st.stitchActive?'stitch':st.chimeActive?'lullaby':null;
 const next=['tea','stitch','lullaby'].includes(id)?id:null;if(next===current)return;
 const room={tea:'kitchen',stitch:'studio',lullaby:'bedroom'}[next??current]??'bedroom';
 st.teaActive=next==='tea';st.stitchActive=next==='stitch';st.chimeActive=next==='lullaby';st.chimeSelection=-1;
 if(!next)presentation.reset(); // The returned house starts with its folded idle edge.
 tapGesture.cancel();cameraMove.cancel();objects.clear();st.focusedRoom=room;st.focusedDoll=null;
 controls.enabled=st.requestedEnabled&&!working();controls.enableDamping=false;
 controls.minPolarAngle=working()?.8:1.10;controls.maxPolarAngle=1.50;
 if(house.originalTeaSet)house.originalTeaSet.visible=!st.teaActive;
 if(house.studioChair)house.studioChair.visible=!st.stitchActive;
 if(house.workCeiling)house.workCeiling.visible=!st.stitchActive;
 if(courtyard.studioArch)courtyard.studioArch.visible=!st.stitchActive;
 applyFraming();
}
