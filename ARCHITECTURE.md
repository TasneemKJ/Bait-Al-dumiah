# Architecture

Static site, no bundler at runtime: `scripts/build.mjs` copies `index.html`, `src/` and `public/` into `dist/` with local Three.js (`dist/vendor`). WebGL2 required; a recovery screen appears if graphics fail.

## Layers
- `src/content.js`, `src/locale-data.js`, `src/i18n.js`: data and bilingual copy (`SAVE_KEY` lives in content.js).
- `src/simulation.js`: all state and rules (`createState`, `step`, `care`, `place`, rituals, story, `restore`). Pure data, no DOM, no WebGL. Helper pure modules: `stitch-path.js`, `lullaby-score.js`, `night-score.js`, input adapters (`tea-input.js`, `stitch-input.js`, `chime-input.js`, `carry-gesture.js`).
- `src/render/`: Three.js world (`world.js`, `house.js`, dolls, props, cameras, `visual-policy.js` for lighting, detail and framing). Reads state, never mutates it.
- `src/ui.js` and `*-ui.js`: DOM shell, panels, ribbons, ritual overlays. Styles in `src/*.css`.
- `src/home-session.js`: cold-entry and safe persistence boundary; `src/home-ui.js`/`home.css`: inactive Home and flat preferences.
- `src/main.js`: runs the gated loop and wires everything; `?debug=1` exposes `window.dollhouse`.

## Rules
1. State changes only in `simulation.js` functions; UI calls them then re-renders.
2. Saves: key `bait-al-dumiah.v1`, version 1. `restore()` whitelists, clamps and defaults every field; no saved HTML, renderer objects or wall-clock catch-up. Events are transient. Saved sound intent is retained; audio remains disabled until a Play or Sound gesture.
3. All copy has English and Arabic entries; direction switches with language.
4. No remote assets or analytics.
5. Budgets (phone profile 390x844, dpr 3, 4x CPU throttle, measured by `scripts/perf_check.py`, weekly in `full-suite.yml`): dist at most 2 MB; ready in at most 25 s under software WebGL; under 400k triangles and 388 draw calls; median CPU time of one animation-frame callback at most 33 ms under 4x throttle (30 fps headroom; measured 27.1 ms, p90 43 ms, on 2026-10-05). Main-thread task time and SwiftShader wall-clock frame time are reported only: they measure the software GPU, not a phone. `play_check.py` also enforces the triangle and call ceilings.
6. Saves: `SAVE_VERSION` and `migrate()` in `simulation.js`; `readSave()` reports unreadable or newer saves, and `home-session.js` keeps them under `bait-al-dumiah.v1.backup` after Play and before a fresh house is saved; backup failure blocks canonical replacement. Export/import in Settings uses the same validation.
7. Hidden tabs pause; held tea, needle and chimes release safely.

## Tests
`tests/*.test.mjs` (node:test) cover simulation, content copy, gestures and CSS policy; `tests/art-*-checks.js` are run in the browser by `scripts/art_check.py`. Browser scripts in `scripts/` drive the built game with Playwright.

## Cold-entry boundary
Home renders the native house with zero delta and hides/inerts all gameplay UI. It never calls simulation step or writes `bait-al-dumiah.v1`. One Play/Continue activation starts normal play. A separate `bait-al-dumiah.v1.preferences` record stores whitelisted Home settings with their canonical-settings base; a newer canonical save wins over a stale record. Entry re-reads the exact canonical bytes and refuses changed, deleted or unreadable identity without changing the existing state/renderer binding. The same entry slot becomes explicit Reload recovery. Writes repeat that identity check; only successful owned saves advance the expected bytes. Home is the first simplification slice; current gameplay remains dense.

## Pinned-main integration boundary
Main 211c1f02 adds Larger text, save migration/import/export, PWA assets, wider portrait whole-house framing and resident wish glow. The Home feature keeps its measured room/selection/rotation controller; `houseFraming` passes room insets through unchanged while widening only the whole-house view. The existing accessible fold owns the unread-clue marker. Return greetings wait until entry, and native performance measurement enters the actual game once before sampling. All integrated native geometry, performance and interaction claims require fresh exact-source evidence.
