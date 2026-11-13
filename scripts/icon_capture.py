"""Render the App Store icon from the game itself: the whole dollhouse at night, UI hidden.
Usage: python3 scripts/icon_capture.py <outdir>   (writes <outdir>/night-full.png at 2000x2000;
crop (40,30,1960,1950) and resize to 1024 for ios/.../AppIcon-1024.png)"""
import json, os, subprocess, sys, time, urllib.request
sys.path.insert(0,'scripts')
from playwright.sync_api import sync_playwright
from game_entry import enter_game
D=sys.argv[1] if len(sys.argv)>1 else "artifacts/icon"; os.makedirs(D,exist_ok=True); URL='http://127.0.0.1:4197'
server=subprocess.Popen(['node','scripts/serve.mjs','.'],env={**os.environ,'PORT':'4197'},stdout=subprocess.DEVNULL)
try:
 for _ in range(100):
  try:urllib.request.urlopen(URL,timeout=1);break
  except Exception:time.sleep(.1)
 with sync_playwright() as p:
  b=p.chromium.launch(headless=True,args=['--no-sandbox','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
  pg=b.new_page(viewport={'width':1000,'height':1000},device_scale_factor=2);pg.set_default_timeout(30000)
  pg.goto(URL+'/?debug=1',wait_until='networkidle');enter_game(pg)
  fx=pg.evaluate('''async()=>{const {createState}=await import('/src/simulation.js');const {SAVE_KEY}=await import('/src/content.js');const s=createState();s.elapsed=18;s.clock=145;s.settings.locale='ar';s.settings.reducedMotion=true;return {key:SAVE_KEY,value:JSON.stringify(s)};}''')
  pg.add_init_script('localStorage.setItem('+json.dumps(fx['key'])+','+json.dumps(fx['value'])+');')
  pg.reload(wait_until='networkidle');enter_game(pg)
  pg.wait_for_function('dollhouse.visual().nightMix>.99',timeout=60000)
  pg.wait_for_function('!dollhouse.visual().cameraMoving',timeout=60000)
  pg.add_style_tag(content='*{visibility:hidden!important} canvas{visibility:visible!important}')
  pg.mouse.move(2,2);time.sleep(1.5)
  pg.screenshot(path=D+'/night-full.png')
  b.close()
finally:
 server.terminate()
