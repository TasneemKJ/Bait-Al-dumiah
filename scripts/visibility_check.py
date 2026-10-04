"""Genuine background-tab acceptance for a held physical tea pot.

Run with requirements-visibility.txt in a headed display (Xvfb on Linux).
Playwright 1.60's no_defaults option leaves real focus/visibility intact only in
the existing default context. The ordinary tea journeys keep Playwright 1.55.
The game is driven through its UI and the shared real-mouse PotDrag helper;
diagnostics only observe state. No visibility events or game time are fabricated.

Official fixture pattern:
https://github.com/microsoft/playwright/blob/v1.60.0/tests/library/chromium/connect-over-cdp.spec.ts#L639
"""
import json
import os
import subprocess
import time
import urllib.request
from importlib.metadata import version
from pathlib import Path

from playwright.sync_api import sync_playwright
from tea_check import PotDrag, tea_ready, tea_status

ROOT = Path(__file__).resolve().parents[1]


def run():
    out = ROOT / 'artifacts' / 'visibility'
    out.mkdir(parents=True, exist_ok=True)
    base = os.environ.get('PLAY_URL', 'http://127.0.0.1:4193').rstrip('/')
    cdp_port = int(os.environ.get('VISIBILITY_CDP_PORT', '4194'))
    checks, errors, observations = [], [], {}
    runtime_info = {'playwright': version('playwright'), 'headed': True,
                    'noDefaults': True, 'context': 'existing default'}
    started = time.monotonic()
    failure = None
    server = server_log = runtime = owner = browser = page = other_tab = drag = None

    def check(name, condition):
        checks.append({'name': name, 'passed': bool(condition)})
        print(('PASS ' if condition else 'FAIL ') + name, flush=True)
        assert condition, name

    def ready():
        page.wait_for_function('window.dollhouse && !document.querySelector("#loading")', timeout=60000)
        page.wait_for_function('!window.dollhouse.visual().cameraMoving', timeout=60000)

    def foreground():
        page.bring_to_front()
        page.wait_for_function('!document.hidden && document.hasFocus()', timeout=20000, polling=100)

    def observe(label):
        snapshot = page.evaluate('''()=>{
            const game=window.dollhouse;
            return {
                visibility:{hidden:document.hidden,state:document.visibilityState,focus:document.hasFocus()},
                viewport:{width:innerWidth,height:innerHeight},
                state:game?.state?.()??null,tea:game?.tea?.()??null,
                visual:game?.visual?.()??null,targets:game?.teaObjects?.()??[]
            };
        }''')
        snapshot['wallSeconds'] = time.monotonic() - started
        observations[label] = snapshot
        (out / (label + '.json')).write_text(json.dumps(snapshot, indent=2))
        return snapshot

    def capture(label):
        # Capturing a background page can change its rendering/visibility state.
        # All evidence during the hidden interval is read-only JSON instead.
        assert page.evaluate('!document.hidden && document.hasFocus()'), 'Screenshots require the foreground game tab'
        page.screenshot(path=str(out / (label + '.png')), timeout=60000)

    try:
        if not os.environ.get('PLAY_URL'):
            server_log = (out / 'server.log').open('w')
            server = subprocess.Popen(
                ['node', 'scripts/serve.mjs', 'dist'], cwd=ROOT,
                env={**os.environ, 'PORT': '4193'},
                stdout=server_log, stderr=subprocess.STDOUT,
            )
        for _ in range(100):
            try:
                with urllib.request.urlopen(base, timeout=1):
                    break
            except Exception:
                time.sleep(.1)
        else:
            raise RuntimeError('Built HTTP application did not become available at ' + base)

        runtime = sync_playwright().start()
        options = {
            'headless': False,
            'args': ['--use-angle=swiftshader', '--enable-unsafe-swiftshader',
                     '--enable-webgl', '--remote-debugging-port=' + str(cdp_port)],
        }
        if os.environ.get('CHROMIUM_PATH'):
            options['executable_path'] = os.environ['CHROMIUM_PATH']
        owner = runtime.chromium.launch(**options)
        runtime_info['chromium'] = owner.version
        browser = runtime.chromium.connect_over_cdp(
            'http://127.0.0.1:' + str(cdp_port),
            no_defaults=True,
        )
        # new_context() would enable Playwright's forced-focus override again.
        # The launch connection does not own pages in this default context.
        context = browser.contexts[0]
        page = context.new_page()
        page.set_default_timeout(20000)
        page.set_viewport_size({'width': 390, 'height': 844})
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.on('console', lambda message: errors.append(message.text) if message.type == 'error' else None)
        page.goto(base + '/?debug=1')
        foreground()
        ready()

        # Retain the original phone check's Arabic, low-detail, reduced-motion UI.
        settings = page.locator('[data-action="panel-settings"]')
        if not settings.is_visible():
            page.locator('[data-action="toggle-tools"]').click()
        settings.click()
        page.locator('[data-field="quality"]').select_option('low')
        page.locator('[data-field="locale"]').select_option('ar')
        page.locator('[data-field="motion"]').check()
        page.locator('#sheet [data-action="close"]').click()
        page.wait_for_function('window.dollhouse.visual().quality==="low" && document.documentElement.dir==="rtl"')
        page.locator('[data-room="kitchen"]').click()
        ready()
        for _ in range(2):
            point = next(p for p in page.evaluate('window.dollhouse.objects()') if p['key'] == 'prop:tea-set')
            assert page.evaluate('p=>document.elementFromPoint(p.x,p.y)?.id==="world"', point), 'Scene tea set is covered'
            page.mouse.click(point['x'], point['y'])
            ready()
        tea_ready(page)

        # Prepare the other real tab before taking the pot, then return to play.
        other_tab = context.new_page()
        other_tab.goto('about:blank')
        foreground()
        ready()
        tea_ready(page)
        capture('01-foreground-table')
        drag = PotDrag(page).down()
        drag.aim(tea_status(page)['cups'][0])
        page.wait_for_function('window.dollhouse.tea().flow>0')
        before = observe('before-hidden')
        check('the foreground game is pouring through a real held pot before the tab switch',
              not before['visibility']['hidden'] and before['visibility']['focus']
              and not before['state']['paused'] and before['tea']['pressed']
              and before['tea']['tilt'] > 0 and before['tea']['flow'] > 0)

        other_tab.bring_to_front()
        # Preserve the original genuine visibility deadline and timer polling.
        page.wait_for_function('document.hidden', timeout=20000, polling=100)
        page.wait_for_function('!window.dollhouse.tea().pressed && window.dollhouse.tea().tilt===0', timeout=20000, polling=100)
        hidden = observe('hidden')
        check('switching to another real tab hides the game document',
              hidden['visibility']['hidden'] and hidden['visibility']['state'] == 'hidden')
        check('hiding the actual page releases its pot input',
              not hidden['tea']['pressed'] and hidden['tea']['tilt'] == 0)
        check('the hidden game pauses and its released stream stops',
              hidden['state']['paused'] and hidden['tea']['flow'] == 0)

        other_tab.close()
        other_tab = None
        foreground()
        tea_ready(page)
        restored = observe('restored')
        check('returning to the visible game never restores the held pour',
              not restored['visibility']['hidden'] and restored['visibility']['focus']
              and not restored['state']['paused'] and not restored['tea']['pressed']
              and restored['tea']['tilt'] == 0 and restored['tea']['flow'] == 0)
        drag.release()
        capture('02-restored-table')
        page.locator('[data-tea-action="exit"]').click()
        page.wait_for_function('window.dollhouse.tea()===null')
        ready()
        check('genuine tab visibility journey has no JavaScript or console errors', not errors)
    except Exception as error:
        failure = str(error)
        if page and not page.is_closed():
            try:
                observe('failure-state')
            except Exception:
                pass
            try:
                if page.evaluate('!document.hidden && document.hasFocus()'):
                    capture('failure')
            except Exception:
                pass
        raise
    finally:
        (out / 'results.json').write_text(json.dumps({
            'checks': checks, 'errors': errors, 'failure': failure,
            'runtime': runtime_info, 'observations': observations,
        }, indent=2))
        (out / 'source-commit.txt').write_text(
            subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True))
        if drag:
            try:
                drag.release()
            except Exception:
                pass
        if browser:
            browser.close()
        if owner:
            owner.close()
        if runtime:
            runtime.stop()
        if server:
            server.terminate()
            try:
                server.wait(timeout=10)
            except subprocess.TimeoutExpired:
                server.kill()
                server.wait(timeout=10)
        if server_log:
            server_log.close()


if __name__ == '__main__':
    run()
