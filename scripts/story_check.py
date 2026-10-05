"""Play the three stories through real scene touches and carried-item drops.

The diagnostics expose observations only. This journey never writes progress,
submits synthetic rewards, calls simulation functions or bypasses hit testing.
"""
import json, os, subprocess, time, urllib.request
from pathlib import Path
from playwright.sync_api import sync_playwright
from scene_gestures import scene_ready
from tea_check import complete_tea, tea_ready, tea_status, tap_tea
from stitch_gestures import finish_stitch, stitch_ready, stitch_status

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'artifacts' / 'stories'
OUT.mkdir(parents=True, exist_ok=True)
BASE = os.environ.get('PLAY_URL', 'http://127.0.0.1:4190')
checks, errors = [], []
server = None
page = None
p = None
browser = None


def check(name, condition):
    checks.append({'name': name, 'passed': bool(condition)})
    print(('PASS ' if condition else 'FAIL ') + name, flush=True)
    assert condition, name


def state():
    return page.evaluate('window.dollhouse.state()')


def progress():
    s = state()['story']
    return sum([3, 4, 4][:s['chapter']]) + s['step']


def ready():
    page.wait_for_function('window.dollhouse && !document.querySelector("#loading")', timeout=60000)
    scene_ready(page)


def capture(name):
    ready()
    page.mouse.move(5, 5)
    page.screenshot(path=str(OUT / (name + '.png')), timeout=60000)
    (OUT / (name + '.json')).write_text(json.dumps({
        'viewport': page.viewport_size, 'visual': page.evaluate('window.dollhouse.visual()'),
        'story': state()['story'], 'objects': page.evaluate('window.dollhouse.objects()')
    }, indent=2))


def room(name):
    page.locator(f'[data-room="{name}"]').click()
    ready()


def point(key):
    scene_ready(page)
    p = next(p for p in page.evaluate('window.dollhouse.objects()') if p['key'] == key)
    check('scene target is reachable: ' + key, page.evaluate(
        'p => document.elementFromPoint(p.x,p.y)?.id === "world"', p))
    return p


def tap_object(key, touch=False):
    p = point(key)
    if touch:
        page.touchscreen.tap(p['x'], p['y'])
    else:
        page.mouse.click(p['x'], p['y'])


def select(key, touch=False):
    tap_object(key, touch)
    page.wait_for_function('key=>window.dollhouse.visual().selectedObject===key', arg=key)
    check('selection stays in the scene: ' + key,
          page.locator('.object-ribbon').is_visible() and not page.locator('dialog[open]').count() and not state()['paused'])


def drag_to(key, touch=False):
    p = point(key)
    token = page.locator('.held-item')
    b = token.bounding_box()
    start = (b['x'] + b['width'] / 2, b['y'] + b['height'] / 2)
    session = page.context.new_cdp_session(page) if touch else None
    if touch:
        session.send('Input.dispatchTouchEvent', {'type':'touchStart','touchPoints':[{'x':start[0],'y':start[1],'id':1}]})
    else:
        page.mouse.move(*start)
        page.mouse.down()
    pressed = token.bounding_box()
    check('held item stays under the finger on pointer down', abs(pressed['x']-b['x']) < 2)
    if touch:
        for i in range(1, 13):
            session.send('Input.dispatchTouchEvent', {'type':'touchMove','touchPoints':[{'x':start[0]+(p['x']-start[0])*i/12,'y':start[1]+(p['y']-start[1])*i/12,'id':1}]})
    else:
        page.mouse.move(p['x'], p['y'], steps=12)
    check('real pointer drag shows the carried item', page.locator('.carry-ghost').is_visible())
    current = next(v for v in page.evaluate('window.dollhouse.objects()') if v['key'] == key)
    check('held drag keeps its destination fixed: ' + key,
          abs(current['x']-p['x']) < .25 and abs(current['y']-p['y']) < .25)
    check('held drag keeps its destination exposed: ' + key,
          page.evaluate('p=>document.elementFromPoint(p.x,p.y)?.id === "world"', p))
    if touch:
        session.send('Input.dispatchTouchEvent', {'type':'touchEnd','touchPoints':[]})
        session.detach()
    else:
        page.mouse.up()


def panel(name):
    target = page.locator(f'[data-action="panel-{name}"]')
    if not target.is_visible():
        page.locator('[data-action="toggle-tools"]').click()
    target.click()


