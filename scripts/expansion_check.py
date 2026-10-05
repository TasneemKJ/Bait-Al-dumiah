"""Exercise earned rituals and room changes against the real built app."""
import json, os, subprocess, time, urllib.request
from pathlib import Path
from playwright.sync_api import sync_playwright
from chime_gestures import finish_chimes
from tea_check import complete_tea, tea_ready, tea_status, tap_tea
from stitch_gestures import NeedleDrag, finish_stitch, stitch_ready, stitch_status, tap_stitch, trace_stitch
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'artifacts'/'expansion'; OUT.mkdir(parents=True,exist_ok=True)
BASE=os.environ.get('PLAY_URL','http://127.0.0.1:4188')
env={**os.environ,'PORT':'4188'}
server=None if os.environ.get('PLAY_URL') else subprocess.Popen(['node','scripts/serve.mjs','dist'],cwd=ROOT,env=env,stdout=(OUT/'server.log').open('w'),stderr=subprocess.STDOUT)
checks=[]
def check(name,ok):
 checks.append({'name':name,'passed':bool(ok)})
 print(('PASS ' if ok else 'FAIL ')+name,flush=True)
 assert ok,name
def open_panel(page,name):
 target=page.locator(f'[data-action="panel-{name}"]')
 if not target.is_visible():page.locator('[data-action="toggle-tools"]').click()
 target.click()
def select_object(page,key,inspect=False):
 target=page.locator(f'[data-object="{key}"]')
 if not target.is_visible():page.locator('[data-object-toggle]').click()
 target.click()
 if inspect:page.locator('[data-scene-action="inspect"]').click()
def expose_objects(page):
 page.wait_for_function('document.querySelector(".object-controls") && !document.querySelector(".object-controls").hidden')
 if page.locator('[data-object-toggle]').get_attribute('aria-expanded')!='true':page.locator('[data-object-toggle]').click()
