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
- Three authored dolls with animated reactions, fullness, energy, comfort and daily wishes.
- Tea, play, naps and reassurance. Wishes earn buttons; tea costs two. Decorating changes the 3D room and household coziness.
- Six keepsakes, three placement slots per room, clear prices, cancellation without charge and full refunds on packing away.
- A four-minute day/night cycle, a manual evening/morning control, a shy sheet ghost and six journal discoveries (one per in-game night).
- Original procedural music-box notes, gesture-gated sound, pause, reduced motion and adjustable rendering detail.
- Versioned local saves. Hidden tabs pause. English/Arabic copy and direction switch together.

This is a first playable, not a claim of production certification. Assets are original procedural meshes and canvas textures, not final sculpted GLB artwork. Residents wander within their assigned room; changing rooms is a gentle relocation, not stair navigation. Furnishing uses predefined slots rather than freeform physics. There is no online account, cloud save, social system or monetization.

## Controls

Tap a doll or open **Little souls**. Fulfil the highlighted wish to earn buttons. Open **Decorate**, choose a keepsake, then tap a glowing spot or choose a room and spot using the controls. After dark, greet the visitor to hear a whisper.

Drag to turn; pinch/scroll to zoom. Arrow keys turn, `+`/`-` zoom, `H` resets the camera, `Space` pauses, `Escape` closes a sheet. DOM controls provide keyboard alternatives to 3D picking.

## Verification

```sh
npm run verify
python -m pip install -r requirements.txt
python -m playwright install --with-deps chromium
npm run test:browser
```

The browser check exercises the built HTTP application, care/rewards, placement/cancellation/refunds, night/mystery progression, pause, saving/reloading, Arabic, mobile portrait/landscape and reduced motion. It records screenshots and JSON results under `artifacts/`. CI retains evidence, including on failure. A preview being available is not proof the browser checks passed.

`?debug=1` explicitly enables read-only diagnostics for tests. Normal play does not expose simulation state globally.

## Boundaries

`src/simulation.js` owns serializable state and rules. `src/content.js` owns stable authored IDs. `src/render/` adapts state into Three.js geometry and animation. `src/ui.js` owns accessible DOM controls, `src/i18n.js` all game text, `src/audio.js` local synthesis. Build/serve scripts are small native Node modules.

## Reference direction

Read-only references: **Al-ejar** (legible, meaningful room furnishings), **Al-bayyara** (care/progression and separation of simulation and presentation), **souq-al-layl** (warm light against darkness and restrained UI), **Al-nafetha** (mobile-first bilingual intimate spaces). No code or assets were copied from those games, and those repositories were not modified.

Three.js is MIT-licensed; its license ships in `dist/vendor/THREE-LICENSE.txt`.
