// The iPhone app's purchases (src/store-ui.js). Shown only inside the app: on the web nothing is for
// sale and the door is open (src/access.js). The App Store's price replaces {price}, kept left to right.
export default {
 en:{
  storeTitle:'More of the house',
  storeIntro:'The whole house is free. Two small extras, if you like.',
  fifthName:'The Fifth Room',
  fifthNote:'At once: the door opens a crack, its first mending done, a jasmine on the threshold. '+
   'Then free mendings (Sami\'s key, six whispers), the room and its gifts. Paid once.',
  fifthOwned:'Yours. The door is open; its last mendings are free (Sami\'s key, then the six whispers).',
  fifthDelivered:'The closed door opens a crack. A pressed jasmine waits on the threshold. Four free mendings '+
   'remain: Sami\'s key, then all six whispers.',
  doorOwnedIntro:'The Fifth Room is yours: the door is open a crack. The mendings that open it fully '+
   'cost no buttons. The key waits until Sami holds you dear; the last waits until you have heard all six '+
   'whispers. Then the visitor\'s gifts come, one a night.',
  canaryName:'The canary',
  canaryNote:'A canary by the sitting room window. It sings by day, and softly into the night. On a night the '+
   'midnight visitor will come, it falls silent at dusk and turns to face the room the visitor will come to first. '+
   'It finds nothing for you, and its songs are lines anyone reads free in Little souls.',
  canaryOwned:'On. The canary is in the sitting room. Look in on it at dusk.',
  storeMonthly:'{price} a month',storeYearly:'{price} a year',
  storeRenews:'Monthly or yearly. Renews automatically unless cancelled in your Apple Account settings at least '+
   '24 hours before the period ends. Then the canary flies home; nothing else changes.',
  storeBuy:'Buy',storeOwned:'Yours',storeLoading:'Asking the App Store…',storeBuying:'Waiting for the App Store…',
  storePending:'Waiting for approval. It opens when it is given.',
  storeFailed:'The App Store could not finish that. Nothing was charged.',
  storeUnavailable:'The App Store is not answering. Try again later.',
  storeNothing:'Nothing to restore on this Apple Account.',
  storeRestore:'Restore purchases',storeManage:'Manage subscription',storeTerms:'Terms of Use',
  storePrivacy:'Privacy Policy',
  storeSettings:'The Fifth Room and the canary',storeSettingsOpen:'See',
  doorLocked:'The closed door opens with The Fifth Room.',
  doorLockedIntro:'Between the four rooms there is a door no one mentions. Behind it: a fifth room, '+
   'and a visitor who leaves gifts. It opens with The Fifth Room.',
  doorLockedSee:'See The Fifth Room',
  canaryArrived:'A canary has come to live by the sitting room window.',
  // The canary's word the morning after the visitor (src/cmd-store.js), on a paper slip by its cage.
  'canaryMorning-0':'The canary has decided it saw nothing. It is lying.',
  'canaryMorning-1':'The canary is pretending to be a small lemon. It believes this is working.',
  'canaryMorning-2':'The canary counted the footsteps last night. It will not say how many feet there were.',
  'canaryMorning-3':'The canary sings a little too loudly this morning, like someone with a clear conscience.',
  'canaryMorning-4':'The canary would like it noted that it was asleep. Its eyes were open.',
  'canaryMorning-5':'The canary has moved its seeds to the far side of the cage. Just in case.',
  'canaryMorning-6':'One feather on the canary is out of place. The canary has no comment.',
  'canaryMorning-7':'The canary is not taking questions at this time.',
  'canaryMorning-8':'The canary saw everything. Fortunately, it has a very small memory.',
  'canaryMorning-9':'The canary whistled the visitor\'s tune by mistake, then stared hard at the wall.',
  homePromise:'A tiny home. Three little souls. A few beautiful secrets.',
  barObjects:'Things',barTools:'Tools',barSound:'Sound',barPause:'Pause',barHouse:'House',
  keepsakeWish:'{doll}’s wish today:',keepsakeWishGranted:'just where I hoped. Thank you.',
  objectiveComplete:'Every whisper is heard and every corner is loved. This house’s story is complete; come by any '+
   'day for tea.',
  shareLabel:'A picture of your house',shareAction:'Share',shareUnavailable:'The picture could not be made just now.',
  hapticsLabel:'Haptics',hapticsHelp:'A small tap under your finger for each press.',supportLink:'Support',
  creditsLine:'Made in three.js (MIT licence); the licences ship inside the app.',
 },
 ar:{
  storeTitle:'أكثر من البيت',
  storeIntro:'البيت كلّه بغرفه الأربع مجاناً. وهناك إضافتان صغيرتان إن أحببت.',
  fifthName:'الغرفة الخامسة',
  fifthNote:'فوراً: ينفتح الباب قليلاً، ويكتمل أول إصلاح، وياسمينة مجفّفة على العتبة. ثم إصلاحات مجانية (مفتاح '+
   'سامي، والهمسات الستّ)، والغرفة الخامسة وهدايا الضيف. تدفع ثمنها مرة واحدة.',
  fifthOwned:'صارت لك. الباب مفتوح، وآخر إصلاحاته مجانية (مفتاح سامي، ثم الهمسات الستّ).',
  fifthDelivered:'انفتح الباب المغلق قليلاً. ياسمينة مجفّفة تنتظر على العتبة. بقيت أربعة إصلاحات مجانية: مفتاح '+
   'سامي، ثم الهمسات الستّ كلّها.',
  doorOwnedIntro:'صارت الغرفة الخامسة لك: الباب مفتوح قليلاً. الإصلاحات التي تفتحه تماماً لا تكلّف زرّاً واحداً. '+
   'المفتاح ينتظر حتى تبلغ درجة المودّة مع سامي، والأخير حتى تسمع الهمسات الستّ كلّها. وبعدها تأتي هدايا الضيف، '+
   'هدية في كل ليلة.',
  canaryName:'الكناري',
  canaryNote:'كناري بجانب نافذة غرفة الجلوس، يغنّي في النهار، وبصوت خافت في أول الليل. وفي الليلة التي سيأتي '+
   'فيها الزائر، يصمت عند الغروب ويلتفت نحو الغرفة التي سيأتيها الزائر أولاً. لا يجد لك شيئاً، وأغانيه كلمات '+
   'يقرؤها أيّ أحد مجاناً في «أهل البيت».',
  canaryOwned:'مفعَّل. الكناري في غرفة الجلوس. انظر إليه عند الغروب.',
  storeMonthly:'{price} في الشهر',storeYearly:'{price} في السنة',
  storeRenews:'شهري أو سنوي. يتجدّد تلقائياً ما لم تلغِه من إعدادات حساب Apple قبل نهاية المدّة بـ٢٤ ساعة على الأقل. '+
   'وحين ينتهي، يعود الكناري إلى بيته ولا يتغيّر شيء آخر.',
  storeBuy:'اشترِ',storeOwned:'لك',storeLoading:'نسأل App Store…',storeBuying:'ننتظر App Store…',
  storePending:'ننتظر الموافقة. تنفتح حين تُمنح.',
  storeFailed:'لم يستطع App Store أن يكمل. لم يُخصم شيء.',
  storeUnavailable:'App Store لا يجيب الآن. جرّب لاحقاً.',
  storeNothing:'لا شيء تستعيده على حساب Apple هذا.',
  storeRestore:'استعد المشتريات',storeManage:'إدارة الاشتراك',storeTerms:'شروط الاستخدام',
  storePrivacy:'سياسة الخصوصية',
  storeSettings:'الغرفة الخامسة والكناري',storeSettingsOpen:'انظر',
  doorLocked:'الباب المغلق ينفتح مع الغرفة الخامسة.',
  doorLockedIntro:'بين الغرف الأربع باب لا يذكره أحد. خلفه غرفة خامسة، وضيف يترك هدايا. ينفتح مع الغرفة الخامسة.',
  doorLockedSee:'انظر الغرفة الخامسة',
  canaryArrived:'جاء كناري ليسكن بجانب نافذة غرفة الجلوس.',
  'canaryMorning-0':'قرّر الكناري أنه لم يرَ شيئاً. إنه يكذب.',
  'canaryMorning-1':'يتظاهر الكناري بأنه ليمونة صغيرة، ويظنّ أن الحيلة تنجح.',
  'canaryMorning-2':'عدّ الكناري الخطوات الليلة الماضية، ولن يقول كم كان عدد الأقدام.',
  'canaryMorning-3':'يغنّي الكناري هذا الصباح بصوت أعلى قليلاً من المعتاد، كمن ضميره مرتاح.',
  'canaryMorning-4':'يريد الكناري أن يُسجَّل أنه كان نائماً. كانت عيناه مفتوحتين.',
  'canaryMorning-5':'نقل الكناري حبوبه إلى الطرف البعيد من القفص، احتياطاً لا أكثر.',
  'canaryMorning-6':'في جناح الكناري ريشة في غير مكانها، والكناري لا يعلّق.',
  'canaryMorning-7':'الكناري لا يجيب عن الأسئلة في الوقت الحالي.',
  'canaryMorning-8':'رأى الكناري كل شيء. ولحسن الحظ، ذاكرته صغيرة جداً.',
  'canaryMorning-9':'صفّر الكناري لحن الزائر سهواً، ثم حدّق في الحائط طويلاً.',
  homePromise:'بيت صغير، ثلاثة قلوب صغيرة، وبضعة أسرار جميلة.',
  barObjects:'أشياء',barTools:'أدوات',barSound:'الصوت',barPause:'وقفة',barHouse:'البيت',
  keepsakeWish:'أمنية {doll} اليوم:',keepsakeWishGranted:'في مكانها تماماً. سلمت يداك.',
  objectiveComplete:'سُمعت كل الهمسات وصارت كل زاوية محبوبة. اكتملت حكاية هذا البيت؛ زُرنا أيّ يوم لنشرب الشاي.',
  shareLabel:'صورة لبيتك',shareAction:'شارك',shareUnavailable:'لم نستطع أن نصنع الصورة الآن.',
  hapticsLabel:'الاهتزاز',hapticsHelp:'نقرة صغيرة تحت إصبعك مع كل ضغطة.',supportLink:'الدعم',
  creditsLine:'صُنعت بـ three.js (رخصة MIT)، والرخص موجودة داخل التطبيق.',
 },
};
