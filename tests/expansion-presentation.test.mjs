import test from 'node:test';
import assert from 'node:assert/strict';
import {strings} from '../src/i18n.js';
import {ACTIVITIES,ROOMS} from '../src/content.js';
test('activities and every restoration stage have authored English and Arabic',()=>{
 const keys=['activities','activitiesIntro','activityStart','activityAgain','activityInstructions','activityMistake','activityFinished','activityPractice','activityReward','activityCooldown','activityCap','restoreTitle','restoreIntro','restoreAction','restorationLocked','restorationDone','restoreSuccess','activityObjective','restorationObjective','masteryLabel','patternLabel','choicesLabel','activityNext','activityExit','practiceLabel','pausedActivity'];
 for(const a of ACTIVITIES)keys.push('activity-'+a.id,'activity-'+a.id+'Intro',...a.choices.map((_,i)=>'choice-'+a.id+'-'+i));
 for(const r of ROOMS)for(let i=1;i<=3;i++)keys.push('restore-'+r.id+'-'+i);
 for(const lang of ['en','ar'])for(const k of keys)assert.ok(strings[lang][k],`${lang}: ${k}`);
});
