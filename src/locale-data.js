// Original game copy, split by domain so each table stays readable. ar is simple, warm fusha (MSA);
// saved locale IDs stay stable.
import rituals from './locale-rituals.js';
import story from './locale-story.js';
import house from './locale-house.js';
import keepsakes from './locale-keepsakes.js';
import store from './locale-store.js';
import arc from './locale-arc.js';
import mischief from './locale-mischief.js';

const tables=[rituals,story,house,keepsakes,store,arc,mischief];
const merge=lang=>Object.assign({},...tables.map(table=>table[lang]));
export const strings={en:merge('en'),ar:merge('ar')};
// In the iPhone app (src/main.js turns this on) a key's `<key>App` wording wins when it exists:
// the app is not a browser, so lines about browser storage or another browser read differently.
let appWording=false;
export function useAppWording(on){appWording=Boolean(on)}
function lookup(locale,key){return strings[locale]?.[key]??strings.en[key]}
export function translate(locale,key){return (appWording&&lookup(locale,key+'App'))||lookup(locale,key)||key}
export function number(locale,value){
 return new Intl.NumberFormat(locale==='ar'?'ar-JO':'en',{maximumFractionDigits:0}).format(value);
}
