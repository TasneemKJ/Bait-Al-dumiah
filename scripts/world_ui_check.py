"""World-first phone UI check: the house fills the screen, controls are 44px, nothing scrolls sideways.

Serves dist/ (run `npm run build` first) and walks a first session at 390x844 with touch, in English and
Arabic: Home, the house, a room, a selected keepsake, the carried thread, the tools dock and a sheet.
For every state it saves a screenshot and measures:
  - every visible, enabled control is at least 44x44 CSS px (Apple HIG 44pt; Material 48dp);
  - the page never scrolls sideways;
  - routine house states leave most of the screen touching the 3D house (world coverage);
  - the carried item's drag handle is uncovered and no resident tag sits on story paper;
  - no console errors.
Honours PORT (default 4715), CHROMIUM_PATH and SHOTS_DIR (default artifacts/world-ui).
"""
import json,os,subprocess,sys,time
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parent.parent
PORT=os.environ.get('PORT','4715')
SHOTS=Path(os.environ.get('SHOTS_DIR',ROOT/'artifacts'/'world-ui'))
# Routine house states keep at least this share of a sample grid on the house itself.
MIN_WORLD={'house':.80,'room':.80,'selected':.62,'carrying':.70}

MEASURE='''()=>{
 const controls='button,a[href],input,select,textarea,summary,[role=button],[data-action],[data-object],[data-room]';
 const shown=e=>{
  if(e.closest('[hidden],[inert]'))return false;
  for(let n=e;n&&n.nodeType===1;n=n.parentElement){const s=getComputedStyle(n);
   if(s.display==='none'||s.visibility==='hidden'||Number(s.opacity)===0)return false}
  const r=e.getBoundingClientRect();
  return r.width>0&&r.height>0&&r.right>0&&r.bottom>0&&r.left<innerWidth&&r.top<innerHeight;
 };
 const label=e=>(e.getAttribute('aria-label')||e.dataset.action||e.dataset.homeAction||e.dataset.object||
  e.dataset.room||e.dataset.sceneAction||e.textContent||e.className).trim().replace(/\\s+/g,' ').slice(0,40);
 const small=[...document.querySelectorAll(controls)].filter(e=>!e.disabled&&shown(e)).map(e=>{
  const r=e.getBoundingClientRect();return {label:label(e),w:Math.round(r.width),h:Math.round(r.height)}})
  .filter(c=>c.w<44||c.h<44);
 const world=document.querySelector('#world');let hits=0,total=0;
 for(let y=6;y<innerHeight;y+=12)for(let x=6;x<innerWidth;x+=12){total++;if(document.elementFromPoint(x,y)===world)hits++}
 // The carried item is a drag handle: its centre must reach it, and no resident tag may sit on paper.
 const token=document.querySelector('.held-item');let handle=null;
 if(token&&shown(token)){const r=token.getBoundingClientRect();
  handle=token.contains(document.elementFromPoint(r.left+r.width/2,r.top+r.height/2))}
 const tag=document.querySelector('.resident-name');let tagOverPaper=false;
 if(tag&&shown(tag)){const t=tag.getBoundingClientRect();
  tagOverPaper=[...document.querySelectorAll('.held-item,.scene-response,.object-ribbon,.objective')].filter(shown)
   .some(e=>{const r=e.getBoundingClientRect();return t.left<r.right&&r.left<t.right&&t.top<r.bottom&&r.top<t.bottom})}
 return {handle,tagOverPaper,small,overflow:document.documentElement.scrollWidth>innerWidth||document.body.scrollWidth>innerWidth,
  world:hits/total,dir:document.documentElement.dir,lang:document.documentElement.lang};
}'''
META='''()=>({viewport:document.querySelector('meta[name=viewport]')?.content??'',
 theme:document.querySelector('meta[name=theme-color]')?.content??'',
 icon:Boolean(document.querySelector('link[rel=icon]')),touchIcon:Boolean(document.querySelector('link[rel=apple-touch-icon]')),
 manifest:Boolean(document.querySelector('link[rel=manifest]')),title:document.title})'''

def settle(page,ms=400):
 page.wait_for_function('!window.dollhouse?.visual()?.cameraMoving',timeout=60000);page.wait_for_timeout(ms)

