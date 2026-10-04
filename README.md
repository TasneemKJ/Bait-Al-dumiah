# Bait Al-dumiah · بيت الدمية

**A home for little souls.** A mobile-first, cute-and-creepy 3D dollhouse simulation with English and Arabic controls.

Look into a miniature Levantine home, care for three porcelain dolls, spend earned buttons on keepsakes, and greet a shy visitor after dark. The house is a place to belong, not a survival punishment: no gore, jump scares, death or offline need decay.

## Play and build

Requires Node 22.12 or newer.

```sh
npm ci
npm run dev     # http://127.0.0.1:4177
npm test
npm run build  # self-contained static dist/
npm run preview
```

Deploy `dist/` to any static web host. Runtime assets and Three.js are local; the game makes no CDN, analytics or backend requests. WebGL2 is required. An accessible recovery screen appears when graphics cannot start or the context is lost.

## The first playable

- Four furnished cutaway rooms: tea kitchen, rose parlor, sewing room and moon bedroom.
- Three authored dolls with animated reactions, fullness, energy, comfort and daily wishes that rotate through each doll's personal list after day one.
- Tea, play, naps and reassurance. Wishes earn buttons; tea costs two. A wished-for action is always welcome, even when that need is nearly full. Decorating changes the 3D room and household coziness; filling all three spots in a room adds extra coziness.
- Closeness: care brings each doll through five levels (Shy to Family). Each level gives a button gift, raises that doll's wish reward and unlocks one of three memories.
- Favourites: each doll has a treasured keepsake and a favourite room. In the favourite room, comfort fades more slowly and care builds closeness faster. With the treasured keepsake in the same room, the doll is content at a lower need level.
- Sewing basket: a doll whose needs are all high sews buttons into a basket (at most nine a day). Nothing is taken from unhappy dolls, and buttons arrive only when you collect them.
- A full house (all three wishes in one day) pays a bonus that grows with a day-in-a-row streak.
- Thirteen milestones in the journal. Each one's reward is paid only when you collect it.
- The closed door: a five-step project in the journal that costs 430 buttons in all. The key step needs you to be dear to Sami, and opening the door needs all six whispers. Once the fifth room is open, you can leave the visitor one small gift a night (12 buttons) and collect the eight things they leave in return.
- Three connected object stories: find a red thread and mend Noor's bear; retrieve a hidden key and repair the music cabinet; carry water, jasmine and hand-poured tea to welcome a small guest. Eleven story steps, eight carried items, three lasting scenes and three journal memories. Chapter rewards pay once; no purchase, waiting or mastery blocks the stories.
- Direct object play: touch an object to select it, touch it again to act, or drag the item in your hand onto another object. Selection uses a small nonmodal ribbon; the house keeps running. Optional details and keyboard discovery remain available. Room views fit edge objects between the phone controls.
- Earned story toys remain playable: wind the cabinet's little dancer, rock the mended bear and greet the guest. These interactions are free and never repeat chapter rewards.
- Physical tea service: grab a mint-enamel pot, slide its spout over open porcelain cups, tilt it and watch amber tea rise toward the engraved gold lines. Release to stop, top up a short cup, or empty an overfilled one. Serve the actual tray. Two-cup service grows to three cups with mastery; four saved personal bests reward accuracy and less waste. The guest's story introduces the same skill with one cup and preserves the sprig through canceled attempts.
- Three distinct rituals: physical tea pouring, embroidery study/recall with free hints, and a reversed moon-song echo. Mastery rewards the first two completions per activity per earned day; practice is always free and mistakes cost no buttons. Rewards wait for 20 seconds of unpaused play between completions. Guest tea advances only its story; it cannot award ritual progression.
- Twelve earned room-restoration stages unlocked through mastery and buttons, with visible arrangements that persist across reloads.
- Six keepsakes, three placement slots per room, clear prices, cancellation without charge and full refunds on packing away. Select an owned keepsake in the scene to turn it or move it without buying again.
- A four-minute day/night cycle, a manual evening/morning control, a shy sheet ghost and six journal discoveries (one per in-game night). From the third whisper on, the visitor waits for a cozier house (45% to 68%).
- Original procedural music-box notes, gesture-gated sound, pause, reduced motion and adjustable rendering detail.
- Versioned local saves. Hidden tabs pause. English/Arabic copy and direction switch together.

This is a first playable, not a claim of production certification. Assets are original procedural meshes and canvas textures, not final sculpted GLB artwork. Residents wander within their assigned room; changing rooms is a gentle relocation, not stair navigation. Furnishing uses predefined slots rather than freeform physics. There is no online account, cloud save, social system or monetization.

## Controls

Follow the clue into a room. **Touch an object once to select it, then touch the same object again to act.** When something is in your hand, drag it onto an object in the room; a wrong destination leaves it safely in your hand. Tap the held item to find the next room. Story progress and carried items survive reloads.

