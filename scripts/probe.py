"""Bounded pinned-source diagnosis. Original load timeouts remain failures.
RAF wall duration includes instrumentation and possible driver stalls; CDP CPU
sampling and task metrics are separate. SwiftShader is not phone hardware.
"""
import json,os,statistics,subprocess,time,urllib.request
from pathlib import Path
from playwright.sync_api import sync_playwright
SHA=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip();assert SHA==os.environ['SOURCE_SHA'];RATE=int(os.environ['CPU_RATE'])
OUT=Path('artifacts/render-probe');OUT.mkdir(parents=True,exist_ok=True)
report={'sourceCommit':SHA,'sourceTree':subprocess.check_output(['git','rev-parse','HEAD^{tree}'],text=True).strip(),'cpuThrottleRate':RATE,'renderer':'SwiftShader, headless Chromium','phases':[],'navigations':[],'errors':[],'limits':['Instrumented RAF wall duration is not pure JavaScript CPU time.','CPU profile categories are sampled stack attribution, not exact update/render timers.','No physical-device performance or audio-quality inference.']}
def save():(OUT/'report.json').write_text(json.dumps(report,indent=2))
INIT="""(()=>{const p=window.__renderProbe={frames:[],drawCalls:0,active:false};const seen=new Set;for(const proto of [window.WebGLRenderingContext?.prototype,window.WebGL2RenderingContext?.prototype])if(proto)for(const name of ['drawArrays','drawElements','drawArraysInstanced','drawElementsInstanced']){const d=Object.getOwnPropertyDescriptor(proto,name);if(!d||typeof d.value!=='function'||seen.has(d.value))continue;const native=d.value;seen.add(native);proto[name]=function(...args){p.drawCalls++;return native.apply(this,args)};}const raf=window.requestAnimationFrame.bind(window);window.requestAnimationFrame=cb=>raf(stamp=>{const start=performance.now(),draws=p.drawCalls;try{return cb(stamp)}finally{if(p.active&&p.frames.length<10000)p.frames.push({stamp,cost:performance.now()-start,draws:p.drawCalls-draws})}});})()"""
def snapshot(page):
 return page.evaluate("()=>{const c=document.getElementById('world');return{at:performance.now(),readyState:document.readyState,visibility:document.visibilityState,hidden:document.hidden,screen:document.getElementById('app')?.dataset.screen,homeView:document.getElementById('home')?.dataset.view,canvasVisibility:c?getComputedStyle(c).visibility:null,canvasDisplay:c?getComputedStyle(c).display:null,canvasRect:c?{w:c.getBoundingClientRect().width,h:c.getBoundingClientRect().height}:null,drawCalls:__renderProbe.drawCalls,elapsed:window.dollhouse?.state?.().elapsed,stats:window.dollhouse?.stats?.(),navigation:performance.getEntriesByType('navigation').map(n=>({domContentLoadedEventEnd:n.domContentLoadedEventEnd,loadEventEnd:n.loadEventEnd,domInteractive:n.domInteractive,responseEnd:n.responseEnd}))}}")
def quantile(values,q):
 a=sorted(values);return a[min(len(a)-1,int((len(a)-1)*q))] if a else None
def sampled(profile):
 nodes={n['id']:n for n in profile['nodes']};parents={c:n['id']for n in profile['nodes']for c in n.get('children',[])};out={};top={}
 for ident,us in zip(profile.get('samples',[]),profile.get('timeDeltas',[])):
  node=nodes[ident];frame=node['callFrame'];key=frame.get('functionName','')+' '+frame.get('url','');top[key]=top.get(key,0)+us/1000;urls=[];p=ident
  while p in nodes:
   urls.append(nodes[p]['callFrame'].get('url',''))
   if p not in parents:break
   p=parents[p]
  category='simulation' if any('/simulation.js' in x for x in urls) else 'render/engine' if any('/render/' in x or '/vendor/three' in x for x in urls) else 'UI' if any('/ui.js' in x or '-ui.js' in x for x in urls) else frame.get('functionName') if frame.get('functionName') in ['(idle)','(program)','(garbage collector)'] else 'other'
  out[category]=out.get(category,0)+us/1000
 return {'sampledStackWallMs':out,'topSelfSamplesMs':sorted(top.items(),key=lambda x:x[1],reverse=True)[:15],'samples':len(profile.get('samples',[]))}
