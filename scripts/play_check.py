"""Exercise the built 3D game over HTTP and retain visual evidence."""
import json,os,subprocess,time,traceback,urllib.request
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'artifacts';OUT.mkdir(exist_ok=True)
BASE=os.environ.get('PLAY_URL','http://127.0.0.1:4177')
server=None
if not os.environ.get('PLAY_URL'):
 server=subprocess.Popen(['node','scripts/serve.mjs','dist'],cwd=ROOT,stdout=(OUT/'browser-server.log').open('w'),stderr=subprocess.STDOUT)
 for _ in range(100):
  try: urllib.request.urlopen(BASE,timeout=1);break
  except Exception:time.sleep(.1)
checks=[];errors=[];browser=None

def check(name,condition):
 checks.append({'name':name,'passed':bool(condition)})
 if not condition:raise AssertionError(name)
def capture(page,name):page.screenshot(path=str(OUT/f'{name}.png'),full_page=False)
def state(page):return page.evaluate('window.dollhouse.state()')
def click(page,action):page.locator(f'[data-action="{action}"]:visible').click()
def open_settings(page):click(page,'panel-settings')
try:
 with sync_playwright() as p:
  opts={'headless':True,'args':['--no-sandbox','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
  if os.environ.get('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
  browser=p.chromium.launch(**opts)
  ctx=browser.new_context(viewport={'width':1440,'height':1000},device_scale_factor=1)
  page=ctx.new_page();page.set_default_timeout(12000)
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.on('console',lambda m:errors.append(m.text) if m.type=='error' else None)
  page.goto(BASE+'/?debug=1',wait_until='networkidle');page.wait_for_timeout(1500)
  capture(page,'desktop-day')
  check('3D house starts without fallback or JS error',not page.locator('.error-screen').count() and not errors)
  check('no loading overlay remains',not page.locator('#loading').count())
  stats=page.evaluate('window.dollhouse.stats()');(OUT/'render-stats.json').write_text(json.dumps(stats,indent=2))
  check('real 3D geometry was rendered',stats['triangles']>10000)
  check('first view keeps panels closed',not page.locator('dialog[open]').count())
  before=state(page);click(page,'objective');after=state(page)
  check('first wish feeds Lina and awards only net 6 buttons',after['dolls'][0]['hunger']>before['dolls'][0]['hunger'] and after['buttons']==42 and after['wishes']==['lina'])
  click(page,'panel-household');page.locator('[data-action="select"][data-id="noor"]').click();capture(page,'doll-care')
  page.locator('[data-action="care"][data-care="rest"]').click()
  check('tucking Noor in improves energy and closes panel',state(page)['dolls'][1]['energy']>70 and not page.locator('dialog[open]').count())
  click(page,'panel-household');page.locator('[data-action="select"][data-id="sami"]').click();page.locator('[data-action="care"][data-care="play"]').click()
  check('all three residents have fulfilable wishes',len(state(page)['wishes'])==3)
  money=state(page)['buttons'];click(page,'panel-decorate');capture(page,'catalogue');page.locator('[data-action="choose-item"][data-id="plant"]').click()
  check('choosing a decoration does not spend money',state(page)['buttons']==money)
  click(page,'placement-cancel');check('cancelling does not spend money',state(page)['buttons']==money and not state(page)['decor'])
  click(page,'panel-decorate');page.locator('[data-action="choose-item"][data-id="plant"]').click();click(page,'place-confirm');after=state(page)
  check('placing a decoration changes ownership and charges exact price',after['buttons']==money-8 and len(after['decor'])==1)
  click(page,'panel-decorate');page.locator('[data-action="remove"]').click();check('packing away refunds the full price',state(page)['buttons']==money and not state(page)['decor']);click(page,'close')
  click(page,'panel-decorate');page.locator('[data-action="choose-item"][data-id="musicbox"]').click();page.locator('#place-room').select_option('parlor');click(page,'place-confirm')
  click(page,'light');page.wait_for_timeout(2200);capture(page,'desktop-night')
  check('nightfall changes the simulation and reveals a visitor',state(page)['clock']>=120 and page.locator('.visitor-hint').is_visible())
  page.locator('.visitor-hint [data-action="discover"]').click();capture(page,'first-whisper');check('visitor grants an authored mystery',state(page)['journal']==['music-box'])
  money=state(page)['buttons'];page.locator('#sheet [data-action="discover"]').click();check('same-night mystery cannot be farmed',state(page)['buttons']==money and len(state(page)['journal'])==1);click(page,'close')
  click(page,'pause');elapsed=state(page)['elapsed'];page.wait_for_timeout(700);check('pause freezes simulation',state(page)['elapsed']==elapsed);page.locator('.pause-overlay [data-action="pause"]').click()
  saved=state(page);page.reload(wait_until='networkidle');page.wait_for_timeout(1000);after=state(page)
  check('reload preserves ownership, money and journal',after['buttons']==saved['buttons'] and [(d['item'],d['room'],d['slot']) for d in after['decor']]==[(d['item'],d['room'],d['slot']) for d in saved['decor']] and after['journal']==saved['journal'])
  open_settings(page);page.locator('[data-field="motion"]').check();page.locator('[data-field="locale"]').select_option('ar');capture(page,'arabic-settings');click(page,'close')
  check('Arabic switches document direction and visible content',page.locator('html').get_attribute('dir')=='rtl' and 'أرواح صغيرة' in page.locator('.dock').inner_text())
  check('reduced motion is applied and saved',state(page)['settings']['reducedMotion'] and 'reduced-motion' in page.locator('body').get_attribute('class'))
  page.set_viewport_size({'width':390,'height':844});page.wait_for_timeout(800);capture(page,'mobile-arabic-night')
  check('mobile viewport has no horizontal overflow',page.evaluate('document.documentElement.scrollWidth<=innerWidth'))
  targets=page.locator('.dock button,.camera-tools button,.objective button,.time-tools button').evaluate_all('(els)=>els.map(e=>({name:e.dataset.action,w:e.getBoundingClientRect().width,h:e.getBoundingClientRect().height}))')
  (OUT/'touch-targets.json').write_text(json.dumps(targets,indent=2))
  check('all persistent mobile controls are at least 44 by 44 px',all(e['h']>=44 and e['w']>=44 for e in targets))
  open_settings(page);page.locator('[data-field="locale"]').select_option('en');click(page,'close');click(page,'light');capture(page,'mobile-day')
  click(page,'panel-household');capture(page,'mobile-care');page.keyboard.press('Escape');check('Escape dismisses the sheet',not page.locator('dialog[open]').count())
  page.set_viewport_size({'width':844,'height':390});page.wait_for_timeout(800);capture(page,'mobile-landscape');check('landscape retains visible toolbar',page.locator('.dock').is_visible())
  check('complete play loop produces no browser errors',not errors)
  print(json.dumps({'checks':checks,'errors':errors,'render':stats},indent=2))
except Exception as exc:
 errors.append(str(exc));traceback.print_exc()
 try:capture(page,'failure-state')
 except Exception:pass
finally:
 (OUT/'browser-results.json').write_text(json.dumps({'checks':checks,'errors':errors},indent=2))
 if browser:
  try:browser.close()
  except Exception:pass
 if server:server.terminate()
if errors or any(not c['passed'] for c in checks):raise SystemExit(1)
