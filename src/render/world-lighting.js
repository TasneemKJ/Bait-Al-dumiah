import * as T from 'three';
import {lighting,duskGlow,fog as fogPolicy,practicalLight} from './visual-policy.js';

// Sets every light, the fog and the window glow from the blend between day and night.
export function applyLighting(rig,{state,nightMix,focusedRoom}){
 const {renderer,depthFog,hemi,key,fill,house,courtyard}=rig;
 const cue=courtyard.update(state,nightMix),look=lighting(nightMix),
   haze=fogPolicy(nightMix);hemi.intensity=look.ambient;key.intensity=look.key;
 fill.intensity=look.rim;renderer.toneMappingExposure=look.exposure;
 depthFog.density=haze.density;depthFog.color.setHex(haze.color);
 hemi.color.set(0xe9e0d5).lerp(new T.Color(0x849bc9),nightMix);const dusk=duskGlow(state.clock);
 key.color.set(0xffe5c2).lerp(new T.Color(0xffa860),dusk*.75).lerp(new T.Color(0xb8caff),
   nightMix);key.intensity*=1+.12*dusk;
 fill.color.set(0xb8cbd5).lerp(new T.Color(0x829bdb),nightMix);
 // Each persistent room lamp keeps its own miniature-film colour and falloff;
 // the global night cue still owns overall lamp energy. Lamps are found by room tag.
 for(const l of house.lights){if(!l.isLight||!l.userData.room)continue;
 const p=practicalLight(l.userData.room,nightMix,look.lamps,cue.lamp,focusedRoom===l.userData.room);
 l.intensity=p.intensity;l.color.setHex(p.color);l.distance=p.distance}
 house.windows.forEach(m=>{m.emissive.set(0x8baaca).lerp(new T.Color(0xffc27d),
   dusk*(1-nightMix));m.emissiveIntensity=.14+nightMix*.62+dusk*.30});
}
