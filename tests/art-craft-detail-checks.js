import * as T from 'three';
import {craftMaterial} from '../src/render/textiles.js';
import {mat,glaze,palette} from '../src/render/primitives.js';
import {createDolls} from '../src/render/dolls.js';
import {rigParts} from '../src/render/doll-rig-batch.js';
export async function runArtChecks(){
 const checks=[],check=(name,passed)=>checks.push({name:'Craft detail: '+name,passed:Boolean(passed)});
 const wood=craftMaterial(palette.wood,'wood'),cloth=craftMaterial(0x8fb9aa),brass=mat(palette.gold),ceramic=glaze(palette.cream);
 for(const [name,m] of [['walnut',wood],['woven cloth',cloth],['brass',brass],['ceramic',ceramic]]){
  check(name+' uses a shared linear finish for relief and variable roughness',m.bumpMap?.isDataTexture&&m.roughnessMap===m.bumpMap&&m.bumpMap.colorSpace===T.NoColorSpace);
  const tex=m.roughnessMap,data=tex?.image?.data;
  let min=255,max=0;if(data)for(let i=1;i<data.length;i+=4){min=Math.min(min,data[i]);max=Math.max(max,data[i])}
  check(name+' has restrained but measurable roughness variation',max-min>=12&&max-min<=110);
 }
 check('finishes are reused, not regenerated for each prop',wood.roughnessMap&&wood.roughnessMap===craftMaterial(palette.wood,'wood').roughnessMap&&brass===mat(palette.gold));
 check('new maps do not turn ceramics metallic or cloth glossy',ceramic.metalness===0&&ceramic.roughness>=.2&&cloth.roughness>=.88&&brass.metalness>.3);
 check('porcelain carries an original painted border rather than a blank color',ceramic.map?.name?.startsWith('atelier-ceramic-pigment-'));
 const dolls=createDolls(new T.Group());
 for(const id of ['lina','noor']){
  const d=dolls.dolls.find(d=>d.id===id),apron=rigParts(d.root,'embroidered-apron')[0],m=apron.material;
  check(id+' thread artwork has twice the linear sampling for closeups',m.map.image.width===512&&m.map.image.height===768);
  check(id+' relief follows the embroidery atlas rather than unrelated weave',m.bumpMap?.name===`stitched-finish-${id}`&&m.bumpMap===m.roughnessMap);
  if(m.bumpMap?.image?.data){
   const t=m.bumpMap,p=t.image.data,w=t.image.width,h=t.image.height,sample=(x,y,c)=>p[(Math.floor(y/384*h)*w+Math.floor(x/256*w))*4+c];
   check(id+' crossed thread is raised above the quiet pocket linen',sample(68,49,0)>sample(128,175,0)+30);
   check(id+' thread catches light more smoothly than raw linen',sample(68,49,1)<sample(128,175,1)-15);
  }else{
   check(id+' crossed thread is raised above the quiet pocket linen',false);check(id+' thread catches light more smoothly than raw linen',false);
  }
 }
 return checks;
}
