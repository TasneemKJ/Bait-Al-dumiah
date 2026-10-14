// Daily errands, the courtyard lantern and the other reference-game systems. Ids are stable save contracts;
// display strings live in locale-grove.js.
// An errand names the house action that finishes it (`on`, optional `arg`) and what must exist for it to be
// possible (`needs`), so a day never asks for a keepsake the player does not own.
export const ERRANDS=[
 {id:'care-lina',on:'care',arg:'lina',icon:'tea'},
 {id:'care-noor',on:'care',arg:'noor',icon:'rest'},
 {id:'care-sami',on:'care',arg:'sami',icon:'play'},
 {id:'basket',on:'basket',icon:'button'},
 {id:'ritual-tea',on:'ritual',arg:'tea',icon:'tea'},
 {id:'ritual-stitch',on:'ritual',arg:'stitch',icon:'button'},
 {id:'ritual-lullaby',on:'ritual',arg:'lullaby',icon:'music'},
 {id:'water-plant',on:'use',arg:'plant',icon:'leaf',needs:'plant'},
 {id:'light-lamp',on:'use',arg:'lamp',icon:'lamp',needs:'lamp'},
 {id:'wind-musicbox',on:'use',arg:'musicbox',icon:'music',needs:'musicbox'},
 {id:'rock-mobile',on:'use',arg:'mobile',icon:'moon',needs:'mobile'},
 {id:'place',on:'place',icon:'leaf'},
 {id:'whisper',on:'whisper',icon:'ghost',needs:'whisper'},
 {id:'gift',on:'gift',icon:'ghost',needs:'door'},
];
export const ERRANDS_PER_DAY=3;
// The courtyard lantern: total warmth needed for each level (0 is a cold wick, 5 lights the whole lane).
export const LANTERN_LEVELS=[0,3,8,15,24,36];
