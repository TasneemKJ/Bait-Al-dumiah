"""Ending, errors, old save, visibility, keyboard and 4x CPU checks."""
import os,json,time,fcntl
from pathlib import Path
from playwright.sync_api import sync_playwright
OUT=Path('/tmp/dumiah-cinema-check');OUT.mkdir(exist_ok=True)
BASE='http://127.0.0.1:'+os.environ.get('PORT','4214')
results={}
def ready(page):
 page.goto(BASE+'/?debug=1',wait_until='domcontentloaded',timeout=120000)
 page.wait_for_function('window.dollhouse',timeout=120000)
def enter(page):page.locator('[data-home-action="play"]').click()
def settings(page):
 page.locator('[data-action="toggle-tools"]').click()
 page.locator('[data-action="panel-settings"]').click()
with sync_playwright() as p,open('/tmp/browser.lock','w') as lock:
 fcntl.flock(lock,fcntl.LOCK_EX)
 try:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,
   args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
  page=browser.new_page(viewport={'width':390,'height':844});page.set_default_timeout(120000)
  ready(page);original=page.evaluate('dollhouse.state()')
  # A pre-intro version-one save must preserve earned currency and skip forced opening.
  page.evaluate('''()=>{const s=dollhouse.state();delete s.introSeen;s.buttons=73;s.settings.muted=true;
   localStorage.setItem('bait-al-dumiah.v1',JSON.stringify(s));}''')
  page.reload(wait_until='domcontentloaded');page.wait_for_function('window.dollhouse');enter(page)
  assert not page.evaluate('dollhouse.intro().active');assert page.evaluate('dollhouse.state().buttons')==73
  results['legacy_save']=True
  settings(page);page.locator('[data-action="watch-intro"]').click()
  assert page.evaluate('dollhouse.intro().active');page.keyboard.press('Escape')
  page.wait_for_function('!dollhouse.intro().active');results['opening_replay_keyboard']=True
  settings(page);page.locator('[data-action="watch-film"]').click()
  page.wait_for_function('!document.querySelector("[data-film=play]").disabled')
  page.locator('[data-film="play"]').click()
  cdp=page.context.new_cdp_session(page);cdp.send('Emulation.setCPUThrottlingRate',{'rate':4})
  page.locator('[data-film="play"]').click()
  intervals=page.evaluate('''()=>new Promise(resolve=>{const out=[];let last=performance.now();
   function frame(now){out.push(now-last);last=now;if(out.length>=24)resolve(out);else requestAnimationFrame(frame);}
   requestAnimationFrame(frame);})''')
  results['film_4x_cpu_frame_ms']={'median':sorted(intervals)[len(intervals)//2],'max':max(intervals)}
  cdp.send('Emulation.setCPUThrottlingRate',{'rate':1})
  page.locator('.film-stage canvas').focus();page.keyboard.press('Space')
  before=page.locator('.film-time').inner_text();page.wait_for_timeout(250)
  assert page.locator('.film-time').inner_text()==before;results['keyboard_pause']=True
  # Simulate the visibility contract using the DOM event consumed by the player.
  page.evaluate('''()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});
   document.dispatchEvent(new Event('visibilitychange'));}''')
  assert page.locator('[data-film="play"]').inner_text()=='Play'
  page.evaluate('''()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));}''')
  assert page.locator('[data-film="play"]').inner_text()=='Play';results['visibility_pause_no_autoresume']=True
  page.locator('[data-film="play"]').click()
  page.wait_for_function('document.querySelector("[data-film=play]").textContent==="Watch again"',timeout=180000)
  assert page.locator('.film-time').inner_text()=='60 / 60'
  assert page.locator('.film-stage [role=status]').inner_text()=='Welcome home.'
  page.locator('[data-film="play"]').click()
  page.wait_for_function('document.querySelector(".film-time").textContent.startsWith("00")')
  results['natural_end_and_replay']=True
  page.locator('[data-film="close"]').click()
  # Failure during the lazy scene import exposes a readable local recovery and close control.
  page.close()
  bad=browser.new_page(viewport={'width':390,'height':844});bad.set_default_timeout(120000)
  ready(bad);enter(bad);bad.locator('.intro-skip').click();bad.wait_for_function('!dollhouse.intro().active')
  settings(bad);bad.route('**/src/render/film-scene.js',lambda route:route.abort())
  bad.locator('[data-action="watch-film"]').click()
  bad.wait_for_function('document.querySelector(".film-stage [role=status]").textContent.includes("could not")')
  bad.screenshot(path=str(OUT/'film-error.png'));bad.locator('[data-film="close"]').click()
  assert bad.locator('.film-dialog[open]').count()==0;results['error_recovery']=True
  browser.close()
 finally:fcntl.flock(lock,fcntl.LOCK_UN)
(OUT/'lifecycle.json').write_text(json.dumps(results,indent=2));print(json.dumps(results,indent=2))
