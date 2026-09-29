import * as T from 'three';
import {createLevantineSetting} from '../src/render/levantine-setting.js';
import {createRoomEffects} from '../src/render/room-effects.js';

export function runArtChecks(){
 const checks=[];const check=(name,passed)=>checks.push({name,passed:Boolean(passed)});
 const courtyard=createLevantineSetting(new T.Group());
 check('Atmosphere detail: passing shadow is an ambiguous jasmine-lattice motif',courtyard.shadow.userData.motif==='jasmine-lattice');
 const room=createRoomEffects(new T.Group());
 const patches=[];room.root.traverse(o=>{if(o.name==='window-light-patch')patches.push(o)});
 check('Atmosphere detail: window light uses an arched lattice pattern',patches.length===3&&patches.every(p=>p.userData.pattern==='arched-lattice'));
 return checks;
}
