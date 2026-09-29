import {paintedTexture} from '../src/render/textiles.js';

export function runArtChecks(){
 const checks=[];const check=(name,passed)=>checks.push({name,passed:Boolean(passed)});
 const wall=paintedTexture('wall',['#dfc6b5','#b0938e']);
 check('Levantine walls: limewash uses a quiet jasmine-frieze field',wall.userData.pattern==='limewash-jasmine-frieze');
 const c=wall.image.getContext('2d');let sum=0,count=0;
 for(let y=58;y<=74;y+=2)for(let x=0;x<512;x+=4){const p=c.getImageData(x,y,1,1).data;sum+=(p[0]+p[1]+p[2])/3;count++}
 const friezeLuma=sum/count;
 check('Levantine walls: frieze remains visible but lighter than furniture contrast',friezeLuma>160&&friezeLuma<220);
 return checks;
}
