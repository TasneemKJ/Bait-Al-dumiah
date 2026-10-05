"""Read-only camera/input timing probe; actual scene touches and carried drops."""
import json, os, subprocess, time, urllib.request
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path.cwd(); OUT=ROOT/'artifacts'/'touch-diagnosis';OUT.mkdir(parents=True,exist_ok=True)
server=subprocess.Popen(['node','scripts/serve.mjs','dist'],env={**os.environ,'PORT':'4192'},stdout=(OUT/'server.log').open('w'),stderr=subprocess.STDOUT)
for _ in range(80):
 try:urllib.request.urlopen('http://127.0.0.1:4192');break
 except Exception:time.sleep(.1)
OBS='''()=>{const g=window.dollhouse,v=g.visual(),s=g.state();return {time:performance.now(),presentation:v.presentation,moving:v.cameraMoving,selected:v.selectedObject,room:v.focusedRoom,story:s.story,activity:s.activities.active?.id,objects:g.objects(),response:document.querySelector('.scene-response,.ribbon-feedback')?.textContent}}'''
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl'])
  for locale,reduce,rate in [('ar',True,1),('en',False,1),('ar',True,4),('en',False,4)]:
   name=f'{locale}-reduce{reduce}-cpu{rate}';context=browser.new_context(viewport={'width':390,'height':844},has_touch=True,reduced_motion='reduce' if reduce else 'no-preference');page=context.new_page();page.set_default_timeout(60000)
   session=context.new_cdp_session(page);session.send('Emulation.setCPUThrottlingRate',{'rate':rate})
   page.goto('http://127.0.0.1:4192/?debug=1');page.wait_for_function('window.dollhouse&&!document.querySelector("#loading")')
   page.locator('[data-action="toggle-tools"]').click();page.locator('[data-action="panel-settings"]').click();page.locator('[data-field="quality"]').select_option('low')
   if locale=='ar':page.locator('[data-field="locale"]').select_option('ar')
   page.locator('#sheet [data-action="close"]').click()
   page.evaluate('''obs=>{window.touchTrace=[];window.traceObs=eval('('+obs+')');for(const type of ['pointerdown','pointerup'])window.addEventListener(type,e=>{window.touchTrace.push({event:type,x:e.clientX,y:e.clientY,target:e.target.className||e.target.id,...window.traceObs()});},true);}''',OBS)
   def obs(label):
    value=page.evaluate(OBS);value['label']=label;print('TOUCH_OBSERVATION '+json.dumps({'case':name,**value}),flush=True);return value
   def ready():page.wait_for_function('!window.dollhouse.visual().cameraMoving')
   def point(key):return next(x for x in page.evaluate('window.dollhouse.objects()') if x['key']==key)
   def tap(key):
    q=point(key);obs('project-'+key);page.touchscreen.tap(q['x'],q['y']);ready()
   def settled():page.evaluate('()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))');ready()
   page.locator('[data-room="kitchen"]').click();ready();tap('prop:mint-tin');tap('prop:mint-tin');fast=obs('fast-two-taps')
   page.wait_for_timeout(600);settled();obs('after-two-taps-settled')
   if fast['story']['step']!=1:
    page.screenshot(path=str(OUT/(name+'-miss.png')));tap('prop:mint-tin');settled();obs('recovery-current-visible-target')
   assert page.evaluate('window.dollhouse.state().story.step')==1,'Tin does not recover at stable visible target'
   page.locator('[data-room="studio"]').click();ready();destination=point('prop:sewing-machine');obs('before-drag');b=page.locator('.held-item').bounding_box();x,y=b['x']+b['width']/2,b['y']+b['height']/2
   session.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x,'y':y,'id':1}]})
   for i in range(1,13):session.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':x+(destination['x']-x)*i/12,'y':y+(destination['y']-y)*i/12,'id':1}]})
   obs('before-drop');session.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]});ready();obs('after-drop');settled();after=obs('after-drop-settled')
   if after.get('activity')!='stitch':
    page.screenshot(path=str(OUT/(name+'-drop-miss.png')));destination=point('prop:sewing-machine');b=page.locator('.held-item').bounding_box();x,y=b['x']+b['width']/2,b['y']+b['height']/2
    session.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x,'y':y,'id':1}]})
    for i in range(1,13):session.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':x+(destination['x']-x)*i/12,'y':y+(destination['y']-y)*i/12,'id':1}]})
    session.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]});page.wait_for_timeout(300);obs('recovery-stable-drop')
   trace=page.evaluate('window.touchTrace');print('TOUCH_TRACE '+json.dumps({'case':name,'events':trace}),flush=True)
   assert page.evaluate('window.dollhouse.state().activities.active?.id')=='stitch','Stable sewing drop failed'
   page.screenshot(path=str(OUT/(name+'-sewing.png')));context.close()
  browser.close()
finally:server.terminate()
