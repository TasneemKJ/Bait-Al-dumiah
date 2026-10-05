"""Native touch composition evidence from the exact built dollhouse source."""
import hashlib,json,os,subprocess,time,urllib.request
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path.cwd();OUT=ROOT/'artifacts'/'single-review';OUT.mkdir(parents=True,exist_ok=True)
SHA=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip();assert SHA==os.environ['SOURCE_SHA']
REV=os.environ['REVIEW_REVISION'];GROUP=os.environ['REVIEW_GROUP']
SIZES={'phone':[(390,844)],'small':[(360,640)],'other':[(412,915),(844,390),(568,320),(360,320)]}[GROUP]
manifest={'sourceCommit':SHA,'sourceTree':subprocess.check_output(['git','rev-parse','HEAD^{tree}'],text=True).strip(),'revision':REV,'group':GROUP,'images':[],'checks':[],'errors':[]}
server=subprocess.Popen(['node','scripts/serve.mjs','dist'],env={**os.environ,'PORT':'4391'},stdout=subprocess.DEVNULL)
def persist():(OUT/'review-manifest.json').write_text(json.dumps(manifest,indent=2))
def check(name,value,detail=None):
 manifest['checks'].append({'name':name,'passed':bool(value),'detail':detail})
 if not value:raise AssertionError(name+': '+str(detail))
def settled(page):
 page.wait_for_function('window.dollhouse && !document.querySelector("#loading") && !dollhouse.visual().cameraMoving',timeout=60000)
 for _ in range(2):
  page.evaluate('()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))')
  page.wait_for_function('!dollhouse.visual().cameraMoving',timeout=60000)
def observations(page):
 return page.evaluate('''()=>({visual:dollhouse.visual(),state:dollhouse.state(),stats:dollhouse.stats(),objects:dollhouse.objects(),viewport:{width:innerWidth,height:innerHeight,dpr:devicePixelRatio,touch:navigator.maxTouchPoints},regions:Object.fromEntries(['.objective','.room-views','.dock','.object-controls','.object-ribbon','.held-item','.visitor-hint'].map(selector=>{const e=document.querySelector(selector),r=e?.getBoundingClientRect();return [selector,e?{x:r.x,y:r.y,width:r.width,height:r.height,display:getComputedStyle(e).display,visibility:getComputedStyle(e).visibility}:null]}))})''')
def capture(page,label,phase,locale,width,height):
 settled(page);observed=observations(page)
 name=label+'-'+phase;path=OUT/(name+'.png');page.screenshot(path=str(path),scale='css',full_page=False,timeout=60000)
 selected=(GROUP!='other' and ((locale=='en' and phase in ['idle','full-clue','held-selected']) or (locale=='ar' and phase in ['idle','night-crowded','home']))) or (GROUP=='other' and phase=='idle' and (width in [412,844] or (width==568 and locale=='en') or (width==360 and locale=='ar')))
 manifest['images'].append({'path':path.name,'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'viewport':{'width':width,'height':height},'deviceScaleFactor':2,'hasTouch':True,'isMobile':True,'cpuThrottle':4,'locale':locale,'screenshotScale':'css','scenario':phase,'transport':selected,'observedBeforeCapture':{'focusedRoom':observed['visual']['focusedRoom'],'selectedObject':observed['visual']['selectedObject'],'regions':observed['regions'],'story':observed['state']['story'],'viewport':observed['viewport']}})
 (OUT/(name+'.json')).write_text(json.dumps(observed,indent=2));persist()
 if REV=='candidate' and phase=='idle' and height>width and height>=600:
  clue=observed['regions']['.objective'];check(label+' actual folded clue bounds',clue['height']<=76 and clue['width']*clue['height']<19000,clue)
 if REV=='candidate' and phase=='night-crowded' and width==360 and height==640:
  bounds=observed['visual']['presentation'];check(label+' crowded real room band',all(k in bounds for k in ['top','bottom']) and height-bounds['top']-bounds['bottom']>=120,bounds)
def tap_object(page,key):
 settled(page);point=next(o for o in page.evaluate('dollhouse.objects()') if o['key']==key)
 check('actual scene target reachable '+key,page.evaluate('p=>document.elementFromPoint(p.x,p.y)?.id==="world"',point),point)
 page.touchscreen.tap(point['x'],point['y']);settled(page)
def wrong_drop(page,key):
 point=next(o for o in page.evaluate('dollhouse.objects()') if o['key']==key)
 box=page.locator('.held-item').bounding_box();start={'x':box['x']+box['width']/2,'y':box['y']+box['height']/2}
 cdp=page.context.new_cdp_session(page)
 try:
  cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{**start,'id':1}]})
  for i in range(1,13):cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':start['x']+(point['x']-start['x'])*i/12,'y':start['y']+(point['y']-start['y'])*i/12,'id':1}]})
  cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
 finally:cdp.detach()
 settled(page)
