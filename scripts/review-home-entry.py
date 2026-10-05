"""Native Home acceptance. All normal entry and gameplay use trusted user input.

The primary EN/AR journeys start with empty storage. Storage and audio failures
are separate, explicitly instrumented fixtures. Debug state is observation-only.
"""
import json, os, subprocess, sys, time, urllib.request
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path.cwd(); sys.path.insert(0,str(ROOT/'scripts'))
from scene_gestures import scene_ready
OUT=ROOT/'artifacts'/'home-entry'; OUT.mkdir(parents=True,exist_ok=True)
checks,observations,errors=[],[],[]
SAVE='bait-al-dumiah.v1'; PREF=SAVE+'.preferences'; URL='http://127.0.0.1:4196/?debug=1'
server=subprocess.Popen(['node','scripts/serve.mjs','dist'],cwd=ROOT,env={**os.environ,'PORT':'4196'},stdout=(OUT/'server.log').open('w'),stderr=subprocess.STDOUT)

INSTRUMENT=r'''() => {
 window.homeEvidence={writes:[],audio:[],inputs:[]};
 const set=Storage.prototype.setItem;
 Storage.prototype.setItem=function(k,v){window.homeEvidence.writes.push({key:k,time:performance.now()});return set.call(this,k,v)};
 const Audio=window.AudioContext;
 if(Audio)window.AudioContext=class extends Audio{
   constructor(...a){super(...a);homeEvidence.audio.push({event:'construct',time:performance.now(),active:navigator.userActivation.isActive})}
   resume(...a){homeEvidence.audio.push({event:'resume',time:performance.now(),active:navigator.userActivation.isActive});return super.resume(...a)}
 };
 for(const type of ['click','pointerdown','pointerup','keydown'])window.addEventListener(type,e=>{
   homeEvidence.inputs.push({type,time:performance.now(),trusted:e.isTrusted,key:e.key,x:e.clientX,y:e.clientY,
     action:e.target.closest?.('[data-home-action]')?.dataset.homeAction,targetId:e.target.id,
     owner:e.clientX!==undefined?document.elementFromPoint(e.clientX,e.clientY)?.id:null});
 },true);
}'''


def check(name,passed):
 checks.append({'name':name,'passed':bool(passed)})
 print(('PASS ' if passed else 'FAIL ')+name,flush=True)
 assert passed,name


def observe(name,**data):
 record={'case':name,'sourceCommit':os.environ['SOURCE_SHA'],**data};observations.append(record)
 print('HOME_ENTRY_OBSERVATION '+json.dumps(record,ensure_ascii=False),flush=True)


def visible(page,selector='#home button'):
 return page.locator(selector).evaluate_all('els=>els.filter(e=>e.getClientRects().length).map(e=>({action:e.dataset.homeAction,text:e.textContent,rect:(({x,y,width,height})=>({x,y,width,height}))(e.getBoundingClientRect())}))')


def geometry(page,label,actions):
 buttons=visible(page);size=page.viewport_size
 check(label+' exact action inventory',sorted(b['action'] for b in buttons)==sorted(actions))
 check(label+' all targets at least 44 CSS pixels',all(b['rect']['width']>=44 and b['rect']['height']>=44 for b in buttons))
 check(label+' targets fit viewport',all(b['rect']['x']>=-1 and b['rect']['y']>=-1 and b['rect']['x']+b['rect']['width']<=size['width']+1 and b['rect']['y']+b['rect']['height']<=size['height']+1 for b in buttons))
 for i,first in enumerate(buttons):
  for second in buttons[i+1:]:
   a,b=first['rect'],second['rect']
   overlap=min(a['x']+a['width'],b['x']+b['width'])>max(a['x'],b['x']) and min(a['y']+a['height'],b['y']+b['height'])>max(a['y'],b['y'])
   check(label+' '+first['action']+' and '+second['action']+' do not overlap',not overlap)
 check(label+' no document overflow',page.evaluate('document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight'))
 observe(label,buttons=buttons,viewport=size,direction=page.locator('html').get_attribute('dir'),safeArea='Browser emulation has zero hardware notch inset; hardware safe areas remain unverified.')


def shot(page,name):
 page.screenshot(path=str(OUT/(name+'.png')),timeout=60000,scale='css')


def tap(page,selector):
 element=page.locator(selector);element.wait_for(state='visible');element.tap(timeout=60000)


def home_ready(page):
 page.wait_for_function('window.dollhouse&&!document.querySelector("#loading")&&!document.querySelector("[data-home-action=play]").disabled',timeout=60000)
 check('Home exposes no gameplay HUD',page.locator('#ui').is_hidden() and page.locator('#ui').get_attribute('inert') is not None)


