import test from 'node:test';
import assert from 'node:assert/strict';
import {strings,translate} from '../src/i18n.js';
const chapters=[['mended-friend',3],['lost-song',4],['guest-tea',4]];
const items=['red-thread','mended-bear','brass-key','bent-cylinder','repaired-cylinder','water-ewer','jasmine-sprig','guest-cup'];
const props=['mint-tin','music-cabinet','wash-basin','jasmine-window','doorstep'];
test('every clue, held object and story action has authored English and Shami copy',()=>{
 const keys=['storyFindObject','storyReadClue','storyFoldClue','storyTitle','storyCompleteTitle','storyCompleteNote','storyNotHere','storyFinished','storyInHand','storyFindRoom','storyDragHint','storyTouchAgain','storyInspect','storyUseHeld','houseTools','storyMemories','storyEmptyHand','storyDropMiss','storyQuiet'];
 for(const [id,count] of chapters){for(const end of ['title','intro','memory'])keys.push(`story-${id}-${end}`);for(let i=0;i<count;i++)for(const end of ['clue','action','done'])keys.push(`story-${id}-${i}-${end}`)}
 for(const id of items)keys.push('held-'+id);
 for(const id of props)keys.push('object-'+id,'object-'+id+'Story');
 keys.push('storyDragShort','storyNotReady','object-music-cabinetRestored');
 for(const id of ['music-cabinet','moon-bed','doorstep'])keys.push('story-play-'+id,'story-replay-'+id);
 for(const id of ['music-cabinet','jasmine-window','moon-bed','doorstep'])keys.push('object-'+id+'RestoredStory');
 for(const key of keys)for(const locale of ['en','ar']){
  assert.ok(strings[locale][key]?.trim(),`${locale}: ${key}`);
  assert.notEqual(translate(locale,key),key);
  if(locale==='ar')assert.match(strings[locale][key],/[\u0600-\u06ff]/,key);
 }
});
