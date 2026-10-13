"""Native widescreen composition proof and measured render cost."""
import base64,json,time,fcntl,os
from pathlib import Path
from playwright.sync_api import sync_playwright
WIDTH=int(os.environ.get('WIDE_WORLD_WIDTH','1920'));HEIGHT=WIDTH*9//16
OUT=Path('/tmp/dumiah-wide' + (f'-{WIDTH}' if WIDTH!=1920 else ''));OUT.mkdir(exist_ok=True)
with sync_playwright() as p,open('/tmp/browser.lock','w') as lock:
 fcntl.flock(lock,fcntl.LOCK_EX)
 try:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
  page=browser.new_page(viewport={'width':960,'height':540})
  page.goto(f'http://127.0.0.1:4214/scripts/film/preview.html?wide&width={WIDTH}&height={HEIGHT}',timeout=180000)
  page.wait_for_function('window.filmReady',timeout=180000)
  times=[]
  for t in [3,15,22,30,38,45,57]:
   start=time.monotonic();pair=page.evaluate('t=>renderPair(t)',t);times.append(time.monotonic()-start)
   for lang,data in zip(['en','ar'],pair):(OUT/f'{lang}-{t:02d}.jpg').write_bytes(base64.b64decode(data.split(',')[1]))
  for lang in ['en','ar']:
   data=page.evaluate('lang=>renderPoster(lang)',lang);(OUT/f'thumbnail-{lang}.jpg').write_bytes(base64.b64decode(data.split(',')[1]))
  data={'world':[WIDTH,HEIGHT],'output':[1920,1080],'pair_seconds':times,'stats':page.evaluate('filmStats()')}
  browser.close()
 finally:fcntl.flock(lock,fcntl.LOCK_UN)
(OUT/'benchmark.json').write_text(json.dumps(data,indent=2));print(json.dumps(data,indent=2))