try:
    if not os.environ.get('PLAY_URL'):
        server = subprocess.Popen(['node', 'scripts/serve.mjs', 'dist'], cwd=ROOT,
                                  env={**os.environ, 'PORT': '4190'},
                                  stdout=(OUT/'server.log').open('w'), stderr=subprocess.STDOUT)
    for _ in range(80):
        try:
            urllib.request.urlopen(BASE, timeout=1)
            break
        except Exception:
            time.sleep(.1)
    p = sync_playwright().start()
    options = {'headless': True, 'args': ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--enable-webgl']}
    if os.environ.get('CHROMIUM_PATH'):
        options['executable_path'] = os.environ['CHROMIUM_PATH']
    browser = p.chromium.launch(**options)
    context = browser.new_context(viewport={'width': 1280, 'height': 900}, has_touch=True)
    page = context.new_page()
    page.set_default_timeout(20000)
    # Software WebGL can delay navigation events after the new document boots.
    # Keep navigation bounded by the same 60s budget as scene readiness.
    page.set_default_navigation_timeout(60000)
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto(BASE+'/?debug=1')
    ready()
    initial = state()
    check('new player starts with no inventory, progress or open tools',
          progress() == 0 and not page.locator('.held-item').count() and page.locator('.dock').get_attribute('data-expanded') == 'false')
    capture('01-open-house')
    # Preserve a full-detail baseline; use the actual player quality setting for
    # the long interaction journey. High-detail rendering has a separate gate.
    panel('settings')
    page.locator('[data-field="quality"]').select_option('low')
    page.locator('#sheet [data-action="close"]').click()
    page.wait_for_function('window.dollhouse.visual().quality==="low"')
    page.locator('#objective-action').click()
    ready()
    check('a clue focuses the kitchen without doing the action', progress() == 0 and state()['buttons'] == initial['buttons'])
    select('prop:mint-tin')
    capture('02-curious-touch')
    tap_object('prop:mint-tin')
    check('second scene touch opens the tin and finds the red thread', progress() == 1 and page.locator('[data-held-item="red-thread"]').is_visible())
    page.reload(wait_until='domcontentloaded')
    ready()
    check('reload preserves a carried item and its next action', progress() == 1 and page.locator('[data-held-item="red-thread"]').is_visible())
    room('kitchen')
    before = state()['story'].copy()
    drag_to('prop:tea-set')
    check('wrong destination preserves every story field and item', state()['story'] == before and page.locator('[data-held-item="red-thread"]').is_visible())
    token = page.locator('.held-item').bounding_box()
    page.mouse.move(token['x']+token['width']/2, token['y']+token['height']/2)
    page.mouse.down()
    page.mouse.move(token['x']+80, token['y']-35, steps=5)
    page.keyboard.press('Escape')
    page.mouse.up()
    check('Escape cancels a live carry gesture without dropping inventory', progress() == 1 and not page.locator('.carry-ghost').is_visible())
    page.locator('.dock [data-action="pause"]').click()
    frozen = state()['elapsed']
    check('pause hides item input and scene selection', not page.locator('.held-item').is_visible() and not page.locator('.object-ribbon').count())
    page.wait_for_timeout(300)
    check('pause freezes story time', state()['elapsed'] == frozen and progress() == 1)
    page.locator('.pause-overlay [data-action="pause"]').click()
    room('studio')
    mend_before = state()
    drag_to('prop:sewing-machine')
    stitch_ready(page)
    check('red-thread drop opens the actual bear seam before advancing', progress() == 1 and stitch_status(page)['mode'] == 'mend' and not page.locator('dialog[open]').count())
    finish_stitch(page)
    mend_after = state()
    check('physical bear sewing grants no ritual currency, care, mastery, bond or records', mend_after['activities'] == mend_before['activities'] and all(mend_after[key] == mend_before[key] for key in ['buttons', 'cares', 'earnedToday']) and [d['bond'] for d in mend_after['dolls']] == [d['bond'] for d in mend_before['dolls']])
    check('thread becomes a mended bear through real sewing and finish', progress() == 2 and page.locator('[data-held-item="mended-bear"]').is_visible())
    capture('03-mended-bear-in-hand')
    room('bedroom')
    drag_to('prop:moon-bed')
    check('bear delivery completes chapter one exactly once', progress() == 3 and state()['buttons'] == initial['buttons'] + 12)
    check('chapter completion reveals the next clue with empty hands', page.locator('.objective').is_visible() and not page.locator('.held-item').count())
    page.wait_for_function('window.dollhouse.visual().story.bearVisible')
    capture('04-bear-at-home')
    # Keyboard discovery remains optional; inspecting returns visible focus.
    stamp = state()['story']['lastActionAt']
    page.wait_for_function('t=>window.dollhouse.state().elapsed>t+.1', arg=stamp)
    page.locator('[data-object-toggle]').focus()
    page.keyboard.press('Enter')
    check('keyboard discovery focuses the first room object', page.evaluate('document.activeElement.dataset.object==="prop:moon-bed"'))
    page.keyboard.press('Enter')
    check('keyboard discovery collapses after selection and focuses its action',
          page.locator('[data-object-toggle]').get_attribute('aria-expanded') == 'false' and page.evaluate('document.activeElement.matches("[data-scene-action=activate]")'))
    page.keyboard.press('Enter')
    check('keyboard activation replays the bear without spending anything', state()['story']['lastActionAt'] > stamp and state()['buttons'] == initial['buttons'] + 12)
    page.keyboard.press('Tab')
    page.keyboard.press('Enter')
    check('keyboard inspection opens optional details', page.locator('dialog[open]').count() == 1)
    page.keyboard.press('Escape')
    check('optional details restore focus to a visible control', page.evaluate('document.activeElement.matches("[data-object-toggle],[data-action=toggle-tools],#world") && document.activeElement.getClientRects().length>0'))
    room('parlor')
    select('prop:parlor-sofa')
    tap_object('prop:parlor-sofa')
    check('lifting the sofa cushion discovers a key', progress() == 4)
    drag_to('prop:music-cabinet')
    page.wait_for_function('window.dollhouse.visual().story.cabinetOpen')
    check('key opens the cabinet without a menu', progress() == 5 and page.evaluate('window.dollhouse.visual().story.cabinetOpen'))
    room('studio')
    drag_to('prop:sewing-machine')
    check('workbench repairs the cylinder', progress() == 6)
    room('parlor')
    drag_to('prop:music-cabinet')
    check('returned song earns chapter two and leaves a real toy', progress() == 7 and state()['buttons'] == initial['buttons'] + 28)
    page.wait_for_function('window.dollhouse.visual().story.musicRepaired')
    capture('05-returned-song')
    stamp = state()['story']['lastActionAt']
    page.wait_for_function('t=>window.dollhouse.state().elapsed>t+.1', arg=stamp)
    select('prop:music-cabinet')
    tap_object('prop:music-cabinet')
    check('earned cabinet replays in the scene with no duplicate reward', state()['story']['lastActionAt'] > stamp and progress() == 7 and state()['buttons'] == initial['buttons'] + 28 and not page.locator('dialog[open]').count())
    # The final chapter uses the same actual scene/drop route in Shami Arabic.
    panel('settings')
    page.locator('[data-field="locale"]').select_option('ar')
    page.locator('[data-field="motion"]').check()
    page.locator('#sheet [data-action="close"]').click()
    page.set_viewport_size({'width': 390, 'height': 844})
    room('kitchen')
    select('prop:wash-basin', touch=True)
    check('phone selection explains the second touch', page.locator('.ribbon-copy p').is_visible())
    tap_object('prop:wash-basin', touch=True)
    check('phone touch fills an ewer in Arabic', progress() == 8 and page.locator('html').get_attribute('dir') == 'rtl')
    check('successful phone handoff reveals the next clue and drag instruction', page.locator('.held-item em').is_visible() and page.locator('.objective').is_visible() and not page.locator('.object-ribbon').count())
    capture('06-arabic-water-in-hand')
    room('parlor')
    drag_to('prop:jasmine-window', touch=True)
    page.wait_for_function('window.dollhouse.visual().story.jasmineBloomed')
    check('watering the actual plant earns its blossoms and sprig', progress() == 9 and page.evaluate('window.dollhouse.visual().story.jasmineBloomed'))
    capture('07-arabic-jasmine')
    page.set_viewport_size({'width': 320, 'height': 740})
    room('kitchen')
    drag_to('prop:tea-set', touch=True)
    tea_ready(page)
    ritual_before = state()['activities'].copy()
    check('320px phone starts a one-cup tea while keeping the sprig', progress() == 9 and tea_status(page)['mode'] == 'guest' and len(tea_status(page)['cups']) == 1)
    complete_tea(page, touch=True)
    ritual_after = state()['activities']
    check('physical guest service produces the carried cup without ritual progress', progress() == 10 and all(ritual_after[key] == ritual_before[key] for key in ['mastery','completed','lastReward','teaRecords']))
    tap_tea(page,'tray',touch=True);page.wait_for_function('window.dollhouse.tea()===null')
    ready()
    check('served guest cup returns to the real carried-item route', page.locator('[data-held-item="guest-cup"]').is_visible())
    capture('08-small-phone-tea')
    page.set_viewport_size({'width': 667, 'height': 375})
    room('parlor')
    drag_to('prop:doorstep', touch=True)
    check('landscape phone reaches the doorstep and finishes the stories', progress() == 11 and state()['buttons'] == initial['buttons'] + 48)
    check('landscape completion leaves the next objective visible', page.locator('.objective').is_visible())
    page.wait_for_function('window.dollhouse.visual().story.guestVisible')
    check('landscape reward remains visible outside its completion message', page.evaluate('''()=>{
        const p=window.dollhouse.objects().find(o=>o.key==='prop:doorstep'),e=document.querySelector('.scene-response');
        if(!e)return true;const b=e.getBoundingClientRect();
        return !(p.x>=b.left&&p.x<=b.right&&p.y>=b.top&&p.y<=b.bottom);
    }'''))
    capture('09-landscape-welcome')
    stamp = state()['story']['lastActionAt']
    page.wait_for_function('t=>window.dollhouse.state().elapsed>t+.1', arg=stamp)
    select('prop:doorstep', touch=True)
    tap_object('prop:doorstep', touch=True)
    check('guest remains directly playable without progress or currency changes', state()['story']['lastActionAt'] > stamp and progress() == 11 and state()['buttons'] == initial['buttons'] + 48 and not page.locator('dialog[open]').count())
    page.keyboard.press('Escape')
    check('Escape dismisses the nonmodal selection', page.evaluate('window.dollhouse.visual().selectedObject===null'))
    page.set_viewport_size({'width': 390, 'height': 844})
    room('parlor')
    if state()['clock'] < 120:
        page.locator('[data-action="light"]').click()
    page.wait_for_function('window.dollhouse.visual().nightMix>.99')
    capture('10-phone-night-welcome')
    check('story path kept audio muted', state()['settings']['muted'])
    panel('journal')
    check('three completed story memories are available in Arabic', page.locator('.story-memories article').count() == 3 and 'الخيط' in page.locator('.story-memories').inner_text())
    page.locator('#sheet [data-action="close"]').click()
    page.reload(wait_until='domcontentloaded')
    ready()
    page.wait_for_function('window.dollhouse.visual().story.bearVisible && window.dollhouse.visual().story.musicRepaired && window.dollhouse.visual().story.guestVisible')
    check('all three visible outcomes and rewards survive reload', progress() == 11 and state()['buttons'] == initial['buttons'] + 48 and page.evaluate('window.dollhouse.visual().story.bearVisible && window.dollhouse.visual().story.musicRepaired && window.dollhouse.visual().story.guestVisible'))
    for width, height in [(320, 740), (390, 844), (667, 375), (844, 390)]:
        page.set_viewport_size({'width': width, 'height': height})
        room('parlor')
        check(f'{width}×{height} controls fit without horizontal overflow', page.evaluate('document.documentElement.scrollWidth<=innerWidth'))
        check(f'{width}×{height} visible play controls meet 44px targets', page.locator('.dock button:visible,.room-views button:visible,[data-object-toggle]:visible,.camera-tools button:visible').evaluate_all('(els)=>els.every(e=>{const b=e.getBoundingClientRect();return b.width>=44&&b.height>=44&&b.left>=0&&b.right<=innerWidth&&b.top>=0&&b.bottom<=innerHeight})'))
        check(f'{width}×{height} controls can actually receive a touch', page.locator('.dock button:visible,.room-views button:visible,[data-object-toggle]:visible,.camera-tools button:visible').evaluate_all('(els)=>els.every(e=>{const b=e.getBoundingClientRect(),hit=document.elementFromPoint(b.left+b.width/2,b.top+b.height/2);return hit===e||e.contains(hit)})'))
    page.set_viewport_size({'width': 1280, 'height': 900})
    panel('settings')
    page.locator('[data-field="quality"]').select_option('high')
    page.locator('#sheet [data-action="close"]').click()
    page.locator('[data-action="camera"]').click()
    page.wait_for_function('window.dollhouse.visual().quality==="high"')
    capture('11-house-remembers')
    stats = page.evaluate('window.dollhouse.stats()')
    (OUT/'render-stats.json').write_text(json.dumps(stats, indent=2))
    check('story artwork stays within the 400k triangle budget', stats['triangles'] < 400000)
    check('no JavaScript errors through the complete object journey', not errors)
except Exception:
    if page and not page.is_closed():
        try:
            page.screenshot(path=str(OUT/'failure.png'), timeout=20000)
            (OUT/'failure-state.json').write_text(json.dumps({'state':state(),'visual':page.evaluate('window.dollhouse.visual()'),'errors':errors},indent=2))
        except Exception:
            pass
    raise
finally:
    (OUT/'results.json').write_text(json.dumps({'checks':checks,'errors':errors},indent=2))
    (OUT/'source-commit.txt').write_text(subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True))
    if browser:
        browser.close()
    if p:
        p.stop()
    if server:
        server.terminate()
