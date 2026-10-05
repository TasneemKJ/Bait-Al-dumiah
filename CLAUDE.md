# CLAUDE.md

**Read `AGENTS.md` first** (workflow, guards, standing rules). Day-to-day conventions for Bait Al-dumiah (بيت الدمية), a mobile-first 3D dollhouse simulation:

- `npm install`, `npm run dev` (http://127.0.0.1:4177, set `PORT` to change), `npm run verify` (tests + build), `npm run test:browser` (needs Playwright; set `PORT`, `CHROMIUM_PATH`).
- Simulation and rules live in `src/simulation.js`; `src/content.js` holds data; `src/render/` is Three.js; UI is DOM in `src/ui.js` plus feature `*-ui.js` modules. Layers: content, simulation, render, ui, main.
- Saves: key `bait-al-dumiah.v1`; `restore()` whitelists and clamps every field. Test corruption and storage failure when touching it.
- Copy through `i18n.js` in English and Arabic; verify RTL.
- 44px targets, `env(safe-area-inset-*)`, reduced motion respected, audio only after a gesture.
- Tests use `node --test tests/*.test.mjs` with behavior assertions.
