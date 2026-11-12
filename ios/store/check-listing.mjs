// Checks ios/store/listing.json against App Store Connect's limits, the catalog in BaitConfig.swift and
// the .storekit file, and the screenshots' size: node ios/store/check-listing.mjs
import {readFileSync,readdirSync,existsSync} from 'node:fs';
const here=new URL('./',import.meta.url),read=p=>readFileSync(new URL(p,here),'utf8');
const listing=JSON.parse(read('listing.json')),len=s=>[...String(s??'')].length;
let bad=0;const fail=m=>{console.log('  ✖ '+m);bad++};
const limits={name:30,subtitle:30,promotionalText:170,keywords:100,description:4000};
for(const [locale,f] of Object.entries(listing.locales)){
 for(const [k,max] of Object.entries(limits)){const n=len(f[k]);console.log(`${locale} ${k}: ${n}/${max}`);if(!n||n>max)fail(`${locale} ${k}`)}
 if(/,\s|\s,/.test(f.keywords))fail(`${locale} keywords: no spaces around commas`);
}
if(!/[؀-ۿ]/.test(listing.locales['ar-SA'].description))fail('the Arabic description is Arabic');
const slug='https://tas-games.vercel.app/bait-al-dumiah/';
if(listing.app.supportURL!==slug+'support.html'||listing.app.privacyURL!==slug+'privacy.html'||listing.app.marketingURL!==slug)fail('site URLs');
const swift=read('../BaitAlDumiah/BaitConfig.swift'),storekit=JSON.parse(read('../BaitAlDumiahTests/BaitAlDumiah.storekit'));
const kitIDs=[...storekit.products,...storekit.subscriptionGroups.flatMap(g=>g.subscriptions)].map(p=>p.productID).sort();
const ids=listing.products.map(p=>p.id).sort();
if(JSON.stringify(ids)!==JSON.stringify(kitIDs))fail('listing products match the .storekit file');
for(const p of listing.products){
 if(!swift.includes(`productID: "${p.id}"`))fail(`${p.id} is in BaitConfig.swift`);
 for(const [locale,l] of Object.entries(p.localizations)){
  console.log(`${p.id} ${locale}: name ${len(l.displayName)}/30, description ${len(l.description)}/45`);
  if(!len(l.displayName)||len(l.displayName)>30||!len(l.description)||len(l.description)>45)fail(`${p.id} ${locale}`);
 }
 if(!existsSync(new URL(p.reviewScreenshot,here)))fail(`${p.reviewScreenshot} exists`);
}
const prices=Object.fromEntries(listing.products.map(p=>[p.id,p.priceUSD]));
if(prices['Tas.BaitAlDumiah.fifthRoom']!=='4.99'||prices['Tas.BaitAlDumiah.canary.monthly']!=='1.99'||
 prices['Tas.BaitAlDumiah.canary.yearly']!=='14.99')fail('prices');
// PNG size from the IHDR chunk.
const png=p=>{const b=readFileSync(p);return b.toString('ascii',1,4)==='PNG'?[b.readUInt32BE(16),b.readUInt32BE(20)]:null};
for(const lang of ['en','ar']){
 const dir=new URL(`screenshots/${lang}/`,here),files=existsSync(dir)?readdirSync(dir).filter(f=>f.endsWith('.png')):[];
 console.log(`screenshots/${lang}: ${files.length}`);if(files.length<4)fail(`at least 4 screenshots in ${lang}`);
 for(const f of files){const size=png(new URL(f,dir));if(String(size)!=='1320,2868')fail(`${lang}/${f} is ${size}`)}
}
process.exit(bad?1:0);
