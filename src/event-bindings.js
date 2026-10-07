// Adds [target, event, handler, capture] listeners and returns the function that removes them.
export function bindAll(bindings){
  for(const [target,event,handler,capture] of bindings)target.addEventListener(event,handler,{capture});
  return ()=>{for(const [target,event,handler,capture] of bindings)target.removeEventListener(event,handler,{capture})};
}
