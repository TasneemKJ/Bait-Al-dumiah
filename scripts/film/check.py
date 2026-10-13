"""Bilingual mobile cinema regression and screenshot evidence, server already running."""
import os,json,time,fcntl
from pathlib import Path
from playwright.sync_api import sync_playwright
OUT=Path('/tmp/dumiah-cinema-check');OUT.mkdir(exist_ok=True)
BASE='http://127.0.0.1:'+os.environ.get('PORT','4214')
views=[(360,640),(390,844),(412,915),(844,390)]
results=[]
def settings(page):
 page.locator('[data-action="toggle-tools"]').click()
 page.locator('[data-action="panel-settings"]').click()
def film(page):
 page.locator('[data-action="watch-film"]').click()
 page.wait_for_function('document.querySelector(".film-dialog[open]") && !document.querySelector("[data-film=play]").disabled',timeout=120000)
def check(label,value):
 assert value,label
 results.append(label)
with sync_playwright() as p,open('/tmp/browser.lock','w') as lock:
 for lang in ['en','ar']:
  for width,height in views:
   fcntl.flock(lock,fcntl.LOCK_EX)
   try:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,
     args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    context=browser.new_context(viewport={'width':width,'height':height},is_mobile=True,has_touch=True)
    page=context.new_page();page.set_default_timeout(90000);errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto(BASE+'/?debug=1',wait_until='domcontentloaded');page.wait_for_function('window.dollhouse',timeout=120000)
    if lang=='ar':
     page.evaluate('''()=>{const s=dollhouse.state();s.settings.locale='ar';s.settings.muted=true;localStorage.setItem('bait-al-dumiah.v1',JSON.stringify(s));}''')
     page.reload(wait_until='domcontentloaded');page.wait_for_function('window.dollhouse')
    page.locator('[data-home-action="play"]').click()
    if page.locator('.intro-layer:not([hidden])').count():
     before=page.evaluate('dollhouse.state().elapsed');page.locator('.intro-skip').click()
     page.wait_for_function('!dollhouse.intro().active');check('skip releases intro',True)
     check('skip has no click-through',page.locator('#sheet[open]').count()==0)
    settings(page);page.locator('[data-field="motion"]').check()
    film(page);page.wait_for_function('Number(document.querySelector(".film-time").textContent.split(" / " )[0])>=3')
    page.locator('[data-film="play"]').click()
    before=page.evaluate('dollhouse.state()');time.sleep(.15)
    check('film freezes canonical clock',page.evaluate('dollhouse.state().elapsed')==before['elapsed'])
    check('film pauses game',page.evaluate('dollhouse.state().paused'))
    check(f'{lang} {width} no overflow',page.evaluate('document.documentElement.scrollWidth<=innerWidth'))
    check('film bounded to viewport',page.locator('.film-dialog').evaluate('(e)=>e.getBoundingClientRect().height<=innerHeight+1'))
    boxes=page.locator('.film-dialog button').evaluate_all('(es)=>es.map(e=>e.getBoundingClientRect().height)')
    check('film targets at least 44px',min(boxes)>=44)
    check('canvas fits remaining landscape height',page.locator('.film-stage canvas').evaluate('(e)=>e.getBoundingClientRect().bottom<=innerHeight'))
    page.screenshot(path=str(OUT/f'{lang}-{width}x{height}.png'),timeout=120000)
    # Native dialog traps focus; Escape restores the source control in Settings.
    page.keyboard.press('Tab');check('focus stays inside film',page.evaluate('document.activeElement.closest(".film-dialog")!==null'))
    page.keyboard.press('Escape');check('Escape closes film',page.locator('.film-dialog[open]').count()==0)
    check('focus returns to film action',page.evaluate('document.activeElement.dataset.action')=='watch-film')
    # A quick close while import is pending must not create a second loop or revive audio.
    for _ in range(2):
     page.locator('[data-action="watch-film"]').click();page.locator('[data-film="close"]').click()
    film(page);page.locator('[data-film="play"]').click()
    start=page.locator('.film-time').inner_text();time.sleep(.2)
    check('pause survives rapid reopen',page.locator('.film-time').inner_text()==start)
    page.keyboard.press('Escape');page.locator('#sheet').evaluate('(e)=>e.close()')
    check('no JavaScript failures',not errors)
    browser.close()
   finally:fcntl.flock(lock,fcntl.LOCK_UN)
   print(f'{lang} {width}x{height} passed',flush=True)
(OUT/'results.json').write_text(json.dumps(results,indent=2))