def fixture(browser,locale='en',extra=None):
 context=browser.new_context(viewport={'width':390,'height':844},has_touch=True,is_mobile=True,device_scale_factor=2,reduced_motion='reduce' if locale=='ar' else 'no-preference')
 # A string passed to add_init_script is a script, not a callback. Keep
 # instrumentation and failure setup in one deterministically ordered script.
 context.add_init_script('('+INSTRUMENT+')();'+('('+extra+')();' if extra else ''))
 page=context.new_page();page.set_default_timeout(60000)
 page.on('pageerror',lambda error:errors.append(str(error)))
 cdp=context.new_cdp_session(page);cdp.send('Emulation.setCPUThrottlingRate',{'rate':4})
 page.goto(URL);home_ready(page)
 if locale=='ar':
  tap(page,'[data-home-action="preferences"]');tap(page,'[data-home-action="language"]');tap(page,'[data-home-action="back"]')
 return context,page,cdp


def raw(page):return page.evaluate('(key)=>localStorage.getItem(key)',SAVE)
def state(page):return page.evaluate('dollhouse.state()')
def canonical_writes(page):return page.evaluate('(key)=>homeEvidence.writes.filter(w=>w.key===key)',SAVE)


def enter(page,method='touch'):
 if method=='keyboard':
  # Preferences Back restores its own button focus. Shift+Tab reaches Play.
  tap(page,'[data-home-action="preferences"]');page.keyboard.press('Escape')
  check('Escape restores Preferences focus',page.evaluate('document.activeElement.dataset.homeAction==="preferences"'))
  page.keyboard.press('Shift+Tab')
  check('keyboard reaches Play',page.evaluate('document.activeElement.dataset.homeAction==="play"'))
  page.keyboard.press('Enter')
 else:tap(page,'[data-home-action="play"]')
 page.wait_for_function('document.querySelector("#app").dataset.screen==="play"&&!document.querySelector("#ui").inert')
 check('entry focuses actual world canvas',page.evaluate('document.activeElement.id==="world"'))
 check('Home becomes inert and hidden',page.locator('#home').is_hidden() and page.locator('#home').get_attribute('inert') is not None)
 events=page.evaluate('homeEvidence.inputs.filter(e=>e.type==="click"&&e.action==="play")')
 check('exactly one trusted Play or Continue activation',len(events)==1 and events[0]['trusted'])
 scene_ready(page)
 return events[0]['time']


def point(page,key):return page.evaluate('key=>dollhouse.objects().find(p=>p.key===key)',key)
def canvas_owner(page,p):return page.evaluate('p=>document.elementFromPoint(p.x,p.y)?.id==="world"',p)


