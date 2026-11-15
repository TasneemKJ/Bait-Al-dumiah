"""The routes that replaced the bottom bar (DESIGN.md #67), for the browser checks.

The key ring holds Settings (fuse), Keepsakes (drawer), Album and the Fifth room; the House key shows the whole
house. Rooms, dolls and objects are reached through the hidden house list (src/house-access.js), the same route a
keyboard or VoiceOver player takes: focus its button and press Enter. The household sheet is a doll's second
touch; the rituals sheet comes from the clue. Sound and Pause live in the Settings sheet (Space still pauses).
"""
KEYS = {'panel-settings': 'fuse', 'panel-decorate': 'drawer', 'panel-journal': 'album', 'panel-store': 'fifth',
        'camera': 'house'}


def press_access(page, pick):
    """Press the hidden house-list entry whose pick matches (e.g. {'roomTap': 'studio'})."""
    # The built game bundles its modules, so the list's order (src/house-access.js accessEntries) is rebuilt
    # here from the debug seam: per room, the room, its dolls, its story objects, its keepsakes, then on a music
    # night its music box and the key. tests/house-access.test.mjs pins that order on the game side.
    index = page.evaluate("""(want)=>{const s=window.dollhouse.state(),objects=window.dollhouse.objects(),out=[];
      const m=s.music,open=Boolean(m)&&m.night===s.day&&!m.done&&s.clock>=120&&s.clock<160;
      const boxes={kitchen:'lina',studio:'sami',bedroom:'noor'};
      for(const room of ['kitchen','parlor','studio','bedroom']){out.push({roomTap:room});
       for(const d of s.dolls.filter(x=>x.room===room))out.push({doll:d.id});
       for(const o of objects.filter(x=>x.key.startsWith('prop:')&&x.room===room))out.push({object:o.key,room});
       for(const d of s.decor.filter(x=>x.room===room))out.push({object:'decor:'+d.id,room});
       if(open&&boxes[room])out.push({musicBox:boxes[room],room});if(open&&m.key===room)out.push({musicKey:true})}
      return out.findIndex(x=>Object.entries(want).every(([k,v])=>x[k]===v))}""", pick)
    if index < 0:
        raise AssertionError(f'no house-list entry for {pick}')
    # Activate it as VoiceOver's double-tap does (a click on the focused button), then give focus back to the
    # house so the list folds away again, as it does for a keyboard player who moves on.
    page.locator(f'.house-access [data-access="{index}"]').evaluate('b=>{b.focus();b.click()}')
    page.evaluate("document.activeElement?.closest?.('.house-access')&&document.querySelector('#world')?.focus({preventScroll:true})")


def focus_room(page, room):
    press_access(page, {'roomTap': room})


def select_object(page, key):
    """Select a story object or keepsake by name (its room comes into view), as the old Things list did."""
    if page.evaluate('(k)=>document.querySelector(".story-playfield")?.dataset?.selected===k', key):
        return
    press_access(page, {'object': key})


def press_key(page, action):
    """A key on the ring for a former bar action; False when the ring does not hold that key yet."""
    key = page.locator(f'.key-ring [data-key="{KEYS[action]}"]')
    if not key.count():
        return False
    key.click()
    return True


def open_household(page, doll='lina'):
    """The household sheet: a doll's first touch greets her, the second opens her sheet."""
    for _ in range(3):
        if page.locator('#sheet[open]').count():
            return
        point = page.evaluate('(id)=>window.dollhouse.project(id)', doll)
        size = page.viewport_size
        if point and 0 < point['x'] < size['width'] and 0 < point['y'] < size['height']:
            page.mouse.click(point['x'], point['y'])
        else:
            press_access(page, {'doll': doll})
        page.wait_for_timeout(300)
    if not page.locator('#sheet[open]').count():
        raise AssertionError(f'the household sheet did not open from {doll}')


def open_rituals(page):
    """The rituals sheet is the album's second page: Album key, then 'Records and restorations'. Without the album
    key yet, the house list's last entry opens it (the keyboard and VoiceOver route)."""
    if press_key(page, 'panel-journal'):
        page.locator('#sheet [data-action="panel-activities"]').click()
        return
    page.locator('.house-access [data-access]').last.evaluate('b=>{b.focus();b.click()}')


def open_panel(page, action):
    if action == 'panel-household':
        return open_household(page)
    if action == 'panel-activities':
        return open_rituals(page)
    if not press_key(page, action):
        raise AssertionError(f'the key ring has no key for {action} yet')
