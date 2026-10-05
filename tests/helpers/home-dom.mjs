// Minimal DOM adapter for Home semantics and event ownership, not layout evidence.
export function homeDOM(){
 const document={activeElement:null,createElement:tag=>new Element(tag),documentElement:{lang:'en',dir:'ltr'}};
 class Element{
  constructor(tag){this.tagName=tag.toUpperCase();this.ownerDocument=document;this.children=[];this.attributes={};this.dataset={};this.listeners={};this.hidden=false;this.disabled=false;this.inert=false;this.textContent=''}
  append(...nodes){for(const node of nodes){node.parentNode=this;this.children.push(node)}}
  setAttribute(name,value){this.attributes[name]=String(value);if(name.startsWith('data-'))this.dataset[name.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=String(value)}
  getAttribute(name){return this.attributes[name]??null}
  addEventListener(name,fn){this.listeners[name]=fn}
  focus(){document.activeElement=this}
  click(){if(!this.disabled)this.listeners.click?.({target:this})}
  get visible(){return !this.hidden&&(!this.parentNode||this.parentNode.visible)}
  all(){return [this,...this.children.flatMap(node=>node.all())]}
 }
 return {document,root:new Element('section')};
}
