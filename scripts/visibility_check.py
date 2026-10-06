"""Genuine background-tab acceptance for held tea, sewing and moon-chime input.

Run with requirements-visibility.txt in a headed display (Xvfb on Linux).
Playwright 1.60's no_defaults option leaves real focus/visibility intact only in
the existing default context. The ordinary tea journeys keep Playwright 1.55.
The game is driven through its UI, real-mouse PotDrag/NeedleDrag helpers and a rendered chime;
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
from game_entry import enter_game
from tea_check import PotDrag, tea_ready, tea_status
from stitch_gestures import NeedleDrag, stitch_ready, stitch_status

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
    server = server_log = runtime = owner = browser = page = other_tab = drag = needle_drag = None
    chime_mouse_held = False

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
                state:game?.state?.()??null,tea:game?.tea?.()??null,stitch:game?.stitch?.()??null,
                stitchTargets:game?.stitchObjects?.()??[],
                chimes:game?.chimes?.()??null,chimeTargets:game?.chimeObjects?.()??[],
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

    def chime_ready():
        # This observes the last rendered pose as well as the simulation. A held
        # note is not photographed or grabbed from an earlier released pose.
        page.wait_for_function('''()=>{
            const g=window.dollhouse,s=g?.chimes?.(),visual=g?.visual?.(),v=visual?.chimes;
            return Boolean(s&&visual.chimeActive&&!visual.cameraMoving&&v?.active
                &&v.phase===s.phase&&v.held===s.held&&Number.isFinite(v.pull)
                &&Math.abs(v.pull-s.pull)<1e-6&&g.chimeObjects().length===5);
        }''', timeout=60000, polling=100)

    def chime_music(snapshot):
        a = snapshot['chimes']
        keys = ('phase', 'pattern', 'cursor', 'listenTime', 'round', 'mistakes',
                'lastTone', 'lastPluck', 'toneSerial', 'result')
        return {key: a[key] for key in keys}

    def chime_economy(snapshot):
        s = snapshot['state']
        return {
            'buttons': s['buttons'], 'earnedToday': s['earnedToday'],
            'cares': s['cares'], 'wishes': s['wishes'],
            'mastery': s['activities']['mastery'],
            'completed': s['activities']['completed'],
            'lastReward': s['activities']['lastReward'],
            'bonds': {d['id']: d['bond'] for d in s['dolls']},
            'restoration': s['restoration'],
        }

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
        enter_game(page)
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

        # The original six tea checks above stay intact. A fresh story has no
        # carried thread, so this double scene tap opens standard physical sewing.
        page.locator('[data-room="studio"]').click()
        ready()
        for _ in range(2):
            point = next(p for p in page.evaluate('window.dollhouse.objects()') if p['key'] == 'prop:sewing-machine')
            assert page.evaluate('p=>document.elementFromPoint(p.x,p.y)?.id==="world"', point), 'Scene sewing machine is covered'
            page.mouse.click(point['x'], point['y'])
            ready()
        stitch_ready(page)
        assert stitch_status(page)['mode'] == 'ritual', 'Fresh empty-handed machine opens the standard sewing ritual'

        other_tab = context.new_page()
        other_tab.goto('about:blank')
        foreground()
        ready()
        stitch_ready(page)
        capture('03-foreground-cloth')
        needle_drag = NeedleDrag(page).down()
        first_vertex = stitch_status(page)['sections'][0][1]
        needle_drag.move_to(first_vertex[0], first_vertex[1])
        page.wait_for_function('''()=>{
            const s=window.dollhouse.stitch();
            return s?.pressed&&s.section===0&&s.distance>.03&&!s.loose&&s.travel>0
                &&Math.hypot(s.target.x-s.needle.x,s.target.y-s.needle.y)>.02;
        }''', timeout=60000, polling=100)
        stitch_before = observe('stitch-before-hidden')
        check('the foreground game sews actual partial coverage with a real held needle before tab loss',
              not stitch_before['visibility']['hidden'] and stitch_before['visibility']['focus']
              and not stitch_before['state']['paused'] and stitch_before['stitch']['pressed']
              and stitch_before['stitch']['section'] == 0 and stitch_before['stitch']['distance'] > .03
              and stitch_before['stitch']['travel'] > 0 and not stitch_before['stitch']['loose'])

        other_tab.bring_to_front()
        page.wait_for_function('document.hidden', timeout=20000, polling=100)
        page.wait_for_function('''()=>{
            const g=window.dollhouse,s=g.stitch();
            return g.state().paused&&!s.pressed&&s.capture===null
                &&Math.hypot(s.target.x-s.needle.x,s.target.y-s.needle.y)<1e-9;
        }''', timeout=20000, polling=100)
        stitch_hidden = observe('stitch-hidden')
        check('switching to another real tab hides and pauses the held sewing page',
              stitch_hidden['visibility']['hidden'] and stitch_hidden['visibility']['state'] == 'hidden'
              and stitch_hidden['state']['paused'])
        check('genuine sewing tab loss releases the needle and clears its capture and residual pursuit',
              not stitch_hidden['stitch']['pressed'] and stitch_hidden['stitch']['capture'] is None
              and stitch_hidden['stitch']['target'] == stitch_hidden['stitch']['needle'])
        # Only read-only diagnostics during genuine hidden time; no screenshots,
        # visibility events, fake clocks, input release or game-state writes.
        page.wait_for_timeout(350)
        stitch_hidden_still = observe('stitch-hidden-still')
        frozen_keys = ('needle', 'target', 'section', 'distance', 'travel', 'alignmentTravel', 'repairs', 'loose')
        check('the genuinely hidden needle stays fixed without adding coverage or stitch waste',
              stitch_hidden_still['visibility']['hidden'] and stitch_hidden_still['state']['paused']
              and all(stitch_hidden_still['stitch'][key] == stitch_hidden['stitch'][key] for key in frozen_keys))

        other_tab.close()
        other_tab = None
        foreground()
        stitch_ready(page)
        page.wait_for_timeout(350)
        stitch_restored = observe('stitch-restored')
        check('returning never resumes held sewing or target pursuit before manual mouse release',
              not stitch_restored['visibility']['hidden'] and stitch_restored['visibility']['focus']
              and not stitch_restored['state']['paused'] and not stitch_restored['stitch']['pressed']
              and stitch_restored['stitch']['capture'] is None
              and all(stitch_restored['stitch'][key] == stitch_hidden['stitch'][key] for key in frozen_keys))
        # Release the still-owned OS mouse only after the independent return check.
        needle_drag.release()
        capture('04-restored-cloth')
        page.locator('[data-stitch-action="exit"]').click()
        page.wait_for_function('window.dollhouse.stitch()===null')
        ready()
        check('genuine held-needle visibility journey has no JavaScript or console errors', not errors)

        # Keep both earlier visibility journeys intact. This independent
        # permanent scene target opens the instrument at every story stage.
        page.locator('[data-room="bedroom"]').click()
        ready()
        for _ in range(2):
            point = next(p for p in page.evaluate('window.dollhouse.objects()')
                         if p['key'] == 'prop:moon-mobile')
            assert page.evaluate('p=>document.elementFromPoint(p.x,p.y)?.id==="world"', point), 'Scene moon mobile is covered'
            page.mouse.click(point['x'], point['y'])
            ready()
        page.wait_for_function('window.dollhouse.chimes()?.phase==="echo"', timeout=90000, polling=100)
        chime_ready()

        other_tab = context.new_page()
        other_tab.goto('about:blank')
        foreground()
        ready()
        chime_ready()
        note = page.evaluate('window.dollhouse.chimes().pattern.at(-1)')
        point = next(p for p in page.evaluate('window.dollhouse.chimeObjects()')
                     if p['key'] == note)
        span = page.evaluate('window.dollhouse.chimePullSpan()')
        assert page.evaluate('''p=>Number.isFinite(p.span)&&p.span>0
            &&Number.isFinite(p.x)&&Number.isFinite(p.y)
            &&document.elementFromPoint(p.x,p.y)?.id==="world"
            &&document.elementFromPoint(p.x,p.y+p.span*.7)?.id==="world"''',
            {'x': point['x'], 'y': point['y'], 'span': span}), 'The real charm and its pull must stay reachable'
        page.mouse.move(point['x'], point['y'])
        page.mouse.down()
        chime_mouse_held = True
        page.mouse.move(point['x'], point['y'] + span * .7, steps=8)
        page.wait_for_function('note=>{const a=window.dollhouse.chimes();return a?.held===note&&a.pull>=.65}',
                               arg=note, timeout=20000, polling=100)
        chime_ready()
        capture('05-held-chime')
        chime_before = observe('chime-before-hidden')
        check('the foreground mobile has a genuinely pulled charm before tab loss',
              not chime_before['visibility']['hidden'] and chime_before['visibility']['focus']
              and not chime_before['state']['paused']
              and chime_before['chimes']['phase'] == 'echo'
              and chime_before['chimes']['held'] == note
              and .65 <= chime_before['chimes']['pull'] <= .75
              and chime_before['visual']['chimes']['held'] == note
              and abs(chime_before['visual']['chimes']['pull'] - chime_before['chimes']['pull']) < 1e-6)

        other_tab.bring_to_front()
        page.wait_for_function('document.hidden', timeout=20000, polling=100)
        page.wait_for_function('''()=>{
            const g=window.dollhouse,a=g.chimes();
            return g.state().paused&&a?.held===null&&a.pull===0;
        }''', timeout=20000, polling=100)
        chime_hidden = observe('chime-hidden')
        check('a genuine hidden tab cancels the pulled charm without sounding or earning a note',
              chime_hidden['visibility']['hidden'] and chime_hidden['visibility']['state'] == 'hidden'
              and chime_hidden['state']['paused']
              and chime_hidden['chimes']['held'] is None and chime_hidden['chimes']['pull'] == 0
              and chime_music(chime_hidden) == chime_music(chime_before)
              and chime_economy(chime_hidden) == chime_economy(chime_before))
        # Read-only observations only while hidden. The OS mouse remains down,
        # so a synthesized release cannot make this cancellation assertion pass.
        page.wait_for_timeout(350)
        chime_hidden_still = observe('chime-hidden-still')
        check('the hidden instrument and its simulation time stay fixed without a note or reward',
              chime_hidden_still['visibility']['hidden'] and chime_hidden_still['state']['paused']
              and chime_hidden_still['state']['elapsed'] == chime_hidden['state']['elapsed']
              and chime_hidden_still['chimes'] == chime_hidden['chimes']
              and chime_economy(chime_hidden_still) == chime_economy(chime_before))

        other_tab.close()
        other_tab = None
        foreground()
        chime_ready()
        page.wait_for_timeout(350)
        chime_restored = observe('chime-restored')
        check('returning never restores the old chime pull before the OS mouse is released',
              not chime_restored['visibility']['hidden'] and chime_restored['visibility']['focus']
              and not chime_restored['state']['paused']
              and chime_restored['chimes']['held'] is None and chime_restored['chimes']['pull'] == 0
              and chime_music(chime_restored) == chime_music(chime_before)
              and chime_economy(chime_restored) == chime_economy(chime_before)
              and chime_restored['visual']['chimes']['held'] is None
              and chime_restored['visual']['chimes']['pull'] == 0)
        page.mouse.up()
        chime_mouse_held = False
        chime_ready()
        chime_released = observe('chime-after-mouseup')
        check('releasing the canceled OS mouse cannot play a delayed note or award mastery',
              chime_released['chimes']['held'] is None and chime_released['chimes']['pull'] == 0
              and chime_music(chime_released) == chime_music(chime_before)
              and chime_economy(chime_released) == chime_economy(chime_before))
        capture('06-restored-chimes')
        page.locator('.chime-exit').click()
        page.wait_for_function('window.dollhouse.chimes()===null', timeout=20000, polling=100)
        ready()
        chime_exited = observe('chime-after-exit')
        check('leaving the canceled instrument restores room controls without a reward',
              chime_exited['state']['activities']['active'] is None
              and not chime_exited['visual']['chimeActive']
              and not page.locator('.chime-playfield').is_visible()
              and page.locator('.room-views').is_visible()
              and page.evaluate('document.activeElement.id==="world"')
              and chime_economy(chime_exited) == chime_economy(chime_before))
        check('genuine held-chime visibility journey has no JavaScript or console errors', not errors)

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
        if needle_drag:
            try:
                needle_drag.release()
            except Exception:
                pass
        if chime_mouse_held and page and not page.is_closed():
            try:
                page.mouse.up()
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
