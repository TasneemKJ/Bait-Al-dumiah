/* Game Center for the iPhone app: the seven achievements, the one leaderboard,
   and the expression TasKit evaluates in the page to read them off the save.

   TasKit (TasBootScripts.snapshot) splices PROGRESS_SCRIPT into one line,
   `try{out.progress=(EXPR);}catch(e){}`, right after the page's save hook has
   written the house, so the expression must never break that line: single
   quotes only, no comments, no backslashes, no double quotes, no trailing
   semicolon. It returns {achievements:{key:true|false}, scores:{key:whole number}}
   and guards every field itself: it reads the raw save, not restore()'s clean copy.
   ios/BaitAlDumiah/BaitConfig.swift embeds the same string;
   tests/ios-game-center.test.mjs checks they match, byte for byte.

   It reads the one house (SAVE_KEY in src/content.js). Milestones the game has
   recorded (`achieved`, `milestones`) stand in for a house that changed since:
   a keepsake taken out of a room, say. Nothing here is behind a purchase: the
   door, the fifth room and its gifts, and the canary, are left out on purpose.
   - firstTea        a tea ritual served at the kitchen table (teaRecords or tea
                     mastery), or the guest's cup poured in the third story
   - threeWishes     lastFullDay: all three wishes granted on one day (full-house)
   - everyRoom       a keepsake in each of the four rooms (every-room)
   - beforeNightfall something the midnight visitor borrowed, found before the next
                     nightfall: nights taken, less those lost and the one still out
                     (the log keeps only the last twelve nights, so it is a fallback)
   - threeWhispers   three of the shy visitor's whispers heard (three-whispers)
   - wholeStory      the game's own ending line (src/objective-ui.js objectiveComplete):
                     all six whispers, the three stories and all twelve corners furnished
   - rainNight       arc.rain: the fifth visit's night, when it rains (hidden)
   - daysKept        arc.visits: distinct calendar days the house was opened, never the
                     in-game dawns the light control can hurry */

export const SAVE_KEY = 'bait-al-dumiah.v1';
export const ROOM_IDS = Object.freeze(['kitchen', 'parlor', 'studio', 'bedroom']);
export const KEEPSAKE_IDS = Object.freeze(['plant', 'lamp', 'rug', 'bear', 'mobile', 'musicbox']);
export const SECRET_IDS = Object.freeze(['music-box', 'small-footsteps', 'portrait', 'jasmine', 'tea-for-four',
  'welcome-home']);
export const CORNERS = 3, CHAPTERS = 3, MAX_VISITS = 999;
const list = (xs) => xs.map((x) => `'${x}'`).join(',');

export const PROGRESS_SCRIPT = [
  '(function(){',
  'var o={achievements:{},scores:{}},a=o.achievements;',
  "var ob=function(v){return v&&typeof v==='object'&&!Array.isArray(v)?v:{};};",
  'var ar=function(v){return Array.isArray(v)?v:[];};',
  "var n=function(v){return typeof v==='number'&&isFinite(v)&&v>0?Math.floor(Math.min(v,1e6)):0;};",
  `var s;try{s=ob(JSON.parse(localStorage.getItem('${SAVE_KEY}')));}catch(e){s={};}`,
  'var got=ar(s.achieved).concat(ar(s.milestones)),has=function(k){return got.indexOf(k)>=0;};',
  'var act=ob(s.activities),st=ob(s.story),m=ob(s.mischief),arc=ob(s.arc),j=ar(s.journal);',
  `var rooms=[${list(ROOM_IDS)}],items=[${list(KEEPSAKE_IDS)}],secrets=[${list(SECRET_IDS)}];`,
  'var heard=secrets.filter(function(x){return j.indexOf(x)>=0;}).length;',
  "var put=ar(s.decor).map(ob).filter(function(d){return rooms.indexOf(d.room)>=0&&items.indexOf(d.item)>=0&&",
  `typeof d.slot==='number'&&d.slot>=0&&d.slot<${CORNERS}&&Math.floor(d.slot)===d.slot;});`,
  'var corners=[];put.forEach(function(d){var c=d.room+d.slot;if(corners.indexOf(c)<0)corners.push(c);});',
  "var poured=ar(act.teaRecords).some(function(v){return typeof v==='number'&&isFinite(v)&&v>=0;});",
  `a.firstTea=poured||n(ob(act.mastery).tea)>=1||n(st.chapter)>=${CHAPTERS};`,
  "a.threeWishes=n(s.lastFullDay)>0||has('full-house');",
  "a.everyRoom=has('every-room')||rooms.every(function(r){return put.some(function(d){return d.room===r;});});",
  'var found=n(m.nights)-n(m.losses)-(m.item?1:0);',
  'a.beforeNightfall=found>=1||ar(m.log).some(function(e){return ob(e).found===true;});',
  "a.threeWhispers=heard>=3||has('three-whispers')||has('all-whispers');",
  `a.wholeStory=heard>=${SECRET_IDS.length}&&n(st.chapter)>=${CHAPTERS}&&`,
  `corners.length>=${ROOM_IDS.length * CORNERS};`,
  'a.rainNight=arc.rain===true;',
  `var v=Math.min(n(arc.visits),${MAX_VISITS});if(v>0)o.scores.daysKept=v;`,
  'return o;',
  '})()',
].join('');

