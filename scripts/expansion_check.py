"""Exercise earned rituals and room changes against the real built app."""
import json, os, subprocess, time, urllib.request
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'artifacts'/'expansion'; OUT.mkdir(parents=True,exist_ok=True)
BASE=os.environ.get('PLAY_URL','http://127.0.0.1:4188')
env={**os.environ,'PORT':'4188'}
server=None if os.environ.get('PLAY_URL') else subprocess.Popen(['node','scripts/serve.mjs','dist'],cwd=ROOT,env=env,stdout=(OUT/'server.log').open('w'),stderr=subprocess.STDOUT)
checks=[]
def check(name,ok):
 checks.append({'name':name,'passed':bool(ok)})
 assert ok,name
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
  page.locator('[data-action="panel-activities"]').click()
  check('activity selection has three rituals',page.locator('.ritual-card').count()==3)
  page.screenshot(path=str(OUT/'01-rituals.png'))
  page.locator('[data-action="begin-activity"][data-id="tea"]').click()
  pattern=state()['activities']['active']['pattern'];before=state()['buttons']
  page.locator(f'[data-choice="{(pattern[0]+1)%4}"]').click()
  check('mistake keeps cursor and buttons safe',state()['activities']['active']['cursor']==0 and state()['buttons']==before)
  page.screenshot(path=str(OUT/'02-tea-play.png'))
  for choice in pattern:page.locator(f'[data-choice="{choice}"]').click()
  check('completed ritual rewards earned mastery',state()['activities']['mastery']['tea']==1 and state()['buttons']==before+7)
  check('result is visible',page.locator('.ritual-result').is_visible())
  page.screenshot(path=str(OUT/'03-earned-reward.png'))
  page.reload();page.wait_for_function('window.dollhouse && !document.querySelector("#loading")')
  check('mastery survives reload',state()['activities']['mastery']['tea']==1)
  # Seed an earned-state fixture to inspect restoration and all-tier rendering.
  page.evaluate('''() => {const s=window.dollhouse.state();s.buttons=1000;s.activities.mastery={tea:6,stitch:6,lullaby:6};sessionStorage.setItem('expansion-fixture',JSON.stringify(s));}''')
  page.reload();page.wait_for_function('window.dollhouse && !document.querySelector("#loading")')
  page.locator('[data-action="panel-activities"]').click()
  page.locator('[data-action="restore-room"][data-id="kitchen"]').click()
  check('restoration spends displayed cost and persists tier',state()['buttons']==955 and state()['restoration']['kitchen']==1)
  page.wait_for_function('!window.dollhouse.visual().cameraMoving')
  page.screenshot(path=str(OUT/'04-restored-kitchen.png'))
  page.evaluate('''() => {const s=window.dollhouse.state();s.restoration={kitchen:3,parlor:3,studio:3,bedroom:3};sessionStorage.setItem('expansion-fixture',JSON.stringify(s));}''')
  page.reload();page.wait_for_function('window.dollhouse && !document.querySelector("#loading")')
  page.screenshot(path=str(OUT/'05-restored-house.png'))
  stats=page.evaluate('window.dollhouse.stats()')
  check('restored house stays within 400k triangles',stats['triangles']<400000)
  page.locator('[data-action="light"]').click();page.wait_for_timeout(900)
  page.screenshot(path=str(OUT/'06-restored-night.png'))
  page.set_viewport_size({'width':390,'height':844})
  page.locator('[data-action="panel-settings"]').click();page.locator('[data-field="locale"]').select_option('ar')
  page.locator('[data-action="close"]').click();page.locator('[data-action="panel-activities"]').click()
  check('Arabic direction and ritual titles',page.locator('html').get_attribute('dir')=='rtl' and 'شاي' in page.locator('.ritual-catalog').inner_text())
  page.locator('[data-action="begin-activity"][data-id="stitch"]').click()
  page.screenshot(path=str(OUT/'07-mobile-arabic.png'))
  check('mobile choices all have 44px targets',page.locator('.ritual-choice').evaluate_all('(els)=>els.every(e=>{const r=e.getBoundingClientRect();return r.width>=44 && r.height>=44})'))
  check('no horizontal page overflow',page.evaluate('document.documentElement.scrollWidth<=innerWidth'))
  page.locator('[data-action="end-activity"]').click();page.locator('[data-action="panel-settings"]').click();page.locator('[data-field="motion"]').check()
  check('reduced motion setting applies',state()['settings']['reducedMotion'])
  check('no JavaScript page errors',not errors)
  browser.close()
finally:
 (OUT/'results.json').write_text(json.dumps(checks,indent=2))
 if server:server.terminate()
print(json.dumps({'passed':len(checks),'checks':checks},indent=2))
