// Minimal final DOM boundary for the real toaster; no layout or CSS simulation.
export function toastDOM(){
 const shown=[];let toast,note,saved;
 function element(initial='',onText=()=>{}){
  let text=initial,textWrites=0;const classes=new Set();
  return {get textWrites(){return textWrites},get textContent(){return text},set textContent(value){textWrites++;if(value!==text)onText(value);text=value},
   classList:{add:name=>classes.add(name),remove:name=>classes.delete(name),contains:name=>classes.has(name),
    toggle(name,on){if(on)classes.add(name);else classes.delete(name)}},
   dataset:{},setAttribute(){},remove(){if(note===this)note=null}};
 }
 const reset=()=>{toast=element('',message=>{if(message)shown.push(message)});note=element();saved=element()};reset();
 const host={querySelector(selector){return selector==='#toast'?toast:selector==='.panel-notice'?note:
  selector==='.saved-note span'?saved:selector==='#sheet-content'?{prepend(value){note=value}}:null}};
 return {host,shown,reset,document:{createElement:()=>element()},newSheet(){note=element()},
  get toast(){return toast},get note(){return note},get saved(){return saved}};
}
