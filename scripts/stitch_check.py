"""Physical sewing acceptance through actual scene, pointer and keyboard input.

STITCH_SCENARIO selects desktop, phone or progression; all runs fresh contexts.
STITCH_HEADED=1 uses ordinary Chromium under a display, with Playwright 1.55.
The shared gestures read rendered anchors and authored contours, then send real
input. No helper writes game state, advances clocks or submits accepted work.
Genuine hidden-tab visibility remains the separate visibility_check.py fixture.
"""
import json
import math
import os
import subprocess
import time
import traceback
import urllib.request
from pathlib import Path

from playwright.sync_api import sync_playwright
from stitch_gestures import (
    NeedleDrag, finish_stitch, stitch_ready, stitch_status, tap_stitch,
    trace_stitch,
)

ROOT = Path(__file__).resolve().parents[1]
SMALL = {'width': 320, 'height': 568}
PHONE = {'width': 390, 'height': 844}
DESKTOP = {'width': 1280, 'height': 900}


def measured_work(stitch, include_target=True):
    keys = ['phase', 'section', 'distance', 'needle', 'loose', 'travel',
            'alignmentTravel', 'repairs', 'capture']
    if include_target:
        keys += ['target', 'pressed']
    return {key: stitch[key] for key in keys}


def economy_of(state):
    return {key: state[key] for key in ['buttons', 'cares', 'earnedToday', 'wishes']} | {
        'mastery': state['activities']['mastery'],
        'completed': state['activities']['completed'],
        'lastReward': state['activities']['lastReward'],
        'bonds': {d['id']: d['bond'] for d in state['dolls']},
        'restoration': state['restoration'],
    }