/* What App Store Connect shows. Names up to 30 characters, descriptions up to
   200, Arabic written as plain fusha. `hidden` keeps the text secret until
   earned. The house is tender and a little watched: nothing here is a prize. */
export const ACHIEVEMENTS = Object.freeze([
  {
    key: 'firstTea', id: 'bait.milestone.1_first_tea', points: 10, hidden: false,
    en: { name: 'The First Pour', before: 'Pour a round of tea at the kitchen table and serve it.',
      after: 'The cups were filled to the line. Lina set out one more than anyone asked for.' },
    ar: { name: 'الصبّة الأولى', before: 'اسكب الشاي على طاولة المطبخ وقدّمه.',
      after: 'امتلأت الأكواب حتى الحدّ، ووضعت لينا كوباً زائداً لم يطلبه أحد.' },
  },
  {
    key: 'threeWishes', id: 'bait.milestone.2_three_wishes', points: 15, hidden: false,
    en: { name: 'Three Wishes in a Day', before: 'Grant Lina, Noor and Sami their wishes on the same day.',
      after: 'For once nobody in the house wanted anything. It lasted until evening.' },
    ar: { name: 'ثلاث أمنيات في يوم', before: 'حقّق أمنيات لينا ونور وسامي في اليوم نفسه.',
      after: 'لم يبقَ في البيت أحد يتمنّى شيئاً، ودام ذلك حتى المساء.' },
  },
  {
    key: 'everyRoom', id: 'bait.milestone.3_every_room', points: 15, hidden: false,
    en: { name: 'Something in Every Room', before: 'Place a keepsake in each of the four rooms.',
      after: 'Every room has something to look after now. Some of them look back.' },
    ar: { name: 'لكل غرفة نصيبها', before: 'ضع تذكاراً في كل غرفة من الغرف الأربع.',
      after: 'صار في كل غرفة ما يُعتنى به. وبعضها يردّ النظر.' },
  },
  {
    key: 'beforeNightfall', id: 'bait.milestone.4_before_nightfall', points: 20, hidden: false,
    en: { name: 'Back Before Nightfall',
      before: 'When the midnight visitor borrows something, find it before the next nightfall.',
      after: 'Home again. The footprints that led away were very small, and nobody apologised.' },
    ar: { name: 'قبل أن يحلّ الليل',
      before: 'حين يستعير زائر منتصف الليل شيئاً، اعثر عليه قبل أن يحلّ الليل التالي.',
      after: 'عاد إلى مكانه. كانت آثار الأقدام صغيرة جداً، ولم يعتذر أحد.' },
  },
  {
    key: 'threeWhispers', id: 'bait.milestone.5_three_whispers', points: 20, hidden: false,
    en: { name: 'Heard After Dark', before: 'Hear three whispers from the shy visitor at night.',
      after: 'It speaks only when the house is warm enough, and never louder than the kettle.' },
    ar: { name: 'همسٌ بعد العتمة', before: 'اسمع ثلاث همسات من الزائر الخجول في الليل.',
      after: 'لا يتكلّم إلا حين يدفأ البيت، ولا يعلو صوته على صوت الإبريق.' },
  },
  {
    key: 'wholeStory', id: 'bait.milestone.6_the_whole_story', points: 50, hidden: false,
    en: { name: 'The House’s Story',
      before: 'Hear all six whispers, finish the three stories and fill every corner of the house.',
      after: 'There is nothing left to find. Someone still sets a cup at the threshold every night.' },
    ar: { name: 'حكاية البيت', before: 'اسمع الهمسات الستّ، وأتمّ الحكايات الثلاث، واملأ كل زاوية في البيت.',
      after: 'لم يبقَ شيء لتجده، ومع ذلك يضع أحدهم كوباً عند العتبة كل ليلة.' },
  },
  {
    key: 'rainNight', id: 'bait.milestone.7_the_rain_night', points: 30, hidden: true,
    en: { name: 'The Night It Rained', before: 'Some nights are kept for those who keep coming back.',
      after: 'Rain on the shutters. The three kept together in the sitting room until it stopped.' },
    ar: { name: 'ليلة المطر', before: 'بعض الليالي محفوظة لمن يواظب على العودة.',
      after: 'مطرٌ يطرق المصاريع، والثلاثة مجتمعون في غرفة الجلوس حتى توقّف.' },
  },
]);

/* Arabic counts take different noun forms (ثلاثة أيام، أحد عشر يوماً), so the
   Arabic board shows the bare number under its name, which already says days. */
export const LEADERBOARD = Object.freeze({
  key: 'daysKept', id: 'bait.daysKept',
  en: { name: 'Days Kept', suffix: 'days', suffixSingular: 'day' },
  ar: { name: 'أيام في البيت' },
});