For keyboard play, choose a room, open **Things to touch**, select an object and activate its scene action. **Look closer** opens optional details. **House tools** opens the household, ritual, decoration, journal and settings controls. Tap a doll to check its care and wishes. Practice rituals for mastery and earn room restorations; choose and place keepsakes through Decorate. After dark, greet the visitor to hear a whisper.

Drag the room to turn; pinch/scroll to zoom. Arrow keys turn, `+`/`-` zoom, `H` resets the camera, `Space` pauses, and `Escape` cancels a carry, dismisses selection or closes a sheet. DOM controls provide keyboard alternatives to 3D picking.

At the tea table, **grab the pot, move sideways to aim and drag down to pour**. Release near each cup's gold line. Touch an overfilled cup to empty it; touch the tray when every cup is ready. After serving, touch the pot to practice again or the tray to return to the house. On a keyboard, arrows aim, held `Space` pours, `E` empties the aimed overfilled cup, `Enter` serves/returns and `Escape` leaves the table. Sound and pause remain available. Pausing, changing tabs, rotating the phone or losing the gesture releases the pot safely.

## Verification

```sh
npm run verify
python -m pip install -r requirements.txt
python -m playwright install --with-deps chromium
npm run test:browser
python scripts/ui_check.py
python scripts/art_check.py
python scripts/expansion_check.py
python scripts/story_check.py
TEA_HEADED=1 xvfb-run -a python scripts/tea_check.py
```

The browser check exercises the built HTTP application, care/rewards, placement/cancellation/refunds, night/mystery progression, pause, saving/reloading, Arabic, mobile portrait/landscape and reduced motion. It records screenshots and JSON results under `artifacts/`. CI retains evidence, including on failure. The expansion check additionally uses actual object ray picks, relocation/rotation/reload, recall/hints, reverse echo, restoration budgets and Arabic touch controls. A preview being available is not proof the browser checks passed.

`?debug=1` explicitly enables read-only diagnostics for tests. Normal play does not expose simulation state globally.

The story check completes all eleven actions through actual scene touches and pointer drops, including wrong destinations, mid-carry reload, Escape, pause, optional keyboard inspection, replay without duplicate rewards, Arabic phone play at 320/390px, and 667px landscape completion. It observes read-only diagnostics and never writes progress or submits synthetic scores.

The tea checks use real mouse drags, touch gestures and keyboard input to exercise misses, partial pours, local overfill repair, serving, free practice, personal-best reloads, input cancellation and the guest's cup. Three independent journeys start from fresh saves: `TEA_SCENARIO=desktop`, `phone` or `progression`; the default runs all three. Progression earns the three-cup table through actual service, cooldowns and house days. Empty, pouring, spilled, ready and served states are captured under `artifacts/tea/<scenario>/`, alongside observed wall/game time for long waits. CI runs the journeys separately and retains evidence for each.

The tea journeys retain Playwright 1.55.0. On Linux, the headed command above follows [Playwright's Xvfb setup](https://playwright.dev/python/docs/ci#running-headed). On a desktop with a display, use `TEA_HEADED=1 python scripts/tea_check.py`.

Genuine tab visibility has its own headed check and pinned Playwright 1.60.0 environment. It uses the documented [`connect_over_cdp(no_defaults=True)`](https://playwright.dev/python/docs/api/class-browsertype#browser-type-connect-over-cdp-option-no-defaults) option on the existing default browser context, so Playwright does not force the game tab to remain active. The check enters tea through the actual kitchen prop, holds and pours with the real mouse, switches to another tab, and requires the game document to become hidden within 20 seconds and release its pot. Returning to the foreground must leave the pour released. Read-only before/hidden/restored observations and foreground-only screenshots are retained under `artifacts/visibility/`; CI runs this check independently and uploads evidence even on failure.

Use a separate environment so this check does not change the normal browser-test dependency:

```sh
python -m venv /tmp/bait-visibility-venv
/tmp/bait-visibility-venv/bin/python -m pip install -r requirements-visibility.txt
/tmp/bait-visibility-venv/bin/python -m playwright install --with-deps chromium
xvfb-run -a /tmp/bait-visibility-venv/bin/python scripts/visibility_check.py
```

On a desktop with a display, omit `xvfb-run -a`. The fixture always launches a headed browser. A successful source build alone does not certify the rendered activity.

## Boundaries

`src/simulation.js` owns serializable state and rules. `src/content.js` owns stable authored IDs. `src/render/` adapts state into Three.js geometry and animation. `src/ui.js` owns accessible DOM controls, `src/i18n.js` all game text, `src/audio.js` local synthesis. Build/serve scripts are small native Node modules.

## Reference direction

Read-only references: **Al-ejar** (legible, meaningful room furnishings), **Al-bayyara** (care/progression and separation of simulation and presentation), **souq-al-layl** (warm light against darkness and restrained UI), **Al-nafetha** (mobile-first bilingual intimate spaces). No code or assets were copied from those games, and those repositories were not modified.

Three.js is MIT-licensed; its license ships in `dist/vendor/THREE-LICENSE.txt`.
