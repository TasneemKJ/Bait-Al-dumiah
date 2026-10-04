"""Physical tea acceptance, driven only by mouse, touch and keyboard events.

Helpers are importable by the legacy story/restoration journeys. Diagnostics are
read-only observations; no browser test submits a fill, score or simulation time.
TEA_SCENARIO selects desktop, phone or progression; all runs each in a fresh
browser context. TEA_HEADED=1 uses regular Chromium with a display.
Genuine visibility loss is checked separately by visibility_check.py.
"""
import json
import os
import subprocess
import time
import urllib.request
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]


def tea_status(page):
    return page.evaluate('window.dollhouse.tea()')


def tea_ready(page):
    # Replay creates a new simulation session before the next graphics frame.
    # An already-active table and existing pot point can still be its old pose.
    # Observe agreement with the actual current session before picking it.
    page.wait_for_function('''()=>{
        const game=window.dollhouse,s=game?.tea?.(),visual=game?.visual?.(),v=visual?.tea;
        if(!s||!v?.active||visual.cameraMoving||!v.pot||v.served!==(s.phase==="served"))return false;
        const close=(a,b)=>Number.isFinite(a)&&Math.abs(a-b)<1e-6;
        if(!close(v.pot.spout[0],s.aim*.45)||!close(v.pot.rotation,s.phase==="served"?0:-s.tilt*.75))return false;
        const offset=v.presentation?.offset;
        if(!Array.isArray(offset)||offset.length!==3||!offset.every(Number.isFinite))return false;
        if(v.cups.length!==s.cups.length||!s.cups.every(c=>{
            const rendered=v.cups.find(p=>p.id===c.id);
            return rendered?.visible&&close(rendered.x,c.x+offset[0])&&close(rendered.z,.14+offset[2])&&close(rendered.bandY,.024+Math.max(0,Math.min(1,c.target))*.19);
        }))return false;
        return game.teaObjects().some(p=>p.key==="pot");
    }''', timeout=60000)


def tea_point(page, key, reachable=True):
    point = next(p for p in page.evaluate('window.dollhouse.teaObjects()') if p['key'] == key)
    if reachable:
        assert page.evaluate('p=>p.x>0&&p.x<innerWidth&&p.y>0&&p.y<innerHeight&&document.elementFromPoint(p.x,p.y)?.id==="world"', point), 'Tea target is covered: ' + key
    return point


def tap_tea(page, key, touch=False):
    tea_ready(page)
    point = tea_point(page, key)
    if touch:
        page.touchscreen.tap(point['x'], point['y'])
    else:
        page.mouse.click(point['x'], point['y'])


class PotDrag:
    """Grab the actual pot, then move its observed spout over an actual cup."""
    def __init__(self, page, touch=False):
        self.page, self.touch, self.session = page, touch, None
        tea_ready(page)
        self.observation = page.evaluate('''()=>{
            const targets=window.dollhouse.teaObjects();
            return {pot:targets.find(p=>p.key==="pot"),spout:targets.find(p=>p.key==="spout"),
                targets,tea:window.dollhouse.tea(),visual:window.dollhouse.visual().tea,
                viewport:{width:innerWidth,height:innerHeight}};
        }''')
        self.start, self.spout = self.observation['pot'], self.observation['spout']
        assert page.evaluate('p=>p.x>0&&p.x<innerWidth&&p.y>0&&p.y<innerHeight&&document.elementFromPoint(p.x,p.y)?.id==="world"', self.start), 'Tea pot grab is covered'
        # Python-side evidence only; no property is written in the game page.
        page._tea_grab_observation = self.observation
        self.x, self.y = self.start['x'], self.start['y']
        self.held = False

    def down(self):
        if self.touch:
            self.session = self.page.context.new_cdp_session(self.page)
            self.session.send('Input.dispatchTouchEvent', {'type': 'touchStart', 'touchPoints': [{'x': self.x, 'y': self.y, 'id': 1}]})
        else:
            self.page.mouse.move(self.x, self.y)
            self.page.mouse.down()
        self.held = True
        return self

    def move(self, x, y):
        self.x, self.y = x, y
        if self.touch:
            self.session.send('Input.dispatchTouchEvent', {'type': 'touchMove', 'touchPoints': [{'x': x, 'y': y, 'id': 1}]})
        else:
            self.page.mouse.move(x, y, steps=4)

    def aim(self, cup, tilt=.64):
        # Delta aiming preserves the offset from the grabbed pot body to its
        # spout. Cup and spout x are projected from the same fixed work camera.
        point = tea_point(self.page, 'cup:' + str(cup['id']))
        self.move(self.start['x'] + point['x'] - self.spout['x'], self.start['y'] + 8 + tilt * 80)

    def release(self, cancel=False):
        if not self.held:
            return
        try:
            if self.touch:
                self.session.send('Input.dispatchTouchEvent', {'type': 'touchCancel' if cancel else 'touchEnd', 'touchPoints': []})
            else:
                self.page.mouse.up()
        finally:
            self.held = False
            if self.session:
                self.session.detach()
                self.session = None


