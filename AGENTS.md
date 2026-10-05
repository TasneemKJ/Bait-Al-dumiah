# Agent guide

Read `README.md`, then `ARCHITECTURE.md`, `DESIGN_RULES.md`, `DESIGN.md`, `TODO.md` and the design in `docs/superpowers/specs/` before changing the game. `CLAUDE.md` holds day-to-day conventions.

## Project rules (permanent)
- Keep the cute-and-creepy Levantine miniature-home identity; no gore or jump scares.
- Simulation state belongs in `src/simulation.js`, never in meshes or UI callbacks.
- New visible copy must exist in English and Arabic in `src/i18n.js`.
- Preserve the public save key (`bait-al-dumiah.v1`) and version unless a tested migration accompanies the change. New state is added lazily and whitelisted in `restore()`.
- Keep all runtime dependencies and artwork local; do not add analytics or remote assets.
- Respect the low-chrome playfield, 44px control targets, reduced motion and audio gesture boundaries.
- Write behavioral tests, run `npm run verify` and the browser checks, inspect screenshots, and state any unverified behavior honestly.

## Iteration workflow
1. **Validate** the request against `ARCHITECTURE.md`, `DESIGN_RULES.md` and `DESIGN.md`. On a violation: stop, name the rule, propose alternatives.
2. **Brainstorm** 20 ideas (IDEAL: identify, define, explore, act, look back; and the 5Ws: who the player is, what they feel or do, when in the session, where in the game, why it affects retention). Spread them across the lenses: visuals, atmosphere, game feel, UI/UX, onboarding and self-teaching, loop and balance, audio, writing and Levantine Arabic quality, accessibility, controls, replayability, data safety, performance, release readiness, stability. Shortlist the few that belong to this game; record them in `TODO.md` and the ledger `docs/superpowers/iteration-ledger.md`.
3. **Update `DESIGN.md`** when what the player sees or feels changes, then `TODO.md`.
4. **Implement** small verified increments.
5. **Test**: behavior tests in `tests/*.test.mjs`, then the checks below. View the screenshots before shipping.

## Commands
```sh
npm install ; npm run verify          # node tests + build (the fast gate)
PORT=4391 CHROMIUM_PATH=/opt/pw-browsers/chromium npm run test:browser   # play_check.py; needs `pip install -r requirements.txt`
```
`scripts/play_check.py` honours `PORT` (default 4177). Other machine-wide browser scripts are listed in `README.md`. On a shared machine pick a unique port and wrap Playwright runs in `flock /tmp/browser.lock` (start servers outside the lock).

## Standing rules (from the owner; apply every session)
- **Mobile first**, including phone WebGL performance. Check with touch emulation at 360x640, 390x844, 412x915 and landscape 844x390, in both languages; measure with 4x CPU throttle. A mobile failure blocks the PR.
- **Visuals and UI/UX** must be captivating and professional and fit the dollhouse's atmosphere (soft porcelain, cream paper, rose and gold, gentle dread). Every iteration includes a visual pass; view the screenshots as an art director and as a player before shipping. Principles are in `DESIGN.md`.
- **Brainstorm** 20 ideas each iteration (step 2).
- **Local first.** Audit, fix, test and self-review the diff locally; one push, one PR and one merge per verified batch. The owner has asked for merges, so merging a green batch PR is allowed. Back-up pushes of the dev branch use `[skip ci]` in the tip commit; the PR head gets a normal commit.
- **Fast gate**: PR and deploy checks stay at 2 minutes or less (`verify` only). Heavy suites (chimes, expansion, tea, sewing, visibility) are manual (`workflow_dispatch`) or weekly (`full-suite.yml`).
- **Artifacts**: failure-only, trimmed (`scripts/trim-artifacts.py`), one per job, 1-day retention.
- **No Vercel tool calls.** Keep GitHub API use minimal; no polling.
- **Screenshots are viewed**, saved in the scratchpad not the repo.
- **Save compatibility**: never break `bait-al-dumiah.v1`.