def metrics(cdp):return{m['name']:m['value']for m in cdp.send('Performance.getMetrics')['metrics']}
def sample(page,cdp,label,other=None):
 start=time.monotonic();before=snapshot(page);other_before=snapshot(other) if other else None;page.evaluate('()=>{__renderProbe.frames=[];__renderProbe.active=true;}');m0=metrics(cdp);cdp.send('Profiler.start');page.wait_for_timeout(8000);profile=cdp.send('Profiler.stop')['profile'];m1=metrics(cdp);frames=page.evaluate('()=>{__renderProbe.active=false;return __renderProbe.frames;}');after=snapshot(page);other_after=snapshot(other)if other else None
 gaps=[b['stamp']-a['stamp']for a,b in zip(frames,frames[1:])if b['stamp']>a['stamp']];costs=[f['cost']for f in frames];row={'label':label,'pythonWallMs':(time.monotonic()-start)*1000,'before':before,'after':after,'otherBefore':other_before,'otherAfter':other_after,'rafCallbacks':len(frames),'rafCallbackWallMedianMs':quantile(costs,.5),'rafCallbackWallP90Ms':quantile(costs,.9),'frameIntervalMedianMs':quantile(gaps,.5),'frameIntervalP90Ms':quantile(gaps,.9),'drawCalls':after['drawCalls']-before['drawCalls'],'taskMs':(m1.get('TaskDuration',0)-m0.get('TaskDuration',0))*1000,'scriptMs':(m1.get('ScriptDuration',0)-m0.get('ScriptDuration',0))*1000,**sampled(profile)};(OUT/('profile-'+label+'.json')).write_text(json.dumps(profile));(OUT/('frames-'+label+'.json')).write_text(json.dumps(frames));report['phases'].append(row);save();print('RENDER_PHASE '+json.dumps(row),flush=True)
def new_page(context,label):
 page=context.new_page();page.set_default_timeout(60000);cdp=context.new_cdp_session(page);cdp.send('Emulation.setCPUThrottlingRate',{'rate':RATE});cdp.send('Performance.enable');cdp.send('Profiler.enable');cdp.send('Profiler.setSamplingInterval',{'interval':1000});events=[];pending={};start=time.monotonic()
 def request(req):pending[id(req)]={'url':req.url,'type':req.resource_type,'startedMs':(time.monotonic()-start)*1000}
 def finished(req):
  item=pending.pop(id(req),{'url':req.url});item['finishedMs']=(time.monotonic()-start)*1000;events.append(item)
 def failed(req):
  item=pending.pop(id(req),{'url':req.url});item.update(failedMs=(time.monotonic()-start)*1000,failure=req.failure);events.append(item)
 page.on('request',request);page.on('requestfinished',finished);page.on('requestfailed',failed);page.on('domcontentloaded',lambda:events.append({'event':'DOMContentLoaded','atMs':(time.monotonic()-start)*1000}));page.on('load',lambda:events.append({'event':'load','atMs':(time.monotonic()-start)*1000}));page.on('pageerror',lambda e:report['errors'].append(label+' runtime: '+str(e)))
 return page,cdp,events,pending,start
def navigate(page,events,pending,start,label):
 error=None
 try:page.goto('http://127.0.0.1:4196/?debug=1',wait_until='load',timeout=60000)
 except Exception as e:error=str(e);report['errors'].append(label+' original navigation: '+error)
 # This collection is diagnostic only; a timeout is retained above and keeps CI red.
 ready_error=None
 try:page.wait_for_function('window.dollhouse&&!document.querySelector("#loading")&&!document.querySelector("[data-home-action=play]").disabled',timeout=20000)
 except Exception as e:ready_error=str(e);report['errors'].append(label+' diagnostic readiness: '+ready_error)
 row={'label':label,'wallMs':(time.monotonic()-start)*1000,'originalLoadError':error,'diagnosticReadinessError':ready_error,'snapshot':snapshot(page),'network':events,'pendingRequests':list(pending.values())};report['navigations'].append(row);save();print('NAVIGATION_PROBE '+json.dumps(row),flush=True);return not ready_error
server=subprocess.Popen(['node','scripts/serve.mjs','dist'],env={**os.environ,'PORT':'4196'},stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
try:
 for _ in range(80):
  try:urllib.request.urlopen('http://127.0.0.1:4196',timeout=1);break
  except Exception:time.sleep(.1)
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl']);context=browser.new_context(viewport={'width':390,'height':844},has_touch=True,is_mobile=True,device_scale_factor=2);context.add_init_script(INIT)
  first,c1,e1,n1,t1=new_page(context,'first')
  if navigate(first,e1,n1,t1,'first'):
   sample(first,c1,'Home-visible');first.locator('[data-home-action=preferences]').tap();sample(first,c1,'Home-Preferences-hidden-canvas');first.locator('[data-home-action=back]').tap();first.locator('[data-home-action=play]').tap();first.wait_for_function('document.querySelector("#app").dataset.screen==="play"');sample(first,c1,'active-play')
   second,c2,e2,n2,t2=new_page(context,'second');second.bring_to_front()
   if navigate(second,e2,n2,t2,'second-foreground'):
    sample(second,c2,'second-Home-foreground',first);first.bring_to_front();sample(first,c1,'first-play-foreground',second)
  browser.close()
except Exception as e:report['errors'].append('probe: '+str(e));save()
finally:server.terminate();server.wait(timeout=10);save()
print('RENDER_PROBE_RESULT '+json.dumps(report),flush=True)
raise SystemExit(bool(report['errors']))