def fill_tea_cup(page, cup_id, touch=False, keyboard=False, fill=None):
    cup = next(c for c in tea_status(page)['cups'] if c['id'] == cup_id)
    assert not cup['overfilled'], 'Overfilled cups require an explicit local repair'
    threshold = cup['target'] - .025 if fill is None else fill
    if cup['fill'] >= threshold:
        return
    if keyboard:
        page.locator('#world').focus()
        target = cup['x'] / .45
        aim = tea_status(page)['aim']
        if abs(aim - target) > .035:
            key = 'ArrowRight' if aim < target else 'ArrowLeft'
            page.keyboard.down(key)
            try:
                page.wait_for_function('a=>{const s=window.dollhouse.tea();return a.right?s.aim>=a.target-.015:s.aim<=a.target+.015}', arg={'right': aim < target, 'target': target}, timeout=60000)
            finally:
                page.keyboard.up(key)
        page.keyboard.down('Space')
        try:
            page.wait_for_function('a=>window.dollhouse.tea().cups.find(c=>c.id===a.id).fill>=a.fill', arg={'id': cup_id, 'fill': threshold}, timeout=60000)
        finally:
            page.keyboard.up('Space')
    else:
        drag = PotDrag(page, touch).down()
        try:
            drag.aim(cup)
            page.wait_for_function('a=>window.dollhouse.tea().cups.find(c=>c.id===a.id).fill>=a.fill', arg={'id': cup_id, 'fill': threshold}, timeout=60000)
        finally:
            drag.release()
    page.wait_for_function('!window.dollhouse.tea().pressed && window.dollhouse.tea().tilt===0')


def complete_tea(page, touch=False, keyboard=False, serve=True):
    tea_ready(page)
    assert tea_status(page)['phase'] == 'pour'
    for cup in tea_status(page)['cups']:
        fill_tea_cup(page, cup['id'], touch=touch, keyboard=keyboard)
    assert tea_status(page)['ready'], 'Physical fills must satisfy every visible target band'
    if serve:
        if keyboard:
            page.keyboard.press('Enter')
        else:
            tap_tea(page, 'tray', touch)
        page.wait_for_function('window.dollhouse.tea()?.phase==="served"', timeout=60000)
    return tea_status(page)


