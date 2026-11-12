// Checks ios/store/listing.md against App Store Connect's limits: node ios/store/check-listing.mjs
import {readFileSync} from 'node:fs';
const md=readFileSync(new URL('./listing.md',import.meta.url),'utf8');
const field=(locale,name)=>{const part=md.split(`## ${locale}`)[1].split('\n## ')[0];
 const m=part.match(new RegExp(`\\*\\*${name}:\\*\\*\\s*([\\s\\S]*?)(?=\\n\\n\\*\\*|$)`));return m?m[1].trim():''};
const limits={Subtitle:30,'Promotional text':170,Keywords:100,Description:4000};
let bad=0;const name='بيت الدمية · Bait Al-dumiah';
if([...name].length>30){console.log('name',[...name].length);bad++}
for(const locale of ['ar-SA','en-US'])for(const [f,max] of Object.entries(limits)){
 const v=field(locale,f),n=[...v].length;console.log(`${locale} ${f}: ${n}/${max}`);if(!n||n>max)bad++;
 if(f==='Keywords'&&/,\s|\s,/.test(v)){console.log('  no spaces around commas');bad++}}
process.exit(bad?1:0);