def journey(page,locale,shoot):
 page.goto(f'http://127.0.0.1:{PORT}/?debug=1')
 page.wait_for_selector('[data-home-action=play]:not([disabled])',timeout=90000)
 if locale=='ar':
  page.locator('[data-home-action=preferences]').click()
  page.locator('[data-home-action=language]').click()
  page.locator('[data-home-action=back]').click()
 shoot('home')
 page.locator('[data-home-action=play]').click();page.wait_for_selector('.dock',timeout=30000)
 page.wait_for_function('window.dollhouse.objects()?.length>0',timeout=60000);settle(page,800)
 shoot('house',True)
 page.locator('[data-room=kitchen]').tap();settle(page)
 shoot('room',True)
 if not page.locator('[data-object="prop:mint-tin"]').is_visible():page.locator('[data-object-toggle]').tap()
 shoot('objects')
 page.locator('[data-object="prop:mint-tin"]').tap();page.wait_for_selector('[data-scene-action="activate"]')
 settle(page);shoot('selected',True)
 page.locator('[data-scene-action="activate"]').tap();page.wait_for_selector('.held-item');settle(page,800)
 shoot('carrying',True)
 page.locator('.tools-toggle').tap();page.wait_for_timeout(500);shoot('tools')
 page.locator('[data-action="panel-household"]:visible').first.tap();page.wait_for_selector('#sheet[open]')
 page.wait_for_timeout(500);shoot('sheet')

def main():
 SHOTS.mkdir(parents=True,exist_ok=True)
 server=subprocess.Popen(['node','scripts/serve.mjs','dist'],cwd=ROOT,env={**os.environ,'PORT':PORT},
  stdout=subprocess.DEVNULL,stderr=subprocess.STDOUT)
 time.sleep(2);failures=[];report={}
 try:
  with sync_playwright() as p:
   options={'headless':True,'args':['--no-sandbox','--enable-webgl','--use-gl=angle','--use-angle=swiftshader',
    '--enable-unsafe-swiftshader']}
   if os.environ.get('CHROMIUM_PATH'):options['executable_path']=os.environ['CHROMIUM_PATH']
   browser=p.chromium.launch(**options)
   for locale in ['en','ar']:
    context=browser.new_context(viewport={'width':390,'height':844},device_scale_factor=1,has_touch=True,
     is_mobile=True)
    page=context.new_page();errors=[]
    page.on('pageerror',lambda e,errors=errors:errors.append(str(e)))
    page.on('console',lambda m,errors=errors:errors.append(m.text) if m.type=='error' else None)
    def shoot(name,routine=False,page=page,locale=locale):
     page.screenshot(path=str(SHOTS/f'{locale}-{name}.png'),timeout=120000)
     m=page.evaluate(MEASURE);report[f'{locale}-{name}']=m
     for c in m['small']:failures.append(f'{locale}-{name}: "{c["label"]}" is {c["w"]}x{c["h"]} px')
     if m['overflow']:failures.append(f'{locale}-{name}: the page scrolls sideways')
     if routine and m['world']<MIN_WORLD[name]:
      failures.append(f'{locale}-{name}: only {m["world"]:.0%} of the screen reaches the house')
     if m['handle'] is False:failures.append(f'{locale}-{name}: the carried item is covered')
     if m['tagOverPaper']:failures.append(f'{locale}-{name}: a resident tag covers story paper')
     if locale=='ar' and name!='home' and m['dir']!='rtl':failures.append(f'{locale}-{name}: not right-to-left')
    journey(page,locale,shoot)
    meta=page.evaluate(META);report[f'{locale}-meta']=meta
    if 'viewport-fit=cover' not in meta['viewport'] or not meta['theme'] or not meta['icon'] or not meta['manifest']:
     failures.append(f'{locale}: page meta is incomplete {meta}')
    failures.extend(f'{locale}: console error {e}' for e in errors)
    context.close()
   browser.close()
 finally:
  server.terminate()
 (SHOTS/'report.json').write_text(json.dumps(report,indent=1,ensure_ascii=False))
 for key,m in report.items():
  if 'world' in m:print(f'{key:16} world {m["world"]:.0%}  small {len(m["small"])}  overflow {m["overflow"]}')
 if failures:
  print('FAILED:\n '+'\n '.join(failures));sys.exit(1)
 print('world UI check passed')

if __name__=='__main__':main()