def normal_journey(browser,locale):
 context,page,cdp=fixture(browser,locale)
 try:
  initial=state(page);check(locale+' begins with a genuinely empty canonical save',raw(page) is None)
  check(locale+' has no audio construction before sound gesture',page.evaluate('homeEvidence.audio.length===0'))
  start=page.evaluate('performance.now()');page.wait_for_timeout(9000)
  check(locale+' Home state stays frozen through real idle interval',state(page)==initial and raw(page) is None and not canonical_writes(page))
  observe(locale+'-home-frozen',requestedIdleMs=9000,actualIdleMs=page.evaluate('performance.now()')-start,state=state(page))
  for width,height in [(320,568),(360,640),(390,844),(412,915),(844,390)]:
   page.set_viewport_size({'width':width,'height':height});page.wait_for_timeout(250)
   label=f'{locale}-{width}x{height}'
   geometry(page,label+' Home',['play','preferences']);shot(page,label+'-home')
   tap(page,'[data-home-action="preferences"]')
   check(label+' Preferences initial focus is Sound',page.evaluate('document.activeElement.dataset.homeAction==="sound"'))
   geometry(page,label+' Preferences',['sound','language','back']);shot(page,label+'-preferences')
   # Rotate while preferences is open and back; only real resize, no app state.
   if width==390:
    page.set_viewport_size({'width':844,'height':390});geometry(page,locale+' rotated Preferences',['sound','language','back'])
    page.set_viewport_size({'width':width,'height':height})
   tap(page,'[data-home-action="back"]')
  check(locale+' responsive Home and Preferences do not advance the house',state(page)==initial and raw(page) is None and not canonical_writes(page))
  page.set_viewport_size({'width':390,'height':844})
  tap(page,'[data-home-action="preferences"]');tap(page,'[data-home-action="sound"]')
  page.wait_for_function('dollhouse.state().settings.muted===false')
  audio=page.evaluate('homeEvidence.audio')
  check(locale+' real Sound gesture unlocks audio',any(e['event']=='resume' and e['active'] for e in audio))
  check(locale+' Preferences still never write canonical progress',raw(page) is None and not canonical_writes(page))
  tap(page,'[data-home-action="sound"]');page.wait_for_function('dollhouse.state().settings.muted===true')
  tap(page,'[data-home-action="back"]')
  play_at=enter(page,'touch' if locale=='en' else 'keyboard')
  check(locale+' new play focuses kitchen',page.evaluate('dollhouse.visual().focusedRoom==="kitchen"'))
  shot(page,locale+'-01-first-play')
  gameplay_controls=visible(page,'#ui button')
  target=point(page,'prop:mint-tin');check(locale+' first tin point is owned by the canvas',canvas_owner(page,target))
  page.touchscreen.tap(target['x'],target['y']);page.wait_for_timeout(650);page.touchscreen.tap(target['x'],target['y']);scene_ready(page)
  check(locale+' first unchanged-coordinate tin attempt yields real red thread',state(page)['story']['step']==1 and page.locator('[data-held-item="red-thread"]').is_visible())
  tin_events=page.evaluate('homeEvidence.inputs.filter(e=>e.type==="pointerdown"&&e.targetId==="world")')
  check(locale+' both opening touches belong to canvas',len(tin_events)==2 and all(e['trusted'] and e['owner']=='world' for e in tin_events))
  observe(locale+'-first-real-tin-action',requestedGapMs=650,actualGapMs=tin_events[1]['time']-tin_events[0]['time'],events=tin_events,target=target,story=state(page)['story'],gameplayControls=gameplay_controls,simplicityVerdict='Gameplay remains dense; this Home gate cannot establish all-screen simplicity.')
  shot(page,locale+'-02-real-thread')
  tap(page,'[data-room="studio"]');scene_ready(page)
  destination=point(page,'prop:sewing-machine');check(locale+' sewing destination is on canvas',canvas_owner(page,destination))
  page.touchscreen.tap(destination['x'],destination['y']);scene_ready(page)
  fixed=point(page,'prop:sewing-machine')
  check(locale+' sewing selection keeps destination fixed',abs(fixed['x']-destination['x'])<.25 and abs(fixed['y']-destination['y'])<.25 and canvas_owner(page,destination))
  b=page.locator('.held-item').bounding_box();x,y=b['x']+b['width']/2,b['y']+b['height']/2
  cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x,'y':y,'id':1}]})
  for i in range(1,13):cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':x+(destination['x']-x)*i/12,'y':y+(destination['y']-y)*i/12,'id':1}]})
  cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
  page.wait_for_function('dollhouse.visual().stitchActive')
  check(locale+' real thread drop starts the bear seam',page.evaluate('dollhouse.stitch()?.mode==="mend"'))
  shot(page,locale+'-03-real-seam-entry')
  page.keyboard.press('Escape');scene_ready(page)
  check(locale+' leaving the seam preserves unfinished red thread',page.locator('[data-held-item="red-thread"]').is_visible() and state(page)['story']['step']==1)
  page.set_viewport_size({'width':844,'height':390});scene_ready(page);page.set_viewport_size({'width':390,'height':844});scene_ready(page)
  # Observe a full native 120-second post-entry session. No virtual clock,
  # simulation injection, or completed-ritual fixture is used.
  elapsed=page.evaluate('performance.now()')-play_at
  if elapsed<120000:page.wait_for_timeout(120000-elapsed)
  elapsed=page.evaluate('performance.now()')-play_at
  check(locale+' observed at least 120 real seconds after entry',elapsed>=120000)
  check(locale+' play simulation actually advanced',state(page)['elapsed']>0)
  shot(page,locale+'-04-after-120-real-seconds')
  observe(locale+'-native-first-120-seconds',actualElapsedMs=elapsed,state=state(page),controls=visible(page,'#ui button'),inputCount=page.evaluate('homeEvidence.inputs.length'))
  # Genuine returning-save case from the preceding fresh-player journey.
  page.reload();home_ready(page)
  check(locale+' returning Home says Continue',page.locator('[data-home-action="play"]').inner_text() in ['Continue','كمّل'])
  before=raw(page);restored=state(page);check(locale+' returning Home preserves actual earned progress',restored['story']['step']==1)
  page.wait_for_timeout(9000)
  check(locale+' returning Home preserves canonical bytes and clock',raw(page)==before and state(page)==restored and not canonical_writes(page))
  tap(page,'[data-home-action="preferences"]');tap(page,'[data-home-action="language"]')
  edited=state(page)['settings']['locale'];check(locale+' Home preference change preserves canonical save bytes',raw(page)==before and not canonical_writes(page))
  page.reload();home_ready(page)
  check(locale+' sidecar preference survives reload without advancing save',state(page)['settings']['locale']==edited and raw(page)==before and not canonical_writes(page))
  shot(page,locale+'-05-returning-continue')
  enter(page)
  check(locale+' Continue preserves actual story and economy',state(page)['story']['step']==1 and state(page)['buttons']==restored['buttons'])
  observe(locale+'-returning-save',fromFreshJourney=True,canonicalBefore= json.loads(before),stateAfterContinue=state(page))
 except Exception:
  shot(page,locale+'-failure-state')
  (OUT/(locale+'-failure-state.json')).write_text(json.dumps({'state':state(page),'inputs':page.evaluate('homeEvidence.inputs'),'visibleHome':visible(page),'visiblePlay':visible(page,'#ui button')},indent=2,ensure_ascii=False))
  raise
 finally:context.close()


