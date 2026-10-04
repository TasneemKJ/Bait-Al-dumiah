"""Genuine sewing gestures shared by browser acceptance journeys.

Only actual mouse, touch and keyboard events enter the game. The debug surface
is read-only: its authored guides and current camera project the visible seam.
No helper submits coverage, score, time, inventory or simulation state.
"""
import math


def stitch_status(page):
    return page.evaluate('window.dollhouse.stitch()')


def stitch_ready(page):
    page.wait_for_function('''()=>{
        const g=window.dollhouse,s=g?.stitch?.(),visual=g?.visual?.(),v=visual?.stitch;
        if(!s||!v?.active||visual.cameraMoving||v.phase!==s.phase||v.patternId!==s.patternId)return false;
        const close=(a,b)=>Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<1e-6;
        if(!v.needle||!close(v.needle.x,s.needle.x)||!close(v.needle.y,s.needle.y)||v.needle.pressed!==s.pressed)return false;
        return g.stitchObjects().some(p=>p.key==="needle"&&Number.isFinite(p.x)&&Number.isFinite(p.y));
    }''', timeout=60000, polling=100)


def stitch_point(page, key, reachable=True):
    point = next(p for p in page.evaluate('window.dollhouse.stitchObjects()') if p['key'] == key)
    if reachable:
        assert page.evaluate('p=>p.x>0&&p.x<innerWidth&&p.y>0&&p.y<innerHeight&&document.elementFromPoint(p.x,p.y)?.id==="world"', point), 'Sewing target is covered: ' + key
    return point


def project_stitch(page, x, y, height=0):
    point = page.evaluate('p=>window.dollhouse.projectStitch(p.x,p.y,p.height)', {'x': x, 'y': y, 'height': height})
    assert point and math.isfinite(point['x']) and math.isfinite(point['y']), 'Visible cloth point must project through the actual camera'
    return point


def tap_stitch(page, key, touch=False):
    stitch_ready(page)
    point = stitch_point(page, key)
    if touch:
        page.touchscreen.tap(point['x'], point['y'])
    else:
        page.mouse.click(point['x'], point['y'])


class NeedleDrag:
    """Pick up the rendered needle grip and guide its actual cloth-plane tip."""
    def __init__(self, page, touch=False):
        self.page, self.touch, self.session = page, touch, None
        stitch_ready(page)
        self.observation = page.evaluate('''()=>{
            const g=window.dollhouse,s=g.stitch(),targets=g.stitchObjects();
            return {stitch:s,needle:targets.find(p=>p.key==="needle"),
                origin:g.projectStitch(s.needle.x,s.needle.y,0),targets,
                visual:g.visual().stitch,viewport:{width:innerWidth,height:innerHeight}};
        }''')
        self.start, self.origin = self.observation['needle'], self.observation['origin']
        assert page.evaluate('p=>document.elementFromPoint(p.x,p.y)?.id==="world"', self.start), 'Needle grab is covered'
        # Python-side capture evidence only. The initial cloth-plane origin
        # preserves the whole grab offset even when pressing lowers the tip.
        page._stitch_grab_observation = self.observation
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
        self.page.wait_for_function('window.dollhouse.stitch()?.pressed===true', timeout=20000, polling=100)
        return self

    def move_to(self, x, y):
        point = project_stitch(self.page, x, y)
        self.x = self.start['x'] + point['x'] - self.origin['x']
        self.y = self.start['y'] + point['y'] - self.origin['y']
        if self.touch:
            self.session.send('Input.dispatchTouchEvent', {'type': 'touchMove', 'touchPoints': [{'x': self.x, 'y': self.y, 'id': 1}]})
        else:
            self.page.mouse.move(self.x, self.y, steps=4)

    def to(self, x, y):
        before = stitch_status(self.page)
        guide = before.get('nextGuidePoint')
        follows_guide = bool(guide and math.hypot(guide['x'] - x, guide['y'] - y) < 1e-8)
        self.move_to(x, y)
        # Proximity alone can precede paid vertex arrival by a simulation frame.
        # The authored current guide must advance before tracing its next edge.
        self.page.wait_for_function('''p=>{
            const s=window.dollhouse.stitch();if(!s)return false;if(s.loose)return true;
            const arrived=Math.hypot(s.needle.x-p.x,s.needle.y-p.y)<.003;
            const guide=s.nextGuidePoint;
            const covered=!p.followsGuide||s.section!==p.section||!guide||Math.hypot(guide.x-p.x,guide.y-p.y)>1e-8;
            return arrived&&covered;
        }''', arg={'x': x, 'y': y, 'followsGuide': follows_guide, 'section': before['section']}, timeout=60000, polling=100)
        state = stitch_status(self.page)
        assert not state['loose'], 'Following the visible contour must not create a loose section'
        return state

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


def _next_vertex(state):
    guide = state.get('nextGuidePoint')
    assert guide and math.isfinite(guide['x']) and math.isfinite(guide['y']), 'An unfinished section must expose its next contiguous guide vertex'
    return [guide['x'], guide['y']]


def trace_stitch(page, touch=False, until_section=None):
    """Trace current/future guide edges through real motion, retaining repairs."""
    stitch_ready(page)
    initial = stitch_status(page)
    assert initial['phase'] == 'sew' and not initial['loose'], 'Repair a loose section explicitly before tracing'
    limit = len(initial['sections']) if until_section is None else until_section
    if initial['section'] >= limit:
        return initial
    drag = NeedleDrag(page, touch).down()
    try:
        for _ in range(80):
            current = stitch_status(page)
            if current['section'] >= limit:
                break
            vertex = _next_vertex(current)
            before = (current['section'], current['distance'])
            drag.to(vertex[0], vertex[1])
            after = stitch_status(page)
            assert (after['section'], after['distance']) != before, 'A covered visible edge must advance the stitch front'
        else:
            raise AssertionError('Authored sewing contour exceeded its finite vertex count')
    finally:
        drag.release()
    page.wait_for_function('window.dollhouse.stitch()?.pressed===false', timeout=20000, polling=100)
    return stitch_status(page)


def finish_stitch(page, *, touch=False, leave=True):
    """Finish an already opened sewing activity, then optionally touch it home."""
    stitch_ready(page)
    if stitch_status(page)['phase'] == 'sew':
        trace_stitch(page, touch)
        page.wait_for_function('window.dollhouse.stitch()?.ready===true', timeout=20000, polling=100)
        tap_stitch(page, 'cloth', touch)
        page.wait_for_function('window.dollhouse.stitch()?.phase==="finished"', timeout=20000, polling=100)
    finished = stitch_status(page)
    assert finished['phase'] == 'finished' and finished['result']['complete'], 'Only an explicitly finished cloth completes the activity'
    if leave:
        tap_stitch(page, 'cloth', touch)
        page.wait_for_function('window.dollhouse.stitch()===null', timeout=20000, polling=100)
        page.wait_for_function('!window.dollhouse.visual().cameraMoving', timeout=60000, polling=100)
    return finished
