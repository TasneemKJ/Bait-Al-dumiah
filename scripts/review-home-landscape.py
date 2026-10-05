"""Additional native gate: whole-house landscape tin, unchanged screen input.

This harness is separate from immutable product source. It never navigates to
another room, re-aims a second tap, clicks the ribbon action, or injects progress.
"""
import json, os, subprocess, sys, time, urllib.request
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path.cwd()
sys.path.insert(0, str(ROOT/'scripts'))
from scene_gestures import scene_ready
OUT = ROOT/'artifacts'/'scene-stability'/'home-landscape'
OUT.mkdir(parents=True, exist_ok=True)
checks, observations, errors = [], [], []
server = subprocess.Popen(['node','scripts/serve.mjs','dist'],cwd=ROOT,
    env={**os.environ,'PORT':'4195'},stdout=(OUT/'server.log').open('w'),stderr=subprocess.STDOUT)


def check(name, passed):
    checks.append({'name':name,'passed':bool(passed)})
    print(('PASS ' if passed else 'FAIL ')+name,flush=True)


try:
    for _ in range(80):
        try:
            urllib.request.urlopen('http://127.0.0.1:4195',timeout=1)
            break
        except Exception:
            time.sleep(.1)
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True,args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl'])
        for locale,motion in [('en','no-preference'),('ar','reduce')]:
            context=browser.new_context(viewport={'width':844,'height':390},has_touch=True,
                is_mobile=True,device_scale_factor=2,reduced_motion=motion)
            page=context.new_page();page.set_default_timeout(60000)
            page.on('pageerror',lambda error:errors.append(str(error)))
            cdp=context.new_cdp_session(page)
            cdp.send('Emulation.setCPUThrottlingRate',{'rate':4})
            try:
                page.goto('http://127.0.0.1:4195/?debug=1');scene_ready(page)
                page.locator('[data-action="toggle-tools"]').click()
                page.locator('[data-action="panel-settings"]').click()
                page.locator('[data-field="quality"]').select_option('low')
                if locale=='ar':page.locator('[data-field="locale"]').select_option('ar')
                page.locator('#sheet [data-action="close"]').click()
                if page.locator('.dock').get_attribute('data-expanded')=='true':
                    page.locator('[data-action="toggle-tools"]').click()
                scene_ready(page)
                check(locale+' remains in the whole-house view',page.evaluate('dollhouse.visual().focusedRoom===null'))
                target=page.evaluate('dollhouse.objects().find(p=>p.key==="prop:mint-tin")')
                initial=page.evaluate('p=>document.elementFromPoint(p.x,p.y)?.id==="world"',target)
                check(locale+' original tin point belongs to actual canvas',initial)
                if not initial:
                    page.screenshot(path=str(OUT/(locale+'-unreachable-before.png')),timeout=60000,scale='css')
                    continue
                page.evaluate('''() => {
                    window.homeTouches=[];
                    for(const type of ['pointerdown','pointerup'])window.addEventListener(type,e=>{
                        const g=dollhouse,v=g.visual(),r=document.querySelector('.object-ribbon')?.getBoundingClientRect();
                        window.homeTouches.push({type,time:performance.now(),x:e.clientX,y:e.clientY,
                            targetId:e.target.id,targetClass:e.target.className,
                            pointOwner:document.elementFromPoint(e.clientX,e.clientY)?.id,
                            selected:v.selectedObject,moving:v.cameraMoving,
                            tin:g.objects().find(p=>p.key==='prop:mint-tin'),
                            ribbon:r?{left:r.left,top:r.top,right:r.right,bottom:r.bottom}:null});
                    },true);
                }''')
                # No layout wait, target projection, or recovery between taps.
                page.touchscreen.tap(target['x'],target['y'])
                page.wait_for_timeout(650)
                page.touchscreen.tap(target['x'],target['y'])
                scene_ready(page)
                trace=page.evaluate('window.homeTouches')
                downs=[event for event in trace if event['type']=='pointerdown']
                check(locale+' has exactly two unchanged-coordinate touches',len(downs)==2 and all(abs(e['x']-target['x'])<.1 and abs(e['y']-target['y'])<.1 for e in downs))
                if len(downs)==2:
                    second=downs[1]
                    check(locale+' second touch is owned by the scene canvas, never ribbon UI',second['targetId']=='world' and second['pointOwner']=='world')
                    check(locale+' selection leaves the original tin fixed',second['selected']=='prop:mint-tin' and abs(second['tin']['x']-target['x'])<.25 and abs(second['tin']['y']-target['y'])<.25)
                    r=second['ribbon'];covered=bool(r and r['left']<=target['x']<=r['right'] and r['top']<=target['y']<=r['bottom'])
                    check(locale+' selection paper does not cover the original tin point',not covered)
                check(locale+' same-position second scene touch actually opens tin',page.evaluate('dollhouse.state().story.step===1') and page.locator('[data-held-item="red-thread"]').is_visible())
                observation={'locale':locale,'motion':motion,'width':844,'height':390,'cpuThrottle':4,
                    'sourceCommit':os.environ['SOURCE_SHA'],'requestedGapMs':650,
                    'actualGapMs':downs[1]['time']-downs[0]['time'] if len(downs)==2 else None,
                    'target':target,'events':trace}
                observations.append(observation)
                print('LANDSCAPE_HOME_OBSERVATION '+json.dumps(observation),flush=True)
                page.screenshot(path=str(OUT/(locale+'-after-two-taps.png')),timeout=60000,scale='css')
            except Exception as error:
                errors.append(locale+': '+str(error))
            finally:
                context.close()
        browser.close()
    check('no native landscape runtime errors',not errors)
finally:
    report={'checks':checks,'errors':errors,'observations':observations}
    (OUT/'results.json').write_text(json.dumps(report,indent=2))
    print('LANDSCAPE_HOME_SUMMARY '+json.dumps({'checks':len(checks),'passed':sum(c['passed'] for c in checks),'errors':errors}),flush=True)
    server.terminate();server.wait(timeout=10)
if errors or any(not c['passed'] for c in checks) or len(observations)!=2:
    raise SystemExit('Whole-house landscape acceptance failed; no covered tap or recovery is accepted')
