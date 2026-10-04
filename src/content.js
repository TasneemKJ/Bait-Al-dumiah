// Authored identifiers are stable save contracts. Display strings live in i18n.js.
export const ROOMS = [
 {id:'kitchen',x:-2.4,y:0,tint:0xbdd9ca},
 {id:'parlor',x:2.4,y:0,tint:0xe5b9bb},
 {id:'studio',x:-2.4,y:3.2,tint:0xcebddd},
 {id:'bedroom',x:2.4,y:3.2,tint:0xe6cfaa},
];
export const DOLLS = [
 {id:'lina',color:0xc16a83,hair:0x44313b,room:'kitchen',wish:'tea',wishes:['tea','soothe','play','tea'],favRoom:'parlor',favItem:'musicbox',hunger:40,energy:84,comfort:70},
 {id:'noor',color:0x789c95,hair:0x604535,room:'bedroom',wish:'rest',wishes:['rest','tea','soothe','rest'],favRoom:'bedroom',favItem:'mobile',hunger:75,energy:35,comfort:60},
 {id:'sami',color:0xa08ab4,hair:0x3b3341,room:'studio',wish:'play',wishes:['play','rest','tea','soothe'],favRoom:'kitchen',favItem:'bear',hunger:80,energy:70,comfort:35},
];
export const CATALOG = [
 {id:'plant',price:8,cozy:4,icon:'leaf'},
 {id:'lamp',price:10,cozy:5,icon:'lamp'},
 {id:'rug',price:12,cozy:7,icon:'rug'},
 {id:'bear',price:14,cozy:6,icon:'bear'},
 {id:'mobile',price:16,cozy:8,icon:'moon'},
 {id:'musicbox',price:20,cozy:10,icon:'music'},
];
export const SLOTS = [{x:-1.5,z:1.1},{x:0,z:1.25},{x:1.5,z:1.1}];
export const SECRETS = ['music-box','small-footsteps','portrait','jasmine','tea-for-four','welcome-home'];
export const ACTIONS = {
 tea:{need:'hunger',amount:38,cost:2},
 play:{need:'comfort',amount:32,cost:0},
 rest:{need:'energy',amount:42,cost:0},
 soothe:{need:'comfort',amount:24,cost:0},
};
// Bond thresholds: each level after the first gives buttons and levels 1-3 unlock a memory.
export const BOND_LEVELS=[0,15,35,60,90];
// Later whispers wait for a cozier house; the index matches SECRETS.
export const SECRET_COZY=[0,0,45,52,60,68];
export const MILESTONES=[
 {id:'first-care',reward:5},{id:'first-keepsake',reward:5},{id:'full-house',reward:8},{id:'first-friend',reward:8},
 {id:'every-room',reward:10},{id:'room-complete',reward:10},{id:'three-whispers',reward:10},{id:'cozy-home',reward:12},
 {id:'streak-3',reward:15},{id:'family',reward:20},{id:'all-whispers',reward:25},{id:'door-open',reward:30},{id:'all-gifts',reward:40},
];
export const SEW_SECONDS=40,SEW_DAILY=9,BASKET_MAX=18,WISH_REFRESH_SECONDS=60;
// The closed door is mended in order; some steps wait for closeness or the whole story.
export const DOOR_STEPS=[
 {id:'hinge',cost:40},{id:'dust',cost:60},{id:'key',cost:80,needs:'sami-dear'},{id:'lamp',cost:100},{id:'open',cost:150,needs:'all-whispers'},
];
// After the door opens, one small gift a night is returned with a keepsake of the visitor's own.
export const GIFT_COST=12;
export const VISITOR_GIFTS=['pressed-jasmine','brass-thimble','paper-boat','sugar-cube','blue-bead','tiny-key','folded-letter','fifth-cup'];
export const SAVE_KEY='bait-al-dumiah.v1';
export const ACTIVITIES=[
 {id:'tea',resident:'lina',room:'kitchen',icon:'tea',choices:['leaf','tea','heart','spark'],seed:1},
 {id:'stitch',resident:'sami',room:'studio',icon:'button',choices:['button','leaf','moon','heart'],seed:2},
 {id:'lullaby',resident:'noor',room:'bedroom',icon:'music',choices:['moon','music','spark','heart'],seed:3},
];
export const ACTIVITY_THRESHOLDS=[0,2,5,9],ACTIVITY_DAILY_CAP=2,ACTIVITY_COOLDOWN=20;
// Shared table geometry; simulation alone judges stream landing and fill targets.
export const TEA_TABLE={room:'kitchen',x:-.53,y:.779,z:.10,aimSpan:.45,cupZ:.14,cupRadius:.112,cupOuterRadius:.14,cupHeight:.24};
// Physical sewing coordinates are normalized cloth x/z; rules own all acceptance.
export const STITCH_TABLE={room:'studio',x:-.35,y:.891,z:.05,clothScale:.46,hoopRadius:.46,gripHeight:.38,boardSize:[1.68,.06,1.15],boardEdgePadding:.015,spoolOffset:[.65,0,.03],finishOffset:[-.65,0,.15],gripDiameter:.35,spoolDiameter:.35,finishSize:[.35,.54]};
const stitchSections=(anchors,bend)=>anchors.slice(0,-1).map((p,i)=>[p,[(p[0]+anchors[i+1][0])/2*bend,(p[1]+anchors[i+1][1])/2*bend],anchors[i+1]]);
export const STITCH_PATTERNS=[
 {id:'bear-seam',sections:[[[-.58,-.05],[-.30,-.20],[0,-.05]],[[0,-.05],[.30,.15],[.58,-.05]]]},
 {id:'leaf',sections:[[[-.60,0],[-.30,-.40],[0,-.60]],[[0,-.60],[.30,-.30],[.60,0]],[[.60,0],[.20,.35],[-.60,0]]]},
 {id:'diamond',sections:stitchSections([[-.60,0],[0,-.60],[.60,0],[0,.60],[-.60,0]],1.20)},
 {id:'jasmine',sections:stitchSections([[0,-.68],[.65,-.21],[.40,.55],[-.40,.55],[-.65,-.21],[0,-.68]],.45)},
 {id:'heart',sections:stitchSections([[0,-.15],[.35,-.45],[.65,-.15],[.40,.35],[0,.65],[-.40,.35],[-.65,-.15],[-.35,-.45],[0,-.15]],1)},
];
export const RESTORATION_COSTS=[45,85,140],RESTORATION_MASTERY=[1,3,6];
export const INTERACTIVE_PROPS=[
 {id:'tea-set',room:'kitchen',position:[-.53,.92,.1],size:[1.1,.55,.75],icon:'tea',activity:'tea',resident:'lina',care:'tea'},
 {id:'sewing-machine',room:'studio',position:[-.35,1.08,-.78],size:[.9,.60,.55],icon:'button',activity:'stitch',resident:'sami',care:'play'},
 {id:'moon-bed',room:'bedroom',position:[-.48,.75,-.42],size:[1.8,1.1,2.1],icon:'rest',activity:'lullaby',resident:'noor',care:'rest'},
 {id:'moon-mobile',room:'bedroom',position:[-1.70,2.36,-.60],size:[.90,1.00,.30],icon:'music',activity:'lullaby'},
 {id:'parlor-sofa',room:'parlor',position:[.42,.74,-.63],size:[2.5,1.1,1.0],icon:'heart',resident:'lina',care:'play'},
 {id:'mint-tin',room:'kitchen',position:[-.30,1.20,-1.04],size:[.36,.26,.30],icon:'leaf',story:true},
 {id:'music-cabinet',room:'parlor',position:[1.66,.75,.25],size:[.64,1.18,.60],icon:'music',story:true},
 {id:'wash-basin',room:'kitchen',position:[-1.27,1.08,-1.06],size:[.62,.28,.50],icon:'tea',story:true},
 {id:'jasmine-window',room:'parlor',position:[-.90,1.48,-1.43],size:[.54,.78,.32],icon:'leaf',story:true},
 {id:'doorstep',room:'parlor',position:[.2,.27,1.95],size:[.78,.40,.46],icon:'ghost',story:true},
];
// Stable story steps define the only carried item; saved progress derives inventory.
export const STORY_ITEMS=[
 {id:'red-thread',icon:'button'},{id:'mended-bear',icon:'bear'},
 {id:'brass-key',icon:'spark'},{id:'bent-cylinder',icon:'music'},{id:'repaired-cylinder',icon:'music'},
 {id:'water-ewer',icon:'tea'},{id:'jasmine-sprig',icon:'leaf'},{id:'guest-cup',icon:'tea'},
];
export const STORY_CHAPTERS=[
 {id:'mended-friend',icon:'bear',reward:12,steps:[
  {object:'mint-tin',gives:'red-thread',icon:'leaf'},
  {object:'sewing-machine',gives:'mended-bear',icon:'button'},
  {object:'moon-bed',gives:null,icon:'bear'},
 ]},
 {id:'lost-song',icon:'music',reward:16,steps:[
  {object:'parlor-sofa',gives:'brass-key',icon:'heart'},
  {object:'music-cabinet',gives:'bent-cylinder',icon:'spark'},
  {object:'sewing-machine',gives:'repaired-cylinder',icon:'button'},
  {object:'music-cabinet',gives:null,icon:'music'},
 ]},
 {id:'guest-tea',icon:'tea',reward:20,steps:[
  {object:'wash-basin',gives:'water-ewer',icon:'tea'},
  {object:'jasmine-window',gives:'jasmine-sprig',icon:'leaf'},
  {object:'tea-set',gives:'guest-cup',icon:'tea'},
  {object:'doorstep',gives:null,icon:'ghost'},
 ]},
];
