import {DOLLS,ROOMS,ACTIVITIES,ACTIVITY_COOLDOWN} from './content.js';

// A fresh house: the state every new game and every failed load starts from.
export function createState(){
 return {version:1,elapsed:0,clock:0,day:1,buttons:36,unease:12,cares:0,
  dolls:DOLLS.map(d=>({id:d.id,room:d.room,hunger:d.hunger,energy:d.energy,comfort:d.comfort,lastCare:-10,action:'idle',actionUntil:0,bond:0,sew:0})),
  decor:[],nextId:1,wishes:[],journal:[],lastSecretDay:0,paused:false,
  streak:0,lastFullDay:0,sewnToday:0,basket:0,earnedToday:0,achieved:[],milestones:[],events:[],door:0,
    gifts:[],lastGiftDay:0,dayTime:0,hints:{night:false,calm:false},
  activities:{mastery:Object.fromEntries(ACTIVITIES.map(a=>[a.id,0])),completed:Object.fromEntries(ACTIVITIES.map(a=>[a.id,0])),
    lastReward:Object.fromEntries(ACTIVITIES.map(a=>[a.id,-ACTIVITY_COOLDOWN])),teaRecords:[null,null,
      null,null],stitchRecords:[null,null,null,null],active:null},
  restoration:Object.fromEntries(ROOMS.map(r=>[r.id,0])),
  story:{chapter:0,step:0,lastAction:null,lastActionAt:-10},
  settings:{locale:'en',muted:true,reducedMotion:false,quality:'auto',largeText:false}};
}