def run(scenario):
    assert scenario in ('desktop', 'phone', 'progression')
    out = ROOT / 'artifacts' / 'stitch' / scenario
    out.mkdir(parents=True, exist_ok=True)
    base = os.environ.get('PLAY_URL', 'http://127.0.0.1:4195')
    checks, errors, waits = [], [], []
    outside_stats = working_high_stats = working_stats = working_visual = None
    server = server_log = browser = context = runtime = page = None

    def check(name, condition):
        checks.append({'name': name, 'passed': bool(condition)})
        print(('PASS ' if condition else 'FAIL ') + name, flush=True)
        assert condition, name

    def state():
        return page.evaluate('window.dollhouse.state()')

    def economy():
        return economy_of(state())

    def progress():
        story = state()['story']
        return sum([3, 4, 4][:story['chapter']]) + story['step']

    def ready():
        page.wait_for_function('window.dollhouse && !document.querySelector("#loading")',
                               timeout=60000, polling=100)
        page.wait_for_function('!window.dollhouse.visual().cameraMoving',
                               timeout=60000, polling=100)

    def observe():
        return page.evaluate('''()=>{
            const g=window.dollhouse;
            return {state:g?.state?.(),stitch:g?.stitch?.(),visual:g?.visual?.(),
                targets:g?.stitchObjects?.(),objects:g?.objects?.(),
                visibility:{state:document.visibilityState,focus:document.hasFocus()},
                focus:{id:document.activeElement?.id,tag:document.activeElement?.tagName},
                viewport:{width:innerWidth,height:innerHeight}};
        }''')

    def resize(viewport):
        # A new CSS viewport precedes ResizeObserver/camera application. Wait for
        # actual animation frames before reading poses or starting a new grab.
        page.set_viewport_size(viewport)
        page.wait_for_function('''size=>innerWidth===size.width&&innerHeight===size.height&&
            new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve(true))))''',
            arg=viewport, timeout=60000, polling=100)
        ready()

    def capture(name, held=False):
        previous = page.viewport_size
        if scenario == 'desktop' and not held:
            resize(DESKTOP)
        if held:
            assert scenario != 'desktop' or page.viewport_size == DESKTOP, \
                'Held desktop evidence requires its real viewport before grabbing'
        ready()
        if stitch_status(page):
            stitch_ready(page)
        if not held:
            page.mouse.move(5, 5)
        before = observe()
        try:
            page.screenshot(path=str(out / (name + '.png')), timeout=60000)
            (out / (name + '.json')).write_text(json.dumps({
                'beforeCapture': before, 'afterCapture': observe(),
                'lastGrab': getattr(page, '_stitch_grab_observation', None),
            }, indent=2))
        finally:
            if scenario == 'desktop' and not held and previous != page.viewport_size:
                resize(previous)

    def panel(name):
        target = page.locator(f'[data-action="panel-{name}"]')
        if not target.is_visible():
            page.locator('[data-action="toggle-tools"]').click()
        target.click()

    def configure(arabic=False):
        panel('settings')
        page.locator('[data-field="quality"]').select_option('low')
        if arabic:
            page.locator('[data-field="locale"]').select_option('ar')
            page.locator('[data-field="motion"]').check()
        page.locator('#sheet [data-action="close"]').click()
        page.wait_for_function('window.dollhouse.visual().quality==="low"',
                               timeout=60000, polling=100)
        if arabic:
            page.wait_for_function('document.documentElement.dir==="rtl" && window.dollhouse.state().settings.reducedMotion',
                                   timeout=60000, polling=100)

    def room(name):
        page.locator(f'[data-room="{name}"]').click()
        ready()

    def object_point(key):
        point = next(p for p in page.evaluate('window.dollhouse.objects()')
                     if p['key'] == key)
        check('scene target is physically reachable: ' + key,
              page.evaluate('p=>document.elementFromPoint(p.x,p.y)?.id==="world"', point))
        return point

    def touch_object(key, twice=False, touch=False):
        point = object_point(key)
        if touch:
            page.touchscreen.tap(point['x'], point['y'])
        else:
            page.mouse.click(point['x'], point['y'])
        ready()
        if twice:
            point = object_point(key)
            if touch:
                page.touchscreen.tap(point['x'], point['y'])
            else:
                page.mouse.click(point['x'], point['y'])
            ready()

    def carry_to(key, touch=False):
        destination = object_point(key)
        box = page.locator('.held-item').bounding_box()
        assert box, 'A real carried story item must be visible before dragging'
        x, y = box['x'] + box['width'] / 2, box['y'] + box['height'] / 2
        if touch:
            session = page.context.new_cdp_session(page)
            try:
                session.send('Input.dispatchTouchEvent', {'type': 'touchStart',
                    'touchPoints': [{'x': x, 'y': y, 'id': 1}]})
                for i in range(1, 13):
                    session.send('Input.dispatchTouchEvent', {'type': 'touchMove',
                        'touchPoints': [{'x': x + (destination['x'] - x) * i / 12,
                                         'y': y + (destination['y'] - y) * i / 12, 'id': 1}]})
                session.send('Input.dispatchTouchEvent', {'type': 'touchEnd', 'touchPoints': []})
            finally:
                session.detach()
        else:
            page.mouse.move(x, y)
            page.mouse.down()
            try:
                page.mouse.move(destination['x'], destination['y'], steps=12)
            finally:
                page.mouse.up()
        ready()

    def enter(touch=False):
        room('studio')
        touch_object('prop:sewing-machine', twice=True, touch=touch)
        stitch_ready(page)
        check('machine entry focuses the canvas and opens the physical sewing cutaway',
              stitch_status(page)['mode'] == 'ritual' and
              page.evaluate('document.activeElement.id==="world" && window.dollhouse.visual().workCeilingVisible===false'))

    def exit_stitch():
        page.locator('[data-stitch-action="exit"]').click()
        page.wait_for_function('window.dollhouse.stitch()===null',
                               timeout=20000, polling=100)
        ready()
        check('leaving the needle restores the actual studio ceiling',
              page.evaluate('window.dollhouse.visual().workCeilingVisible===true'))

    def wait_simulation(label, predicate, arg=None, timeout=180000):
        # Read-only wall/simulation evidence. The production clock and its frame
        # cap remain unchanged, including the 20-second eligibility requirement.
        started, before = time.monotonic(), state()
        result = {'label': label, 'viewport': page.viewport_size,
                  'startElapsed': before['elapsed'], 'startDayTime': before['dayTime'],
                  'startPhase': (stitch_status(page) or {}).get('phase')}
        try:
            page.wait_for_function(predicate, arg=arg, timeout=timeout, polling=100)
            result['passed'] = True
        finally:
            after = state()
            result.update({'wallSeconds': time.monotonic() - started,
                           'simulationSeconds': after['elapsed'] - before['elapsed'],
                           'endElapsed': after['elapsed'], 'endDayTime': after['dayTime'],
                           'visibility': page.evaluate('({state:document.visibilityState,focus:document.hasFocus()})')})
            waits.append(result)
            (out / 'waits.json').write_text(json.dumps(waits, indent=2))
            print('WAIT ' + json.dumps(result), flush=True)

    def advance_observation(label, seconds=.25):
        wait_simulation(label, 't=>window.dollhouse.state().elapsed>=t',
                        state()['elapsed'] + seconds, timeout=60000)

    def cooldown():
        wait_simulation('reward cooldown', 't=>window.dollhouse.state().elapsed>=t+20',
                        state()['activities']['lastReward']['stitch'])

    def new_earned_day():
        wait_simulation('earned day', 'window.dollhouse.state().dayTime>=60',
                        timeout=300000)
        old_day = state()['day']
        if stitch_status(page):
            exit_stitch()
        if state()['clock'] < 120:
            page.locator('[data-action="light"]').click()
        page.locator('[data-action="light"]').click()
        check('real earned time and the light control refresh the sewing cap',
              state()['day'] == old_day + 1 and
              state()['activities']['completed']['stitch'] == 0)

    def heading_fit(label):
        check(label + ' heading and status fit without covering sound or pause',
              page.locator('.stitch-heading').evaluate('''e=>{
                const b=e.getBoundingClientRect();
                return b.left>=0&&b.right<=innerWidth&&b.top>=0&&b.bottom<=innerHeight&&
                    [...document.querySelectorAll(".dock button[data-action=sound],.dock button[data-action=pause]")]
                    .every(c=>{const r=c.getBoundingClientRect();return b.right<=r.left||b.left>=r.right||b.bottom<=r.top||b.top>=r.bottom});
              }'''))
        check(label + ' score and work strip wrap inside their visible surfaces',
              page.locator('.stitch-progress,.stitch-work-strip,.stitch-work-copy').evaluate_all('''els=>
                els.every(e=>e.scrollWidth<=e.clientWidth+1&&(()=>{
                    const b=e.getBoundingClientRect();return b.left>=0&&b.right<=innerWidth&&b.top>=0&&b.bottom<=innerHeight;
                })())'''))
        check(label + ' heading has a visible background',
              page.locator('.stitch-heading').evaluate('''e=>{
                const bg=getComputedStyle(e).backgroundColor;
                return bg!=="transparent"&&bg!=="rgba(0, 0, 0, 0)";
              }'''))

    def targets_fit(label):
        stitch_ready(page)
        geometry = page.evaluate('''()=>{
            const g=window.dollhouse,s=g.stitch(),v=g.visual().stitch,targets=g.stitchObjects();
            const needle=targets.find(p=>p.key==="needle"),tip=targets.find(p=>p.key==="tip");
            const p=(x,y,h=0)=>g.projectStitch(x/.46,y/.46,h);
            const a=p(0,0),b=p(1,0),scale=Math.abs(b.x-a.x);
            const f=v.finish,c=f.center,near=p(c[0],c[2]-f.size[1]/2,c[1]),far=p(c[0],c[2]+f.size[1]/2,c[1]);
            const surfaces=[...document.querySelectorAll(".stitch-heading,.stitch-work-strip")]
                .filter(e=>e.getClientRects().length).map(e=>{
                    const b=e.getBoundingClientRect();
                    return {name:e.className,left:b.left,right:b.right,top:b.top,bottom:b.bottom};
                });
            const clearances=targets.filter(p=>p.key!=="tip").map(p=>{
                const b={left:p.x-22,right:p.x+22,top:p.y-22,bottom:p.y+22};
                return {key:p.key,bounds:b,overlaps:surfaces.filter(r=>
                    b.left<r.right&&b.right>r.left&&b.top<r.bottom&&b.bottom>r.top).map(r=>r.name)};
            });
            return {targets:targets.filter(p=>p.key!=="tip"),surfaces,clearances,
                complete:s.completedSections===s.sections.length,
                gripWidth:.35*scale,spoolWidth:v.spool.diameter*scale,
                clothWidth:f.size[0]*scale,clothDepth:Math.abs(near.y-far.y),
                fingerClearance:tip.y-needle.y};
        }''')
        # Python-side evidence only: these are observed DOM/camera rectangles.
        page._stitch_target_clearance = {'label': label, **geometry}
        expected = {'needle', 'spool', 'cloth'} if geometry['complete'] else {'needle', 'spool'}
        check(label + ' exposes only visible physical needle, spool and available cloth',
              {p['key'] for p in geometry['targets']} == expected)
        check(label + ' physical targets have 44px canvas clearance and receive input',
              all(page.evaluate('''p=>p.x>=22&&p.x<=innerWidth-22&&p.y>=22&&p.y<=innerHeight-22&&
                  [[0,0],[-22,0],[22,0],[0,-22],[0,22]].every(([x,y])=>
                    document.elementFromPoint(p.x+x,p.y+y)?.id==="world")''', point)
                  for point in geometry['targets']))
        check(label + ' visible headings and work strips do not cover any 44px physical target',
              all(not target['overlaps'] for target in geometry['clearances']))
        check(label + ' rendered target dimensions and needle clearance meet the geometry contract',
              geometry['gripWidth'] >= 44 and geometry['spoolWidth'] >= 44 and
              geometry['clothWidth'] >= 44 and geometry['clothDepth'] >= 44 and
              geometry['fingerClearance'] >= 36)
        check(label + ' visible Exit, sound and pause controls are at least 44px and clickable',
              page.locator('[data-stitch-action]:visible,.dock button:visible').evaluate_all('''els=>
                els.length===3&&els.every(e=>{const b=e.getBoundingClientRect(),
                    hit=document.elementFromPoint(b.left+b.width/2,b.top+b.height/2);
                    return b.width>=44&&b.height>=44&&b.left>=0&&b.right<=innerWidth&&b.top>=0&&b.bottom<=innerHeight&&(hit===e||e.contains(hit));
                })'''))
        check(label + ' has no answer grid, automatic modal or toast overlay',
              not page.locator('.ritual-choice:visible,dialog[open],#toast:visible').count())
        heading_fit(label)

    def no_payout(label, before):
        after = state()
        check(label + ' preserves currency, care, mastery, caps, cooldowns and bonds',
              economy_of(after) == economy_of(before))
        check(label + ' does not raise resident comfort',
              all(d['comfort'] <= next(b for b in before['dolls'] if b['id'] == d['id'])['comfort'] + 1e-8
                  for d in after['dolls']))

    def reward(label, before, expected):
        after, result = state(), stitch_status(page)['result']
        mastery = before['activities']['mastery']['stitch']
        check(label + ' preserves the exact button reward and one earned mastery',
              after['buttons'] == before['buttons'] + expected and
              after['earnedToday'] == before['earnedToday'] + expected and
              after['activities']['mastery']['stitch'] == mastery + 1 and
              after['activities']['completed']['stitch'] == before['activities']['completed']['stitch'] + 1 and
              result['complete'] and not result['practice'])
        check(label + ' raises only Sami by the authored three bond points',
              all(d['bond'] == next(b for b in before['dolls'] if b['id'] == d['id'])['bond'] +
                  (3 if d['id'] == 'sami' else 0) for d in after['dolls']) and
              after['cares'] == before['cares'] and after['wishes'] == before['wishes'])

    try:
        if not os.environ.get('PLAY_URL'):
            server_log = (out / 'server.log').open('w')
            server = subprocess.Popen(['node', 'scripts/serve.mjs', 'dist'], cwd=ROOT,
                env={**os.environ, 'PORT': '4195'}, stdout=server_log, stderr=subprocess.STDOUT)
        for _ in range(100):
            try:
                with urllib.request.urlopen(base, timeout=1):
                    break
            except Exception:
                time.sleep(.1)
        else:
            raise RuntimeError('Sewing acceptance server did not become available')
        runtime = sync_playwright().start()
        options = {'headless': os.environ.get('STITCH_HEADED') != '1',
                   'args': ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--enable-webgl']}
        if os.environ.get('CHROMIUM_PATH'):
            options['executable_path'] = os.environ['CHROMIUM_PATH']
        browser = runtime.chromium.launch(**options)
        viewport = {'desktop': DESKTOP, 'phone': PHONE, 'progression': SMALL}[scenario]
        context = browser.new_context(viewport=viewport, has_touch=True)
        page = context.new_page()
        page.set_default_timeout(20000)
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.on('console', lambda message: errors.append(message.text) if message.type == 'error' else None)
        page.goto(base + '/?debug=1')
        ready()
        check(scenario + ' begins with fresh sewing records, mastery and story progress',
              state()['activities']['mastery']['stitch'] == 0 and
              state()['activities']['stitchRecords'] == [None, None, None, None] and
              progress() == 0)

        if scenario == 'desktop':
            outside_stats = page.evaluate('window.dollhouse.stats()')
            enter()
            targets_fit('Desktop')
            initial = stitch_status(page)
            check('the machine starts an unstitched leaf at its visible first point',
                  initial['patternId'] == 'leaf' and initial['section'] == 0 and
                  initial['distance'] == 0 and initial['travel'] == 0 and
                  initial['needle'] == initial['target'] and not initial['pressed'])
            working_high_stats = page.evaluate('window.dollhouse.stats()')
            check('physical sewing adds no more than 5000 visible triangles and 24 draws',
                  working_high_stats['triangles'] - outside_stats['triangles'] < 5000 and
                  working_high_stats['calls'] - outside_stats['calls'] <= 24)
            capture('01-desktop-empty')
            # Preserve the original high-detail opening above. Longer motion uses
            # the actual player setting and a smaller released viewport, as in tea.
            exit_stitch()
            configure()
            enter()
            drag = NeedleDrag(page).down()
            try:
                untouched = measured_work(stitch_status(page))
                advance_observation('stationary held needle')
                check('holding the stationary grip adds no distance, score or coverage',
                      measured_work(stitch_status(page)) == untouched)
                section = stitch_status(page)['sections'][0]
                point = [section[0][i] + (section[1][i] - section[0][i]) * .55 for i in (0, 1)]
                partial = drag.to(*point)
                check('real two-dimensional pointer motion leaves a partial accepted seam',
                      partial['section'] == 0 and partial['distance'] > .2 and
                      partial['travel'] > .2 and len(partial['acceptedTrail']) > 1 and
                      partial['needle']['x'] != section[0][0] and partial['needle']['y'] != section[0][1])
                stitch_ready(page)
                check('actual needle contact and red thread follow accepted work',
                      page.evaluate('''()=>{const s=window.dollhouse.stitch(),v=window.dollhouse.visual().stitch;
                        return v.needle.pressed&&v.needle.tip[1]===0&&JSON.stringify(v.trail)===JSON.stringify(s.acceptedTrail)}'''))
                capture('02-desktop-mid-stitch', held=True)
            finally:
                drag.release()
            released = measured_work(stitch_status(page))
            advance_observation('released partial seam')
            check('release fixes the raw target at the actual needle and stops delayed stitching',
                  measured_work(stitch_status(page)) == released and
                  released['needle'] == released['target'] and not released['pressed'])
            resize(SMALL)
            trace_stitch(page, until_section=1)
            completed = stitch_status(page)
            check('following both real edges preserves the first complete leaf section',
                  completed['completedSections'] == 1 and completed['section'] == 1)
            drag = NeedleDrag(page).down()
            try:
                section = stitch_status(page)['sections'][1]
                point = [(section[0][i] + section[1][i]) / 2 for i in (0, 1)]
                drag.to(*point)
                drag.move_to(point[0], point[1] + .35)
                page.wait_for_function('window.dollhouse.stitch().loose',
                                       timeout=60000, polling=100)
            finally:
                drag.release()
            dirty = stitch_status(page)
            stitch_ready(page)
            check('leaving the corridor creates an actual loose loop without losing finished work',
                  dirty['loose'] and dirty['completedSections'] == 1 and
                  page.evaluate('window.dollhouse.visual().stitch.loose'))
            capture('03-desktop-loose-thread')
            tap_stitch(page, 'spool')
            repaired = stitch_status(page)
            check('the real spool repairs only the current section and retains cumulative waste',
                  repaired['section'] == 1 and repaired['distance'] == 0 and
                  not repaired['loose'] and repaired['repairs'] == dirty['repairs'] + 1 and
                  repaired['travel'] == dirty['travel'] and
                  repaired['alignmentTravel'] == dirty['alignmentTravel'] and
                  repaired['acceptedTrail'] == completed['acceptedTrail'] and
                  repaired['needle'] == {'x': section[0][0], 'y': section[0][1]})
            capture('04-desktop-repaired')

            # Give U a genuinely sewn current section to repair. Lifted keyboard
            # motion may overshoot while the renderer is busy; a real local repair
            # then returns to the authored start without assuming a tiny excursion.
            drag = NeedleDrag(page).down()
            try:
                section = stitch_status(page)['sections'][1]
                point = [(section[0][i] + section[1][i]) / 2 for i in (0, 1)]
                drag.to(*point)
            finally:
                drag.release()
            page.locator('#world').focus()
            hover_before = stitch_status(page)
            page.keyboard.down('ArrowLeft')
            try:
                page.wait_for_function('x=>window.dollhouse.stitch().needle.x<=x-.025',
                                       arg=hover_before['needle']['x'], timeout=60000, polling=20)
            finally:
                page.keyboard.up('ArrowLeft')
            hover = stitch_status(page)
            check('an unpressed arrow moves the lifted needle without sewing or resetting coverage',
                  hover['needle']['x'] < hover_before['needle']['x'] and
                  hover['distance'] == hover_before['distance'] and
                  hover['travel'] == hover_before['travel'] and not hover['pressed'] and
                  hover['target'] == hover['needle'])
            page.keyboard.press('u')
            repaired_hover = stitch_status(page)
            check('a genuine U repair restores the current start after any lifted excursion',
                  repaired_hover['section'] == 1 and repaired_hover['distance'] == 0 and
                  repaired_hover['needle'] == {'x': section[0][0], 'y': section[0][1]} and
                  repaired_hover['target'] == repaired_hover['needle'] and
                  repaired_hover['repairs'] == hover['repairs'] + 1 and
                  repaired_hover['travel'] == hover['travel'] and
                  repaired_hover['alignmentTravel'] == hover['alignmentTravel'] and
                  repaired_hover['acceptedTrail'] == completed['acceptedTrail'])
            page.keyboard.down('Space')
            page.keyboard.down('ArrowRight')
            page.keyboard.down('ArrowDown')
            try:
                page.wait_for_function('window.dollhouse.stitch().distance>=.16 || window.dollhouse.stitch().loose',
                                       timeout=60000, polling=20)
            finally:
                for key in ('ArrowDown', 'ArrowRight', 'Space'):
                    page.keyboard.up(key)
            keyboard_work = stitch_status(page)
            check('held arrows and Space physically stitch in two axes from the repaired front',
                  not keyboard_work['loose'] and keyboard_work['distance'] >= .16 and
                  keyboard_work['travel'] > repaired_hover['travel'] and
                  keyboard_work['needle']['x'] > repaired_hover['needle']['x'] and
                  keyboard_work['needle']['y'] > repaired_hover['needle']['y'] and
                  not keyboard_work['pressed'])
            advance_observation('keyboard release')
            check('keyup leaves no residual target or vertex pursuit',
                  measured_work(stitch_status(page)) == measured_work(keyboard_work))
            page.keyboard.press('u')
            keyboard_repair = stitch_status(page)
            check('U performs the same local repair without deleting completed thread or travel',
                  keyboard_repair['section'] == 1 and keyboard_repair['distance'] == 0 and
                  keyboard_repair['repairs'] == keyboard_work['repairs'] + 1 and
                  keyboard_repair['travel'] == keyboard_work['travel'] and
                  keyboard_repair['acceptedTrail'] == completed['acceptedTrail'])
            trace_stitch(page, until_section=2)
            before_ready = economy()
            drag = NeedleDrag(page).down()
            try:
                for point in stitch_status(page)['sections'][2][1:]:
                    drag.to(*point)
                final_held = stitch_status(page)
                check('completing the contour while held reveals cloth without finishing or paying',
                      final_held['completedSections'] == len(final_held['sections']) and
                      final_held['phase'] == 'sew' and final_held['pressed'] and
                      not final_held['ready'] and final_held['result'] is None and
                      economy() == before_ready)
                frozen = measured_work(final_held, include_target=False)
                drag.move_to(1, 1)
                advance_observation('held final contour freeze')
                check('extra held motion cannot add travel, score, mistakes or move the finished tip',
                      measured_work(stitch_status(page), include_target=False) == frozen and
                      stitch_status(page)['pressed'] and economy() == before_ready)
                page.keyboard.press('Enter')
                check('a held pointer cannot finish through a competing keyboard command',
                      stitch_status(page)['result'] is None and economy() == before_ready)
            finally:
                drag.release()
            page.wait_for_function('window.dollhouse.stitch().ready',
                                   timeout=20000, polling=100)
            capture('05-desktop-ready')
            before_reward = state()
            tap_stitch(page, 'cloth')
            page.wait_for_function('window.dollhouse.stitch().phase==="finished"',
                                   timeout=20000, polling=100)
            first = stitch_status(page)
            reward('first finished leaf', before_reward, 7)
            expected_score = math.floor(100 * first['alignmentTravel'] / first['travel'] *
                                        min(1, first['requiredLength'] / first['travel']) + .5)
            check('the finished score counts inaccurate travel and retained repair waste',
                  first['result']['score'] == expected_score and 0 <= expected_score < 100 and
                  first['best'] == expected_score and first['repairs'] >= 2)
            tap_stitch(page, 'needle')
            stitch_ready(page)
            check('the finished needle replays a fresh leaf while retaining the earned record',
                  stitch_status(page)['section'] == 0 and stitch_status(page)['travel'] == 0 and
                  stitch_status(page)['best'] == first['best'])
            practice_before = state()
            trace_stitch(page)
            check('the immediate replay reaches its finish before the genuine cooldown expires',
                  state()['elapsed'] - state()['activities']['lastReward']['stitch'] < 20)
            tap_stitch(page, 'cloth')
            page.wait_for_function('window.dollhouse.stitch().phase==="finished"',
                                   timeout=20000, polling=100)
            no_payout('clean cooldown practice', practice_before)
            check('clean practice improves the best without claiming a second reward',
                  stitch_status(page)['result']['practice'] and
                  stitch_status(page)['best'] > first['best'] and
                  stitch_status(page)['best'] == stitch_status(page)['result']['score'])
            resize(DESKTOP)
            stitch_ready(page)
            targets_fit('Finished desktop')
            capture('06-desktop-finished')
            terminal, terminal_economy = stitch_status(page), economy()
            page.locator('#world').focus()
            page.keyboard.down('Space')
            page.keyboard.down('ArrowRight')
            try:
                advance_observation('terminal keyboard input')
            finally:
                page.keyboard.up('ArrowRight')
                page.keyboard.up('Space')
            check('finished keyboard input cannot restitch or reward a terminal cloth',
                  measured_work(stitch_status(page)) == measured_work(terminal) and
                  stitch_status(page)['result'] == terminal['result'] and
                  economy() == terminal_economy)
            working_stats = page.evaluate('window.dollhouse.stats()')
            working_visual = page.evaluate('window.dollhouse.visual().stitch')
            records = state()['activities']['stitchRecords']
            tap_stitch(page, 'cloth')
            page.wait_for_function('window.dollhouse.stitch()===null',
                                   timeout=20000, polling=100)
            ready()
            check('the finished cloth returns to an interactive studio',
                  not page.locator('.stitch-playfield').is_visible() and
                  page.evaluate('!window.dollhouse.visual().stitchActive && window.dollhouse.visual().focusedRoom==="studio" && window.dollhouse.visual().workCeilingVisible===true'))
            page.reload(wait_until='domcontentloaded')
            ready()
            check('earned mastery and improved bests survive reload without an active needle',
                  state()['activities']['mastery']['stitch'] == 1 and
                  state()['activities']['stitchRecords'] == records and stitch_status(page) is None)

        elif scenario == 'phone':
            configure(arabic=True)
            enter(touch=True)
            targets_fit('390px Arabic')
            capture('07-arabic-phone-empty')
            phone_before = state()
            drag = NeedleDrag(page, touch=True).down()
            try:
                section = stitch_status(page)['sections'][0]
                point = [(section[0][i] + section[1][i]) / 2 for i in (0, 1)]
                drag.to(*point)
                owned = stitch_status(page)
                drag.session.send('Input.dispatchTouchEvent', {'type': 'touchStart',
                    'touchPoints': [{'x': drag.x, 'y': drag.y, 'id': 1},
                                    {'x': 20, 'y': 260, 'id': 2}]})
                drag.session.send('Input.dispatchTouchEvent', {'type': 'touchMove',
                    'touchPoints': [{'x': drag.x, 'y': drag.y, 'id': 1},
                                    {'x': 80, 'y': 310, 'id': 2}]})
                check('an extra touch cannot steal the actual needle or change its target',
                      stitch_status(page)['pressed'] and
                      stitch_status(page)['target'] == owned['target'])
                page.locator('.dock [data-action="pause"]').click()
                paused, elapsed = stitch_status(page), state()['elapsed']
                check('pausing a touch-owned needle releases input and fixes its target',
                      state()['paused'] and not paused['pressed'] and paused['capture'] is None and
                      paused['needle'] == paused['target'])
                page.wait_for_timeout(300)
                check('paused accepted work and simulation time stay frozen',
                      measured_work(stitch_status(page)) == measured_work(paused) and
                      state()['elapsed'] == elapsed)
            finally:
                drag.release(cancel=True)
            page.locator('.pause-overlay [data-action="pause"]').click()
            resumed = measured_work(stitch_status(page))
            advance_observation('phone pause resume')
            check('resuming never restores touch ownership or queued needle travel',
                  measured_work(stitch_status(page)) == resumed and not stitch_status(page)['pressed'])
            drag = NeedleDrag(page, touch=True).down()
            try:
                point = [section[0][i] + (section[1][i] - section[0][i]) * .75 for i in (0, 1)]
                drag.to(*point)
            finally:
                drag.release(cancel=True)
            cancelled = measured_work(stitch_status(page))
            advance_observation('genuine touchCancel')
            check('touchCancel retains the partial seam and prevents delayed stitching',
                  measured_work(stitch_status(page)) == cancelled and
                  not cancelled['pressed'] and cancelled['target'] == cancelled['needle'])
            capture('08-arabic-phone-mid-stitch')
            drag = NeedleDrag(page, touch=True).down()
            try:
                drag.move_to(*section[1])
                resize({'width': 667, 'height': 320})
                resized = measured_work(stitch_status(page))
                check('an actual viewport resize cancels capture and fixes the needle target',
                      not resized['pressed'] and resized['capture'] is None and
                      resized['needle'] == resized['target'] and resized['distance'] >= cancelled['distance'])
                advance_observation('phone resize release')
                check('the new viewport has no stale touch pursuit',
                      measured_work(stitch_status(page)) == resized)
            finally:
                drag.release(cancel=True)
            targets_fit('667x320 Arabic')
            resize(PHONE)
            drag = NeedleDrag(page, touch=True).down()
            try:
                page.keyboard.press('Escape')
            finally:
                drag.release(cancel=True)
            page.wait_for_function('window.dollhouse.stitch()===null',
                                   timeout=20000, polling=100)
            ready()
            check('Escape exits a touch-owned needle and restores the house controls',
                  not page.locator('.stitch-playfield').is_visible() and
                  page.locator('.room-views').is_visible())
            no_payout('cancelled phone ritual', phone_before)

            room('kitchen')
            touch_object('prop:mint-tin', twice=True, touch=True)
            check('real story touches discover and carry the red thread',
                  progress() == 1 and page.locator('[data-held-item="red-thread"]').is_visible())
            mend_before = state()
            room('studio')
            carry_to('prop:sewing-machine', touch=True)
            stitch_ready(page)
            check('dropping thread starts the two-section bear seam without spending inventory',
                  progress() == 1 and stitch_status(page)['mode'] == 'mend' and
                  stitch_status(page)['patternId'] == 'bear-seam' and
                  len(stitch_status(page)['sections']) == 2)
            trace_stitch(page, touch=True, until_section=1)
            page.keyboard.press('Escape')
            page.wait_for_function('window.dollhouse.stitch()===null',
                                   timeout=20000, polling=100)
            ready()
            check('cancelling a partially mended bear restores the same red thread',
                  progress() == 1 and page.locator('[data-held-item="red-thread"]').is_visible())
            carry_to('prop:sewing-machine', touch=True)
            stitch_ready(page)
            resize(SMALL)
            targets_fit('320px bear seam')
            trace_stitch(page, touch=True, until_section=1)
            capture('09-small-phone-bear-seam')
            page.reload(wait_until='domcontentloaded')
            ready()
            check('reload discards an unfinished seam and preserves story thread and ritual records',
                  progress() == 1 and stitch_status(page) is None and
                  page.locator('[data-held-item="red-thread"]').is_visible() and
                  state()['activities']['stitchRecords'] == mend_before['activities']['stitchRecords'])
            room('studio')
            carry_to('prop:sewing-machine', touch=True)
            stitch_ready(page)
            finished = finish_stitch(page, touch=True, leave=False)
            no_payout('explicitly finished story repair', mend_before)
            check('finishing the bear advances exactly once without a ritual best or mastery',
                  progress() == 2 and finished['mode'] == 'mend' and
                  finished['result']['storyResult']['held'] == 'mended-bear' and
                  finished['result']['reward'] == 0 and
                  state()['activities']['stitchRecords'] == mend_before['activities']['stitchRecords'])
            targets_fit('320px finished bear')
            capture('10-small-phone-bear-finished')
            tap_stitch(page, 'cloth', touch=True)
            page.wait_for_function('window.dollhouse.stitch()===null',
                                   timeout=20000, polling=100)
            ready()
            page.reload(wait_until='domcontentloaded')
            ready()
            check('reload after finishing restores the carried bear rather than reopening a needle',
                  progress() == 2 and stitch_status(page) is None and
                  page.locator('[data-held-item="mended-bear"]').is_visible())
            room('bedroom')
            carry_to('prop:moon-bed', touch=True)
            page.wait_for_function('window.dollhouse.visual().story.bearVisible',
                                   timeout=60000, polling=100)
            check('placing the repaired bear pays its original chapter reward once',
                  progress() == 3 and state()['buttons'] == mend_before['buttons'] + 12 and
                  state()['activities']['mastery']['stitch'] == 0 and
                  state()['activities']['stitchRecords'] == [None, None, None, None])
            page.reload(wait_until='domcontentloaded')
            ready()
            resize(PHONE)
            room('bedroom')
            page.wait_for_function('window.dollhouse.visual().story.bearVisible',
                                   timeout=60000, polling=100)
            check('the placed bear tableau persists after a real reload',
                  progress() == 3 and not page.locator('.held-item').count() and
                  page.evaluate('window.dollhouse.visual().story.bearVisible'))
            capture('11-bear-patch')

            # Earning the bear keeps its bed replay and the separate physical
            # mobile available. No chapter/mastery is seeded for this entry.
            before_mobile = economy()
            touch_object('prop:moon-mobile', twice=True, touch=True)
            page.wait_for_function('''()=>{
                const g=window.dollhouse,s=g.chimes(),v=g.visual();
                return s&&v.chimeActive&&v.chimes.active&&v.chimes.phase===s.phase&&!v.cameraMoving&&g.chimeObjects().length===5;
            }''', timeout=60000, polling=100)
            check('the earned bear does not block direct mobile entry on an Arabic phone',
                  progress() == 3 and state()['activities']['active']['id'] == 'lullaby' and
                  not page.locator('dialog[open],[data-choice]').count())
            capture('11b-earned-moon-instrument')
            page.locator('.chime-exit').click()
            page.wait_for_function('window.dollhouse.chimes()===null', timeout=20000, polling=100)
            ready()
            check('leaving the post-bear instrument preserves all earned progress',
                  economy() == before_mobile and progress() == 3)
            last_bear_play = state()['story']['lastActionAt']
            touch_object('prop:moon-bed', twice=True, touch=True)
            check('the separate bed still replays its earned bear without opening a ritual',
                  state()['activities']['active'] is None and economy() == before_mobile and
                  state()['story']['lastAction'] == 'prop:moon-bed' and
                  state()['story']['lastActionAt'] > last_bear_play and
                  page.evaluate('window.dollhouse.visual().story.bearVisible'))

            if state()['clock'] < 120:
                page.locator('[data-action="light"]').click()
            page.wait_for_function('window.dollhouse.visual().nightMix>.99',
                                   timeout=60000, polling=100)
            resize({'width': 667, 'height': 375})
            enter(touch=True)
            targets_fit('667x375 Arabic night')
            capture('12-arabic-landscape-night')
            resize(SMALL)
            stitch_ready(page)
            night_before = state()
            finish_stitch(page, touch=True, leave=False)
            reward('first night ritual after the story repair', night_before, 7)
            resize(PHONE)
            stitch_ready(page)
            targets_fit('390px Arabic night finished')
            capture('13-phone-night-finished')
            working_stats = page.evaluate('window.dollhouse.stats()')
            working_visual = page.evaluate('window.dollhouse.visual().stitch')

        elif scenario == 'progression':
            configure(arabic=True)
            enter()
            first_before = state()
            finish_stitch(page, leave=False)
            reward('first earned leaf', first_before, 7)
            cooldown()
            tap_stitch(page, 'needle', touch=True)
            stitch_ready(page)
            second_before = state()
            finish_stitch(page, touch=True, leave=False)
            reward('second earned leaf with its level bonus', second_before, 17)
            check('a level-up stores its score in the played leaf slot',
                  state()['activities']['stitchRecords'][0] is not None and
                  state()['activities']['stitchRecords'][1:] == [None, None, None])
            capped_day = state()['day']
            cooldown()
            tap_stitch(page, 'needle')
            stitch_ready(page)
            check('two genuine masteries unlock the four-section diamond',
                  stitch_status(page)['level'] == 1 and stitch_status(page)['patternId'] == 'diamond' and
                  len(stitch_status(page)['sections']) == 4)
            targets_fit('320px diamond')
            capture('14-small-phone-diamond')
            capped_before = state()
            finish_stitch(page, touch=True, leave=False)
            no_payout('daily-capped diamond practice after cooldown', capped_before)
            check('the two-per-day cap permits a better record without a third mastery',
                  state()['day'] == capped_day and stitch_status(page)['result']['practice'] and
                  state()['activities']['mastery']['stitch'] == 2 and
                  state()['activities']['stitchRecords'][1] is not None)
            records = state()['activities']['stitchRecords']
            new_earned_day()
            page.reload(wait_until='domcontentloaded')
            ready()
            check('both played difficulty records and earned mastery survive a new day and reload',
                  state()['activities']['stitchRecords'] == records and
                  state()['activities']['mastery']['stitch'] == 2 and stitch_status(page) is None)
            enter()
            while state()['activities']['mastery']['stitch'] < 5:
                if state()['activities']['completed']['stitch'] >= 2:
                    new_earned_day()
                    enter()
                cooldown()
                if stitch_status(page)['phase'] == 'finished':
                    tap_stitch(page, 'needle', touch=True)
                    stitch_ready(page)
                before = state()
                finish_stitch(page, touch=True, leave=False)
                mastery = before['activities']['mastery']['stitch']
                reward(f'earned sewing {mastery + 1}', before, [7, 17, 9, 9, 34][mastery])
            check('five earned masteries unlock jasmine without pre-populating its record',
                  state()['activities']['mastery']['stitch'] == 5 and
                  state()['activities']['stitchRecords'][2] is None)
            cooldown()
            tap_stitch(page, 'needle', touch=True)
            stitch_ready(page)
            check('the real replay opens the five-section jasmine motif',
                  stitch_status(page)['level'] == 2 and stitch_status(page)['patternId'] == 'jasmine' and
                  len(stitch_status(page)['sections']) == 5)
            targets_fit('320px jasmine')
            capture('15-small-phone-jasmine')
            advanced_before = state()
            # Approach the first acute jasmine tip with a real .02-unit offset
            # toward its next edge. Paid vertex capture must visibly carry the
            # actual needle through the corner; exact pointer landing is optional.
            drag = NeedleDrag(page, touch=True).down()
            try:
                sections = stitch_status(page)['sections']
                drag.to(*sections[0][1])
                corner, outgoing = sections[0][-1], sections[1][1]
                dx, dy = outgoing[0] - corner[0], outgoing[1] - corner[1]
                size = math.hypot(dx, dy)
                near = [corner[0] + .02 * dx / size, corner[1] + .02 * dy / size]
                rounded = drag.to(*near)
                check('a real off-endpoint approach passes jasmine without a pixel-perfect corner',
                      rounded['completedSections'] == 1 and rounded['distance'] > 0 and
                      not rounded['loose'] and rounded['travel'] >= rounded['distance'])
            finally:
                drag.release()
            trace_stitch(page, touch=True)
            check('all five jasmine contours must be covered before explicit finishing',
                  stitch_status(page)['ready'] and stitch_status(page)['completedSections'] == 5 and
                  stitch_status(page)['result'] is None and
                  economy() == economy_of(advanced_before))
            resize(PHONE)
            stitch_ready(page)
            targets_fit('390px Arabic jasmine ready')
            capture('16-arabic-jasmine-ready')
            tap_stitch(page, 'cloth', touch=True)
            page.wait_for_function('window.dollhouse.stitch().phase==="finished"',
                                   timeout=20000, polling=100)
            reward('finished level-two jasmine', advanced_before, 11)
            check('jasmine saves its own score without changing either earlier difficulty best',
                  state()['activities']['stitchRecords'][:2] == advanced_before['activities']['stitchRecords'][:2] and
                  state()['activities']['stitchRecords'][2] == stitch_status(page)['result']['score'] and
                  state()['activities']['stitchRecords'][3] is None)
            capture('17-arabic-jasmine-finished')
            heading_fit('390px Arabic jasmine finished')
            working_stats = page.evaluate('window.dollhouse.stats()')
            working_visual = page.evaluate('window.dollhouse.visual().stitch')
            records = state()['activities']['stitchRecords']
            page.locator('#world').focus()
            page.keyboard.press('Enter')
            page.wait_for_function('window.dollhouse.stitch()===null',
                                   timeout=20000, polling=100)
            ready()
            check('finished Enter returns to the studio without opening a new sewing session',
                  not page.locator('.stitch-playfield').is_visible() and
                  state()['activities']['mastery']['stitch'] == 6)
            page.reload(wait_until='domcontentloaded')
            ready()
            check('all three genuinely played records survive reload with no active capture',
                  state()['activities']['stitchRecords'] == records and
                  all(record is not None for record in records[:3]) and
                  state()['activities']['mastery']['stitch'] == 6 and stitch_status(page) is None)

        (out / 'render-stats.json').write_text(json.dumps({
            'outside': outside_stats, 'workingHigh': working_high_stats,
            'working': working_stats, 'stitch': working_visual,
        }, indent=2))
        check(scenario + ' geometry sample observes a real active finished cloth',
              working_visual['active'] and working_visual['phase'] == 'finished' and
              working_visual['finishedClothVisible'])
        check(scenario + ' work view stays below the existing 400k triangle budget',
              working_stats['triangles'] < 400000)
        check(scenario + ' journey has no JavaScript or console errors', not errors)
    except Exception as error:
        # Always persist the failure and read-only observations BEFORE asking a
        # possibly unhealthy graphics process for a screenshot.
        failure = {'error': repr(error), 'traceback': traceback.format_exc(),
                   'scenario': scenario, 'checks': checks, 'errors': errors, 'waits': waits}
        if page and not page.is_closed():
            try:
                failure['observation'] = observe()
                failure['lastGrab'] = getattr(page, '_stitch_grab_observation', None)
                failure['targetClearance'] = getattr(page, '_stitch_target_clearance', None)
            except Exception as observation_error:
                failure['observationError'] = repr(observation_error)
        (out / 'failure-state.json').write_text(json.dumps(failure, indent=2))
        if page and not page.is_closed():
            try:
                page.screenshot(path=str(out / 'failure.png'), timeout=20000)
            except Exception:
                pass
        raise
    finally:
        (out / 'results.json').write_text(json.dumps({
            'scenario': scenario, 'checks': checks, 'errors': errors, 'waits': waits,
        }, indent=2))
        try:
            commit = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True)
            (out / 'source-commit.txt').write_text(commit)
        except Exception as error:
            (out / 'source-commit-error.txt').write_text(repr(error))
        if context:
            context.close()
        if browser:
            browser.close()
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
    selected = os.environ.get('STITCH_SCENARIO', 'all')
    if selected not in ('all', 'desktop', 'phone', 'progression'):
        raise ValueError('STITCH_SCENARIO must be desktop, phone, progression or all')
    for scenario in ('desktop', 'phone', 'progression') if selected == 'all' else (selected,):
        run(scenario)
