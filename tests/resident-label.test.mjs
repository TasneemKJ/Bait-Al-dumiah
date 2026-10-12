import test from 'node:test';
import assert from 'node:assert/strict';
import {createState} from '../src/simulation.js';

// A tiny DOM: the label measures from its left/top style; paper has fixed rectangles.
function element(rect=null){
 const node={hidden:false,style:{},dataset:{},isConnected:true,textContent:'',dir:'',className:'',
  setAttribute(){},getClientRects(){return rect?[rect]:[]},
  getBoundingClientRect(){
   if(rect)return rect;const left=parseFloat(this.style.left)-25,top=parseFloat(this.style.top);
   return {left,right:left+50,top,bottom:top+24};
  }};
 return node;
}
function setup(paper){
 globalThis.document={createElement:()=>element()};globalThis.innerWidth=390;globalThis.innerHeight=844;
 const host={append(){},querySelectorAll:()=>paper};
 return host;
}

test('a resident name tag hides rather than cover the carried item',async()=>{
 const {createResidentLabel}=await import('../src/resident-label.js');
 const s=createState(),lina=s.dolls.find(d=>d.id==='lina');
 const token=element({left:120,right:270,top:665,bottom:715});
 const label=createResidentLabel(setup([token]));
 label.update(s,'lina',lina.room,{x:245,y:660},false);
 assert.equal(label.node.hidden,true,'the drag handle stays visible');
 label.update(s,'lina',lina.room,{x:245,y:420},false);
 assert.equal(label.node.hidden,false,'clear of paper, the tag shows');
 assert.equal(label.node.textContent.length>0,true);
});

test('hidden paper does not hide the name tag',async()=>{
 const {createResidentLabel}=await import('../src/resident-label.js');
 const s=createState(),lina=s.dolls.find(d=>d.id==='lina');
 const label=createResidentLabel(setup([element(null)]));
 label.update(s,'lina',lina.room,{x:245,y:600},false);
 assert.equal(label.node.hidden,false);
});