try:
 for _ in range(100):
  try:urllib.request.urlopen('http://127.0.0.1:4391',timeout=1);break
  except Exception:time.sleep(.1)
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl'])
  for width,height in SIZES:
   for locale in ['en','ar']:
    label=f'{width}x{height}-{locale}';context=browser.new_context(viewport={'width':width,'height':height},has_touch=True,is_mobile=True,device_scale_factor=2)
    page=context.new_page();page.set_default_timeout(30000);errors=[];page.on('pageerror',lambda error:errors.append(str(error)))
    cdp=context.new_cdp_session(page);cdp.send('Emulation.setCPUThrottlingRate',{'rate':4})
    try:
     page.goto('http://127.0.0.1:4391/?debug=1',wait_until='networkidle');settled(page)
     if locale=='ar':
      page.locator('[data-action="toggle-tools"]').tap();page.locator('[data-action="panel-settings"]').tap();page.locator('[data-field="locale"]').select_option('ar');page.locator('#sheet [data-action="close"]').tap()
      if page.locator('.dock').get_attribute('data-expanded')=='true':page.locator('[data-action="toggle-tools"]').tap()
     page.locator('[data-room="kitchen"]').tap();settled(page)
     check(label+' locale',page.locator('html').get_attribute('lang')==locale)
     check(label+' true touch and no horizontal overflow',page.evaluate('navigator.maxTouchPoints>0 && document.documentElement.scrollWidth<=innerWidth+1'))
     capture(page,label,'idle',locale,width,height)
     toggle=page.locator('[data-action="toggle-clue"]')
     if toggle.count():
      check(label+' folded clue starts folded',toggle.get_attribute('aria-expanded')=='false')
      toggle.tap();check(label+' clue expands through actual touch',page.locator('#objective-copy').is_visible())
     capture(page,label,'full-clue',locale,width,height)
     if toggle.count():toggle.tap()
     tap_object(page,'prop:mint-tin');page.wait_for_function('dollhouse.visual().selectedObject==="prop:mint-tin"')
     capture(page,label,'selected',locale,width,height)
     tap_object(page,'prop:mint-tin');page.wait_for_selector('[data-held-item="red-thread"]')
     tap_object(page,'prop:tea-set');wrong_drop(page,'prop:tea-set')
     check(label+' wrong drop preserves real held thread',page.locator('[data-held-item="red-thread"]').is_visible())
     if REV=='candidate':check(label+' wrong-target feedback stays inside selected ribbon',page.locator('.ribbon-feedback').is_visible())
     capture(page,label,'held-selected',locale,width,height)
     page.locator('[data-action="light"]').tap();page.wait_for_function('dollhouse.visual().nightMix>.99',timeout=60000)
     capture(page,label,'night-crowded',locale,width,height)
     close=page.locator('[data-scene-action="close"]')
     if close.is_visible():close.tap()
     for room in ['parlor','studio','bedroom','kitchen']:
      page.locator(f'[data-room="{room}"]').tap();settled(page)
      check(label+' room return '+room,page.evaluate('dollhouse.visual().focusedRoom')==room)
      capture(page,label,'room-'+room,locale,width,height)
     page.locator('[data-action="camera"]').tap();settled(page)
     check(label+' home restores whole-house focus',page.evaluate('dollhouse.visual().focusedRoom') is None)
     capture(page,label,'home',locale,width,height)
     check(label+' no page errors',not errors,errors)
    except Exception as error:manifest['errors'].append({'scenario':label,'error':str(error),'pageErrors':errors})
    finally:context.close();persist()
  browser.close()
finally:server.terminate();server.wait(timeout=10);persist()
print(json.dumps({'sourceCommit':SHA,'revision':REV,'group':GROUP,'images':len(manifest['images']),'checks':len(manifest['checks']),'errors':manifest['errors']}))
raise SystemExit(bool(manifest['errors']))
