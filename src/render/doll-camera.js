// A portrait is framed inside the free playfield, not the entire phone screen.
export function portraitFraming(width,height,position){
 if(!Array.isArray(position)||position.length!==3||!position.every(Number.isFinite))return null;
 const w=Number.isFinite(width)?Math.max(1,width):390,h=Number.isFinite(height)?Math.max(1,height):844;
 const phone=w<680&&h>w,short=h<560;
 const top=phone?(h<680?112:174):short?26:112,bottom=phone?178:short?92:168;
 const usable=Math.max(120,h-top-bottom),span=Math.max(2.3,1.70*h/usable),zoom=2.8;
 const offset=((top+usable/2)/h-.5)*span;
 return {height:span*zoom,zoom,aspect:w/h,target:[position[0],position[1]+.78+offset,position[2]]};
}
