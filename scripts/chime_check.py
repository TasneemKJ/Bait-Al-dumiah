"""Actual HTTP/WebGL moon-instrument acceptance with read-only diagnostics."""
import json,os,subprocess,time,traceback,urllib.request
from pathlib import Path
from playwright.sync_api import sync_playwright
from game_entry import enter_game
from scene_gestures import scene_ready
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
def house_hud_fit(label):
 result=page.evaluate(r'''()=>{
  const rect=e=>{const r=e.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}};
  const visible=e=>e.getClientRects().length&&getComputedStyle(e).visibility==='visible';
  const inside=r=>r.width>0&&r.height>0&&r.left>=0&&r.top>=0&&r.right<=innerWidth&&r.bottom<=innerHeight;
  const overlap=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
  const titleElement=document.querySelector('.brand h1'),clueElement=document.querySelector('.objective');
  const title=rect(titleElement),clue=rect(clueElement);
  const objectives=[...document.querySelectorAll('[data-action="objective"]')],objectiveRects=objectives.map(rect);
  const normalize=text=>(text??'').replace(/\s+/g,' ').trim(),label=normalize(objectives[0]?.textContent);
  const identity=e=>e?{tag:e.tagName,id:e.id,class:typeof e.className==='string'?e.className:'',action:e.dataset?.action??null}:null;
  const labelCopies=label?[...document.querySelectorAll('#app *')].filter(e=>(e.matches('button,a,[role="button"]')||e.children.length===0)&&normalize(e.textContent)===label).slice(0,12).map(e=>{
   const c=getComputedStyle(e);return {element:identity(e),rect:rect(e),style:{display:c.display,visibility:c.visibility,opacity:c.opacity,position:c.position,transform:c.transform}};
  }):[];
  const topEdge=[40,120,200].flatMap(x=>[2,12,22].map(y=>{
   const px=Math.max(0,Math.min(innerWidth-1,x)),py=Math.max(0,Math.min(innerHeight-1,y)),hit=document.elementFromPoint(px,py);
   return {x:px,y:py,hit:identity(hit),button:identity(hit?.closest('button,a,[role="button"]'))};
  }));
  const roomButtons=[...document.querySelectorAll('.room-views [data-room]')];
  const dockButtons=[...document.querySelectorAll('.dock[data-expanded=false]>button')].filter(visible);
  const discovery=document.querySelector('[data-object-toggle]'),discoveryRect=discovery?rect(discovery):null;
  const panels={clue,rooms:rect(document.querySelector('.room-views')),dock:rect(document.querySelector('.dock[data-expanded=false]'))};
  const controls=[...roomButtons,...dockButtons,...objectives,discovery].filter(Boolean).map(e=>{
   const r=rect(e),cx=(r.left+r.right)/2,cy=(r.top+r.bottom)/2;
   const hits=[[0,0],[-20,0],[20,0],[0,-20],[0,20]].map(([dx,dy])=>{const hit=document.elementFromPoint(cx+dx,cy+dy);return Boolean(hit&&e.contains(hit))});
   return {key:e.hasAttribute('data-object-toggle')?'discovery':e.dataset.room??e.dataset.action,rect:r,hits,reachable:visible(e)&&inside(r)&&r.width>=44&&r.height>=44&&hits.every(Boolean)};
  });
  const controlsSeparate=controls.every((a,i)=>controls.slice(i+1).every(b=>!overlap(a.rect,b.rect)));
  return {viewport:{width:innerWidth,height:innerHeight},title,clue,objectiveRects,labelCopies,topEdge,discoveryRect,panels,discoveryClear:Boolean(discoveryRect&&visible(discovery)&&inside(discoveryRect)&&Object.values(panels).every(r=>!overlap(discoveryRect,r))),singleObjective:objectives.length===1&&visible(objectives[0])&&inside(objectiveRects[0])&&objectiveRects[0].left>=clue.left&&objectiveRects[0].right<=clue.right&&objectiveRects[0].top>=clue.top&&objectiveRects[0].bottom<=clue.bottom,clearTitle:visible(titleElement)&&visible(clueElement)&&inside(title)&&inside(clue)&&!overlap(title,clue),roomKeys:roomButtons.map(e=>e.dataset.room),controls,controlsSeparate};
 }''')
 print('SCENE_HUD_BOUNDS '+json.dumps({'label':label,**result}),flush=True)
 check(label+' title and clue stay fully visible without overlap',result['clearTitle'])
 check(label+' has one visible objective action inside its clue card',result['singleObjective'])
 check(label+' nine scene controls retain separate reachable 44px areas',set(result['roomKeys'])=={'kitchen','parlor','studio','bedroom'} and len(result['controls'])==9 and result['controlsSeparate'] and all(c['reachable'] for c in result['controls']))
 check(label+' discovery stays clear of the clue, room grid and dock',result['discoveryClear'])

