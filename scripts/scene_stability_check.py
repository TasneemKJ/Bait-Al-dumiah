"""Real-touch regression: selection keeps the player's original screen target.

Readiness is permitted before a gesture sequence only. The second tap and held
item drop reuse unchanged coordinates; observation never changes game state.
"""
import json, os, subprocess, time, urllib.request
from pathlib import Path
from playwright.sync_api import sync_playwright
from scene_gestures import scene_ready

ROOT = Path(__file__).resolve().parents[1]
GROUP = os.environ.get('STABILITY_GROUP', 'all')
OUT = ROOT / 'artifacts' / 'scene-stability' / GROUP
OUT.mkdir(parents=True, exist_ok=True)
checks, observations, errors = [], [], []
server = subprocess.Popen(['node', 'scripts/serve.mjs', 'dist'], cwd=ROOT,
    env={**os.environ, 'PORT': '4194'}, stdout=(OUT / 'server.log').open('w'), stderr=subprocess.STDOUT)


def check(name, passed):
    checks.append({'name': name, 'passed': bool(passed)})
    print(('PASS ' if passed else 'FAIL ') + name, flush=True)
    assert passed, name


def point(page, key):
    return page.evaluate('key=>window.dollhouse.objects().find(p=>p.key===key)', key)


def reachable(page, p):
    return page.evaluate('p=>document.elementFromPoint(p.x,p.y)?.id==="world"', p)


def unchanged(a, b):
    return abs(a['x'] - b['x']) < .25 and abs(a['y'] - b['y']) < .25


def fixture(browser, locale, motion, width, height, rate):
    context = browser.new_context(viewport={'width': width, 'height': height},
        has_touch=True, device_scale_factor=2, is_mobile=True, reduced_motion=motion)
    page = context.new_page()
    page.set_default_timeout(60000)
    page.on('pageerror', lambda error: errors.append(str(error)))
    cdp = context.new_cdp_session(page)
    cdp.send('Emulation.setCPUThrottlingRate', {'rate': rate})
    page.goto('http://127.0.0.1:4194/?debug=1')
    scene_ready(page)
    page.locator('[data-action="toggle-tools"]').click()
    page.locator('[data-action="panel-settings"]').click()
    page.locator('[data-field="quality"]').select_option('low')
    if locale == 'ar':
        page.locator('[data-field="locale"]').select_option('ar')
    page.locator('#sheet [data-action="close"]').click()
    page.evaluate('''() => {
        window.stabilityEvents = [];
        for (const type of ['pointerdown','pointerup']) window.addEventListener(type, e => {
            const g=window.dollhouse,v=g.visual();
            window.stabilityEvents.push({type,time:performance.now(),x:e.clientX,y:e.clientY,
                target:e.target.id||e.target.className,selected:v.selectedObject,
                moving:v.cameraMoving,presentation:v.presentation,objects:g.objects()});
        },true);
    }''')
    return context, page, cdp


def room(page, name):
    page.locator('[data-room="' + name + '"]').click()
    scene_ready(page)


def select_at(page, key):
    before = point(page, key)
    check('selection begins on canvas: ' + key, reachable(page, before))
    page.touchscreen.tap(before['x'], before['y'])
    page.wait_for_function('key=>window.dollhouse.visual().selectedObject===key', arg=key)
    scene_ready(page)
    check('selection retains original screen target: ' + key, unchanged(before, point(page, key)))
    check('new ribbon leaves original target reachable: ' + key, reachable(page, before))
    return before


def drop(page, cdp, destination, name):
    b = page.locator('.held-item').bounding_box()
    start = {'x': b['x'] + b['width']/2, 'y': b['y'] + b['height']/2}
    edge = page.locator('.story-playfield').get_attribute('data-ribbon-edge')
    cdp.send('Input.dispatchTouchEvent', {'type':'touchStart', 'touchPoints':[{**start,'id':1}]})
    for i in range(1, 13):
        cdp.send('Input.dispatchTouchEvent', {'type':'touchMove', 'touchPoints':[{
            'x':start['x']+(destination['x']-start['x'])*i/12,
            'y':start['y']+(destination['y']-start['y'])*i/12, 'id':1}]})
    check(name + ' retains the destination while held', unchanged(destination, point(page, destination['key'])))
    check(name + ' destination remains exposed on canvas', reachable(page, destination))
    check(name + ' keeps ribbon placement during gesture', page.locator('.story-playfield').get_attribute('data-ribbon-edge') == edge)
    cdp.send('Input.dispatchTouchEvent', {'type':'touchEnd', 'touchPoints':[]})


