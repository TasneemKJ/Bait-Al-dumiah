"""Actual HTTP/WebGL moon-instrument acceptance with read-only diagnostics."""
import json,os,subprocess,time,traceback,urllib.request
from pathlib import Path
from playwright.sync_api import sync_playwright
from chime_gestures import wait_for_echo,pluck_chime
ROOT=Path(__file__).resolve().parents[1]
SCENARIO=os.environ.get('CHIME_SCENARIO','desktop')
assert SCENARIO in ['desktop','phone']
OUT=ROOT/'artifacts'/'chimes'/SCENARIO;OUT.mkdir(parents=True,exist_ok=True)
BASE=os.environ.get('PLAY_URL','http://127.0.0.1:4196')
server=None;checks=[];errors=[];page=None

def check(name,value):
 checks.append({'name':name,'passed':bool(value)})
 print(('PASS ' if value else 'FAIL ')+name,flush=True)
 assert value,name

def snapshot():return page.evaluate('window.dollhouse.state()')
def status():return page.evaluate('window.dollhouse.chimes()')
def settled():
 page.wait_for_function('''()=>{
  const g=window.dollhouse,s=g.chimes(),v=g.visual(),a=v.chimes;
  if(v.cameraMoving)return false;
  if(!s)return !v.chimeActive&&!a.active;
  return v.chimeActive&&a.active&&a.phase===s.phase&&a.held===s.held&&Math.abs(a.pull-s.pull)<1e-6&&g.chimeObjects().length===5;
 }''',timeout=60000,polling=100)
def capture(name):
 settled()
 page.screenshot(path=str(OUT/(name+'.png')),timeout=60000)
 (OUT/(name+'.json')).write_text(json.dumps({'chimes':status(),'visual':page.evaluate('window.dollhouse.visual()'),'viewport':page.viewport_size},indent=2))
def target(key):return page.evaluate('key=>window.dollhouse.chimeObjects().find(p=>p.key===key)',key)
def targets_fit(label):
 settled()
 result=page.evaluate('''()=>{
  const points=window.dollhouse.chimeObjects();
  const papers=[...document.querySelectorAll('.chime-heading,.chime-work-strip,#ui .dock')].filter(e=>e.getClientRects().length).map(e=>e.getBoundingClientRect());
  const overlap=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
  return {count:points.length,keys:points.map(p=>p.key),valid:points.every(p=>{
   const b=p.bounds;
   return b&&Object.values(b).every(Number.isFinite)&&b.width>=44-1e-6&&b.height>=44-1e-6&&b.left>=0&&b.right<=innerWidth&&b.top>=0&&b.bottom<=innerHeight&&document.elementFromPoint(p.x,p.y)?.id==='world'&&!papers.some(r=>overlap(b,r));
  })};
 }''')
 check(label+' has five real 44px targets clear of the work strip and controls',result['count']==5 and set(result['keys'])=={0,1,2,3,'moon'} and result['valid'])
def start_from_scene():
 page.locator('[data-room=bedroom]').click()
 page.wait_for_function('!window.dollhouse.visual().cameraMoving',timeout=60000)
 capture('00-bedroom-mobile')
 for _ in range(2):
  p=page.evaluate('window.dollhouse.objects().find(p=>p.key==="prop:moon-mobile")')
  if SCENARIO=='phone':page.touchscreen.tap(p['x'],p['y'])
  else:page.mouse.click(p['x'],p['y'])
 page.wait_for_function('window.dollhouse.visual().chimeActive',timeout=60000)
 check('two direct touches on the hanging mobile enter physical play without a modal',page.locator('dialog[open],[data-choice]').count()==0)
 wait_for_echo(page)

