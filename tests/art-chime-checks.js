import * as T from 'three';
import {createMoonChimes} from '../src/render/moon-chimes.js';
import {createState,beginActivity,step,grabChime,pullChime,releaseChime,cancelChime,endActivity} from '../src/simulation.js';
export function runArtChecks(){
 const results=[],check=(name,passed)=>results.push({name,passed:Boolean(passed)});
 const parent=new T.Group(),instrument=createMoonChimes(parent),s=createState();instrument.update(s);
 check('moon instrument stays hidden until physical play begins',!instrument.root.visible);
 check('moon instrument has four distinct grab targets and one physical replay moon',instrument.targets.length===5&&new Set(instrument.targets.map(t=>t.userData.chime)).size===5);
 check('the earned constellation is absent from a fresh bedroom',!instrument.constellation.visible);
 beginActivity(s,'lullaby');instrument.update(s);check('moon instrument enters the room rather than an answer sheet',instrument.root.visible&&instrument.status().phase==='listen');
 for(let i=0;i<40&&s.activities.active.phase==='listen';i++)step(s,.1);
 grabChime(s,2);pullChime(s,.75);instrument.update(s);const held=instrument.status();
 check('actual jasmine mesh follows the validated physical pull',Math.abs(held.centers[2][1]-(1.16-.75*.44))<1e-9);
 cancelChime(s);instrument.update(s);check('cancelled pull returns the charm to its resting height',instrument.status().centers[2][1]===1.16);
 s.settings.reducedMotion=true;let result;for(const note of [...s.activities.active.pattern].reverse()){grabChime(s,note);pullChime(s,.7);result=releaseChime(s)}instrument.update(s);
 check('completed echo visibly lights every pendant',result.complete&&instrument.status().allLit);
 check('reduced-motion pendants have no spring rotation',instrument.status().turns.every(n=>n===0));
 const pos=JSON.stringify(instrument.status().centers);step(s,.1);instrument.update(s);check('reduced-motion finished instrument keeps a stable physical pose',JSON.stringify(instrument.status().centers)===pos);
 endActivity(s);instrument.update(s);check('earned constellation remains in the room after exiting',instrument.constellation.visible&&instrument.status().earnedStars===1);
 check('only earned stars are visible, not the whole progression at once',instrument.constellation.children.filter(c=>c.visible).length===1);
 check('all five physical targets have finite real world anchors',(()=>{beginActivity(s,'lullaby');instrument.update(s);return instrument.points().length===5&&instrument.points().every(p=>p.world.every(Number.isFinite))})());
 return results;
}
