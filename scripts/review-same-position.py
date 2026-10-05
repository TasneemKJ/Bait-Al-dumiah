"""Immutable before/after real-touch probe; never re-aim between two taps."""
import json, os, subprocess, time, urllib.request
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path.cwd()
OUT = ROOT / 'artifacts' / 'same-position'
OUT.mkdir(parents=True, exist_ok=True)
SOURCE = os.environ['SOURCE_SHA']
REVISION = os.environ['REVIEW_REVISION']
server = subprocess.Popen(['node', 'scripts/serve.mjs', 'dist'],
    env={**os.environ, 'PORT': '4193'}, stdout=(OUT / 'server.log').open('w'), stderr=subprocess.STDOUT)

OBS = '''() => {const g=window.dollhouse,v=g.visual(),s=g.state();return {
 time:performance.now(),selected:v.selectedObject,room:v.focusedRoom,
 moving:v.cameraMoving,presentation:v.presentation,step:s.story.step,
 held:document.querySelector('[data-held-item]')?.dataset.heldItem,
 objects:g.objects().filter(p=>['prop:mint-tin','prop:tea-set'].includes(p.key))}}'''

def ready(page):
    page.wait_for_function('window.dollhouse && !document.querySelector("#loading")', timeout=60000)
    page.wait_for_function('''() => new Promise(resolve => {
      let last=null,n=0;
      function observe(){const g=window.dollhouse,v=g.visual();
       const now=v.cameraMoving?null:JSON.stringify([v.focusedRoom,v.presentation,
        g.objects().map(p=>[p.key,+p.x.toFixed(2),+p.y.toFixed(2)])]);
       n=now!==null&&now===last?n+1:0;last=now;
       if(n>=2)resolve(true);else requestAnimationFrame(observe);
      }requestAnimationFrame(observe);
    })''', timeout=60000)

results=[]
try:
    for _ in range(80):
        try:
            urllib.request.urlopen('http://127.0.0.1:4193',timeout=1)
            break
        except Exception:
            time.sleep(.1)
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True,args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl'])
        cases=[(locale,motion,delay,rate) for locale,motion in [('en','no-preference'),('ar','reduce')]
               for delay,rate in [(80,1),(250,1),(650,1),(250,4)]]
        for locale,motion,delay,rate in cases:
            label=f'{locale}-{motion}-{delay}ms-cpu{rate}'
            context=browser.new_context(viewport={'width':390,'height':844},has_touch=True,reduced_motion=motion)
            page=context.new_page();page.set_default_timeout(60000)
            errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
            cdp=context.new_cdp_session(page);cdp.send('Emulation.setCPUThrottlingRate',{'rate':rate})
            page.goto('http://127.0.0.1:4193/?debug=1');ready(page)
            page.locator('[data-action="toggle-tools"]').click()
            page.locator('[data-action="panel-settings"]').click()
            page.locator('[data-field="quality"]').select_option('low')
            if locale=='ar':page.locator('[data-field="locale"]').select_option('ar')
            page.locator('#sheet [data-action="close"]').click()
            page.locator('[data-room="kitchen"]').click();ready(page)
            before=page.evaluate(OBS)
            target=next(p for p in before['objects'] if p['key']=='prop:mint-tin')
            assert page.evaluate('p=>document.elementFromPoint(p.x,p.y)?.id==="world"',target)
            page.evaluate('''obs=>{window.probeTrace=[];window.readProbe=eval('('+obs+')');
              for(const type of ['pointerdown','pointerup'])window.addEventListener(type,e=>{
                window.probeTrace.push({type,x:e.clientX,y:e.clientY,target:e.target.id||e.target.className,...window.readProbe()});
              },true);
            }''',OBS)
            # Same exact initial screen point, with no readiness/reprojection in between.
            page.touchscreen.tap(target['x'],target['y'])
            page.wait_for_timeout(delay)
            page.touchscreen.tap(target['x'],target['y'])
            ready(page)
            after=page.evaluate(OBS)
            trace=page.evaluate('window.probeTrace')
            downs=[v for v in trace if v['type']=='pointerdown']
            result={'sourceCommit':SOURCE,'revision':REVISION,'case':label,
                'fixture':{'locale':locale,'motion':motion,'cpuThrottle':rate,'width':390,'height':844,'hasTouch':True},
                'requestedDelayMs':delay,'pointerdownGapMs':downs[1]['time']-downs[0]['time'] if len(downs)==2 else None,
                'before':before,'after':after,'events':trace,'errors':errors,
                'activatedTin':after['step']==1 and after.get('held')=='red-thread'}
            results.append(result)
            print('SAME_POSITION_RESULT '+json.dumps(result),flush=True)
            if delay==650:
                page.screenshot(path=str(OUT/f'{REVISION}-{locale}-after-two-taps.png'),timeout=60000)
            context.close()
        browser.close()
finally:
    (OUT/'results.json').write_text(json.dumps(results,indent=2))
    server.terminate()
    server.wait(timeout=10)
if len(results)!=8 or any(r['errors'] for r in results):
    raise SystemExit('Probe did not complete cleanly; inspect results')
print('SAME_POSITION_SUMMARY '+json.dumps({'sourceCommit':SOURCE,'revision':REVISION,
    'fixtures':len(results),'activated':sum(r['activatedTin'] for r in results)}),flush=True)

