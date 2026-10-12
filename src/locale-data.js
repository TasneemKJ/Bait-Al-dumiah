// Original game copy, split by domain so each table stays readable. ar is shared Levantine/Shami Arabic;
// saved locale IDs stay stable.
import rituals from './locale-rituals.js';
import story from './locale-story.js';
import house from './locale-house.js';
import keepsakes from './locale-keepsakes.js';

const tables=[rituals,story,house,keepsakes];
const merge=lang=>Object.assign({},...tables.map(table=>table[lang]));
export const strings={en:merge('en'),ar:merge('ar')};
export function translate(locale,key){return strings[locale]?.[key]??strings.en[key]??key}
export function number(locale,value){
 return new Intl.NumberFormat(locale==='ar'?'ar-JO':'en',{maximumFractionDigits:0}).format(value);
}
