"""Native Home acceptance. All normal entry and gameplay use trusted user input.

The primary EN/AR journeys start with empty storage. Storage and audio failures
are separate, explicitly instrumented fixtures. Debug state is observation-only.
"""
import hashlib, json, os, struct, subprocess, sys, time, urllib.request
from datetime import datetime, timezone
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path.cwd(); sys.path.insert(0,str(ROOT/'scripts'))
from scene_gestures import scene_ready
MODE=os.environ.get('HOME_ACCEPTANCE_MODE','behavior-4x')
if MODE not in {'behavior-4x','visual-1x'}:raise ValueError('Unknown Home acceptance mode')
CPU_RATE=4 if MODE=='behavior-4x' else 1
OUT=ROOT/'artifacts'/'home-entry'/MODE; OUT.mkdir(parents=True,exist_ok=True)
profiles,captures,capture_errors,failed_capture_pages={},{},[],set()
SELECTED_CAPTURES={f'{locale}-{name}' for locale in ['en','ar'] for name in ['320x568-home','390x844-home','844x390-home','390x844-preferences','844x390-preferences','01-first-play','02-real-thread','03-real-seam-entry','05-returning-continue','read-failure','invalid-save','audio-failure','entry-changed','failure-state']}
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
     action:e.target.closest?.('[data-home-action]')?.dataset.homeAction,gameAction:e.target.closest?.('[data-action]')?.dataset.action,field:e.target.closest?.('[data-field]')?.dataset.field,targetId:e.target.id,
     owner:e.clientX!==undefined?document.elementFromPoint(e.clientX,e.clientY)?.id:null});
 },true);
}'''


def check(name,passed):
 checks.append({'name':name,'passed':bool(passed)})
 print(('PASS ' if passed else 'FAIL ')+name,flush=True)
 assert passed,name


def observe(name,**data):
 record={'case':name,'sourceCommit':os.environ['SOURCE_SHA'],'sourceTree':os.environ['SOURCE_TREE'],'reviewedSourceDigest':os.environ['SOURCE_DIGEST'],'evidenceRole':MODE,'cpuThrottleRate':CPU_RATE,**data};observations.append(record)
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
 # Never change a behavioral context's CPU rate to take a picture. The visual
 # job owns independent fresh contexts and labels every original accordingly.
 if MODE!='visual-1x' or name not in SELECTED_CAPTURES or page in failed_capture_pages:return False
 profile=profiles[page]
 if profile['cpuThrottleRate']!=1:raise AssertionError('Originals require a separate normal-speed context')
 path=OUT/('visual-1x-'+name+'.png');started=time.monotonic()
 try:data=page.screenshot(path=str(path),timeout=60000,scale='css')
 except Exception as error:
  failed_capture_pages.add(page);capture_errors.append({'name':name,'contextId':profile['contextId'],'elapsedWallMs':(time.monotonic()-started)*1000,'error':str(error),'retry':False});raise
 assert data==path.read_bytes(),'Saved PNG differs from screenshot return bytes'
 assert data[:8]==b'\x89PNG\r\n\x1a\n'
 width,height=struct.unpack('>II',data[16:24])
 record={**profile,'name':name,'path':path.name,'sourceCommit':os.environ['SOURCE_SHA'],'sourceTree':os.environ['SOURCE_TREE'],'reviewedSourceDigest':os.environ['SOURCE_DIGEST'],'evidenceRole':'visual-1x','width':width,'height':height,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),'captureWallMs':(time.monotonic()-started)*1000,'capturedAtUtc':datetime.now(timezone.utc).isoformat(),'captureScale':'css','deviceScaleFactor':2,'pixels':'unaltered browser capture bytes; no post-capture resizing or recomposition','behavioral120SecondEvidence':False}
 captures[name]=record;(path.with_suffix('.png.json')).write_text(json.dumps(record,indent=2,ensure_ascii=False))
 return True


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
 cdp=context.new_cdp_session(page);cdp.send('Emulation.setCPUThrottlingRate',{'rate':CPU_RATE})
 profiles[page]={'contextId':MODE+'-'+locale+'-'+str(len(profiles)+1),'locale':locale,'cpuThrottleRate':CPU_RATE,'contextPurpose':'behavioral input/state/geometry' if MODE=='behavior-4x' else 'separate normal-speed original pixels'}
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


def finish_observation(page,locale,play_at,wall_started,wall_started_utc):
 # performance.now and the monotonic Python timer are real clocks. The game
 # simulation clock is observed separately; no virtual time or progress write.
 elapsed=page.evaluate('performance.now()')-play_at
 if MODE=='behavior-4x' and elapsed<120000:page.wait_for_timeout(120000-elapsed)
 elapsed=page.evaluate('performance.now()')-play_at
 current=state(page)
 if MODE=='behavior-4x':
  check(locale+' observed at least 120 real seconds after entry',elapsed>=120000)
  check(locale+' play simulation actually advanced',current['elapsed']>0)
 observe(locale+('-native-first-120-seconds' if MODE=='behavior-4x' else '-visual-context-input-sequence'),actualElapsedMs=elapsed,minimum120SecondGate=MODE=='behavior-4x',pythonWallSinceEntryCallMs=(time.monotonic()-wall_started)*1000,entryCallStartedAtUtc=wall_started_utc,observedAtUtc=datetime.now(timezone.utc).isoformat(),simulationSecondsSinceFreshEntry=current['elapsed'],state=current,controls=visible(page,'#ui button'),inputCount=page.evaluate('homeEvidence.inputs.length'))


def restore_getter(page):
 page.evaluate('() => {Storage.prototype.getItem=window.failureOriginalGet;}')


def open_settings(page):
 tap(page,'[data-action="toggle-tools"]');tap(page,'[data-action="panel-settings"]')


def legitimate_save_routes(page,locale):
 # The imported file is the exact download made from this genuinely played
 # house. No JSON edits, save seeding, or injected story progression occur.
 open_settings(page)
 before=state(page)['settings']['largeText'];tap(page,'[data-field="largeText"]')
 page.wait_for_function('value=>dollhouse.state().settings.largeText===value',arg=not before)
 saved=json.loads(raw(page));check(locale+' native Larger text setting saves legitimately',saved['settings']['largeText']==(not before))
 with page.expect_download(timeout=60000) as pending:tap(page,'[data-action="save-export"]')
 exported=OUT/(locale+'-native-export.json');pending.value.save_as(str(exported));content=exported.read_bytes();copy=json.loads(content)
 check(locale+' native export contains the real earned thread',copy['story']['step']==1)
 tap(page,'[data-action="reset-prompt"]');tap(page,'[data-action="reset-yes"]')
 page.wait_for_function('dollhouse.state().story.step===0')
 check(locale+' explicit native reset writes a genuine fresh save',json.loads(raw(page))['story']['step']==0)
 open_settings(page)
 with page.expect_file_chooser(timeout=60000) as pending:
  page.locator('.file-button').tap(timeout=60000)
 pending.value.set_files(str(exported))
 page.wait_for_function('dollhouse.state().story.step===1')
 restored=state(page);saved=json.loads(raw(page))
 check(locale+' native import preserves exported story and economy',restored['story']==copy['story'] and restored['buttons']==copy['buttons'] and saved['story']==copy['story'] and saved['buttons']==copy['buttons'])
 check(locale+' imported file bytes were never edited',exported.read_bytes()==content)
 events=page.evaluate('homeEvidence.inputs.filter(e=>e.type==="click"&&["save-export","reset-prompt","reset-yes"].includes(e.gameAction))')
 check(locale+' export and confirmed reset use trusted native actions',all(any(e['gameAction']==action and e['trusted'] for e in events) for action in ['save-export','reset-prompt','reset-yes']))
 observe(locale+'-legitimate-save-routes',settingsSaved=True,resetSaved=True,importSaved=True,exportSha256=hashlib.sha256(content).hexdigest(),importSha256=hashlib.sha256(exported.read_bytes()).hexdigest(),fileOrigin='exact native download from this genuine journey; never edited',events=events,state=restored)


def page_in_context(context,locale,purpose):
 page=context.new_page();page.set_default_timeout(60000);page.on('pageerror',lambda error:errors.append(str(error)))
 cdp=context.new_cdp_session(page);cdp.send('Emulation.setCPUThrottlingRate',{'rate':CPU_RATE})
 profiles[page]={'contextId':MODE+'-'+locale+'-'+str(len(profiles)+1),'locale':locale,'cpuThrottleRate':CPU_RATE,'contextPurpose':purpose}
 return page


def changed_entry_fixture(context,active_page,locale):
 # The second tab's real Settings action changes the save; no progressed save
 # is manufactured. The stale Home must retain its original state binding.
 stale=page_in_context(context,locale,'stale Home; other tab performs a real settings save')
 try:
  stale.goto(URL);home_ready(stale);frozen=state(stale);before=raw(stale)
  active_page.bring_to_front();open_settings(active_page);tap(active_page,'[data-field="largeText"]')
  latest=raw(active_page);check(locale+' other tab really changed canonical bytes',latest!=before)
  stale.bring_to_front();tap(stale,'[data-home-action="play"]');stale.locator('[data-home-action="reload"]').wait_for(state='visible')
  check(locale+' changed-save entry stays on inactive Home',stale.locator('#ui').is_hidden() and state(stale)==frozen)
  check(locale+' changed-save entry preserves newer bytes without a write',raw(stale)==latest and not canonical_writes(stale))
  geometry(stale,locale+' changed-save Reload recovery',['reload','preferences']);shot(stale,locale+'-entry-changed')
  observe(locale+'-entry-changed',fault='another native tab saved a real Larger text change',stateBindingUnchanged=True,canonicalUnchanged=True,explicitReloadVisible=True)
 finally:stale.close()


def late_entry_fixture(browser,locale,kind):
 # Explicit failure fixtures. The starting save comes only from genuine Play.
 context,page,cdp=fixture(browser,locale)
 try:
  enter(page);page.reload();home_ready(page);frozen=state(page);before=raw(page);check(locale+' '+kind+' starts from a real generated save',before is not None)
  if kind=='entry-deleted':page.evaluate('(key)=>localStorage.removeItem(key)',SAVE)
  elif kind=='entry-read-failed':
   page.evaluate('''() => {window.failureOriginalGet=Storage.prototype.getItem;Storage.prototype.getItem=function(k){if(k==='bait-al-dumiah.v1')throw new Error('intentional entry-time read failure');return window.failureOriginalGet.call(this,k)};}''')
  else:raise ValueError('Unknown late-entry fixture')
  tap(page,'[data-home-action="play"]');page.locator('[data-home-action="reload"]').wait_for(state='visible');page.wait_for_timeout(1000)
  if kind=='entry-read-failed':restore_getter(page)
  check(locale+' '+kind+' refuses stale play without changing its binding',page.locator('#ui').is_hidden() and page.locator('#ui').get_attribute('inert') is not None and state(page)==frozen)
  check(locale+' '+kind+' preserves absent or unreadable canonical bytes',raw(page)==(None if kind=='entry-deleted' else before) and not canonical_writes(page))
  geometry(page,locale+' '+kind+' Reload recovery',['reload','preferences'])
  observe(locale+'-'+kind,failureFixture=True,fault='canonical deletion after Home load' if kind=='entry-deleted' else 'native getter refuses reads only after Home load',progressionInjected=False,stateBindingUnchanged=True,explicitReloadVisible=True,writes=page.evaluate('homeEvidence.writes'))
 finally:context.close()


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
  play_wall_started=time.monotonic();play_wall_utc=datetime.now(timezone.utc).isoformat()
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
  finish_observation(page,locale,play_at,play_wall_started,play_wall_utc)
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
  legitimate_save_routes(page,locale)
  changed_entry_fixture(context,page,locale)
 except Exception:
  (OUT/(locale+'-failure-state.json')).write_text(json.dumps({'state':state(page),'inputs':page.evaluate('homeEvidence.inputs'),'visibleHome':visible(page),'visiblePlay':visible(page,'#ui button')},indent=2,ensure_ascii=False))
  try:shot(page,locale+'-failure-state')
  except Exception as capture_error:print('HOME_CAPTURE_ERROR '+str(capture_error),flush=True)
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
  if kind!='read-failure':shot(page,locale+'-'+kind)
  if kind=='read-failure':
   # Restore reads only after the app made its initial unavailable decision.
   restore_getter(page)
   before=raw(page);frozen=state(page);tap(page,'[data-home-action="play"]')
   page.locator('[data-home-action="reload"]').wait_for(state='visible');page.wait_for_timeout(9000)
   check(locale+' failed initial read refuses stale entry and retains the original state',page.locator('#ui').is_hidden() and page.locator('#ui').get_attribute('inert') is not None and state(page)==frozen)
   check(locale+' failed initial read never overwrites unknown save after real Play attempt',raw(page)==before and not canonical_writes(page))
   geometry(page,locale+' read-failure Reload recovery',['reload','preferences'])
   shot(page,locale+'-'+kind)
   observe(locale+'-'+kind,entryRejected=True,explicitReloadVisible=True,canonicalUnchanged=raw(page)==before,writes=page.evaluate('homeEvidence.writes'))
  else:
   invalid_before=raw(page);enter(page);check(locale+' invalid save starts fresh through actual Play',state(page)['story']['step']==0 and state(page)['buttons']==36)
   check(locale+' invalid save is backed up before canonical replacement',page.evaluate('(key)=>localStorage.getItem(key+".backup")',SAVE)==invalid_before)
   writes=page.evaluate('homeEvidence.writes');backup=next(i for i,w in enumerate(writes) if w['key']==SAVE+'.backup');canonical=next(i for i,w in enumerate(writes) if w['key']==SAVE);check(locale+' backup precedes first canonical save',backup<canonical)
 finally:context.close()


try:
 for _ in range(80):
  try:urllib.request.urlopen(URL,timeout=1);break
  except Exception:time.sleep(.1)
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl'])
  for locale in ['en','ar']:
   for name,fn in [('fresh-and-returning',lambda:normal_journey(browser,locale))]+[(kind,lambda kind=kind:failure_fixture(browser,locale,kind)) for kind in ['read-failure','invalid-save','audio-failure']]+[(kind,lambda kind=kind:late_entry_fixture(browser,locale,kind)) for kind in ['entry-deleted','entry-read-failed']]:
    try:fn()
    except Exception as error:
     errors.append(locale+' '+name+': '+str(error));print('HOME_ENTRY_ERROR '+errors[-1],flush=True)
  browser.close()
 check('no native Home runtime or journey errors',not errors)
finally:
 report={'sourceCommit':os.environ['SOURCE_SHA'],'sourceTree':os.environ['SOURCE_TREE'],'reviewedSourceDigest':os.environ['SOURCE_DIGEST'],'evidenceRole':MODE,'cpuThrottleRate':CPU_RATE,'checks':checks,'errors':errors,'observations':observations,'captures':list(captures.values()),'captureErrors':capture_errors}
 (OUT/'capture-manifest.json').write_text(json.dumps({'sourceCommit':os.environ['SOURCE_SHA'],'sourceTree':os.environ['SOURCE_TREE'],'reviewedSourceDigest':os.environ['SOURCE_DIGEST'],'evidenceRole':MODE,'captures':list(captures.values()),'captureErrors':capture_errors},indent=2,ensure_ascii=False))
 (OUT/'results.json').write_text(json.dumps(report,indent=2,ensure_ascii=False))
 print('HOME_ENTRY_SUMMARY '+json.dumps({'evidenceRole':MODE,'cpuThrottleRate':CPU_RATE,'checks':len(checks),'passed':sum(c['passed'] for c in checks),'errors':errors,'captures':len(captures),'captureErrors':capture_errors}),flush=True)
 server.terminate();server.wait(timeout=10)
if errors or any(not c['passed'] for c in checks):raise SystemExit('Native Home acceptance failed')