try:
    for _ in range(80):
        try:
            urllib.request.urlopen('http://127.0.0.1:4194', timeout=1)
            break
        except Exception:
            time.sleep(.1)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl'])
        if GROUP in ('all', 'taps'):
            cases = [(locale,motion,delay,rate,390,844)
                for locale,motion in [('en','no-preference'),('ar','reduce')]
                for delay,rate in [(80,1),(250,1),(650,1),(250,4)]]
            cases += [(locale,motion,250,4,360,640)
                for locale,motion in [('en','no-preference'),('ar','reduce')]]
            cases += [(locale,motion,250,4,width,height) for locale,motion in [('en','no-preference'),('ar','reduce')] for width,height in [(412,915),(844,390)]]
            for locale,motion,delay,rate,width,height in cases:
                label = f'{locale}-{motion}-{width}x{height}-{delay}ms-cpu{rate}'
                context,page,cdp = fixture(browser,locale,motion,width,height,rate)
                room(page,'kitchen')
                target = point(page,'prop:mint-tin')
                check(label+' initial point reaches canvas', reachable(page,target))
                page.evaluate('window.stabilityEvents=[]')
                # No readiness, projection, or retry between the two real touches.
                page.touchscreen.tap(target['x'],target['y'])
                page.wait_for_timeout(delay)
                page.touchscreen.tap(target['x'],target['y'])
                scene_ready(page)
                events = page.evaluate('window.stabilityEvents')
                downs = [e for e in events if e['type']=='pointerdown']
                check(label+' has two original-coordinate touches',len(downs)==2 and all(abs(e['x']-target['x'])<.1 and abs(e['y']-target['y'])<.1 for e in downs))
                check(label+' second touch still points to selected tin',downs[1]['selected']=='prop:mint-tin' and unchanged(target,next(v for v in downs[1]['objects'] if v['key']=='prop:mint-tin')))
                check(label+' opens tin on first unchanged-position attempt',page.evaluate('window.dollhouse.state().story.step===1') and page.locator('[data-held-item="red-thread"]').is_visible())
                observations.append({'case':label,'requestedGapMs':delay,'actualGapMs':downs[1]['time']-downs[0]['time'],'target':target,'events':events})
                context.close()
        if GROUP in ('all', 'reachability'):
            for locale,motion in [('en','no-preference'),('ar','reduce')]:
                context,page,cdp = fixture(browser,locale,motion,360,640,4)
                scene_ready(page)
                select_at(page,'prop:mint-tin')
                check(locale+' whole-house scene selection does not navigate',page.evaluate('window.dollhouse.visual().focusedRoom===null && window.dollhouse.state().story.step===0'))
                page.keyboard.press('Escape')
                room(page,'bedroom')
                select_at(page,'prop:moon-mobile')
                check(locale+' upper prop uses lower ribbon',page.locator('.story-playfield').get_attribute('data-ribbon-edge')=='bottom')
                page.screenshot(path=str(OUT/(locale+'-upper-prop.png')),timeout=60000,scale='css')
                page.keyboard.press('Escape')
                room(page,'kitchen')
                tin = select_at(page,'prop:mint-tin')
                page.touchscreen.tap(tin['x'],tin['y'])
                scene_ready(page)
                tea = select_at(page,'prop:tea-set')
                check(locale+' held lower prop uses upper ribbon',page.locator('.story-playfield').get_attribute('data-ribbon-edge')=='top')
                check(locale+' top ribbon is cached as a top occluder',page.evaluate('''() => {
                    const r=document.querySelector('.object-ribbon').getBoundingClientRect(),p=dollhouse.visual().presentation;
                    return p.top>=r.bottom && p.bottom<260;
                }'''))
                drop(page,cdp,tea,locale+' invalid thread drop')
                check(locale+' wrong drop keeps red thread',page.locator('[data-held-item="red-thread"]').is_visible() and page.evaluate('window.dollhouse.state().story.step===1'))
                scene_ready(page)
                check(locale+' localized feedback leaves tea reachable',reachable(page,tea) and unchanged(tea,point(page,'prop:tea-set')))
                page.screenshot(path=str(OUT/(locale+'-held-selected.png')),timeout=60000,scale='css')
                # A real viewport rotation cancels the held input and must use
                # the newly measured layout even while selection remains.
                before_rotate = page.evaluate('''()=>{const s=dollhouse.state();return {story:s.story,buttons:s.buttons,earnedToday:s.earnedToday,activities:s.activities,held:document.querySelector('[data-held-item]')?.dataset.heldItem}}''')
                b = page.locator('.held-item').bounding_box()
                x,y = b['x']+b['width']/2,b['y']+b['height']/2
                cdp.send('Input.dispatchTouchEvent', {'type':'touchStart','touchPoints':[{'x':x,'y':y,'id':1}]})
                cdp.send('Input.dispatchTouchEvent', {'type':'touchMove','touchPoints':[{'x':x+15,'y':y-15,'id':1}]})
                check(locale+' rotation starts from a real held gesture',page.locator('.carry-ghost').is_visible())
                page.set_viewport_size({'width':844,'height':390})
                scene_ready(page)
                check(locale+' rotation cancels carry safely',not page.locator('.carry-ghost').is_visible() and page.locator('[data-held-item="red-thread"]').is_visible())
                cdp.send('Input.dispatchTouchEvent', {'type':'touchEnd','touchPoints':[]})
                after_rotate = page.evaluate('''()=>{const s=dollhouse.state();return {story:s.story,buttons:s.buttons,earnedToday:s.earnedToday,activities:s.activities,held:document.querySelector('[data-held-item]')?.dataset.heldItem}}''')
                check(locale+' canceled rotation consumes, rewards and drops nothing',after_rotate==before_rotate)
                rotated = point(page,'prop:tea-set')
                check(locale+' selected rotation uses current measured safe area',page.evaluate('''p=>{const v=dollhouse.visual();return v.selectedObject==='prop:tea-set' && p.y>=v.presentation.top && p.y<=innerHeight-v.presentation.bottom && document.elementFromPoint(p.x,p.y)?.id==='world'}''',rotated))
                def final_clearance():
                    return page.evaluate('''() => {
                        const p=dollhouse.objects().find(p=>p.key==='prop:tea-set'),r=document.querySelector('.object-ribbon').getBoundingClientRect();
                        return {point:p,ribbon:{left:r.left,right:r.right,top:r.top,bottom:r.bottom},
                            owner:document.elementFromPoint(p.x,p.y)?.id,
                            covered:p.x>=r.left&&p.x<=r.right&&p.y>=r.top&&p.y<=r.bottom,
                            insets:dollhouse.visual().presentation};
                    }''')
                fitted=final_clearance()
                check(locale+' final rotated prop is outside the actual ribbon',not fitted['covered'] and fitted['owner']=='world')
                # Revisit the same focused room while selected; inspect the
                # final fitted point, not the earlier pre-navigation sample.
                page.locator('[data-room="kitchen"]').click()
                scene_ready(page)
                navigated=final_clearance()
                check(locale+' final explicit room fit leaves selected prop exposed',not navigated['covered'] and navigated['owner']=='world')
                observations.append({'case':locale+'-final-landscape-clearance','rotated':fitted,'navigated':navigated})
                page.screenshot(path=str(OUT/(locale+'-selected-landscape.png')),timeout=60000,scale='css')
                page.set_viewport_size({'width':360,'height':640})
                scene_ready(page)
                check(locale+' selected portrait return remains reachable',reachable(page,point(page,'prop:tea-set')))
                room(page,'studio')
                sewing = select_at(page,'prop:sewing-machine')
                drop(page,cdp,sewing,locale+' thread to sewing')
                page.wait_for_function('window.dollhouse.visual().stitchActive')
                check(locale+' real drop starts bear seam',page.evaluate('window.dollhouse.stitch()?.mode==="mend"'))
                page.keyboard.press('Escape')
                scene_ready(page)
                check(locale+' exit preserves carried thread',page.locator('[data-held-item="red-thread"]').is_visible())
                observations.append({'case':locale+'-short-phone-geometry','events':page.evaluate('window.stabilityEvents')})
                context.close()
        check('no browser runtime errors',not errors)
        browser.close()
finally:
    (OUT/'results.json').write_text(json.dumps({'group':GROUP,'checks':checks,'errors':errors,'observations':observations},indent=2))
    print('STABILITY_SUMMARY '+json.dumps({'group':GROUP,'checks':len(checks),'passed':sum(c['passed'] for c in checks),'errors':errors}),flush=True)
    server.terminate()
    server.wait(timeout=10)
