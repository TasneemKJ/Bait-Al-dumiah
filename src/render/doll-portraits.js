import * as T from 'three';
import {portraitMarkup} from '../resident-portraits.js';
export {portraitMarkup};
const validIds=new Set(['lina','noor','sami']);
export function createPortraitScene(doll){
 if(!doll?.body||!validIds.has(doll.id))throw new TypeError('Unknown portrait resident');
 const scene=new T.Scene();scene.background=new T.Color(0xeadccc);
 const model=doll.body.clone(true);model.position.set(0,0,0);model.rotation.set(0,0,0);model.scale.set(1,1,1);scene.add(model);
 const head=model.getObjectByName('doll-head');if(head)head.rotation.set(0,0,0);
 model.traverse(o=>{
  if(o.name==='held-tea')o.visible=false;
  if(o.name==='portrait-eye'){o.children[0].scale.y=1;o.children[0].visible=true}
  if(o.name==='closed-bisque-lid')o.visible=false;
  if(o.name==='painted-iris')o.position.x=0;
  if(o.name==='upper-arm')o.rotation.set(0,0,Math.sign(o.position.x)*.19);
  if(['articulated-forearm','articulated-hand','lina-plait','cloth-bow'].includes(o.name))o.rotation.set(0,0,0);
 });
 scene.add(new T.HemisphereLight(0xfff0df,0x9a8fa6,.7));
 const key=new T.DirectionalLight(0xffe8d4,1.4);key.position.set(-3,4,5);scene.add(key);
 const fill=new T.DirectionalLight(0xd6dcec,.65);fill.position.set(4,2,4);scene.add(fill);
 const camera=new T.OrthographicCamera(-.44,.44,.44,-.44,.1,20);camera.position.set(0,1.075,6);camera.lookAt(0,1.075,0);
 return {scene,camera,model};
}
const srgb=x=>Math.round(255*(x<=.0031308?12.92*x:1.055*Math.pow(x,1/2.4)-.055));
export function portraitPixels(pixels,size){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=size;const ctx=canvas.getContext('2d'),image=ctx.createImageData(size,size);
 // Offscreen Three r180 targets are linear; Canvas2D PNGs require sRGB and top-down rows.
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){const source=((size-1-y)*size+x)*4,dest=(y*size+x)*4;
 for(let c=0;c<3;c++)image.data[dest+c]=srgb(pixels[source+c]/255);image.data[dest+3]=pixels[source+3]}
 ctx.putImageData(image,0,0);return canvas.toDataURL('image/png');
}
export function renderPortrait(renderer,doll,size=192){
 size=Number.isFinite(size)?Math.max(64,Math.min(256,Math.floor(size))):192;
 const {scene,camera}=createPortraitScene(doll),target=new T.WebGLRenderTarget(size,size,{depthBuffer:true,stencilBuffer:false});
 const previous={target:renderer.getRenderTarget(),viewport:renderer.getViewport(new T.Vector4()),scissor:renderer.getScissor(new T.Vector4()),
   test:renderer.getScissorTest(),clear:renderer.getClearColor(new T.Color()),alpha:renderer.getClearAlpha(),auto:renderer.autoClear,shadow:renderer.shadowMap.enabled};
 try{
  renderer.setRenderTarget(target);renderer.setScissorTest(false);renderer.autoClear=true;renderer.shadowMap.enabled=false;renderer.render(scene,camera);
  const pixels=new Uint8Array(size*size*4);renderer.readRenderTargetPixels(target,0,0,size,size,pixels);return portraitPixels(pixels,size);
 }finally{
  renderer.setRenderTarget(previous.target);renderer.setViewport(previous.viewport);renderer.setScissor(previous.scissor);
  renderer.setScissorTest(previous.test);renderer.setClearColor(previous.clear,previous.alpha);renderer.autoClear=previous.auto;renderer.shadowMap.enabled=previous.shadow;
  target.dispose();scene.clear();
 }
}
export function renderPortraits(renderer,residents){return Object.fromEntries(residents.dolls.map(doll=>[doll.id,renderPortrait(renderer,doll)]))}

export function createPortraitCache(residents,capture){
 let images=null,disposed=false;
 return {
  get size(){return images?Object.keys(images).length:0},
  getAll(){
   if(disposed)return images;
   if(images)return images;
   const result=Object.create(null);
   for(const doll of residents.dolls){try{const url=capture(doll);if(portraitMarkup(doll.id,url))result[doll.id]=url}catch(error){console.warn('Portrait capture skipped:',doll.id,error)}}
   images=Object.freeze(result);return images;
  },
  dispose(){disposed=true;images=Object.freeze(Object.create(null))}
 };
}
