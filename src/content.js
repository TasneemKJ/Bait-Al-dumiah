// Authored identifiers are stable save contracts. Display strings live in i18n.js.
export const ROOMS = [
 {id:'kitchen',x:-2.4,y:0,tint:0xbdd9ca},
 {id:'parlor',x:2.4,y:0,tint:0xe5b9bb},
 {id:'studio',x:-2.4,y:3.2,tint:0xcebddd},
 {id:'bedroom',x:2.4,y:3.2,tint:0xe6cfaa},
];
export const DOLLS = [
 {id:'lina',color:0xc16a83,hair:0x44313b,room:'kitchen',wish:'tea',hunger:40,energy:84,comfort:70},
 {id:'noor',color:0x789c95,hair:0x604535,room:'bedroom',wish:'rest',hunger:75,energy:35,comfort:60},
 {id:'sami',color:0xa08ab4,hair:0x3b3341,room:'studio',wish:'play',hunger:80,energy:70,comfort:35},
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
export const SAVE_KEY='bait-al-dumiah.v1';
