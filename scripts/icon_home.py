"""Render the 1.4 App Store icon from the game itself: the whole dollhouse at night on Home's rosewood table
against the papered wall (src/render/home-backdrop.js), restored rooms lit. Blind row tests 2026-11-24 picked it
over the 1.2 icon (Noor and the ghost) at 180 and 60 px in three rounds; the house fills ~90% of the tile; boards in tas-studio-notes/store-rework/bait-home-2026-11-24.
Usage: PORT=4398 python3 scripts/icon_home.py [out.png]   (default: the AppIcon-1024.png in the Xcode project)
Renders at 2048 and downsamples to 1024, RGB with no alpha. Needs Pillow."""
import os,subprocess,sys,time,urllib.request
from pathlib import Path
from PIL import Image
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1];PORT=os.environ.get('PORT','4419')
OUT=sys.argv[1] if len(sys.argv)>1 else str(ROOT/'ios/BaitAlDumiah/Assets.xcassets/AppIcon.appiconset/AppIcon-1024.png')
SHOT='''()=>{const {s,world}=window.lab;s.clock=150;s.day=3;s.restoration={kitchen:3,parlor:3,studio:3,bedroom:3};
 world.setHomeStage({rtl:false});window.lab.draw(40);const cam=world.camera;cam.zoom*=2.05;cam.updateProjectionMatrix();
 const vh=(cam.top-cam.bottom)/cam.zoom;cam.translateY(-.06*vh);world.renderer.render(world.scene,cam)}'''
server=subprocess.Popen(['node','scripts/serve.mjs','.'],cwd=ROOT,env={**os.environ,'PORT':PORT},stdout=subprocess.DEVNULL)
try:
 url=f'http://127.0.0.1:{PORT}/scripts/icon-lab.html'
 for _ in range(100):
  try:urllib.request.urlopen(url,timeout=1);break
  except Exception:time.sleep(.1)
 with sync_playwright() as p:
  b=p.chromium.launch(headless=True,args=['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
  pg=b.new_page(viewport={'width':1024,'height':1024},device_scale_factor=2);pg.goto(url,wait_until='networkidle')
  pg.wait_for_function('window.lab&&window.lab.ready',timeout=120000);pg.evaluate(SHOT);time.sleep(.5)
  tmp=OUT+'.2048.png';pg.screenshot(path=tmp);b.close()
 Image.open(tmp).convert('RGB').resize((1024,1024),Image.LANCZOS).save(OUT);os.remove(tmp);print('icon_home:',OUT)
finally:server.terminate()