try:
 if not os.environ.get('PLAY_URL'):
  server=subprocess.Popen(['node','scripts/serve.mjs','dist'],cwd=ROOT,env={**os.environ,'PORT':'4196'},stdout=(OUT/'server.log').open('w'),stderr=subprocess.STDOUT)
  for _ in range(100):
   try:urllib.request.urlopen(BASE,timeout=1);break
   except Exception:time.sleep(.1)
 with sync_playwright() as p:
  opts={'headless':True,'args':['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']}
  if os.environ.get('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
  browser=p.chromium.launch(**opts)
  context=browser.new_context(viewport={'width':1280,'height':900} if SCENARIO=='desktop' else {'width':390,'height':844},device_scale_factor=1,has_touch=SCENARIO=='phone',is_mobile=SCENARIO=='phone',reduced_motion='reduce' if SCENARIO=='phone' else 'no-preference')
  page=context.new_page();page.set_default_timeout(15000)
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.on('console',lambda m:errors.append(m.text) if m.type=='error' else None)
  if SCENARIO=='phone':
   # Authored old-save settings fixture only. No earned gameplay is seeded.
   page.add_init_script("localStorage.setItem('bait-al-dumiah.v1',JSON.stringify({version:1,settings:{locale:'ar',muted:true,reducedMotion:true,quality:'auto'}}))")
  page.goto(BASE+'/?debug=1',wait_until='domcontentloaded',timeout=60000)
  page.wait_for_function('window.dollhouse&&!document.querySelector("#loading")',timeout=90000)
  start_from_scene();capture('01-instrument');targets_fit(SCENARIO+' initial instrument')
  check('five separated physical targets are available',len(page.evaluate('window.dollhouse.chimeObjects()'))==5)
  first=list(reversed(status()['pattern']))[0]
  before=snapshot()['buttons'];note=target(first)
  if SCENARIO=='desktop':
   page.mouse.click(note['x'],note['y'])
   check('a tap is not mistaken for a pluck',status()['cursor']==0 and status()['held'] is None)
   page.mouse.move(note['x'],note['y']);page.mouse.down()
   span=page.evaluate('window.dollhouse.chimePullSpan()');page.mouse.move(note['x'],note['y']+span*.65,steps=8)
   page.wait_for_function('window.dollhouse.chimes().pull>=.6')
   capture('02-held-charm');page.mouse.move(-20,-20);page.mouse.up()
   check('leaving the canvas cancels the pull without a note or reward',status()['held'] is None and status()['cursor']==0 and snapshot()['buttons']==before)
   pluck_chime(page,(first+1)%4)
   check('wrong note starts a gentle demonstration without taking currency',status()['phase']=='listen' and snapshot()['buttons']==before)
   wait_for_echo(page);settled()
   # R cancels an owned keyboard pull and demonstrates the same phrase freely.
   replay_pattern=list(status()['pattern'])
   page.locator('#world').focus();page.keyboard.down('Space')
   page.wait_for_function('window.dollhouse.chimes().held!==null&&window.dollhouse.chimes().pull>=.35',timeout=60000)
   held_before_replay=status()
   page.keyboard.press('r');page.keyboard.up('Space')
   replayed=status()
   check('keyboard replay cancels a held charm without echoing or paying',replayed['phase']=='listen' and replayed['held'] is None and replayed['cursor']==0 and snapshot()['buttons']==before and replayed['pattern']==replay_pattern and replayed['toneSerial']==held_before_replay['toneSerial'] and replayed['round']==held_before_replay['round']+1 and replayed['mistakes']==held_before_replay['mistakes'])
   wait_for_echo(page);settled()
   # Finish with actual keyboard ownership, not answer button dispatches.
   selected=0
   for note_id in reversed(status()['pattern']):
    while selected!=note_id:page.keyboard.press('ArrowRight');selected=(selected+1)%4
    page.keyboard.down('Space');page.wait_for_function('window.dollhouse.chimes().pull>=.35',timeout=60000);page.keyboard.up('Space')
  else:
   check('phone instructions use Shami Arabic with reduced motion',page.locator('html').get_attribute('dir')=='rtl' and snapshot()['settings']['reducedMotion'])
   cdp=context.new_cdp_session(page)
   def touch_pluck(note_id,capture_held=False):
    p=target(note_id);span=page.evaluate('window.dollhouse.chimePullSpan()')
    cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':p['x'],'y':p['y'],'id':1}]})
    for i in range(1,7):cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':p['x'],'y':p['y']+span*.7*i/6,'id':1}]})
    if capture_held:capture('02-touch-held')
    cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
   for i,note_id in enumerate(reversed(status()['pattern'])):touch_pluck(note_id,i==0)
  page.wait_for_function("window.dollhouse.chimes().phase==='finished'",timeout=60000)
  check('direct physical play earns one melody and retained finished state',snapshot()['activities']['mastery']['lullaby']==1 and snapshot()['buttons']==before+7)
  capture('03-finished-mobile')
  page.wait_for_function('window.dollhouse.visual().chimes.allLit',timeout=60000)
  check('the completed mobile visibly lights all charms',page.evaluate('window.dollhouse.visual().chimes.allLit'))
  stable=snapshot()['buttons'];p=target(0)
  if SCENARIO=='phone':page.touchscreen.tap(p['x'],p['y'])
  else:page.mouse.click(p['x'],p['y'])
  check('releasing or tapping completed work cannot pay again',snapshot()['buttons']==stable and snapshot()['activities']['mastery']['lullaby']==1)
  if SCENARIO=='phone':
   for width,height in [(320,568),(667,320)]:
    page.set_viewport_size({'width':width,'height':height});page.wait_for_timeout(500)
    page.wait_for_function('!window.dollhouse.visual().cameraMoving',timeout=60000)
    capture(f'04-arabic-{width}x{height}')
    targets_fit(f'{width}x{height} Arabic finished instrument')
    check(f'phone work strip stays inside {width}x{height}',page.locator('.chime-work-strip').evaluate('(e)=>{const r=e.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.bottom<=innerHeight}'))
   check('reduced-motion strings do not spring after release',page.evaluate('window.dollhouse.visual().chimes.turns.every(t=>t===0)'))
  # The finished instrument needs a fresh physical moon tap to start again.
  # On phone this is deliberately exercised at the limiting 667x320 viewport.
  moon=target('moon')
  if SCENARIO=='phone':page.touchscreen.tap(moon['x'],moon['y'])
  else:page.mouse.click(moon['x'],moon['y'])
  page.wait_for_function("window.dollhouse.chimes()?.phase==='listen'",timeout=60000)
  check('the actual wind-up moon starts a fresh phrase without another reward',snapshot()['buttons']==stable and snapshot()['activities']['mastery']['lullaby']==1 and status()['held'] is None and status()['cursor']==0)
  wait_for_echo(page);settled();targets_fit(SCENARIO+' replayed instrument')
  stats=page.evaluate('window.dollhouse.stats()');check('physical instrument stays under the existing geometry budget',stats['triangles']<400000)
  if SCENARIO=='desktop':
   page.locator('#world').focus();page.keyboard.down('Space')
   try:
    page.wait_for_function('window.dollhouse.chimes().held!==null&&window.dollhouse.chimes().pull>=.35',timeout=60000)
    page.keyboard.press('Escape')
   finally:page.keyboard.up('Space')
  else:page.locator('.chime-exit').click()
  page.wait_for_function('!window.dollhouse.visual().chimeActive',timeout=60000);settled()
  check('an unfinished replay restores canvas controls and keeps earned progress',status() is None and snapshot()['buttons']==stable and snapshot()['activities']['mastery']['lullaby']==1 and page.locator('.room-views').is_visible() and page.evaluate('document.activeElement.id==="world"&&document.querySelector("#world").getAttribute("role")!=="application"'))
  check('leaving retains an earned star in the bedroom',page.evaluate('window.dollhouse.visual().chimes.earnedStars===1'))
  capture('05-earned-constellation')
  if SCENARIO=='desktop':
   page.reload(wait_until='domcontentloaded',timeout=60000);page.wait_for_function('window.dollhouse&&!document.querySelector("#loading")',timeout=90000)
   check('earned moon mastery survives a real HTTP reload',snapshot()['activities']['mastery']['lullaby']==1 and status() is None)
  check('journey has no JavaScript or console errors',not errors)
  (OUT/'checks.json').write_text(json.dumps({'checks':checks,'errors':errors,'stats':stats},indent=2));browser.close()
except Exception:
 (OUT/'failure.txt').write_text(traceback.format_exc())
 (OUT/'checks.json').write_text(json.dumps({'checks':checks,'errors':errors},indent=2))
 if page:
  try:page.screenshot(path=str(OUT/'failure.png'),timeout=60000)
  except Exception:pass
 raise
finally:
 if server:server.terminate()
