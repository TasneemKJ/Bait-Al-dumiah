import * as T from 'three';
import {DollhouseAudio} from '../src/audio.js';
import {createLevantineSetting} from '../src/render/levantine-setting.js';
import {createState} from '../src/simulation.js';

export function runArtChecks(){
 const checks=[],check=(name,passed)=>checks.push({name,passed:Boolean(passed)});
 const audio=new DollhouseAudio(),context=new OfflineAudioContext(1,22050,22050);
 audio.context=context;audio.master=context.createGain();audio.master.connect(context.destination);
 audio.enabled=true;audio.night=true;audio.index=7;audio.next=0;audio.nextKnock=100;
 audio.tick(true);
 check('Atmosphere: a deliberate night rest creates no Web Audio voices',audio.nodes.size===0&&audio.index===8&&audio.next>=2.5);
 audio.tick(true);check('Atmosphere: resting frames do not catch up old melody notes',audio.index===8);
 audio.stopVoices();
 const view=createLevantineSetting(new T.Group()),state=createState();
 view.update(state,0);
 check('Atmosphere: fully transparent day glow is culled rather than drawn',!view.doorGlow.visible);
 view.update(state,1);check('Atmosphere: warm door light reappears after sunset',view.doorGlow.visible&&view.doorGlow.material.opacity>0);
 return checks;
}
