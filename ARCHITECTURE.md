# Architecture

Static site, no bundler at runtime: `scripts/build.mjs` copies `index.html`, `src/` and `public/` into `dist/` with local Three.js (`dist/vendor`). WebGL2 required; a recovery screen appears if graphics fail.

## Layers
- `src/content.js`, `src/locale-data.js`, `src/i18n.js`: data and bilingual copy (`SAVE_KEY` lives in content.js).
- `src/simulation.js`: all state and rules (`createState`, `step`, `care`, `place`, rituals, story, `restore`). Pure data, no DOM, no WebGL. Helper pure modules: `stitch-path.js`, `lullaby-score.js`, `night-score.js`, input adapters (`tea-input.js`, `stitch-input.js`, `chime-input.js`, `carry-gesture.js`).
- `src/render/`: Three.js world (`world.js`, `house.js`, dolls, props, cameras, `visual-policy.js` for lighting, detail and framing). Reads state, never mutates it.
- `src/ui.js` and `*-ui.js`: DOM shell, panels, ribbons, ritual overlays. Styles in `src/*.css`.
- `src/main.js`: loads/saves state, runs the loop, wires everything; `?debug=1` exposes `window.dollhouse`.

## Rules
1. State changes only in `simulation.js` functions; UI calls them then re-renders.
2. Saves: key `bait-al-dumiah.v1`, version 1. `restore()` whitelists, clamps and defaults every field; no saved HTML, renderer objects or wall-clock catch-up. Events are transient. Muted is always true on load.
3. All copy has English and Arabic entries; direction switches with language.
4. No remote assets or analytics.
5. Budgets (phone profile 390x844, dpr 3, 4x CPU throttle, measured by `scripts/perf_check.py`, weekly in `full-suite.yml`): dist at most 2 MB; ready in at most 25 s under software WebGL; under 400k triangles and 388 draw calls; main-thread work per frame at most 50 ms (script at most 35 ms) under 4x throttle, about 12 ms unthrottled. SwiftShader wall-clock frame time is reported only: it measures the software GPU, not a phone. `play_check.py` also enforces the triangle and call ceilings.
6. Saves: `SAVE_VERSION` and `migrate()` in `simulation.js`; `readSave()` reports unreadable or newer saves, and `main.js` keeps them under `bait-al-dumiah.v1.backup` before a fresh house is saved. Export/import in Settings uses the same validation.
7. Hidden tabs pause; held tea, needle and chimes release safely.

## Tests
`tests/*.test.mjs` (node:test) cover simulation, content copy, gestures and CSS policy; `tests/art-*-checks.js` are run in the browser by `scripts/art_check.py`. Browser scripts in `scripts/` drive the built game with Playwright.
