"""Canonical source-stamped HTTP captures; genuine touch contexts on phones.

No scene rewriting, CSS modifications, simulation mutation or invented frames.
Existing UI and story journeys remain the behavioral gates.
"""
import hashlib
import json
import os
from pathlib import Path
import subprocess
import time
import urllib.request
from playwright.sync_api import sync_playwright

ROOT = Path.cwd()
OUT = ROOT / 'artifacts' / 'single-review'
OUT.mkdir(parents=True, exist_ok=True)
SHA = subprocess.check_output(['git', 'rev-parse', 'HEAD'], text=True).strip()
assert SHA == os.environ['SOURCE_SHA']
manifest = {'sourceCommit': SHA, 'sourceTree': subprocess.check_output(['git', 'rev-parse', 'HEAD^{tree}'], text=True).strip(),
            'revision': os.environ['REVIEW_REVISION'], 'images': [], 'checks': [], 'errors': []}
server = subprocess.Popen(['node', 'scripts/serve.mjs', 'dist'], env={**os.environ, 'PORT': '4391'}, stdout=subprocess.DEVNULL)


def check(name, condition, detail=None):
    manifest['checks'].append({'name': name, 'passed': bool(condition), 'detail': detail})
    if not condition:
        raise AssertionError(name + ': ' + str(detail))


def write_manifest():
    (OUT / 'review-manifest.json').write_text(json.dumps(manifest, indent=2))


try:
    for _ in range(100):
        try:
            urllib.request.urlopen('http://127.0.0.1:4391', timeout=1)
            break
        except Exception:
            time.sleep(.1)
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True, args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--enable-webgl'])
        sizes = [(390, 844), (1280, 800)] if manifest['revision'] == 'baseline' else [(360, 640), (390, 844), (412, 915), (844, 390), (1280, 800)]
        for width, height in sizes:
            mobile = width != 1280
            for locale in ['en', 'ar']:
                label = f'{width}x{height}-{locale}'
                context = browser.new_context(viewport={'width': width, 'height': height}, has_touch=mobile, is_mobile=mobile, device_scale_factor=2 if mobile else 1)
                page = context.new_page()
                page.set_default_timeout(60000)
                errors = []
                page.on('pageerror', lambda error: errors.append(str(error)))
                session = context.new_cdp_session(page)
                if mobile:
                    session.send('Emulation.setCPUThrottlingRate', {'rate': 4})
                try:
                    page.goto('http://127.0.0.1:4391/?debug=1', wait_until='networkidle')
                    page.wait_for_function('window.dollhouse && !document.querySelector("#loading") && !dollhouse.visual().cameraMoving')
                    def activate(selector):
                        target = page.locator(selector)
                        target.tap() if mobile else target.click()
                    if locale == 'ar':
                        activate('[data-action="toggle-tools"]')
                        activate('[data-action="panel-settings"]')
                        page.locator('[data-field="locale"]').select_option('ar')
                        activate('#sheet [data-action="close"]')
                        # Opening a sheet already collapses the tool dock. Do not
                        # re-expand it and hide the actual room controls.
                        if page.locator('.dock').get_attribute('data-expanded') == 'true':
                            activate('[data-action="toggle-tools"]')
                    room = 'kitchen' if locale == 'en' else 'bedroom'
                    activate(f'[data-room="{room}"]')
                    page.wait_for_function('!dollhouse.visual().cameraMoving')
                    page.wait_for_timeout(400)
                    observations = page.evaluate('({visual:dollhouse.visual(),state:dollhouse.state(),width:innerWidth,scroll:document.documentElement.scrollWidth,lang:document.documentElement.lang,dir:document.documentElement.dir,canvas:{width:document.querySelector("#world").width,height:document.querySelector("#world").height},touch:navigator.maxTouchPoints})')
                    check(label + ' locale', observations['lang'] == locale and observations['dir'] == ('rtl' if locale == 'ar' else 'ltr'))
                    check(label + ' selected room', observations['visual']['focusedRoom'] == room)
                    check(label + ' no horizontal overflow', observations['scroll'] <= observations['width'] + 1, observations['scroll'])
                    check(label + ' rendered canvas', observations['canvas']['width'] > 0 and observations['canvas']['height'] > 0)
                    if mobile:
                        check(label + ' actual touch context', observations['touch'] > 0)
                    path = OUT / (label + '.png')
                    page.screenshot(path=str(path), timeout=60000, full_page=False)
                    manifest['images'].append({'path': path.name, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest(), 'viewport': {'width': width, 'height': height}, 'deviceScaleFactor': 2 if mobile else 1, 'hasTouch': mobile, 'isMobile': mobile, 'cpuThrottle': 4 if mobile else 1, 'locale': locale, 'room': room, 'transport': width in [390, 1280]})
                    (OUT / (label + '.json')).write_text(json.dumps(observations, indent=2))
                    check(label + ' no page errors', not errors, errors)
                except Exception as error:
                    manifest['errors'].append({'scenario': label, 'error': str(error)})
                finally:
                    context.close()
                    write_manifest()
        browser.close()
finally:
    server.terminate()
    server.wait(timeout=10)
    write_manifest()
print(json.dumps({'sourceCommit': SHA, 'images': len(manifest['images']), 'checks': len(manifest['checks']), 'errors': manifest['errors']}))
raise SystemExit(bool(manifest['errors']))