try:
 for _ in range(80):
  try:urllib.request.urlopen(BASE,timeout=1);break
  except Exception:time.sleep(.1)
 with sync_playwright() as p:
  opts={'headless':True,'args':['--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl']}
  if os.environ.get('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
  browser=p.chromium.launch(**opts)
  page=browser.new_page(viewport={'width':1280,'height':900})
  page.add_init_script("const seeded=sessionStorage.getItem('expansion-fixture');if(seeded){localStorage.setItem('bait-al-dumiah.v1',seeded);sessionStorage.removeItem('expansion-fixture')}")
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(BASE+'/?debug=1');page.wait_for_function('window.dollhouse && !document.querySelector("#loading")')
  check('WebGL scene starts',page.locator('.error-screen').count()==0)
  state=lambda:page.evaluate('window.dollhouse.state()')
  def ensure_night():
   # Software WebGL can make this journey span enough simulation time to reach
   # evening naturally. Only press the control while it still represents Evening.
   for _ in range(2):
    if state()['clock']>=120:return
    page.locator('[data-action="light"]').click()
   check('night entry is deterministic even across a natural clock transition',state()['clock']>=120)
  points=page.evaluate('window.dollhouse.objects()');point=next(o for o in points if o['key']=='prop:tea-set');other=next(o for o in points if o['key']=='prop:moon-bed');before_distance=((point['x']-other['x'])**2+(point['y']-other['y'])**2)**.5
  page.mouse.click(point['x'],point['y'])
  page.wait_for_function('!window.dollhouse.visual().cameraMoving')
  check('whole-house object pick focuses its room with a nonmodal scene ribbon',page.locator('.object-ribbon').is_visible() and not page.locator('dialog[open]').count() and not state()['paused'] and page.evaluate('window.dollhouse.visual().focusedRoom==="kitchen"'))
  points=page.evaluate('window.dollhouse.objects()');near=next(o for o in points if o['key']=='prop:tea-set');other=next(o for o in points if o['key']=='prop:moon-bed');after_distance=((near['x']-other['x'])**2+(near['y']-other['y'])**2)**.5
  check('object selection actually reframes the camera, beyond focus metadata',after_distance/before_distance>1.5)
  page.locator('[data-scene-action="close"]').click()
  page.locator('[data-room="kitchen"]').click();page.wait_for_function('!window.dollhouse.visual().cameraMoving')
  point=next(o for o in page.evaluate('window.dollhouse.objects()') if o['key']=='prop:tea-set')
  page.mouse.click(point['x'],point['y'])
  check('actual tea-set ray pick selects its scene ribbon',page.locator('.object-ribbon').is_visible())
  page.locator('[data-scene-action="inspect"]').click()
  check('optional tea-set inspection opens its contextual actions',page.locator('.object-detail [data-action="begin-activity"][data-id="tea"]').count()==1)
  page.screenshot(path=str(OUT/'08-object-selection.png'))
  page.locator('[data-action="close"]').click()
  open_panel(page,'activities')
  check('activity selection has three rituals',page.locator('.ritual-card').count()==3)
  page.screenshot(path=str(OUT/'01-rituals.png'))
  page.locator('[data-action="begin-activity"][data-id="tea"]').click()
  tea_ready(page);before=state()['buttons']
  check('tea enters the actual table without sequence choices or a modal',tea_status(page)['phase']=='pour' and not page.locator('.ritual-choice:visible,dialog[open]').count())
  page.screenshot(path=str(OUT/'02-tea-play.png'))
  complete_tea(page)
  check('completed physical ritual rewards earned mastery',state()['activities']['mastery']['tea']==1 and state()['buttons']==before+7)
  check('served result remains visible on the actual table',tea_status(page)['phase']=='served' and page.locator('#tea-work-status').is_visible())
  page.screenshot(path=str(OUT/'03-earned-reward.png'),timeout=60000)
  tap_tea(page,'tray');page.wait_for_function('window.dollhouse.tea()===null')
  expose_objects(page)
  check('ritual camera and accessible objects agree after completion',page.locator('[data-object="prop:tea-set"]').is_visible() and page.locator('[data-room="kitchen"]').get_attribute('aria-pressed')=='true')
  page.reload();page.wait_for_function('window.dollhouse && !document.querySelector("#loading")')
  check('mastery survives reload',state()['activities']['mastery']['tea']==1)
  # Seed an earned-state fixture to inspect restoration and all-tier rendering.
  page.evaluate('''() => {const s=window.dollhouse.state();s.buttons=1000;s.activities.mastery={tea:6,stitch:6,lullaby:6};sessionStorage.setItem('expansion-fixture',JSON.stringify(s));}''')
  page.reload();page.wait_for_function('window.dollhouse && !document.querySelector("#loading")')
  open_panel(page,'activities')
  page.locator('[data-action="restore-room"][data-id="kitchen"]').click()
  check('restoration spends displayed cost and persists tier',state()['buttons']==955 and state()['restoration']['kitchen']==1)
  page.wait_for_function('!window.dollhouse.visual().cameraMoving')
  page.screenshot(path=str(OUT/'04-restored-kitchen.png'))
  page.evaluate('''() => {const s=window.dollhouse.state();s.restoration={kitchen:3,parlor:3,studio:3,bedroom:3};s.settings.reducedMotion=true;sessionStorage.setItem('expansion-fixture',JSON.stringify(s));}''')
  page.reload();page.wait_for_function('window.dollhouse && !document.querySelector("#loading")')
  page.screenshot(path=str(OUT/'05-restored-house.png'))
  stats=page.evaluate('window.dollhouse.stats()')
  (OUT/'render-stats.json').write_text(json.dumps(stats,indent=2))
  check('restored house stays within 400k triangles',stats['triangles']<400000)
  ensure_night();page.wait_for_function('window.dollhouse.visual().nightMix > .99')
  check('all four earned lamps cast bounded practical light at settled night',page.evaluate('window.dollhouse.visual().restoredLights===4'))
  page.screenshot(path=str(OUT/'06-restored-night.png'))
  page.set_viewport_size({'width':390,'height':844})
  open_panel(page,'settings');page.locator('[data-field="locale"]').select_option('ar')
  page.locator('[data-action="close"]').click();open_panel(page,'activities')
  check('Arabic direction and ritual titles',page.locator('html').get_attribute('dir')=='rtl' and 'شاي' in page.locator('.ritual-catalog').inner_text())
  page.locator('[data-action="begin-activity"][data-id="stitch"]').click()
  stitch_ready(page)
  page.screenshot(path=str(OUT/'07-mobile-arabic.png'))
  check('embroidery opens physical sewing with no answer grid or modal',stitch_status(page)['phase']=='sew' and stitch_status(page)['mode']=='ritual' and not page.locator('.ritual-choice:visible,dialog[open]').count())
  check('mobile sewing controls all have reachable 44px targets',page.locator('[data-stitch-action]:visible,.dock button:visible').evaluate_all('els=>els.length>0&&els.every(e=>{const r=e.getBoundingClientRect(),hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return r.width>=44&&r.height>=44&&r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight&&(hit===e||e.contains(hit))})'))
  check('empty sewing exposes only the actual reachable needle and spool',page.evaluate('()=>{const points=window.dollhouse.stitchObjects(),targets=points.filter(p=>["needle","spool"].includes(p.key));return targets.length===2&&!points.some(p=>p.key==="cloth")&&targets.every(p=>p.x>0&&p.x<innerWidth&&p.y>0&&p.y<innerHeight&&document.elementFromPoint(p.x,p.y)?.id==="world")}'))
  before=state()['buttons']
  stitched=trace_stitch(page,until_section=1)
  check('real needle motion completes the first contour section',stitched['section']==1 and stitched['travel']>0 and not stitched['pressed'])
  current=stitched['sections'][stitched['section']];start,next_point=current[0],current[1]
  dx,dy=next_point[0]-start[0],next_point[1]-start[1];edge_length=(dx*dx+dy*dy)**.5
  wrong_x=max(-.9,min(.9,start[0]-dy/edge_length*.5));wrong_y=max(-.9,min(.9,start[1]+dx/edge_length*.5))
  needle=NeedleDrag(page).down()
  try:
   needle.move_to(wrong_x,wrong_y)
   page.wait_for_function('window.dollhouse.stitch()?.loose===true',timeout=60000,polling=100)
  finally:needle.release()
  dirty=stitch_status(page)
  check('embroidery mistake retains completed sections and buttons',dirty['loose'] and dirty['section']==stitched['section'] and dirty['travel']>stitched['travel'] and state()['buttons']==before)
  guides=page.evaluate('window.dollhouse.visual().stitchGuides')
  check('the sewing contour stays projected without paid hints',len(guides)==len(dirty['sections']) and all(len(projected)==len(authored) for projected,authored in zip(guides,dirty['sections'])) and all(p and 0<p['x']<390 and 0<p['y']<844 for section in guides for p in section) and state()['buttons']==before)
  tap_stitch(page,'spool')
  repaired=stitch_status(page)
  check('free spool repair preserves finished sections and cumulative wrong travel',not repaired['loose'] and repaired['section']==dirty['section'] and repaired['distance']==0 and repaired['travel']==dirty['travel'] and repaired['alignmentTravel']==dirty['alignmentTravel'] and repaired['repairs']==dirty['repairs']+1 and state()['buttons']==before)
  stitch_before=state()
  finished=finish_stitch(page,leave=False)
  stitch_ready(page)
  check('finished cloth is an actual reachable scene target',page.evaluate('()=>{const targets=window.dollhouse.stitchObjects().filter(p=>p.key==="cloth");return targets.length===1&&targets.every(p=>p.x>0&&p.x<innerWidth&&p.y>0&&p.y<innerHeight&&document.elementFromPoint(p.x,p.y)?.id==="world")}'))
  check('physical sewing finish earns unchanged mastery and eleven-button reward',state()['activities']['mastery']['stitch']==7 and state()['activities']['completed']['stitch']==stitch_before['activities']['completed']['stitch']+1 and state()['buttons']==before+11 and finished['result']['reward']==11 and finished['result']['bonus']==0)
  check('finished sewing remains on its actual cloth with a saved played-level best',finished['phase']=='finished' and state()['activities']['stitchRecords'][finished['level']]==finished['best'] and not page.locator('dialog[open]').count())
  check('no horizontal page overflow',page.evaluate('document.documentElement.scrollWidth<=innerWidth'))
  tap_stitch(page,'cloth');page.wait_for_function('window.dollhouse.stitch()===null',polling=100)
  page.wait_for_function('!window.dollhouse.visual().cameraMoving',timeout=60000,polling=100)
  expose_objects(page)
  check('stitch launched from another view exposes studio objects after exit',page.locator('[data-object="prop:sewing-machine"]').is_visible() and page.locator('[data-room="studio"]').get_attribute('aria-pressed')=='true' and page.evaluate('window.dollhouse.visual().focusedRoom==="studio"'))
  open_panel(page,'settings');page.locator('[data-field="motion"]').check()
  check('reduced motion setting applies',state()['settings']['reducedMotion'])
  page.locator('[data-action="close"]').click()
  page.set_viewport_size({'width':1280,'height':900})
  open_panel(page,'decorate');page.locator('[data-action="choose-item"][data-id="bear"]').click();page.locator('[data-action="place-confirm"]').click()
  decor=state()['decor'][-1];key='decor:'+str(decor['id']);buttons=state()['buttons']
  page.locator('[data-room="kitchen"]').click();page.wait_for_function('!window.dollhouse.visual().cameraMoving')
  point=next(o for o in page.evaluate('window.dollhouse.objects()') if o['key']==key)
  page.mouse.move(point['x'],point['y']);page.mouse.down();page.mouse.move(point['x']+50,point['y']);page.mouse.move(point['x'],point['y']);page.mouse.up()
  check('a camera drag cannot select a decoration',page.locator('.object-ribbon').count()==0 and page.locator('.object-detail').count()==0 and page.evaluate('!window.dollhouse.visual().selectedObject'))
  # Recenter after the drag before selecting the physical object.
  page.locator('[data-room="kitchen"]').click();page.wait_for_function('!window.dollhouse.visual().cameraMoving')
  point=next(o for o in page.evaluate('window.dollhouse.objects()') if o['key']==key);page.mouse.click(point['x'],point['y'])
  check('owned decoration is selectable in the scene ribbon',page.locator('.object-ribbon').is_visible())
  page.locator('[data-scene-action="inspect"]').click()
  check('owned decoration inspection offers manipulation',page.locator('[data-action="rotate-object"]').count()==1)
  page.screenshot(path=str(OUT/'09-keepsake-actions-arabic.png'))
  page.locator('[data-action="rotate-object"]').click();check('quarter turn changes the selected owned object',state()['decor'][-1]['rotation']==1)
  page.locator('[data-action="move-object"]').click();page.locator('#place-room').select_option('studio');page.locator('#place-slot').select_option('2');page.locator('[data-action="place-confirm"]').click()
  check('move preserves ownership, orientation and currency',state()['decor'][-1]['id']==decor['id'] and state()['decor'][-1]['room']=='studio' and state()['decor'][-1]['slot']==2 and state()['decor'][-1]['rotation']==1 and state()['buttons']==buttons)
  page.wait_for_function('!window.dollhouse.visual().cameraMoving');page.screenshot(path=str(OUT/'10-moved-keepsake.png'))
  page.reload();page.wait_for_function('window.dollhouse && !document.querySelector("#loading")')
  check('manipulated object survives reload',state()['decor'][-1]['room']=='studio' and state()['decor'][-1]['rotation']==1)
  page.locator('[data-room="bedroom"]').click();page.wait_for_function('!window.dollhouse.visual().cameraMoving')
  select_object(page,'prop:moon-bed',inspect=True);page.locator('[data-action="begin-activity"][data-id="lullaby"]').click()
  finish_chimes(page)
  check('physical moon echo completes through real object plucks',state()['activities']['mastery']['lullaby']==7)
  # Seed each usable keepsake and exercise the full object-sheet dispatch against the rendered game.
  page.evaluate('''() => {const s=window.dollhouse.state();s.settings.locale='en';s.settings.reducedMotion=false;s.clock=0;s.decor=[
   {id:1,item:'plant',room:'kitchen',slot:0,rotation:0,originRoom:'kitchen',active:false,tendedDay:0,lastUse:-10},
   {id:2,item:'lamp',room:'parlor',slot:0,rotation:0,originRoom:'parlor',active:false,tendedDay:0,lastUse:-10},
   {id:3,item:'musicbox',room:'studio',slot:0,rotation:0,originRoom:'studio',active:false,tendedDay:0,lastUse:-10},
   {id:4,item:'mobile',room:'bedroom',slot:0,rotation:0,originRoom:'bedroom',active:false,tendedDay:0,lastUse:-10}
  ];s.nextId=5;sessionStorage.setItem('expansion-fixture',JSON.stringify(s));}''')
  page.reload();page.wait_for_function('window.dollhouse && !document.querySelector("#loading")')
  baseline=state();progress=(baseline['buttons'],baseline['cares'],baseline['earnedToday'],baseline['activities']['mastery'].copy(),[(d['id'],d['bond']) for d in baseline['dolls']])
  page.locator('[data-room="kitchen"]').click();page.wait_for_function('!window.dollhouse.visual().cameraMoving')
  point=next(o for o in page.evaluate('window.dollhouse.objects()') if o['key']=='decor:1');page.mouse.click(point['x'],point['y'])
  page.locator('[data-scene-action="inspect"]').click()
  use=page.locator('[data-action="use-object"]')
  check('water action is exposed from the actual scene plant',use.get_attribute('data-id')=='1' and use.inner_text()=='Water the jasmine')
  page.locator('[data-action="use-object"]').click();check('watering persists its earned-day state',state()['decor'][0]['tendedDay']==state()['day'])
  page.wait_for_function('window.dollhouse.visual().reactivePoses[1]?.scale > 1.07')
  check('watered plant visibly perks up in the rendered room',True)
  page.screenshot(path=str(OUT/'12-watered-plant.png'))
  select_object(page,'decor:1',inspect=True)
  check('watered plant reports completion and blocks same-day repetition',page.locator('[data-action="use-object"]').is_disabled() and 'Watered today' in page.locator('.object-detail').inner_text())
  page.locator('[data-action="close"]').click()
  page.locator('[data-room="parlor"]').click();page.wait_for_function('!window.dollhouse.visual().cameraMoving');select_object(page,'decor:2');page.locator('[data-scene-action="activate"]').click()
  check('lamp action toggles persistent active state',state()['decor'][1]['active'])
  check('keepsake action retains meaningful visible keyboard focus',page.evaluate('document.activeElement.matches("[data-scene-action=activate],[data-object-toggle]") && document.activeElement.getBoundingClientRect().width>=44'))
  open_panel(page,'settings');page.locator('[data-field="motion"]').check();page.locator('[data-action="close"]').click()
  ensure_night();page.wait_for_function('window.dollhouse.visual().nightMix > .99 && window.dollhouse.visual().activeOwnedLights === 1')
  page.screenshot(path=str(OUT/'13-active-lamp-night.png'))
  open_panel(page,'settings');page.locator('[data-field="motion"]').uncheck();page.locator('[data-action="close"]').click()
  page.locator('[data-room="studio"]').click();page.wait_for_function('!window.dollhouse.visual().cameraMoving');select_object(page,'decor:3');page.locator('[data-scene-action="activate"]').click()
  check('music-box action records a current animation timestamp',state()['elapsed']-state()['decor'][2]['lastUse']<1)
  page.wait_for_function('Math.abs(window.dollhouse.visual().reactivePoses[3]?.turn??0) > .02')
  turn=page.evaluate('window.dollhouse.visual().reactivePoses[3].turn')
  page.wait_for_function('turn=>Math.abs(window.dollhouse.visual().reactivePoses[3].turn-turn)>.25',arg=turn)
  check('wound music box visibly turns in the rendered room',True)
  page.screenshot(path=str(OUT/'14-wound-music-box.png'))
  open_panel(page,'settings');page.locator('[data-field="motion"]').check();page.locator('[data-action="close"]').click()
  page.locator('[data-room="bedroom"]').click();page.wait_for_function('!window.dollhouse.visual().cameraMoving');select_object(page,'decor:4');page.locator('[data-scene-action="activate"]').click()
  check('mobile action works with reduced motion enabled',state()['settings']['reducedMotion'] and state()['elapsed']-state()['decor'][3]['lastUse']<1)
  page.wait_for_function('Math.abs(window.dollhouse.visual().reactivePoses[4]?.rock-.06)<.0001')
  rock=page.evaluate('window.dollhouse.visual().reactivePoses[4].rock');page.wait_for_timeout(350)
  check('reduced motion holds the rocked moon at a still response pose',abs(page.evaluate('window.dollhouse.visual().reactivePoses[4].rock')-rock)<.0001)
  page.screenshot(path=str(OUT/'15-rocked-mobile-reduced-motion.png'))
  current=state();after=(current['buttons'],current['cares'],current['earnedToday'],current['activities']['mastery'].copy(),[(d['id'],d['bond']) for d in current['dolls']])
  check('free keepsake play grants no currency, care, mastery or bond',after==progress)
  page.reload();page.wait_for_function('window.dollhouse && !document.querySelector("#loading")')
  check('reactive keepsake states survive a save reload',state()['decor'][0]['tendedDay']==state()['day'] and state()['decor'][1]['active'] and state()['decor'][2]['lastUse']>=0 and state()['decor'][3]['lastUse']>=0)
  check('no JavaScript page errors',not errors)
  browser.close()
finally:
 (OUT/'results.json').write_text(json.dumps(checks,indent=2))
 if server:server.terminate()
print(json.dumps({'passed':len(checks),'checks':checks},indent=2))