def discover_objects(label,frame):
 toggle=page.locator('[data-object-toggle]')
 before_box=toggle.bounding_box()
 before_progress=(snapshot()['buttons'],snapshot()['activities']['mastery']['lullaby'])
 page.touchscreen.tap(before_box['x']+before_box['width']/2,before_box['y']+before_box['height']/2)
 page.locator('.object-list').wait_for(state='visible')
 opened=page.locator('.object-list').evaluate('''e=>{const r=e.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}}''')
 expanded=page.locator('.object-list').evaluate('''e=>{
  const rect=n=>{const r=n.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}};
  const bounds=rect(e),overlap=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
  const panels=['.objective','.room-views','.dock'].map(selector=>({selector,bounds:rect(document.querySelector(selector))}));
  return {bounds,panels,overlaps:panels.filter(panel=>overlap(bounds,panel.bounds)).map(panel=>panel.selector)};
 }''')
 print('SCENE_DISCOVERY_BOUNDS '+json.dumps({'label':label,**expanded}),flush=True)
 check(label+' expanded discovery stays clear of the clue, room grid and dock',not expanded['overlaps'])
 after_box=toggle.bounding_box()
 check(label+' touch opens an in-bounds list without moving discovery',opened['left']>=0 and opened['right']<=page.viewport_size['width'] and opened['top']>=0 and opened['bottom']<=page.viewport_size['height'] and all(abs(before_box[k]-after_box[k])<.01 for k in before_box))
 reachable=[]
 for item in [page.locator('.object-list button').first,page.locator('.object-list button').last]:
  item.scroll_into_view_if_needed()
  reachable.append(item.evaluate('''e=>{
   const r=e.getBoundingClientRect(),p=e.parentElement.getBoundingClientRect(),cx=(r.left+r.right)/2,cy=(r.top+r.bottom)/2;
   return r.width>=44&&r.height>=44&&r.left>=0&&r.right<=innerWidth&&r.top>=Math.max(0,p.top)&&r.bottom<=Math.min(innerHeight,p.bottom)&&[[0,0],[-20,0],[20,0],[0,-20],[0,20]].every(([dx,dy])=>{const hit=document.elementFromPoint(cx+dx,cy+dy);return Boolean(hit&&e.contains(hit))});
  }'''))
 check(label+' first and last discovery objects have real reachable 44px areas',all(reachable))
 capture(frame)
 page.touchscreen.tap(after_box['x']+after_box['width']/2,after_box['y']+after_box['height']/2)
 check(label+' closing discovery restores the house without starting or paying a ritual',toggle.get_attribute('aria-expanded')=='false' and not page.locator('.object-list').is_visible() and status() is None and (snapshot()['buttons'],snapshot()['activities']['mastery']['lullaby'])==before_progress)

def paint_probe():
 # These explicitly named diagnostics are not canonical game screenshots.
 # Compare unchanged A, temporary containment B, and exactly restored A.
 observe='''()=>{const c=document.querySelector('.objective'),b=document.querySelector('#objective-action');const rect=e=>{const r=e.getBoundingClientRect();return [r.left,r.top,r.width,r.height]};return {style:c.getAttribute('style'),card:rect(c),button:rect(b),label:b.textContent}}'''
 original=page.evaluate(observe)
 observations=[]
 try:
  for variant in ['a','b-contained','a-restored']:
   if variant=='b-contained':
    page.locator('.objective').evaluate("e=>e.style.setProperty('contain','paint')")
   elif variant=='a-restored':
    page.locator('.objective').evaluate("(e,style)=>{if(style===null)e.removeAttribute('style');else e.setAttribute('style',style)}",original['style'])
   page.evaluate('()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())))')
   capture('diagnostic-paint-'+variant)
   observed=page.evaluate(observe)
   observations.append(observed)
   print('HUD_PAINT_PROBE '+json.dumps({'variant':variant,**observed}),flush=True)
 finally:
  page.locator('.objective').evaluate("(e,style)=>{if(style===null)e.removeAttribute('style');else e.setAttribute('style',style)}",original['style'])
 restored=page.evaluate(observe)
 check('temporary paint probe preserves HUD bounds and restores source styling',restored['style']==original['style'] and all(o['card']==original['card'] and o['button']==original['button'] and o['label']==original['label'] for o in observations))

def start_from_scene():
 page.locator('[data-room=bedroom]').click()
 scene_ready(page)
 house_hud_fit('bedroom entry')
 capture('00-bedroom-mobile')
 for _ in range(2):
  scene_ready(page)
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
  page.goto(BASE+'/?debug=1',wait_until='domcontentloaded',timeout=60000); enter_game(page)
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
  house_hud_fit('returned house')
  capture('05-earned-constellation')
  if SCENARIO=='phone':
   discover_objects('667x320 Arabic house','06-discovery-667x320')
   page.set_viewport_size({'width':568,'height':320})
   page.wait_for_function('innerWidth===568&&!window.dollhouse.visual().cameraMoving',timeout=60000)
   page.evaluate('()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())))')
   house_hud_fit('568x320 Arabic house')
   capture('07-house-568x320')
   discover_objects('568x320 Arabic house','08-discovery-568x320')
  else:
   paint_probe()
  if SCENARIO=='desktop':
   page.reload(wait_until='domcontentloaded',timeout=60000); enter_game(page);page.wait_for_function('window.dollhouse&&!document.querySelector("#loading")',timeout=90000)
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
