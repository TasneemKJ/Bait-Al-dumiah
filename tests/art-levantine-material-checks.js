import {paintedTexture} from '../src/render/textiles.js';

export function runArtChecks(){
 const checks=[];const check=(name,passed)=>checks.push({name,passed:Boolean(passed)});
 const rug=paintedTexture('rug',['#be8297','#f0d7b7']);
 const tile=paintedTexture('tile',['#e7dcc5','#90aba0']);
 check('Levantine materials: rug uses original stepped-lozenge geometry',rug.userData.pattern==='stepped-lozenge-weave');
 check('Levantine materials: tile uses an eight-point stone-star field',tile.userData.pattern==='eight-point-stone-star');
 const rc=rug.image.getContext('2d'),tc=tile.image.getContext('2d');
 const center=rc.getImageData(256,256,1,1).data,edge=rc.getImageData(28,28,1,1).data;
 check('Levantine materials: rug center and border retain distinct woven hierarchy',Math.abs(center[0]-edge[0])+Math.abs(center[1]-edge[1])+Math.abs(center[2]-edge[2])>25);
 let tileInk=0;for(let y=8;y<64;y+=4)for(let x=8;x<64;x+=4){const p=tc.getImageData(x,y,1,1).data;if(p[1]>p[0]*.75&&p[2]>p[0]*.70)tileInk++}
 check('Levantine materials: tile motif stays legible at miniature sampling scale',tileInk>35);
 return checks;
}
