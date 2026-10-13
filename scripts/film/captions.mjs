import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {filmShot,FILM_SECONDS} from '../../src/render/film-scene.js';
import {translate} from '../../src/i18n.js';
const out=fileURLToPath(new URL('../../film/exports/',import.meta.url));
await mkdir(out,{recursive:true});
const stamp=seconds=>new Date(seconds*1000).toISOString().slice(11,23).replace('.',',');
for(const lang of ['en','ar']){
 const cues=[];
 for(let seconds=0;seconds<FILM_SECONDS;){
  const shot=filmShot(seconds),text=translate(lang,'filmLine'+shot.index);
  const title=shot.index===6?`\n${translate(lang,'title')} — ${translate(lang,'filmEnd')}`:'';
  cues.push(`${cues.length+1}\n${stamp(shot.start)} --> ${stamp(shot.end)}\n${text}${title}\n`);
  seconds=shot.end;
 }
 for(const size of ['1080x1920','1920x1080']){
  await writeFile(`${out}/bait-al-dumiah-${lang}-${size}.srt`,cues.join('\n'),'utf8');
 }
}
console.log('Four UTF-8 sidecars written from the actual seven-shot timeline.');
