// Geometry-only sewing rules. No rendering, clocks, rewards or input ownership here.
export const STITCH_SPEED=.90,STITCH_CORRIDOR=.11,STITCH_VERTEX_RADIUS=.04;
const EPS=1e-9;
const point=p=>({x:p[0],y:p[1]});
const length=(a,b)=>Math.hypot(b.x-a.x,b.y-a.y);
export const sectionLength=section=>section.slice(1).reduce((n,p,i)=>n+length(point(section[i]),point(p)),0);
export const requiredLength=sections=>sections.reduce((n,section)=>n+sectionLength(section),0);
export function stitchEdge(a,sections){
 const section=sections[a.section];if(!section)return null;
 let offset=0;
 for(let edge=0;edge<section.length-1;edge++){
  const start=point(section[edge]),end=point(section[edge+1]),size=length(start,end);
  if(a.distance<offset+size-EPS||edge===section.length-2)return {section:a.section,edge,start,end,size,offset,last:edge===section.length-2,
    front:Math.max(0,Math.min(size,a.distance-offset)),ux:(end.x-start.x)/size,uy:(end.y-start.y)/size};
  offset+=size;
 }
 return null;
}
export function stitchFront(a,sections){
 const e=stitchEdge(a,sections);if(!e){const p=sections.at(-1).at(-1);return point(p)}
 return {x:e.start.x+e.ux*e.front,y:e.start.y+e.uy*e.front};
}
export function acceptedTrail(a,sections){
 const trail=[];
 for(let i=0;i<Math.min(a.section,sections.length);i++)for(const p of sections[i])if(!trail.length||
   length(point(trail.at(-1)),point(p))>EPS)trail.push([...p]);
 if(a.section<sections.length){
  const section=sections[a.section];let left=a.distance;
  if(!trail.length||length(point(trail.at(-1)),point(section[0]))>EPS)trail.push([...section[0]]);
  for(let j=1;j<section.length&&left>EPS;j++){
   const start=point(section[j-1]),end=point(section[j]),size=length(start,end),fraction=Math.min(1,left/size);
   trail.push([start.x+(end.x-start.x)*fraction,start.y+(end.y-start.y)*fraction]);left-=size;
  }
 }
 return trail;
}
const project=(p,e)=>(p.x-e.start.x)*e.ux+(p.y-e.start.y)*e.uy;
const signed=(p,e)=>(p.x-e.start.x)*e.uy-(p.y-e.start.y)*e.ux;
// Integral of absolute linear perpendicular offset, including crossing the seam.
const meanAbs=(a,b)=>a*b>=0?(Math.abs(a)+Math.abs(b))/2:(a*a+b*b)/(2*(Math.abs(a)+Math.abs(b)));
function sweep(a,e,from,to,assistedWeight){
 const traveled=length(from,to);if(traveled<=EPS)return 0;
 a.travel+=traveled;
 if(a.loose)return 0;
 const p0=project(from,e),p1=project(to,e),d0=Math.abs(signed(from,e)),d1=Math.abs(signed(to,e));
 // A lifted needle ahead of the accepted front must physically return across it.
 const crosses=p0<=e.front+1e-7&&p1>=e.front-EPS&&p1>p0+EPS;
 const attached=p0<=e.front+1e-7&&p0>=e.front-STITCH_CORRIDOR&&d0<=STITCH_CORRIDOR+EPS;
 let t=0;
 if(!attached&&!crosses)return 0;
 if(crosses&&!attached)t=Math.max(0,(e.front-p0)/(p1-p0));
 const at={x:from.x+(to.x-from.x)*t,y:from.y+(to.y-from.y)*t};
 if(Math.abs(signed(at,e))>STITCH_CORRIDOR+EPS)return 0;
 if(d1>STITCH_CORRIDOR+EPS){a.loose=true;return 0}
 const weight=Math.max(0,1-meanAbs(signed(at,e),signed(to,e))/STITCH_CORRIDOR);
 a.alignmentTravel+=traveled*(1-t)*Math.min(weight,assistedWeight??1);
 const before=a.distance;
 const forward=Math.max(0,p1-e.front);
 let front=Math.min(e.size,e.front+Math.min(forward,traveled*(1-t)));
 const arrives=length(to,e.end)<=EPS;
 // Edge completion requires arriving at its actual vertex, never its projection.
 if(!arrives&&front>=e.size-EPS)front=e.size-1e-7;
 a.distance=e.offset+Math.max(e.front,front);
 if(arrives&&a.distance>=e.offset+e.size-1e-7){
  a.distance=e.offset+e.size;
  if(e.last){a.section++;a.distance=0}
 }
 return Math.max(0,a.distance-before);
}
function diskEntry(from,to,end){
 const dx=to.x-from.x,dy=to.y-from.y,ox=from.x-end.x,oy=from.y-end.y;
 if(ox*ox+oy*oy<=STITCH_VERTEX_RADIUS**2+EPS)return 0;
 const aa=dx*dx+dy*dy,bb=2*(ox*dx+oy*dy),cc=ox*ox+oy*oy-STITCH_VERTEX_RADIUS**2,disc=bb*bb-4*aa*cc;
 if(disc<0||aa<=EPS*EPS)return null;
 const t=(-bb-Math.sqrt(disc))/(2*aa);return t>=0&&t<=1?t:null;
}
export function moveStitch(a,sections,dt){
 if(a.phase!=='sew'||a.section>=sections.length)return;
 let budget=STITCH_SPEED*dt;
 if(!a.pressed){
  const distance=length(a.needle,a.target);if(distance<=EPS)return;
  const f=Math.min(1,budget/distance);a.needle={x:a.needle.x+(a.target.x-a.needle.x)*f,y:a.needle.y+(a.target.y-a.needle.y)*f};return;
 }
 while(budget>EPS&&a.section<sections.length){
  const e=stitchEdge(a,sections);
  const assisted=!!a.capture,destination=assisted?a.capture.point:a.target,from={...a.needle},distance=length(from,destination);
  if(distance<=EPS){a.capture=null;break}
  let traveled=Math.min(budget,.02,distance),to={x:from.x+(destination.x-from.x)*traveled/distance,
    y:from.y+(destination.y-from.y)*traveled/distance},arm=false;
  if(!assisted&&!a.loose){
   const p0=project(from,e),p1=project(to,e),entry=diskEntry(from,to,e.end);
   if(entry!==null&&p1>p0+EPS&&p0<=e.front+1e-7&&p1>=e.front-EPS){
    const t=Math.max(entry,(e.size-STITCH_VERTEX_RADIUS-p0)/(p1-p0),(e.front-p0)/(p1-p0),1e-7/traveled);
    if(t<=1+EPS){
     const candidate={x:from.x+(to.x-from.x)*Math.min(1,t),y:from.y+(to.y-from.y)*Math.min(1,t)};
     if(Math.abs(signed(candidate,e))<=STITCH_CORRIDOR+EPS&&length(candidate,e.end)<length(from,e.end)-EPS){
      to=candidate;traveled=length(from,to);arm=true;
     }
    }
   }
  }
  const before=a.distance,sectionBefore=a.section;
  sweep(a,e,from,to,assisted?a.capture.alignmentWeight:undefined);
  a.needle=to;budget-=traveled;
  if(a.section>=sections.length){a.capture=null;break}
  if(assisted&&length(to,destination)<=EPS)a.capture=null;
  if(arm&&!a.loose&&a.section===sectionBefore&&a.distance>before+EPS&&e.offset+e.size-a.distance<=STITCH_VERTEX_RADIUS+EPS){
   a.capture={section:e.section,edge:e.edge,point:{...e.end},alignmentWeight:Math.max(0,1-Math.abs(signed(to,e))/STITCH_CORRIDOR)};
  }
 }
}
