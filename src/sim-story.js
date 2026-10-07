// The hidden-house story: objects, carried items, chapters and replayable keepsakes.
import {storyStatus,advanceStory} from './sim-core.js';
import {createTea} from './sim-tea.js';
import {createStitch} from './sim-stitch.js';
import {fail} from './sim-util.js';
import {INTERACTIVE_PROPS} from './content.js';
export function interactStory(s,key){
 if(s.paused)return fail('pausedActivity');
 if(typeof key!=='string'||!INTERACTIVE_PROPS.some(p=>'prop:'+p.id===key))return fail('invalid');
 if(s.activities.active)return fail('activityBusy');
 const status=storyStatus(s);if(status.finished)return fail('storyFinished');
 if(key!=='prop:'+status.next.object)return fail('storyNotHere');
 if(status.chapter.id==='mended-friend'&&status.step===1){s.activities.active=createStitch(s,'mend');
 return {ok:true,startedActivity:'stitch',mode:'mend',held:status.held}}
 if(status.chapter.id==='guest-tea'&&status.step===2){s.activities.active=createTea(s,'guest');
 return {ok:true,startedActivity:'tea',mode:'guest',held:status.held}}
 return advanceStory(s,status);
}
// Earned tableaux remain toys; replay records a visual cue, never progression.
export function playStoryKeepsake(s,key){
 if(s.paused)return fail('pausedActivity');
 const chapters={'prop:moon-bed':'mended-friend','prop:music-cabinet':'lost-song','prop:doorstep':'guest-tea'};
 if(typeof key!=='string'||!Object.hasOwn(chapters,key))return fail('invalid');
 if(!storyStatus(s).completed.includes(chapters[key]))return fail('storyNotReady');
 s.story.lastAction=key;s.story.lastActionAt=s.elapsed;
 const effect=key.slice(5);return {ok:true,effect,message:'story-replay-'+effect};
}