def failure_fixture(browser,locale,kind):
 # These isolated records are labeled failure fixtures, never fresh-play proof.
 extra='''() => {
 const get=Storage.prototype.getItem,set=Storage.prototype.setItem;
 set.call(localStorage,'bait-al-dumiah.v1','unknown save that must not be overwritten');
 window.homeEvidence.writes=[];
 window.failureOriginalGet=get;
 Storage.prototype.getItem=function(k){if(k==='bait-al-dumiah.v1')throw new Error('intentional initial read failure');return get.call(this,k)};
 }''' if kind=='read-failure' else '''() => { Storage.prototype.setItem.call(localStorage,'bait-al-dumiah.v1','{invalid-json');window.homeEvidence.writes=[]; }'''
 if kind=='audio-failure':extra='''() => {window.AudioContext=class {constructor(){throw new Error('intentional audio unavailable')}};window.webkitAudioContext=undefined;}'''
 context,page,cdp=fixture(browser,locale,extra)
 try:
  if kind=='audio-failure':
   tap(page,'[data-home-action="preferences"]');tap(page,'[data-home-action="sound"]')
   check(locale+' audio failure remains muted',state(page)['settings']['muted'])
   check(locale+' audio failure is visibly explained on Home',page.locator('#home .home-notice').is_visible() and bool(page.locator('#home .home-notice').inner_text()))
   shot(page,locale+'-'+kind);observe(locale+'-'+kind,notice=page.locator('#home .home-notice').inner_text());return
  check(locale+' '+kind+' visible notice',page.locator('#home .home-notice').is_visible())
  check(locale+' '+kind+' offers Play rather than Continue',page.locator('[data-home-action="play"]').inner_text() in ['Play','العب'])
  shot(page,locale+'-'+kind)
  if kind=='read-failure':
   # Restore reads only after the app made its initial unavailable decision.
   page.evaluate('Storage.prototype.getItem=window.failureOriginalGet')
   before=raw(page);enter(page);page.wait_for_timeout(9000)
   check(locale+' failed initial read never overwrites unknown save after real Play',raw(page)==before and not canonical_writes(page))
   observe(locale+'-'+kind,canonicalUnchanged=raw(page)==before,writes=page.evaluate('homeEvidence.writes'))
  else:
   enter(page);check(locale+' invalid save starts fresh through actual Play',state(page)['story']['step']==0 and state(page)['buttons']==36)
 finally:context.close()


try:
 for _ in range(80):
  try:urllib.request.urlopen(URL,timeout=1);break
  except Exception:time.sleep(.1)
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl'])
  for locale in ['en','ar']:
   for name,fn in [('fresh-and-returning',lambda:normal_journey(browser,locale))]+[(kind,lambda kind=kind:failure_fixture(browser,locale,kind)) for kind in ['read-failure','invalid-save','audio-failure']]:
    try:fn()
    except Exception as error:
     errors.append(locale+' '+name+': '+str(error));print('HOME_ENTRY_ERROR '+errors[-1],flush=True)
  browser.close()
 check('no native Home runtime or journey errors',not errors)
finally:
 report={'sourceCommit':os.environ['SOURCE_SHA'],'checks':checks,'errors':errors,'observations':observations}
 (OUT/'results.json').write_text(json.dumps(report,indent=2,ensure_ascii=False))
 print('HOME_ENTRY_SUMMARY '+json.dumps({'checks':len(checks),'passed':sum(c['passed'] for c in checks),'errors':errors}),flush=True)
 server.terminate();server.wait(timeout=10)
if errors or any(not c['passed'] for c in checks):raise SystemExit('Native Home acceptance failed')
