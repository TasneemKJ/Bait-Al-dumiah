"""Verify the shipped courtyard, Shami UI and gesture-gated audio over HTTP."""
import json, os, subprocess, time, urllib.request, wave, struct
from pathlib import Path
from playwright.sync_api import sync_playwright
from game_entry import enter_game
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'artifacts/levantine';OUT.mkdir(parents=True,exist_ok=True)
URL='http://127.0.0.1:4189';results=[];errors=[]
server=subprocess.Popen(['node','scripts/serve.mjs','dist'],cwd=ROOT,env={**os.environ,'PORT':'4189'},stdout=subprocess.DEVNULL)
def check(name,passed):
 results.append({'name':name,'passed':bool(passed)})
 if not passed:raise AssertionError(name)
def capture(page,name):
 page.wait_for_function('!dollhouse.visual().cameraMoving',timeout=60000)
 page.mouse.move(8,8);page.screenshot(path=str(OUT/(name+'.png')),timeout=60000)
 (OUT/(name+'.json')).write_text(json.dumps(page.evaluate('dollhouse.visual()'),indent=2))
try:
 for _ in range(100):
  try:urllib.request.urlopen(URL,timeout=1);break
  except Exception:time.sleep(.1)
 with sync_playwright() as p:
  options={'headless':True,'args':['--no-sandbox','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
  if os.environ.get('CHROMIUM_PATH'):options['executable_path']=os.environ['CHROMIUM_PATH']
  browser=p.chromium.launch(**options);page=browser.new_page(viewport={'width':1440,'height':1000});page.set_default_timeout(20000)
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.on('console',lambda m:errors.append(m.text) if m.type=='error' else None)
  page.goto(URL+'/?debug=1',wait_until='networkidle'); enter_game(page)
  fixture=page.evaluate('''async()=>{const {createState}=await import('/src/simulation.js');const {SAVE_KEY}=await import('/src/content.js');const s=createState();s.elapsed=18;s.clock=145;s.settings.locale='ar';return {key:SAVE_KEY,value:JSON.stringify(s)};}''')
  # Seed the incoming document before main.js reads its save. Writing in the old
  # document loses to the legitimate pagehide autosave during page.reload().
  page.add_init_script('localStorage.setItem('+json.dumps(fixture['key'])+','+json.dumps(fixture['value'])+');')
  page.reload(wait_until='networkidle'); enter_game(page)
  initial=page.evaluate('({state:dollhouse.state(),visual:dollhouse.visual(),hidden:document.hidden})')
  (OUT/'night-initial-state.json').write_text(json.dumps(initial,indent=2))
  check('the night fixture survives pagehide autosave and loads before the app',initial['state']['clock']>=120 and initial['state']['settings']['locale']=='ar')
  page.wait_for_function('dollhouse.visual().nightMix>.99',timeout=60000)
  if not page.locator('[data-action=panel-household]').is_visible():page.locator('[data-action=toggle-tools]').click()
  check('Shami labels are rendered right-to-left in the shipped game',page.locator('html').get_attribute('dir')=='rtl' and 'أهل البيت' in page.locator('.dock [data-action=panel-household]').inner_text())
  page.locator('[data-action=toggle-tools]').click()
  check('night cue appears in the actual scene, not only in a construction fixture',page.evaluate('dollhouse.visual().courtyard.shadow>0 && dollhouse.visual().courtyard.shadow<=.24'))
  capture(page,'courtyard-shami-night')
  page.locator('[data-room=studio]').click();capture(page,'window-night-closeup');page.locator('[data-action=camera]').click()
  if not page.locator('[data-action=panel-settings]').is_visible():page.locator('[data-action=toggle-tools]').click()
  page.locator('[data-action=panel-settings]').click();page.locator('[data-field=motion]').check();page.locator('[data-action=close]').click()
  check('reduced motion removes the passing silhouette',page.evaluate('dollhouse.visual().courtyard.shadow===0'))
  page.set_viewport_size({'width':390,'height':844});capture(page,'courtyard-shami-phone')
  check('Shami phone layout has no horizontal scrolling',page.evaluate('document.documentElement.scrollWidth<=innerWidth'))
  check('sound remains off before a user gesture',page.evaluate('dollhouse.state().settings.muted'))
  page.locator('[data-action=sound]:visible').click();page.wait_for_function('!dollhouse.state().settings.muted');check('sound can be enabled through its actual button',True)
  page.locator('[data-action=sound]:visible').click();check('the same control mutes sound',page.evaluate('dollhouse.state().settings.muted'))
  # Export an actual offline synthesis sample, not a claim of listening review.
  samples=page.evaluate('''async()=>{const {playPluck,playWoodTap}=await import('/src/audio.js');const c=new OfflineAudioContext(1,22050*6,22050);[196,207.65,246.94,261.63].forEach((f,i)=>playPluck(c,c.destination,f,.1+i*.82,1.6,.052));playWoodTap(c,c.destination,4.6,.023);playWoodTap(c,c.destination,5.02,.018);return Array.from((await c.startRendering()).getChannelData(0));}''')
  with wave.open(str(OUT/'original-plucked-night-sample.wav'),'wb') as wav:
   wav.setnchannels(1);wav.setsampwidth(2);wav.setframerate(22050);wav.writeframes(struct.pack('<'+'h'*len(samples),*[int(max(-1,min(1,x))*32767) for x in samples]))
  check('actual synthesized sample is non-silent and below clipping',.01<max(abs(x) for x in samples)<.18)
  check('courtyard play-through has no browser errors',not errors);browser.close()
except Exception as e:
 errors.append(str(e));raise
finally:
 server.terminate();server.wait(timeout=10)
 (OUT/'results.json').write_text(json.dumps({'checks':results,'errors':errors},indent=2))
print(json.dumps({'passed':len(results),'errors':errors}))
