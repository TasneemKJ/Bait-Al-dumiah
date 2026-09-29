import * as T from 'three';
import * as keepsakes from '../src/render/keepsake-details.js';
const cases=[];
const test=(name,run)=>cases.push({name,run});
const assert=(condition,message)=>{if(!condition)throw new Error(message)};
export async function runArtChecks(){
 const results=[];
 for(const {name,run} of cases){try{await run();results.push({name,passed:true})}catch(error){results.push({name,passed:false,error:String(error.message)})}}
 return results;
}
test('11: pastries sit on a miniature tray inside the kitchen counter footprint',()=>{
 assert(typeof keepsakes.pastryTray==='function','pastry tray is missing');const g=keepsakes.pastryTray();
 assert(g.children.filter(c=>c.name==='pastry').length===5,'tray must have five authored pastries');
 const b=new T.Box3().setFromObject(g),s=b.getSize(new T.Vector3());assert(s.x<.7&&s.z<.5&&b.min.y>=0,'tray should fit the counter, not the walk lane');
});
test('12: kitchen crock holds three separate wooden utensils',()=>{
 assert(typeof keepsakes.spoonCrock==='function','utensil crock is missing');const g=keepsakes.spoonCrock();
 assert(g.children.filter(c=>c.name==='wooden-spoon').length===3,'three utensils should have distinct silhouettes');
 const s=new T.Box3().setFromObject(g).getSize(new T.Vector3());assert(s.y>.3&&s.y<.6&&s.x<.4,'crock must stay at counter scale');
});
test('13: hanging tea towel has folded geometry and real woven stripes',()=>{
 assert(typeof keepsakes.teaTowel==='function','striped towel is missing');const g=keepsakes.teaTowel(),t=g.getObjectByName('striped-tea-towel');
 assert(t?.material.map&&t.material.bumpMap,'towel needs painted stripes and thread relief');const p=t.geometry.attributes.position;let min=1,max=-1;for(let i=0;i<p.count;i++){min=Math.min(min,p.getZ(i));max=Math.max(max,p.getZ(i))}assert(max-min>.015,'towel hangs as a flat card');
});
test('14: pantry labels identify jam by botanical motifs rather than unreadable text',()=>{
 assert(typeof keepsakes.pantryJars==='function','pantry labels are missing');const g=keepsakes.pantryJars();const labels=[];g.traverse(o=>{if(o.name==='botanical-jar-label')labels.push(o)});
 assert(labels.length===4,'four jars need four matching labels');assert(labels.every(l=>l.material.map.image.width===128),'labels should be bounded original raster art');
});
test('15: open storybook has two curved paper leaves and a visible binding',()=>{
 assert(typeof keepsakes.storybook==='function','open storybook is missing');const book=keepsakes.storybook();
 const pages=book.children.filter(o=>o.name==='storybook-page');assert(pages.length===2,'book needs separate left and right leaves');
 for(const page of pages){page.geometry.computeBoundingBox();assert(page.geometry.boundingBox.max.y-page.geometry.boundingBox.min.y>.012,'pages are flat cards')}
 assert(book.getObjectByName('storybook-binding'),'binding is missing');const size=new T.Box3().setFromObject(book).getSize(new T.Vector3());assert(size.x<.43&&size.z<.34,'book crowds the tea table');
});
test('16: cushion embroidery uses raised stitching and four restrained tassels',()=>{
 assert(typeof keepsakes.cushionEmbroidery==='function','embroidered cushion detail is missing');const g=keepsakes.cushionEmbroidery();
 assert(g.children.filter(o=>o.name==='cushion-tassel').length===4,'four corner tassels are missing');assert(g.getObjectByName('cushion-embroidery'),'floral stitching is missing');const size=new T.Box3().setFromObject(g).getSize(new T.Vector3());assert(size.x<.51&&size.y<.55,'embroidery overhangs the cushion');
});
test('17: lavender sprigs form a bounded arrangement rather than a solid plant blob',()=>{
 assert(typeof keepsakes.lavenderVase==='function','lavender arrangement is missing');const g=keepsakes.lavenderVase();assert(g.children.filter(o=>o.name==='lavender-sprig').length===5,'arrangement requires five individually modeled sprigs');const size=new T.Box3().setFromObject(g).getSize(new T.Vector3());assert(size.y<.8&&size.x<.5,'arrangement collides with the wall sconce');
});
test('18: embroidery hoop has stretched linen, floral stitches and a brass clamp',()=>{
 assert(typeof keepsakes.embroideryHoop==='function','wall embroidery hoop is missing');const g=keepsakes.embroideryHoop();assert(g.getObjectByName('hoop-linen')&&g.getObjectByName('hoop-clamp'),'linen and tightening clamp are required');const size=new T.Box3().setFromObject(g).getSize(new T.Vector3());assert(size.x<.55&&size.y<.6&&size.z<.15,'hoop must stay on the sewing-room back wall');
});
test('19: sewing desk tools include open scissor handles and a curved measuring tape',()=>{
 assert(typeof keepsakes.sewingTools==='function','sewing tools are missing');const g=keepsakes.sewingTools();assert(g.children.filter(o=>o.name==='scissor-handle').length===2,'scissors need two open handles');const tape=g.getObjectByName('measuring-tape');assert(tape&&tape.material.map,'measuring tape needs authored markings');tape.geometry.computeBoundingBox();assert(tape.geometry.boundingBox.max.y>.015,'tape must curl above the table');
});
test('20: patchwork quilt has stitched colored panels, woven relief and bounded piping',()=>{
 assert(typeof keepsakes.patchworkQuilt==='function','patchwork bedding is missing');const g=keepsakes.patchworkQuilt();const quilt=g.getObjectByName('patchwork-quilt');assert(quilt?.material.map&&quilt.material.bumpMap,'patchwork and thread relief must both be present');assert(g.children.filter(o=>o.name==='quilt-piping').length===4,'all quilt edges must be finished');const size=new T.Box3().setFromObject(g).getSize(new T.Vector3());assert(size.x<=1.74&&size.z<=1.12&&size.y<.08,'quilt must sit on the existing mattress');
});
