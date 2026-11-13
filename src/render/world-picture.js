import {renderFrame} from './world-frame.js';

// One still of the whole house at night for the share card. The camera and focus are put back afterwards; `use`
// receives the canvas in the same task as the render, while its drawing buffer is still valid.
export function takePicture(w,state,use){
 const {st,canvas,applyFraming,resize,working}=w;if(st.disposed||st.lost||working())return null;
 const room=st.focusedRoom,doll=st.focusedDoll;st.focusedRoom=null;st.focusedDoll=null;applyFraming();resize();
 const night={...state,clock:130,paused:false,settings:{...state.settings,reducedMotion:true}};
 renderFrame(w,night,0,null);
 let result=null;try{result=use(canvas)}finally{st.focusedRoom=room;st.focusedDoll=doll;applyFraming()}
 return result;
}
