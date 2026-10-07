// Write to the DOM only when the value changed, so screen readers and layout are not disturbed every frame.
export const setText=(element,value)=>{if(element.textContent!==value)element.textContent=value};
export const setAttribute=(element,name,value)=>{
  if(element.getAttribute(name)!==value)element.setAttribute(name,value);
};
