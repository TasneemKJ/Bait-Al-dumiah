"""Headless smoke for the pause key, story interaction and drag-and-drop of the carried item.

Serves dist/ (run `npm run build` first). Honours PORT (default 4413) and CHROMIUM_PATH.
"""
import os,subprocess,sys,time
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parent.parent
PORT=os.environ.get('PORT','4413')

def state(page):return page.evaluate('window.dollhouse.state()')

def main():
 server=subprocess.Popen(['node','scripts/serve.mjs','dist'],cwd=ROOT,env={**os.environ,'PORT':PORT},stdout=subprocess.DEVNULL,stderr=subprocess.STDOUT)
 time.sleep(2);errors=[]
 try:
  with sync_playwright() as p:
   options={'headless':True,'args':['--no-sandbox','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
   if os.environ.get('CHROMIUM_PATH'):options['executable_path']=os.environ['CHROMIUM_PATH']
   browser=p.chromium.launch(**options)
   page=browser.new_page(viewport={'width':390,'height':844},has_touch=True)
   page.on('pageerror',lambda e:errors.append(str(e)))
   page.on('console',lambda m:errors.append(m.text) if m.type=='error' else None)
   page.goto(f'http://127.0.0.1:{PORT}/?debug=1')
   page.wait_for_selector('[data-home-action=play]:not([disabled])',timeout=60000)
   page.click('[data-home-action=play]');page.wait_for_selector('.dock',timeout=30000)
   page.wait_for_function('window.dollhouse.objects()?.length>0',timeout=30000)
   page.keyboard.press('Space');page.wait_for_timeout(300);assert state(page)['paused'] is True,'Space pauses'
   page.keyboard.press('Space');page.wait_for_timeout(300);assert state(page)['paused'] is False,'Space resumes'
   if not page.locator('[data-object="prop:mint-tin"]').is_visible():page.locator('[data-object-toggle]').click()
   page.locator('[data-object="prop:mint-tin"]').click()
   page.wait_for_selector('[data-scene-action="activate"]',timeout=10000)
   page.locator('[data-scene-action="activate"]').click();page.wait_for_timeout(800)
   assert state(page)['story']['lastAction']=='prop:mint-tin','activating the tin advances the story'
   assert page.locator('.held-item').count()==1,'the red thread is carried'
   page.locator('[data-room=studio]').click();page.wait_for_timeout(1200)
   target=[o for o in page.evaluate('window.dollhouse.objects()') if o['key']=='prop:sewing-machine'][0]
   token=page.locator('.held-item').bounding_box()
   page.mouse.move(token['x']+token['width']/2,token['y']+token['height']/2);page.mouse.down()
   page.mouse.move(token['x']+token['width']/2+10,token['y']+token['height']/2-10,steps=3)
   page.mouse.move(target['x'],target['y'],steps=8)
   assert page.evaluate("!document.querySelector('.carry-ghost').hidden"),'the carried item follows the pointer'
   page.mouse.up();page.wait_for_timeout(800)
   assert page.evaluate('Boolean(window.dollhouse.stitch())'),'dropping the thread on the sewing machine starts mending'
   browser.close()
 finally:
  server.terminate()
 assert not errors,errors
 print('story smoke passed')

if __name__=='__main__':
 try:main()
 except AssertionError as error:
  print('FAILED:',error);sys.exit(1)
