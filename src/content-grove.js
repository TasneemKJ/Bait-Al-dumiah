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
 // Seasonal event errands join the day's three while their event runs; they are never drawn from the pool.
 {id:'event-olive',on:'cook',icon:'leaf',event:'olive',embers:2},
 {id:'event-lamps',on:'tend',icon:'lamp',event:'lamps',embers:2},
 {id:'event-almond',on:'hug',icon:'heart',event:'almond',embers:2},
 {id:'event-jasmine',on:'tuck',icon:'moon',event:'jasmine',embers:2},
];
// Seasonal events by device month (0-11): olive harvest, winter lamps, almond blossom, jasmine nights.
export const EVENTS=[{id:'lamps',months:[11,0]},{id:'almond',months:[1,2]},{id:'jasmine',months:[5,6,7]},
  {id:'olive',months:[9,10]}];
export const ERRANDS_PER_DAY=3;
// The first day teaches the house through its errands: Lina's tea, a first keepsake, the tea table.
export const FIRST_DAY_ERRANDS=['care-lina','place','ritual-tea'];
// The courtyard lantern: total warmth needed for each level (0 is a cold wick, 5 lights the whole lane).
export const LANTERN_LEVELS=[0,3,8,15,24,36];
// What each lantern level brings back to the house, in order from level 1.
export const LANTERN_WONDERS=['flame','colour','garland','stars','lane'];
// Comfort food: one dish a day for the whole house. Every resident has a favourite and one that is
// simply not for them (never a penalty, only a smaller comfort).
export const DISHES=[{id:'kaak',cost:4},{id:'maamoul',cost:6},{id:'mujaddara',cost:5},{id:'knafeh',cost:8}];
export const TASTES={
 lina:{maamoul:'love',kaak:'like',mujaddara:'like',knafeh:'meh'},
 noor:{mujaddara:'love',knafeh:'like',kaak:'like',maamoul:'meh'},
 sami:{knafeh:'love',kaak:'like',maamoul:'like',mujaddara:'meh'},
};
export const TASTE_EFFECT={love:{hunger:30,comfort:15,bond:4},like:{hunger:25,comfort:6,bond:2},
  meh:{hunger:20,comfort:2,bond:0}};
// Personal arcs: three small requests per resident, each heard at a closeness level and kept in order.
export const ARCS={
 lina:[{id:'lina-maamoul',bond:1},{id:'lina-musicbox',bond:2},{id:'lina-cups',bond:3}],
 noor:[{id:'noor-mobile',bond:1},{id:'noor-chimes',bond:2},{id:'noor-lantern',bond:3}],
 sami:[{id:'sami-bear',bond:1},{id:'sami-sewing',bond:2},{id:'sami-door',bond:3}],
};
// The player's own year: the device calendar picks the season (months 0-11, the Levant's northern year).
export const SEASONS=['winter','winter','spring','spring','spring','summer','summer','summer','autumn','autumn',
  'autumn','winter'];
// Small things the house hides, one a day, for the curio cabinet. The order they turn up in is fixed.
export const TRINKETS=['blue-marble','old-stamp','tiny-spoon','glass-button','lavender-sachet','paper-star',
  'copper-coin','seashell','hair-ribbon','olive-wood-bird','embroidered-patch','silver-bell'];
