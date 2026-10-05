"""Regression: first-attempt real scene input after measured HUD changes.

The scene is never patched and no simulation progress is injected. Pointer
coordinates are observed at event time to distinguish bad aiming from a rule
failure. SCENE_CASE selects one independently isolated real-browser fixture.
"""
import json, os, subprocess, time, urllib.request
from pathlib import Path
from playwright.sync_api import sync_playwright
from scene_gestures import scene_ready

ROOT = Path(__file__).resolve().parents[1]
CASE = os.environ.get('SCENE_CASE', 'ar-reduced')
CASES = {'ar-reduced': ('ar', 'reduce', 390, 844, 1),
         'en-motion': ('en', 'no-preference', 390, 844, 1),
         'ar-throttled': ('ar', 'reduce', 360, 640, 4),
         'en-throttled': ('en', 'no-preference', 390, 844, 4)}
locale, motion, width, height, throttle = CASES[CASE]
OUT = ROOT / 'artifacts' / 'scene-input' / CASE
OUT.mkdir(parents=True, exist_ok=True)
checks, errors = [], []
server = subprocess.Popen(['node', 'scripts/serve.mjs', 'dist'], cwd=ROOT,
                          env={**os.environ, 'PORT': '4192'},
                          stdout=(OUT / 'server.log').open('w'), stderr=subprocess.STDOUT)
page = None


def check(name, value):
    checks.append({'name': name, 'passed': bool(value)})
    print(('PASS ' if value else 'FAIL ') + name, flush=True)
    assert value, name


def point(key):
    scene_ready(page)
    value = next(p for p in page.evaluate('window.dollhouse.objects()') if p['key'] == key)
    check('projected target reaches actual canvas: ' + key,
          page.evaluate('p=>document.elementFromPoint(p.x,p.y)?.id === "world"', value))
    return value


def tap(key):
    value = point(key)
    page.touchscreen.tap(value['x'], value['y'])


try:
    for _ in range(80):
        try:
            urllib.request.urlopen('http://127.0.0.1:4192', timeout=1)
            break
        except Exception:
            time.sleep(.1)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=[
            '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--enable-webgl'])
        context = browser.new_context(viewport={'width': width, 'height': height},
                                      has_touch=True, reduced_motion=motion)
        page = context.new_page()
        page.set_default_timeout(60000)
        page.on('pageerror', lambda error: errors.append(str(error)))
        session = context.new_cdp_session(page)
        session.send('Emulation.setCPUThrottlingRate', {'rate': throttle})
        page.goto('http://127.0.0.1:4192/?debug=1')
        scene_ready(page)
        page.locator('[data-action="toggle-tools"]').click()
        page.locator('[data-action="panel-settings"]').click()
        page.locator('[data-field="quality"]').select_option('low')
        if locale == 'ar':
            page.locator('[data-field="locale"]').select_option('ar')
        page.locator('#sheet [data-action="close"]').click()
        page.evaluate('''() => {
            window.sceneInputObservations = [];
            for (const type of ['pointerdown', 'pointerup']) {
                window.addEventListener(type, event => {
                    const g = window.dollhouse;
                    window.sceneInputObservations.push({type, x: event.clientX, y: event.clientY,
                        target: event.target.id || event.target.className,
                        objects: g.objects(), visual: {presentation: g.visual().presentation,
                            moving: g.visual().cameraMoving}});
                }, true);
            }
        }''')
        page.locator('[data-room="kitchen"]').click()
        tap('prop:mint-tin')
        check('first real touch selects the tin without advancing',
              page.evaluate('window.dollhouse.visual().selectedObject === "prop:mint-tin" && window.dollhouse.state().story.step === 0'))
        tap('prop:mint-tin')
        check('second real touch after the measured ribbon takes the red thread',
              page.evaluate('window.dollhouse.state().story.step === 1') and
              page.locator('[data-held-item="red-thread"]').is_visible())
        # Changing rooms clears the response and changes the bottom inset.
        page.locator('[data-room="studio"]').click()
        destination = point('prop:sewing-machine')
        box = page.locator('.held-item').bounding_box()
        x, y = box['x'] + box['width'] / 2, box['y'] + box['height'] / 2
        session.send('Input.dispatchTouchEvent', {'type': 'touchStart',
            'touchPoints': [{'x': x, 'y': y, 'id': 1}]})
        for i in range(1, 13):
            session.send('Input.dispatchTouchEvent', {'type': 'touchMove', 'touchPoints': [{
                'x': x + (destination['x'] - x) * i / 12,
                'y': y + (destination['y'] - y) * i / 12, 'id': 1}]})
        current = next(p for p in page.evaluate('window.dollhouse.objects()') if p['key'] == 'prop:sewing-machine')
        check('real carry keeps the visible sewing destination fixed',
              abs(current['x'] - destination['x']) < .25 and abs(current['y'] - destination['y']) < .25)
        session.send('Input.dispatchTouchEvent', {'type': 'touchEnd', 'touchPoints': []})
        page.wait_for_function('window.dollhouse.state().activities.active?.id === "stitch"')
        check('first real drop after room/feedback changes enters the bear seam',
              page.evaluate('window.dollhouse.stitch()?.mode === "mend" && window.dollhouse.state().story.step === 1'))
        page.wait_for_function('window.dollhouse.visual().stitchActive')
        page.screenshot(path=str(OUT / 'real-sewing-entry.png'), timeout=60000)
        page.keyboard.press('Escape')
        scene_ready(page)
        check('real exit preserves the earned red thread',
              page.locator('[data-held-item="red-thread"]').is_visible() and
              page.evaluate('window.dollhouse.state().activities.active === null'))
        check('no browser runtime errors', not errors)
        (OUT / 'input-observations.json').write_text(json.dumps(page.evaluate('window.sceneInputObservations'), indent=2))
        browser.close()
finally:
    (OUT / 'results.json').write_text(json.dumps({'case': CASE,
        'fixture': {'locale': locale, 'motion': motion, 'width': width, 'height': height, 'cpuThrottle': throttle},
        'checks': checks, 'errors': errors}, indent=2))
    server.terminate()
