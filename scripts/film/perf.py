"""Measure the actual live film after mobile-specific composition/batching."""
import json,fcntl,time,os
from pathlib import Path
from playwright.sync_api import sync_playwright
OUT=Path('/tmp/dumiah-cinema-check');OUT.mkdir(exist_ok=True)
RATE=int(os.environ.get('PERF_RATE','4'))
with sync_playwright() as p,open('/tmp/browser.lock','w') as lock:
 fcntl.flock(lock,fcntl.LOCK_EX)
 try:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,
   args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
  page=browser.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
  page.set_default_timeout(120000);page.goto('http://127.0.0.1:4214/?debug=1',wait_until='domcontentloaded')
  page.wait_for_function('window.dollhouse');page.locator('[data-home-action="play"]').click()
  page.locator('.intro-skip').click();page.wait_for_function('!dollhouse.intro().active')
  page.locator('[data-action="toggle-tools"]').click();page.locator('[data-action="panel-settings"]').click()
  page.locator('[data-action="watch-film"]').click()
  page.wait_for_function('!document.querySelector("[data-film=play]").disabled')
  page.wait_for_function('dollhouse.film().seconds>=3',timeout=120000)
  baseline=page.evaluate('dollhouse.film()')
  cdp=page.context.new_cdp_session(page);cdp.send('Emulation.setCPUThrottlingRate',{'rate':RATE})
  intervals=page.evaluate('''()=>new Promise(resolve=>{const out=[];let last=performance.now();
   function frame(now){out.push(now-last);last=now;if(out.length>=36)resolve(out);else requestAnimationFrame(frame);}
   requestAnimationFrame(frame);})''')
  data={'cpu_throttle':RATE,'frame_ms':{'median':sorted(intervals)[len(intervals)//2],'max':max(intervals)},
   'film':page.evaluate('dollhouse.film()'),'baseline':baseline,'canvas':page.locator('.film-stage canvas').evaluate('(e)=>[e.width,e.height]')}
  assert data['film']['still'] or data['frame_ms']['median']<180,'slow playback must choose held poses'
  if data['film']['still']:
   assert data['film']['stats']['frame']-baseline['stats']['frame']<=1,'still screening must not rerender every RAF'
   assert data['film']['seconds']>baseline['seconds'],'clock continues between held poses'
  cdp.send('Emulation.setCPUThrottlingRate',{'rate':1})
  page.locator('[data-film="play"]').click();page.screenshot(path=str(OUT/f'film-optimized-{RATE}x-390.png'))
  page.locator('[data-film="close"]').click();browser.close()
 finally:fcntl.flock(lock,fcntl.LOCK_UN)
(OUT/f'perf-{RATE}x.json').write_text(json.dumps(data,indent=2));print(json.dumps(data,indent=2))
