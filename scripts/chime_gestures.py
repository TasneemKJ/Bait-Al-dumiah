"""Real rendered targets plus real input; no state writes or score submission."""
def wait_for_echo(page):
    page.wait_for_function("window.dollhouse.chimes()?.phase==='echo'", timeout=90000)
    page.wait_for_function('!window.dollhouse.visual().cameraMoving', timeout=60000)

def pluck_chime(page, note, pull=.7):
    point=page.evaluate('id=>window.dollhouse.chimeObjects().find(p=>p.key===id)',note)
    span=page.evaluate('window.dollhouse.chimePullSpan()')
    assert point and span>0, 'A real rendered charm and pull projection are required'
    page.mouse.move(point['x'],point['y']);page.mouse.down()
    page.mouse.move(point['x'],point['y']+span*pull,steps=8);page.mouse.up()

def finish_chimes(page):
    wait_for_echo(page)
    pattern=page.evaluate('window.dollhouse.chimes().pattern')
    for note in reversed(pattern):pluck_chime(page,note)
    page.wait_for_function("window.dollhouse.chimes()?.phase==='finished'",timeout=60000)