def run(scenario):
    assert scenario in ('desktop', 'phone', 'progression')
    out = ROOT / 'artifacts' / 'tea' / scenario
    out.mkdir(parents=True, exist_ok=True)
    base = os.environ.get('PLAY_URL', 'http://127.0.0.1:4192')
    checks, errors, waits = [], [], []
    outside_stats = working_high_stats = working_stats = None
    working_visual = None
    server = browser = runtime = page = None

    def check(name, condition):
        checks.append({'name': name, 'passed': bool(condition)})
        print(('PASS ' if condition else 'FAIL ') + name, flush=True)
        assert condition, name

    def state():
        return page.evaluate('window.dollhouse.state()')

    def progress():
        s = state()['story']
        return sum([3, 4, 4][:s['chapter']]) + s['step']

    def economy():
        s = state()
        return {key: s[key] for key in ['buttons', 'cares', 'earnedToday', 'wishes']} | {
            'mastery': s['activities']['mastery'], 'completed': s['activities']['completed'],
            'lastReward': s['activities']['lastReward'], 'bonds': [d['bond'] for d in s['dolls']]
        }

    def ready():
        page.wait_for_function('window.dollhouse && !document.querySelector("#loading")', timeout=60000)
        page.wait_for_function('!window.dollhouse.visual().cameraMoving', timeout=60000)

    def resize(viewport):
        # ResizeObserver and the work camera can still describe the old viewport
        # immediately after set_viewport_size. Observe two real rendered frames
        # before reading camera readiness or projecting a new pointer target.
        page.set_viewport_size(viewport)
        page.wait_for_function('size=>innerWidth===size.width&&innerHeight===size.height&&new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve(true))))', arg=viewport, timeout=60000, polling=100)
        ready()

    def capture(name, moving=False):
        previous = page.viewport_size
        desktop_capture = scenario == 'desktop'
        if desktop_capture and not moving:
            resize({'width': 1280, 'height': 900})
        if moving:
            assert not desktop_capture or page.viewport_size == {'width': 1280, 'height': 900}, 'Moving desktop evidence requires the actual desktop viewport before grabbing'
        if not moving:
            ready()
            page.mouse.move(5, 5)
        before_capture = {'elapsed': state()['elapsed'], 'tea': tea_status(page)}
        try:
            page.screenshot(path=str(out / (name + '.png')), timeout=60000)
            (out / (name + '.json')).write_text(json.dumps({
                'viewport': page.viewport_size, 'beforeCapture': before_capture,
                'state': state(), 'tea': tea_status(page),
                'visual': page.evaluate('window.dollhouse.visual()'),
                'targets': page.evaluate('window.dollhouse.teaObjects()')
            }, indent=2))
        finally:
            if desktop_capture and not moving and previous != page.viewport_size:
                resize(previous)
                ready()

    def configure_phone():
        panel('settings')
        page.locator('[data-field="quality"]').select_option('low')
        page.locator('[data-field="locale"]').select_option('ar')
        page.locator('[data-field="motion"]').check()
        page.locator('#sheet [data-action="close"]').click()
        page.wait_for_function('window.dollhouse.visual().quality==="low" && document.documentElement.dir==="rtl"')

    def wait_simulation(label, predicate, arg=None, timeout=120000):
        # Timing remains genuine game time. Keep the served table camera while
        # waiting, and log its wall/simulation throughput instead of faking time.
        start_wall, start_state = time.monotonic(), state()
        result = {'label': label, 'viewport': page.viewport_size,
                  'startElapsed': start_state['elapsed'], 'startDayTime': start_state['dayTime'],
                  'startPhase': (tea_status(page) or {}).get('phase')}
        try:
            page.wait_for_function(predicate, arg=arg, timeout=timeout, polling=100)
            result['passed'] = True
        finally:
            end_state = state()
            result.update({'wallSeconds': time.monotonic() - start_wall,
                           'simulationSeconds': end_state['elapsed'] - start_state['elapsed'],
                           'endElapsed': end_state['elapsed'], 'endDayTime': end_state['dayTime'],
                           'visibility': page.evaluate('({state:document.visibilityState,focus:document.hasFocus()})')})
            waits.append(result)
            (out/'waits.json').write_text(json.dumps(waits, indent=2))
            print('WAIT ' + json.dumps(result), flush=True)

    def cooldown():
        wait_simulation('reward cooldown', 't=>window.dollhouse.state().elapsed>=t+20', state()['activities']['lastReward']['tea'])

    def new_earned_day():
        wait_simulation('earned day', 'window.dollhouse.state().dayTime>=60', timeout=180000)
        earned_day = state()['day']
        if tea_status(page):
            exit_tea()
        if state()['clock'] < 120:
            page.locator('[data-action="light"]').click()
        page.locator('[data-action="light"]').click()
        check('real earned time and the light control unlock the next service day', state()['day'] == earned_day + 1 and state()['activities']['completed']['tea'] == 0)

    def heading_fit(label):
        check(label + ' served score wraps inside its heading', page.locator('.tea-progress').evaluate('e=>e.scrollWidth<=e.clientWidth'))
        check(label + ' served heading fits the viewport without covering sound or pause', page.locator('.tea-heading').evaluate('e=>{const b=e.getBoundingClientRect();return b.left>=0&&b.right<=innerWidth&&b.top>=0&&b.bottom<=innerHeight&&[...document.querySelectorAll(".dock button[data-action=sound],.dock button[data-action=pause]")].every(c=>{const r=c.getBoundingClientRect();return b.right<=r.left||b.left>=r.right||b.bottom<=r.top||b.top>=r.bottom})}'))
        check(label + ' heading has a visible paper background', page.locator('.tea-heading').evaluate('e=>{const b=getComputedStyle(e).backgroundColor;return b!=="transparent"&&b!=="rgba(0, 0, 0, 0)"}'))

    def panel(name):
        target = page.locator(f'[data-action="panel-{name}"]')
        if not target.is_visible():
            page.locator('[data-action="toggle-tools"]').click()
        target.click()

    def room(name):
        page.locator(f'[data-room="{name}"]').click()
        ready()

    def object_point(key):
        point = next(p for p in page.evaluate('window.dollhouse.objects()') if p['key'] == key)
        check('scene object remains physically reachable: ' + key, page.evaluate('p=>document.elementFromPoint(p.x,p.y)?.id==="world"', point))
        return point

    def touch_object(key, twice=False):
        p = object_point(key)
        page.mouse.click(p['x'], p['y'])
        ready()
        if twice:
            p = object_point(key)
            page.mouse.click(p['x'], p['y'])
            ready()

    def carry_to(key, touch=False):
        destination = object_point(key)
        b = page.locator('.held-item').bounding_box()
        x, y = b['x'] + b['width'] / 2, b['y'] + b['height'] / 2
        if touch:
            session = page.context.new_cdp_session(page)
            try:
                session.send('Input.dispatchTouchEvent', {'type': 'touchStart', 'touchPoints': [{'x': x, 'y': y, 'id': 1}]})
                for i in range(1, 13):
                    session.send('Input.dispatchTouchEvent', {'type': 'touchMove', 'touchPoints': [{'x': x + (destination['x']-x)*i/12, 'y': y + (destination['y']-y)*i/12, 'id': 1}]})
                session.send('Input.dispatchTouchEvent', {'type': 'touchEnd', 'touchPoints': []})
            finally:
                session.detach()
        else:
            page.mouse.move(x, y)
            page.mouse.down()
            page.mouse.move(destination['x'], destination['y'], steps=12)
            page.mouse.up()
        ready()

    def dismiss_sequence(activity, escape=False):
        panel('activities')
        page.locator(f'[data-action="begin-activity"][data-id="{activity}"]').click()
        page.wait_for_function('id=>window.dollhouse.state().activities.active?.id===id', arg=activity)
        check(activity + ' starts through its visible optional catalog', page.locator('dialog[open] .ritual-play').is_visible())
        if escape:
            page.keyboard.press('Escape')
        else:
            page.locator('#sheet [data-action="close"]').click()
        page.wait_for_function('window.dollhouse.state().activities.active===null')
        check(('Escape' if escape else 'Close') + ' fully ends the sequence session', not page.locator('dialog[open]').count() and state()['activities']['active'] is None)
        ready()

    def enter():
        room('kitchen')
        touch_object('prop:tea-set', twice=True)
        tea_ready(page)

    def exit_tea():
        page.locator('[data-tea-action="exit"]').click()
        page.wait_for_function('window.dollhouse.tea()===null')
        ready()

    def targets_fit(label):
        targets = page.evaluate('window.dollhouse.teaObjects()')
        actionable = [p for p in targets if p['key'] != 'spout']
        check(label + ' pot, cups and tray stay inside the usable canvas', len(actionable) == len(tea_status(page)['cups']) + 2 and all(page.evaluate('p=>p.x>0&&p.x<innerWidth&&p.y>0&&p.y<innerHeight&&document.elementFromPoint(p.x,p.y)?.id==="world"', p) for p in actionable))
        check(label + ' visible work controls have 44px targets and receive input', page.locator('[data-tea-action]:visible,.dock button:visible').evaluate_all('els=>els.length>0&&els.every(e=>{const b=e.getBoundingClientRect(),hit=document.elementFromPoint(b.left+b.width/2,b.top+b.height/2);return b.width>=44&&b.height>=44&&b.left>=0&&b.right<=innerWidth&&b.top>=0&&b.bottom<=innerHeight&&(hit===e||e.contains(hit))})'))
        check(label + ' has no answer grid or automatic modal', not page.locator('.ritual-choice:visible,dialog[open]').count())

    try:
        if not os.environ.get('PLAY_URL'):
            server = subprocess.Popen(['node', 'scripts/serve.mjs', 'dist'], cwd=ROOT,
                                      env={**os.environ, 'PORT': '4192'}, stdout=(out/'server.log').open('w'), stderr=subprocess.STDOUT)
        for _ in range(100):
            try:
                urllib.request.urlopen(base, timeout=1)
                break
            except Exception:
                time.sleep(.1)
        runtime = sync_playwright().start()
        options = {'headless': os.environ.get('TEA_HEADED') != '1', 'args': ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--enable-webgl']}
        if os.environ.get('CHROMIUM_PATH'):
            options['executable_path'] = os.environ['CHROMIUM_PATH']
        browser = runtime.chromium.launch(**options)
        viewport = {'desktop': {'width': 1280, 'height': 900}, 'phone': {'width': 390, 'height': 844}, 'progression': {'width': 320, 'height': 568}}[scenario]
        context = browser.new_context(viewport=viewport, has_touch=True)
        page = context.new_page()
        page.set_default_timeout(20000)
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
        page.goto(base+'/?debug=1')
        ready()
        check(scenario + ' starts with fresh ritual and story progress', state()['activities']['mastery']['tea'] == 0 and state()['activities']['teaRecords'] == [None, None, None, None] and progress() == 0)
        if scenario == 'desktop':
            outside_stats = page.evaluate('window.dollhouse.stats()')
            dismiss_sequence('stitch')
            enter()
            check('scene tea starts after closing an unfinished stitch', tea_status(page)['mode'] == 'ritual' and state()['activities']['active']['id'] == 'tea')
            targets_fit('Desktop')
            check('scene entry focuses the canvas and starts two empty physical cups', page.evaluate('document.activeElement.id==="world"') and len(tea_status(page)['cups']) == 2 and all(c['fill'] == 0 for c in tea_status(page)['cups']))
            working_high_stats = page.evaluate('window.dollhouse.stats()')
            check('tea adds at most five thousand visible triangles and twenty-four draws', working_high_stats['triangles'] - outside_stats['triangles'] < 5000 and working_high_stats['calls'] - outside_stats['calls'] <= 24)
            capture('01-desktop-empty')
            # Retain the high-detail opening and its unchanged geometry gate. The
            # long continuous-input journey uses the actual player quality setting;
            # shared software WebGL can otherwise advance very little simulation
            # time while screenshots consume minutes of wall time.
            exit_tea()
            panel('settings')
            page.locator('[data-field="quality"]').select_option('low')
            page.locator('#sheet [data-action="close"]').click()
            page.wait_for_function('window.dollhouse.visual().quality==="low"')
            resize({'width': 320, 'height': 568})
            enter()
            check('low-quality replay enters through real UI with fresh empty cups', tea_status(page)['phase'] == 'pour' and all(c['fill'] == 0 for c in tea_status(page)['cups']) and state()['activities']['mastery']['tea'] == 0)
            # A held pot starts with no flow; its spout misses both cups in the gap.
            drag = PotDrag(page).down()
            try:
                untouched = tea_status(page)['poured']
                page.wait_for_timeout(250)
                check('pressing the pot alone never pours', tea_status(page)['poured'] == untouched)
                cups = tea_status(page)['cups']
                left, right = [tea_point(page, 'cup:' + str(c['id'])) for c in cups]
                drag.move(drag.start['x'] + (left['x'] + right['x']) / 2 - drag.spout['x'], drag.start['y'] + 60)
                page.wait_for_function('window.dollhouse.tea().spills>.08')
                check('a real miss spills without filling either opening', all(c['fill'] == 0 for c in tea_status(page)['cups']))
            finally:
                drag.release()
            page.wait_for_function('window.dollhouse.visual().tea.spillVisible')
            check('missed tea leaves a real visible spill patch', page.evaluate('window.dollhouse.visual().tea.spillVisible'))
            capture('02-desktop-spill')
            cup = tea_status(page)['cups'][0]
            fill_tea_cup(page, cup['id'], fill=.25)
            check('a short cup retains its partial tea after release', .2 < tea_status(page)['cups'][0]['fill'] < cup['target'] - .07)
            page.wait_for_function('window.dollhouse.visual().tea.cups[0].surfaceY>.06')
            check('actual amber geometry rises below the engraved band', page.evaluate('window.dollhouse.visual().tea.cups[0].surfaceY<window.dollhouse.visual().tea.cups[0].bandY'))
            # Capture actual moving liquid. Any extra fill while software rendering
            # completes remains part of the same deliberate overfill/repair example.
            resize({'width': 1280, 'height': 900})
            tea_ready(page)
            drag = PotDrag(page).down()
            try:
                drag.aim(tea_status(page)['cups'][0], tilt=.35)
                page.wait_for_function('window.dollhouse.tea().flow>0 && window.dollhouse.tea().cups[0].fill>.3')
                page.wait_for_function('window.dollhouse.visual().tea.stream.visible')
                capture('03-desktop-mid-pour', moving=True)
            finally:
                drag.release()
            resize({'width': 320, 'height': 568})
            tea_ready(page)
            drag = PotDrag(page).down()
            try:
                drag.aim(tea_status(page)['cups'][0], tilt=.64)
                page.wait_for_function('window.dollhouse.tea().cups[0].overfilled && window.dollhouse.tea().cups[0].fill>=1.05', timeout=60000)
            finally:
                drag.release()
            dirty = tea_status(page)
            capture('04-desktop-overfilled')
            tap_tea(page, 'cup:' + str(cup['id']))
            repaired = tea_status(page)
            check('tapping an overfilled cup empties only that cup and preserves waste', repaired['cups'][0]['fill'] == 0 and repaired['poured'] == dirty['poured'] and abs(repaired['spills'] - dirty['spills'] - dirty['cups'][0]['fill']) < 1e-9 and repaired['cups'][1]['fill'] == dirty['cups'][1]['fill'])
            before = economy()
            complete_tea(page, serve=False)
            check('release stops filling immediately and leaves both target bands ready', tea_status(page)['ready'] and not tea_status(page)['pressed'])
            stable_fill = [c['fill'] for c in tea_status(page)['cups']]
            page.wait_for_timeout(350)
            check('released cups cannot continue filling', [c['fill'] for c in tea_status(page)['cups']] == stable_fill)
            page.wait_for_function('!window.dollhouse.visual().tea.stream.visible')
            check('every actual filled cup meets its engraved geometry line', page.evaluate('window.dollhouse.visual().tea.cups.every(c=>c.visible&&Math.abs(c.surfaceY-c.bandY)<=.19*.07+.001)'))
            capture('05-desktop-ready')
            tap_tea(page, 'tray')
            page.wait_for_function('window.dollhouse.tea().phase==="served"')
            first = tea_status(page)
            page.wait_for_function('window.dollhouse.visual().tea.served')
            check('physical tray service pays the unchanged seven buttons and one mastery', state()['buttons'] == before['buttons'] + 7 and state()['activities']['mastery']['tea'] == 1 and state()['activities']['completed']['tea'] == 1)
            check('served tray is a terminal tableau with a saved service score', first['result'] is not None and first['best'] is not None and not page.locator('dialog[open]').count())
            served_economy = economy()
            page.keyboard.down('Space')
            page.wait_for_timeout(200)
            page.keyboard.up('Space')
            check('held Space cannot refill or reward a served tray', tea_status(page)['phase'] == 'served' and economy() == served_economy)
            # Replay from the actual pot before the cooldown expires: better practice
            # may improve a best, but cannot grant a second reward during cooldown.
            tap_tea(page, 'pot')
            tea_ready(page)
            practice_before = economy()
            complete_tea(page, keyboard=True)
            check('clean keyboard practice cannot farm currency, mastery, care or bond', economy() == practice_before and tea_status(page)['result']['practice'])
            check('clean practice preserves or improves the personal best', tea_status(page)['best'] >= first['best'])
            capture('06-desktop-served')
            resize({'width': 1280, 'height': 900})
            tea_ready(page)
            heading_fit('Desktop')
            working_stats = page.evaluate('window.dollhouse.stats()')
            working_visual = page.evaluate('window.dollhouse.visual().tea')
            check('Desktop geometry sample observes the actual served table', working_visual['active'] and working_visual['served'])
            records = state()['activities']['teaRecords']
            exit_tea()
            page.reload(wait_until='domcontentloaded')
            ready()
            check('earned mastery and personal best survive reload', state()['activities']['mastery']['tea'] == 1 and state()['activities']['teaRecords'] == records and tea_status(page) is None)
        elif scenario == 'phone':
            configure_phone()
            resize({'width': 390, 'height': 844})
            enter()
            targets_fit('390px Arabic')
            capture('07-arabic-phone-empty')
            # Pause while a touch owns the pot; release is accepted even while paused.
            drag = PotDrag(page, touch=True).down()
            try:
                drag.aim(tea_status(page)['cups'][0])
                page.wait_for_function('window.dollhouse.tea().flow>0')
                owned = tea_status(page)
                drag.session.send('Input.dispatchTouchEvent', {'type': 'touchStart', 'touchPoints': [{'x': drag.x, 'y': drag.y, 'id': 1}, {'x': 20, 'y': 260, 'id': 2}]})
                drag.session.send('Input.dispatchTouchEvent', {'type': 'touchMove', 'touchPoints': [{'x': drag.x, 'y': drag.y, 'id': 1}, {'x': 80, 'y': 310, 'id': 2}]})
                check('an extra touch cannot steal the held pot', tea_status(page)['pressed'] and tea_status(page)['aim'] == owned['aim'] and tea_status(page)['tilt'] == owned['tilt'])
                page.locator('.dock [data-action="pause"]').click()
                frozen = tea_status(page)
                frozen_elapsed = state()['elapsed']
                check('pausing a held pot releases its flow', state()['paused'] and not frozen['pressed'] and frozen['tilt'] == 0)
                page.wait_for_timeout(300)
                check('paused fill and simulation time remain frozen', tea_status(page)['cups'] == frozen['cups'] and state()['elapsed'] == frozen_elapsed)
            finally:
                drag.release(cancel=True)
            page.locator('.pause-overlay [data-action="pause"]').click()
            # Cancellation has no delayed pour when the same canvas becomes active.
            page.wait_for_timeout(250)
            check('resuming never restores a held pour', not tea_status(page)['pressed'] and tea_status(page)['flow'] == 0)
            if tea_status(page)['cups'][0]['overfilled']:
                tap_tea(page, 'cup:0', touch=True)
            fill_tea_cup(page, tea_status(page)['cups'][0]['id'], keyboard=True, fill=1.02)
            check('keyboard aiming and held Space can overfill an actual cup', tea_status(page)['cups'][0]['overfilled'])
            capture('08-arabic-phone-overfilled')
            keyboard_waste = tea_status(page)['poured']
            page.keyboard.press('e')
            check('E empties the aimed overfilled cup without erasing poured history', tea_status(page)['cups'][0]['fill'] == 0 and tea_status(page)['poured'] == keyboard_waste)
            drag = PotDrag(page, touch=True).down()
            try:
                drag.aim(tea_status(page)['cups'][0])
                page.wait_for_function('window.dollhouse.tea().cups[0].fill>.12')
            finally:
                drag.release(cancel=True)
            cancelled = tea_status(page)
            page.wait_for_timeout(200)
            check('a genuine touchCancel stops the stream and preserves partial fill', not tea_status(page)['pressed'] and tea_status(page)['flow'] == 0 and tea_status(page)['cups'] == cancelled['cups'])
            capture('08-arabic-phone-partial')
            complete_tea(page, touch=True, serve=False)
            capture('08-arabic-phone-ready')
            tap_tea(page, 'tray', touch=True)
            page.wait_for_function('window.dollhouse.tea().phase==="served"')
            capture('09-arabic-phone-served')
            heading_fit('390px Arabic')
            tap_tea(page, 'pot', touch=True)
            drag = PotDrag(page, touch=True).down()
            try:
                drag.aim(tea_status(page)['cups'][0])
                page.wait_for_function('window.dollhouse.tea().pressed')
                page.keyboard.press('Escape')
            finally:
                drag.release(cancel=True)
            page.wait_for_function('window.dollhouse.tea()===null')
            check('Escape cancels touch ownership and exits the working camera', not page.locator('.tea-playfield').is_visible())
            # Genuine hidden-tab cancellation runs in visibility_check.py with
            # Playwright's forced-focus default disabled for that fixture.
            # Advance the first nine story touches by the real scene route. The
            # guest cup is a one-cup introduction, with no ritual payout or best.
            dismiss_sequence('lullaby', escape=True)
            room('kitchen')
            touch_object('prop:mint-tin', twice=True)
            check('current story prop progresses after dismissing an unfinished lullaby', progress() == 1 and page.locator('[data-held-item="red-thread"]').is_visible())
            room('studio'); carry_to('prop:sewing-machine')
            room('bedroom'); carry_to('prop:moon-bed')
            room('parlor'); touch_object('prop:parlor-sofa', twice=True)
            carry_to('prop:music-cabinet')
            room('studio'); carry_to('prop:sewing-machine')
            room('parlor'); carry_to('prop:music-cabinet')
            room('kitchen'); touch_object('prop:wash-basin', twice=True)
            room('parlor'); carry_to('prop:jasmine-window')
            check('guest introduction was reached through nine physical story steps', progress() == 9)
            resize({'width': 320, 'height': 740})
            room('kitchen'); carry_to('prop:tea-set', touch=True)
            tea_ready(page)
            guest_before = economy()
            guest_records = state()['activities']['teaRecords']
            check('guest service keeps its sprig until a one-cup tray is served', progress() == 9 and tea_status(page)['mode'] == 'guest' and len(tea_status(page)['cups']) == 1 and page.evaluate('window.dollhouse.state().story.step===2'))
            targets_fit('320px guest')
            capture('10-small-phone-guest-empty')
            fill_tea_cup(page, tea_status(page)['cups'][0]['id'], touch=True, fill=.25)
            page.reload(wait_until='domcontentloaded')
            ready()
            check('reload discards an unfinished pour and restores the guest sprig', progress() == 9 and tea_status(page) is None and page.locator('[data-held-item="jasmine-sprig"]').is_visible())
            room('kitchen'); carry_to('prop:tea-set', touch=True)
            tea_ready(page)
            complete_tea(page, touch=True)
            check('serving a guest cup advances once without any ritual rewards or records', progress() == 10 and economy() == guest_before and state()['activities']['teaRecords'] == guest_records)
            capture('11-small-phone-guest-served')
            heading_fit('320px Arabic guest')
            exit_tea()
            page.reload(wait_until='domcontentloaded')
            ready()
            check('reload after service restores the carried guest cup', progress() == 10 and page.locator('[data-held-item="guest-cup"]').is_visible())
            resize({'width': 667, 'height': 375})
            room('parlor'); carry_to('prop:doorstep', touch=True)
            check('guest delivery pays its chapter reward exactly once', progress() == 11 and state()['buttons'] == guest_before['buttons'] + 20)
            if state()['clock'] < 120:
                page.locator('[data-action="light"]').click()
            page.wait_for_function('window.dollhouse.visual().nightMix>.99')
            enter()
            targets_fit('Arabic landscape night')
            capture('12-arabic-landscape-night-empty')
            complete_tea(page, keyboard=True, serve=False)
            capture('13-arabic-landscape-night-ready')
            page.keyboard.press('Enter')
            page.wait_for_function('window.dollhouse.tea().phase==="served"')
            capture('14-arabic-landscape-night-served')
            heading_fit('Arabic landscape night')
            exit_tea()
            resize({'width': 390, 'height': 844})
            enter()
            targets_fit('390px night')
            capture('15-phone-night-empty')
            working_stats = page.evaluate('window.dollhouse.stats()')
            working_visual = page.evaluate('window.dollhouse.visual().tea')
            check('Phone geometry sample observes the actual working table', working_visual['active'])
        elif scenario == 'progression':
            configure_phone()
            enter()
            before = economy()
            complete_tea(page)
            check('physical tray service pays the unchanged seven buttons and one mastery', state()['buttons'] == before['buttons'] + 7 and state()['activities']['mastery']['tea'] == 1 and state()['activities']['completed']['tea'] == 1)
            cooldown()
            tap_tea(page, 'pot')
            tea_ready(page)
            second_before = economy()
            complete_tea(page, touch=True)
            check('second touch service preserves seven buttons plus the ten-button level bonus', state()['buttons'] == second_before['buttons'] + 17 and state()['activities']['mastery']['tea'] == 2 and state()['activities']['completed']['tea'] == 2)
            cap_day = state()['day']
            cooldown()
            tap_tea(page, 'pot')
            tea_ready(page)
            capped_before = economy()
            complete_tea(page)
            check('two earned services cap further rewards after cooldown', state()['day'] == cap_day and economy() == capped_before and tea_status(page)['result']['practice'])
            records = state()['activities']['teaRecords']
            # Keep the served view for the genuine earned-day wait. Only then
            # leave/reload to verify the same earned progress and saved bests.
            new_earned_day()
            page.reload(wait_until='domcontentloaded')
            ready()
            check('earned mastery and all difficulty bests survive reload', state()['activities']['mastery']['tea'] == 2 and state()['activities']['teaRecords'] == records and tea_status(page) is None)
            enter()
            while state()['activities']['mastery']['tea'] < 5:
                if state()['activities']['completed']['tea'] >= 2:
                    new_earned_day()
                    enter()
                cooldown()
                if tea_status(page)['phase'] == 'served':
                    tap_tea(page, 'pot')
                    tea_ready(page)
                before_earning = state()
                complete_tea(page, keyboard=True)
                mastery = before_earning['activities']['mastery']['tea']
                expected = [7, 17, 9, 9, 34][mastery]
                check(f'earned service {mastery+1} preserves its exact level and bond economy', state()['activities']['mastery']['tea'] == mastery + 1 and state()['buttons'] == before_earning['buttons'] + expected)
            if state()['activities']['completed']['tea'] >= 2:
                new_earned_day()
                enter()
            cooldown()
            if tea_status(page)['phase'] == 'served':
                tap_tea(page, 'pot')
                tea_ready(page)
            check('five genuinely earned masteries unlock the three-cup table', tea_status(page)['level'] == 2 and len(tea_status(page)['cups']) == 3)
            targets_fit('320px advanced three-cup')
            capture('16-small-phone-three-cup-empty')
            # Check the 390px composition independently, then retain the real small
            # viewport for the three actual mouse-controlled advanced fills.
            resize({'width': 390, 'height': 844})
            tea_ready(page)
            targets_fit('390px advanced three-cup')
            resize({'width': 320, 'height': 568})
            tea_ready(page)
            advanced_before = state()
            for cup in tea_status(page)['cups']:
                fill_tea_cup(page, cup['id'])
                check('pot-body offset still aims the real advanced cup ' + str(cup['id']), tea_status(page)['aimedCup'] == cup['id'] and abs(tea_status(page)['aim'] * .45 - cup['x']) < .025)
            resize({'width': 390, 'height': 844})
            tea_ready(page)
            capture('17-arabic-three-cup-ready')
            tap_tea(page, 'tray')
            page.wait_for_function('window.dollhouse.tea().phase==="served"')
            check('three-cup service pays the unchanged eleven-button level-two reward', state()['activities']['mastery']['tea'] == advanced_before['activities']['mastery']['tea'] + 1 and state()['buttons'] == advanced_before['buttons'] + 11)
            advanced_records = state()['activities']['teaRecords']
            capture('18-arabic-three-cup-served')
            heading_fit('390px advanced Arabic')
            working_stats = page.evaluate('window.dollhouse.stats()')
            working_visual = page.evaluate('window.dollhouse.visual().tea')
            check('Advanced geometry sample observes the actual served three-cup table', working_visual['active'] and working_visual['served'])
            exit_tea()
            page.reload(wait_until='domcontentloaded')
            ready()
            check('bests for all three played difficulties survive a real reload', state()['activities']['teaRecords'] == advanced_records and all(record is not None for record in advanced_records[:3]))
        (out/'render-stats.json').write_text(json.dumps({'outside': outside_stats, 'workingHigh': working_high_stats, 'working': working_stats, 'tea': working_visual}, indent=2))
        check('working table stays within the existing 400k geometry budget', working_stats['triangles'] < 400000)
        check(scenario + ' physical tea journey has no JavaScript or console errors', not errors)
    except Exception:
        if page and not page.is_closed():
            try:
                (out/'failure-state.json').write_text(json.dumps({'state': state(), 'tea': tea_status(page), 'visual': page.evaluate('window.dollhouse.visual()'), 'targets': page.evaluate('window.dollhouse.teaObjects()'), 'lastGrab': getattr(page, '_tea_grab_observation', None), 'visibility': page.evaluate('({state:document.visibilityState,focus:document.hasFocus()})'), 'viewport': page.viewport_size, 'waits': waits, 'errors': errors}, indent=2))
            except Exception:
                pass
            try:
                page.screenshot(path=str(out/'failure.png'), timeout=20000)
            except Exception:
                pass
        raise
    finally:
        (out/'results.json').write_text(json.dumps({'scenario': scenario, 'checks': checks, 'errors': errors, 'waits': waits}, indent=2))
        (out/'source-commit.txt').write_text(subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True))
        if browser:
            browser.close()
        if runtime:
            runtime.stop()
        if server:
            server.terminate()
            server.wait(timeout=10)


if __name__ == '__main__':
    selected = os.environ.get('TEA_SCENARIO', 'all')
    if selected not in ('all', 'desktop', 'phone', 'progression'):
        raise ValueError('TEA_SCENARIO must be desktop, phone, progression or all')
    for scenario in ('desktop', 'phone', 'progression') if selected == 'all' else (selected,):
        run(scenario)
