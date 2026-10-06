# Safe Home entry, first incremental slice

Baseline: reviewed draft 22 source 283b4905. Approved design: `mobile-reference-research/bait/DESIGN.md`; latest owner refinement is Home Play/Continue + Preferences, with a single flat Sound/Language/Back surface. Execution: this assigned implementation task, source-only; publication and independent review belong to the parent.

## Change contract
- Cold launch shows a real inactive Home, not gameplay behind a start overlay. Exactly two visible actions. Preferences replaces Home content with exactly three actions, including Back.
- One activation enters the actual existing game. New profiles focus Lina's kitchen; saved profiles retain canonical story, economy and rewards.
- No simulation step, event drainage, economic change, gameplay save, scene picks, camera gestures or gameplay keyboard action can run on Home. Rendering reads state with zero delta.
- Existing version-1 public key is unchanged. Invalid saves fall back safely. A failed initial storage read never permits a fresh fallback to overwrite a potentially valid existing save. Home preference updates use a separate bounded settings record, preserving the canonical save bytes until entry.
- Saved sound preference is retained but AudioContext is never enabled without a Play or Sound gesture. Lifecycle changes pause audio and safely release work input as before.
- Gameplay chrome remains unchanged and dense. This is not full simple-play acceptance. No rewards, prices, story steps, rituals, selection/ribbon/rotation files or existing game controls are removed or bypassed.

## Visual inventory
Reference-only ImageGen concept: scratch evidence `bait-simple-home/home-concept.png`, based on inspected native 283b house screenshot. The actual game retains its native Three.js house, roof, dolls and materials, intentionally not the generated reconstruction. No raster UI or new sprites are shipped.
Allowed Home copy: localized game title, Play or Continue, Preferences. Preferences: heading, Sound on/off, named alternate language, Back, essential failure status only. Cream #f1e7dd background, ink #574451, rose #804a64 primary, restrained serif title/buttons, no cards or HUD. Native house receives a dedicated middle stage. Portrait stacks title/stage/actions; landscape puts the stage beside title/actions. Safe-area padding, 44px targets and no added motion.

## Task 1: session and storage boundary (RED/GREEN)
Create `tests/home-session.test.mjs` using real simulation/restore and in-memory Storage. Demonstrate current boot behavior can advance and save without entry using the existing loader seam, then add `src/home-session.js`.
API: `createHomeSession({storage,reducedMotion})` returns restored state, valid-save flag, entered getter, idempotent `enter()`, gated `advance(state,dt)`, gated `save(state)`, and separate `savePreferences(settings)`. Test fresh/valid/corrupt/future-version, read/write failures, zero Home progression, one-time entry, canonical byte preservation, preference precedence and once-only story reward preservation. Persist only whitelisted preference fields.

## Task 2: code-native Home surface (RED/GREEN)
Create `tests/home-ui.test.mjs` with deterministic DOM adapter tests and bilingual/copy contracts; add `src/home-ui.js`, `src/home.css`, bilingual strings and index markup. Assert two Home controls, three flat Preferences controls, explicit alternate-language label, Back/Escape focus restoration, ready/fatal boundary, no focusable gameplay under Home. Keep title and core controls stable during preference changes. Native layout/touch acceptance remains deferred to the allowed workflow.

## Task 3: integrate real lifecycle (RED/GREEN)
Create an executable `main.js` integration harness using VM module loading with real simulation/session and bounded DOM/render/audio adapters. Capture requestAnimationFrame and native lifecycle handlers. Assert Home time/economy/save/picks/keys untouched; real Play click activates once; duplicate Play cannot reinitialize or reward; Home preferences do not touch canonical bytes; initial audio requires gesture; pagehide/visibility before entry cannot write; repeated hide/show preserves state and cancels input. Then integrate the session and surface into `main.js`; keep gameplay branches intact.

## Task 4: verify and freeze
Run focused tests after each slice, then `npm run verify` including existing 269 tests and total shipped gzip JS <= 500 KiB including Three.js. Review exact diffs and hashes; confirm stable-selection files unchanged. Update DESIGN/TODO/iteration ledger with 20 ideas and honest scope. Freeze text payload + SHA-256 manifest and native acceptance plan for independent review. Do not publish. Do not launch a local browser, create cloud tasks, clean up files or claim native/fidelity acceptance. Native workflow after review must exercise both locales, 320px/normal portrait, short landscape, rotation, touch, keyboard, reduced motion, safe areas, real 120-second opening, save reload and advanced saves. Existing native stable-selection evidence proves measured ownership only, not rapid taps.

## Independent review correction: native entry boundaries
The reviewer found the existing HTTP native scripts still expected immediate play. Add `scripts/game_entry.py` with one genuine Home button click after every actual-game navigation/reload, keeping `scene_ready` read-only. Cover all ten actual-game scripts and leave the separate component/art documents untouched. The stability whole-house case must explicitly press its existing camera reset before selection because new-profile Play now focuses the kitchen. Add test-first helper/call-site contracts, compile Python scripts and rerun full verification; preserve all real gesture/unchanged-coordinate assertions. These source tests use the Python standard library to execute the native helper and parse its consumers; they do not launch a browser.
