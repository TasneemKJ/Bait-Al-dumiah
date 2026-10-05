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
5. Budgets: under 400k triangles and 388 draw calls in the first scene (enforced by `play_check.py`).
6. Hidden tabs pause; held tea, needle and chimes release safely.

## Tests
`tests/*.test.mjs` (node:test) cover simulation, content copy, gestures and CSS policy; `tests/art-*-checks.js` are run in the browser by `scripts/art_check.py`. Browser scripts in `scripts/` drive the built game with Playwright.

## Cold-entry boundary
Home renders the native house with zero delta and hides/inerts all gameplay UI. It never calls simulation step or writes `bait-al-dumiah.v1`. One Play/Continue activation starts normal play. A separate `bait-al-dumiah.v1.preferences` record stores whitelisted Home settings with their canonical-settings base; a newer canonical save wins over a stale record. A failed initial save read locks canonical writes for that visit. Home is the first simplification slice; current gameplay remains dense.
