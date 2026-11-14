import test from 'node:test';
import assert from 'node:assert/strict';
import * as sim from '../src/simulation.js';
import {MUSIC_BOXES,KEY_REST,MUSIC_MIDNIGHT,WIND_TURNS,ROOMS,DOLLS} from '../src/content.js';

// The music box key (DESIGN.md #49, src/sim-musicbox.js): one key, three rooms, midnight.
const wait=(s,seconds)=>{for(let i=0;i<seconds;i++)sim.step(s,1)};
const events=(s,type)=>s.events.splice(0).filter(e=>e.type===type);
const toNight=s=>wait(s,Math.ceil((120-s.clock+240)%240)+1);
// A lived first day and dusk of the second, as a player who leaves the house open would.
const secondDusk=()=>{const s=sim.createState();for(const d of s.dolls)d.comfort=60;wait(s,240);toNight(s);return s};
const wind=(s,doll)=>{const box=sim.boxOf(doll);sim.moveKey(s,box.room);return sim.turnKey(s,doll,WIND_TURNS)};

test('every doll has one box in her own room, and the key rests in the sitting room by day',()=>{
 assert.deepEqual(MUSIC_BOXES.map(b=>b.doll).sort(),DOLLS.map(d=>d.id).sort());
 for(const b of MUSIC_BOXES)assert.equal(b.room,DOLLS.find(d=>d.id===b.doll).room,b.doll);
 const s=sim.createState();assert.equal(sim.musicStatus(s).key,KEY_REST.room);assert.equal(sim.musicStatus(s).open,false);
});

test('the first night is left to the visitor; the boxes run down from the second lived dusk',()=>{
 const s=sim.createState();toNight(s);assert.equal(sim.windingOpen(s),false,'not on night one');
 const h=sim.createState();sim.changeLight(h);sim.changeLight(h);sim.changeLight(h);wait(h,2);
 assert.equal(sim.windingOpen(h),false,'a hurried day never starts them');
 const n=secondDusk();assert.equal(n.day,2);assert.equal(sim.windingOpen(n),true);
 assert.deepEqual(n.events.filter(e=>e.type==='musicbox-dusk').map(e=>e.first),[true]);
});

test('the key winds only in its own room, two full turns wind a box, and a half-wound box slips back',()=>{
 const s=secondDusk();assert.equal(sim.turnKey(s,'noor',1).reason,'keyElsewhere');
 assert.equal(sim.moveKey(s,'attic').ok,false);assert.equal(sim.moveKey(s,'bedroom').ok,true);
 const half=sim.turnKey(s,'noor',1);assert.equal(half.wind,1/WIND_TURNS);assert.equal(half.wound,false);
 wait(s,5);assert.ok(sim.musicStatus(s).wind.noor<half.wind,'left half-wound, it slips back');
 assert.equal(sim.turnKey(s,'noor',WIND_TURNS).wound,true);
 const before=sim.musicStatus(s).wind.noor;wait(s,10);assert.equal(sim.musicStatus(s).wind.noor,before,'wound stays wound');
 assert.equal(sim.turnKey(s,'noor',1).already,true);
 assert.equal(sim.turnKey(s,'lina',-5).reason,'keyElsewhere');assert.equal(sim.turnKey(s,'nobody',1).ok,false);
});

test('at midnight a wound box plays to its end and its doll dances; a box left stops and its doll stays still',()=>{
 const s=secondDusk();s.events.length=0;const comfort=Object.fromEntries(s.dolls.map(d=>[d.id,d.comfort]));
 wind(s,'lina');wind(s,'sami');wait(s,Math.ceil(MUSIC_MIDNIGHT-s.clock)+1);
 const [mid]=events(s,'musicbox-midnight');
 assert.deepEqual([mid.danced.sort(),mid.stilled],[['lina','sami'],['noor']]);
 assert.deepEqual(sim.musicStatus(s).result,{lina:'dance',noor:'still',sami:'dance'});
 assert.ok(s.dolls.find(d=>d.id==='lina').comfort>comfort.lina-5,'a dance is a little comfort');
 assert.equal(sim.turnKey(s,'noor',2).reason,'musicResting','after midnight the key turns nothing');
 wait(s,Math.ceil(240-s.clock)+10);assert.equal(s.day,3);
 assert.deepEqual(sim.musicStatus(s).result,{lina:'',noor:'',sami:''},'morning: Noor moves again');
});

test('hurrying past midnight with the light control still ends the night, and the save keeps it whole',()=>{
 const s=secondDusk();wind(s,'noor');s.events.length=0;sim.changeLight(s);wait(s,1);
 assert.deepEqual(events(s,'musicbox-midnight').map(e=>e.danced),[['noor']]);
 const n=secondDusk();wind(n,'sami');sim.moveKey(n,'kitchen');sim.turnKey(n,'lina',1);
 const back=sim.restore(JSON.stringify(n));
 assert.deepEqual(sim.musicStatus(back),sim.musicStatus(n));assert.equal(sim.windingOpen(back),true,'a reload mid-night resumes');
 const hostile=sim.restore(JSON.stringify({...n,music:{key:'attic',night:1e9,done:'no',wind:{noor:9,sami:'1',lina:-2},
   result:{noor:'fly'},nights:-4}}));
 assert.deepEqual(hostile.music,{key:KEY_REST.room,night:n.day,done:true,wind:{lina:0,noor:1,sami:0},
   result:{lina:'',noor:'',sami:''},nights:0});
 for(const bad of [null,[],'x',7])assert.deepEqual(sim.restore(JSON.stringify({...n,music:bad})).music.key,KEY_REST.room);
 assert.ok(ROOMS.some(r=>r.id===KEY_REST.room));
});

test('in the house: touch the key, touch a box to carry it there, circle to wind, and the box answers',async()=>{
 const {bootHome}=await import('./helpers/main-home-harness.mjs');
 const s=secondDusk();s.events.length=0;s.cares=1;const game=bootHome({saved:JSON.stringify(s)});game.button('play').click();
 game.pick({musicBox:'noor',room:'bedroom'});assert.equal(game.state().music.key,KEY_REST.room,'without the key nothing moves');
 game.pick({musicKey:true});game.pick({musicBox:'noor',room:'bedroom'});assert.equal(game.state().music.key,'bedroom');
 game.pick({musicBox:'noor',room:'bedroom'});assert.equal(game.state().music.wind.noor,.25/WIND_TURNS,'a touch is a quarter turn');
 game.pick({wind:{doll:'noor',turns:WIND_TURNS}});assert.equal(game.state().music.wind.noor,1);
 game.pick({keyTo:'kitchen'});assert.equal(game.state().music.key,'kitchen','a drag carries it');
 game.pick({musicKey:true});game.pick({roomTap:'studio'});assert.equal(game.state().music.key,'studio');
});
