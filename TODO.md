# TODO

## Done this iteration
- [x] play_check honours `PORT`; CI fast gate, failure-only trimmed artifacts, weekly full suite.
- [x] Objective step counter no longer wraps on narrow landscape cards (test: `tests/mobile-hud.test.mjs`).
- [x] Mobile home-screen check: no overflow, no sub-44px targets at 360x640, 390x844, 412x915, 844x390 (English).

## Round 2 (2026-10-05)
Brainstorm, 20 ideas (IDEAL: problem, definition, options, act, look back; 5Ws: a phone player, mid-session, at the top HUD or on return, because clutter over the hero house and silent returns lose players):
1. Clue folds into a chip on phone portrait (UI/UX, visuals) - **shipped**
2. Whole house framed on 360-412 portrait (visuals, mobile) - **shipped**
3. Consistent HUD gutter in portrait and short landscape (UI/UX) - **shipped**
4. Welcome-back line naming what waits (retention, session design) - **shipped**
5. Save backup on unreadable/newer saves (data safety) - **shipped**
6. Save export/import (data safety, session design) - **shipped**
7. Mirror directional arrow in Arabic (Arabic/RTL) - **shipped**
8. Manifest, icons, share card from the real house (release readiness) - **shipped**
9. Privacy note and credits link in Settings (release readiness) - **shipped**
10. Measured phone performance budgets (performance) - **shipped** (script + weekly)
11. Unread-clue dot as a gentle first-five-minutes cue (onboarding) - **shipped**
12. Doll waves when a returning player opens the house (feel, retention) - later; needs acting work
13. Dusk music swell (audio) - **shipped**
12. Doll waves when a returning player opens the house (feel, retention) - **shipped** (reuses greeting pose)
13. Dusk music swell (audio) - later
14. Tea steam and dust motes (atmosphere) - owned by the atmosphere work in PR #20
15. Larger-text setting (accessibility) - **shipped (panels)**
16. Daily wish glow on the doll who wishes (self-teaching) - **shipped** (first three days)
17. Gift collection page for visitor gifts (replayability) - **shipped** (keepsake shelf with art)
18. Shami proverb on the loading card (writing, Levantine) - **shipped**
19. Minified three.js upgrade path (performance, upgrades) - later; #18 closed because 0.186 dropped .min builds
20. Low-detail auto fallback when frames drop (performance) - built on branch claude/game-audit-qa-batch9 (CPU-time governor, tested); NO PR until a real-device check shows benefit and the one-time shader-recompile hitch is acceptable (SwiftShader here cannot measure either)

## Open
- [ ] Arabic/RTL mobile screenshots and panels (household, journal, settings, night) reviewed.
- [ ] Absolute `og:image` URL once the production domain is recorded; artist icons and share card (ASSET_REQUESTS.md).
- [ ] Performance budgets measured under 4x CPU throttle in the weekly suite.
- [ ] Versions live in package.json and CHANGELOG (tags are not pushed: the proxy rejects them).

## Brainstorm (iteration 2026-10-05, 20 ideas)
Chosen: nowrap counter (UI/UX, mobile), docs set (stability for later sessions). Others, not yet built: first-night greeting hint (onboarding), soft lullaby swell at dusk (audio), return-day greeting from dolls (retention), collection page for visitor gifts (replayability), save export (data safety), wider portrait framing (visuals), lower-poly fallback on weak phones (performance), larger text option (accessibility), gamepad rail for room tabs (controls), Levantine proverb on loading (writing), dust motes in sunbeams (atmosphere), tea steam particles (game feel), jasmine scent journal entry (authenticity), share card (release), error-boundary retry button (stability), nightly gift choice (loop), daily wish hint glow (self-teaching), pause-on-hidden toast (session), button-economy dashboard (balance), seed-varied dolls' wishes (replayability).

## Active atmosphere slice — 2026-10-05
- [x] Reproduce and fix inherited-key room lighting fallback (behavioral regression).
- [ ] Distinct mint enamel and woven bear finish, within existing story-art budget.
- [x] Material-specific, gesture-gated tin/cloth foley with source behavior tests.
- [ ] Brief bear cloth response; deferred with material visual changes until browser access works.
- [ ] Rendered desktop/phone, Arabic, reduced-motion and 4x CPU checks.
- [ ] Review actual screenshots and listen to foley before release; draft publication may record the blocker.
- [ ] Continue the unfinished forty-item roadmap in `docs/visual-40/2026-10-05-ultra-atmosphere.md`; numeric arrays do not count as passes.

Twenty ideas and IDEAL/5Ws for this slice are recorded in the iteration ledger. Selected: enamel, woven bear, bounded touch response, tin/cloth foley, matte pollen batching, safe lighting lookup. Other ideas remain deferred or preserved invariants.


## Reclaim the miniature — 2026-10-05
- [x] Inspect original baseline phone/desktop pixels and record twenty IDEAL/5Ws ideas in `docs/superpowers/specs/2026-10-05-reclaim-the-miniature.md`.
- [x] Reproduce the wasted camera reservation and redundant arrival clue before source changes.
- [x] Fit focused rooms to the currently visible edge, preserving authored edge-prop bounds and independent ritual cameras.
- [x] Fold the contextual clue and replace stacked portrait capsules with a restrained two-row navigation edge; preserve 44px fallback targets.
- [x] Keep crowded selected-object feedback inside its existing ribbon, avoiding a second scene-covering card.
- [x] Add observer lifecycle, bilingual context and framing regressions plus real-DOM capture assertions.
- [ ] Run exact-commit real-DOM/full-game browser suites and inspect EN/AR day/night before/after originals, including 4× CPU and ritual returns. Visual acceptance remains pending.
- [ ] Review material/contact-depth refinements as a separate later art slice.

Selected ideas: camera composition, folded contextual guidance, material-led navigation and arrival self-teaching. The other sixteen ideas remain an explicit sequenced backlog in the spec; none is reported as implemented by this batch.

## Stable scene selection correction
- [x] Trace the native unchanged-coordinate second-touch miss and compare camera/paper alternatives.
- [x] Add failing projection/gesture regressions, preserve direct scene poses and cache pending insets.
- [x] Place portrait selection paper by measured clearance; classify top paper correctly and hold it during drag.
- [x] Add unchanged-position native touch checks and strengthen actual held destination checks in the full story journey.
- [ ] Verify exact corrected source through native same-position, bilingual short-phone and full physical journeys; inspect original images before merging.
- [x] Reproduce and inspect the bilingual whole-house landscape ribbon overlap with unchanged-coordinate native input.
- [x] Extend measured-clearance placement to short landscape, respecting intersecting controls and safe areas; add final-fit exposure regressions.
- [ ] Obtain independent review and fresh exact-source focused native acceptance before full ritual journeys or merge.


## Simple opening, first bounded slice
- [x] Real cold-launch Home: Play/Continue plus Preferences; flat Sound/Language/Back.
- [x] Test-first canonical time/save gate, once-only activation, saved preference handling, failed-read protection and visible audio failure.
- [x] Keep native house, costs/rewards, physical rituals and stable selection/rotation source unchanged.
- [ ] Independent frozen-source review, then exact-source native EN/AR small-phone/landscape/rotation/keyboard/touch/reload acceptance and original screenshot inspection.
- [ ] Execute a real fresh-profile 120-second opening; source-clock tests are not native play evidence.
- [ ] Replace gameplay chrome only after every command family has a tested world/context route, including care alternatives, restoration, placement, visitor, earned claims and advanced saves.
- [ ] Simplify all remaining surfaces, not just Home: main play, Pause, utilities, focused actions/choices, rituals/results and recovery. No giant catalog hidden behind one button.

The twenty current ideas and chosen/deferred boundary are recorded in the iteration ledger and `docs/superpowers/plans/2026-10-05-safe-home-entry.md`. No retention or rapid-tap claim is made.

## Brainstorm 3: visuals and atmosphere (2026-10-06)
Chosen: **golden hour at dusk** (shipped). Shortlist, not built: (a) soft lamp light pools on the floor at night, (b) warm window glow seen from outside as lit panes, (c) dust motes lit inside sunbeams near windows by day, (d) paper-grain material overlay on cards, (e) steam over the kettle in the kitchen when Lina is idle, (f) slow cloud shadows across the backdrop, (g) soft vignette that tightens at night, (h) curtain sway on the open window at dusk. Rejected for cost or risk on phones: volumetric light shafts, real-time reflections.
## Decisions and parked items (2026-10-06)
- Day-1 trough (pacing audit): not fixing income. A calm line at about minute 1.5 makes the quiet stretch feel intended. Wish rotation after a grant stays a parked proposal (changes income and the streak rule; re-run `scripts/pacing-curve.mjs` first).
- Story voice addresses the player in the masculine by default (`إنت`, `وانت غايب`, `فيك تصلّح`). Consistent and deliberate: leave as is; a gender-neutral pass would be a full copy rewrite.
- Late-game sink (proposal only, not built): after the door opens the only sink is a 12-button gift per night while income stays near 25 per minute. One small option for the owner: a "keepsake shelf" purchase, one new visitor keepsake per three nights at a rising price (30, 45, 60...), reusing the gift art path. It adds a sink without changing earning; measure with the pacing script before shipping.
- Low-detail governor: parked on branch `claude/game-audit-qa-batch9`; no PR until a real-device check shows the benefit and the one-time shader-recompile hitch is acceptable.

- Brainstorm 3 follow-up: lamp pools and kettle steam shipped. Sunbeam motes NOT built: the frame-cost check is too noisy under SwiftShader to prove it free (see the PR); revisit with a real-device measurement.

- Cloud shadows skipped: the backdrop is a procedural shader, not a texture on a mesh, so a scrolling cloud term would add per-pixel shader work over the whole screen; not a cheap texture offset. Sunbeam motes still wait for a real-device frame-cost check.

## 2026-10-08 — Cycle 1: first-night invitation delivery

IDEAL: Identify the missing announcement handler; define a once-only visible invitation; explore the twenty options below; act on the existing event-to-notice route; look back with RED/GREEN simulation-to-feedback tests and rendered night capture.
5Ws: casual phone player; understands how to greet the visitor; first earned dusk; door and existing toast; makes the existing gentle mystery discoverable without a new loop.

1. Reveal the existing visitor hint at first night. **Selected.**
2. Keep the hint silent on repeat nights. **Selected.**
3. Use the authored Arabic visitor verb. **Selected.**
4. Match the invitation to the visible visitor control. Preserve/check; no separate feature claimed.
5. Route the hint through the existing notice queue. **Selected.**
6. Retain the existing once-only simulation flag. Preserve/check; no separate feature claimed.
7. Keep it visible with sound disabled. Preserve/check; no separate feature claimed.
8. Check the night toast contrast. Preserve/check; no separate feature claimed.
9. Keep the door scene unobstructed. Preserve/check; no separate feature claimed.
10. Avoid a second tutorial sheet. Preserve/check; no separate feature claimed.
11. Preserve a pending reward announcement. Preserve/check; no separate feature claimed.
12. Keep the ghost non-threatening. Preserve/check; no separate feature claimed.
13. Do not automatically greet the visitor. Preserve/check; no separate feature claimed.
14. Do not spend buttons when explaining. Preserve/check; no separate feature claimed.
15. Use the existing screen-reader status region. Preserve/check; no separate feature claimed.
16. Test manual evening and natural dusk. **Selected.**
17. Preserve old-save hint suppression. Preserve/check; no separate feature claimed.
18. Check small portrait wrapping. Preserve/check; no separate feature claimed.
19. Check RTL short-landscape wrapping. Preserve/check; no separate feature claimed.
20. Stamp screenshot evidence to source. **Selected.**

Root cause: `step()` emits `first-night` and records its hint flag, but `announce()` discards it. RED: the real simulation-to-feedback test failed because no localized hint reached the toast. Native visual acceptance pending.

## 2026-10-08 — Cycle 2: first-day quiet delivery

IDEAL: Identify consumed calm event; define visible reassurance after care; explore twenty alternatives; act on existing bilingual notice; look back through actual care/step/announcement regression and phone screenshots.
5Ws: first-time care player; reads a warm quiet beat; minute 1.5 on day one; kettle/house toast; understands intentional breathing room without added currency or urgency.

1. Deliver the authored quiet-after-care sentence. **Selected.**
2. Keep the quiet beat optional to read. Preserve/check or deferred; not a shipped feature.
3. Retain the ninety-second trigger. Preserve/check or deferred; not a shipped feature.
4. Avoid promising protection beyond current needs. Preserve/check or deferred; not a shipped feature.
5. Keep later days quiet. Preserve/check or deferred; not a shipped feature.
6. Prevent a repeated calm announcement. **Selected.**
7. Let queued rewards retain their order. **Selected.**
8. Keep the kettle as the named local anchor. Preserve/check or deferred; not a shipped feature.
9. Retain warm Levantine Arabic. **Selected.**
10. Test a real care before the quiet beat. **Selected.**
11. Test an idle visitor receives no care praise. Preserve/check or deferred; not a shipped feature.
12. Preserve old-save suppression. Preserve/check or deferred; not a shipped feature.
13. Keep natural time progression unchanged. Preserve/check or deferred; not a shipped feature.
14. Do not add income during the trough. Preserve/check or deferred; not a shipped feature.
15. Keep the house actionable during the line. Preserve/check or deferred; not a shipped feature.
16. Inspect cream/rose message balance. Preserve/check or deferred; not a shipped feature.
17. Check Arabic long-line wrapping. Preserve/check or deferred; not a shipped feature.
18. Check smaller text with larger-text enabled. Preserve/check or deferred; not a shipped feature.
19. Keep sound unnecessary. Preserve/check or deferred; not a shipped feature.
20. Compare the calm state against the existing dusk. **Selected.**

RED: actual care followed by ninety seconds produced the simulation flag but no calm message. Root cause: missing `calm` handler beside the other announcement routes. Native acceptance pending.

## 2026-10-08 — Cycle 3: player camera ownership on return

IDEAL: Identify wrong input ancestor; define player input priority; explore twenty options; act by capturing at the shared app root; look back with actual main-wiring canvas event regression and rendered same-position touches.
5Ws: returning touch/keyboard player; keeps the camera after interacting; first 700 ms; canvas alongside HUD; prevents an automatic welcome from moving the object under a finger.

1. Let canvas touches own the camera. **Selected.**
2. Let canvas keyboard input own the camera. **Selected.**
3. Capture HUD input at the same shared root. **Selected.**
4. Do not move a selected prop during welcome. Invariant/check or deferred.
5. Keep a returning player’s room navigation. Invariant/check or deferred.
6. Keep reset-camera as an explicit choice. Invariant/check or deferred.
7. Preserve the existing welcome wave. Invariant/check or deferred.
8. Retain no camera glance with reduced motion. **Selected.**
9. Let the untouched house receive one glance. Invariant/check or deferred.
10. Avoid extra confirmation UI. Invariant/check or deferred.
11. Preserve scene picking order. Invariant/check or deferred.
12. Do not change mesh hit volumes. Invariant/check or deferred.
13. Test capture rather than relying on sibling bubbling. **Selected.**
14. Make a key held during return cancel the glance. Invariant/check or deferred.
15. Check a pot grab before the delayed move. Invariant/check or deferred.
16. Check a carry before the delayed move. Invariant/check or deferred.
17. Check pinch input begins ownership. Invariant/check or deferred.
18. Keep bilingual welcome line unchanged. Invariant/check or deferred.
19. Avoid saving camera state. Invariant/check or deferred.
20. Inspect unchanged-coordinate target after welcome. **Selected.**

RED: real cmd-home wiring moved to kitchen after a canvas pointer. The listener was attached to sibling #ui, which never receives canvas events. Native screenshots pending.

## 2026-10-08 — Cycle 4: delayed welcome interruption safety

IDEAL: Identify unguarded second welcome timer; define interruption-preserving camera behavior; explore twenty options; act on both delayed command guards; look back via main-wiring hide/pause reproductions and returned screenshots.
5Ws: returning phone player; leaves camera frozen during interruption; after initial glance and before automatic return; background tab or paused home; avoids losing the active scene context.

1. Prevent hidden-tab welcome reset. **Selected.**
2. Prevent paused welcome reset. **Selected.**
3. Prevent ritual camera replacement. **Selected.**
4. Prevent modal-sheet camera replacement. **Selected.**
5. Prevent fatal recovery camera replacement. Invariant/check or deferred.
6. Respect motion preference changed during return. **Selected.**
7. Keep original state identity through delayed work. **Selected.**
8. Allow an uninterrupted welcome to finish. **Selected.**
9. Do not replay the welcome after resume. Invariant/check or deferred.
10. Keep the returned view where it stopped. Invariant/check or deferred.
11. Retain safe carried input release. Invariant/check or deferred.
12. Keep audio pause synchronized. Invariant/check or deferred.
13. Avoid elapsed-time catch-up. Invariant/check or deferred.
14. Avoid welcome timers in simulation. Invariant/check or deferred.
15. Remove expired input listeners. Invariant/check or deferred.
16. Test first and second delayed boundaries. **Selected.**
17. Check portrait return while paused. Invariant/check or deferred.
18. Check Arabic return while paused. Invariant/check or deferred.
19. Inspect selected-room before/after resume. **Selected.**
20. Avoid a new resume popup. Invariant/check or deferred.

RED: actual visibility handling paused the simulation, but the second timer still dispatched camera reset. This is a UI timer guard defect, not simulation progression. Native acceptance pending.

## 2026-10-08 — Cycle 5: truthful saving recovery

IDEAL: Identify stale warning state; define accurate recovery after an actual successful write; explore twenty options; act with existing saved feedback; look back through quota-denial/recovery/re-denial tests and bilingual toast screenshots.
5Ws: player with temporarily full/blocked storage; sees whether progress now persists; autosave after recovery; existing toast and saved note; avoids a permanent false failure and permits later failure warning.

1. Retire the failed-save flag after a real owned write. **Selected.**
2. Announce recovered saving once. **Selected.**
3. Warn again if storage fails later. **Selected.**
4. Reuse the bilingual saved copy. **Selected.**
5. Restore the existing saved-note text. **Selected.**
6. Do not claim recovery on a failed write. **Selected.**
7. Preserve canonical-byte ownership checks. Invariant/check or deferred.
8. Leave unreadable identity recovery to Reload. Invariant/check or deferred.
9. Keep warnings quiet during repeated failures. Invariant/check or deferred.
10. Check quota denial then recovery. **Selected.**
11. Check both locales. **Selected.**
12. Avoid adding a permanent warning panel. Invariant/check or deferred.
13. Do not auto-export private progress. Invariant/check or deferred.
14. Keep blocked backup behavior intact. Invariant/check or deferred.
15. Preserve preferences separately. Invariant/check or deferred.
16. Keep autosave frequency unchanged. Invariant/check or deferred.
17. Show saving recovery in current dialog. Invariant/check or deferred.
18. Do not drown out earned-reward messages. Invariant/check or deferred.
19. Inspect long Arabic failure wrapping. **Selected.**
20. Keep the whole house visible during notices. Invariant/check or deferred.

RED: a real HomeSession write recovered after quota denial while app.saveWarning remained true. The stale latch also suppresses subsequent failed-write notices. Identity read failures stay intentionally sticky. Native acceptance pending.

## 2026-10-08 — Cycle 6: pending import ownership

IDEAL: Identify competing asynchronous save reads; define latest intentional command ownership; explore twenty options; act with an ephemeral request generation; look back with delayed real file-text validation and browser import/reset checks.
5Ws: player moving a house between browsers; sees the house they most recently selected; while file reading overlaps a second choice or reset; optional save settings; prevents delayed earlier work from replacing a later intentional house.

1. Latest file choice owns pending import. **Selected.**
2. Confirmed reset cancels older reads. **Selected.**
3. Ignore stale failed-read messages. **Selected.**
4. Keep the selected file’s locale. Invariant/check or deferred.
5. Retain current sound gesture intent. Invariant/check or deferred.
6. Preserve save-v1 validation. **Selected.**
7. Do not put import tokens in saved state. **Selected.**
8. Keep file-size guard. Invariant/check or deferred.
9. Let a failed latest import leave current state. **Selected.**
10. Avoid an import progress modal. Invariant/check or deferred.
11. Do not upload save copies. Invariant/check or deferred.
12. Test reverse file-read completion order. **Selected.**
13. Test reset while file is reading. **Selected.**
14. Verify no stale imported toast. **Selected.**
15. Keep earned progress on valid latest import. Invariant/check or deferred.
16. Keep canonical identity check after import. Invariant/check or deferred.
17. Keep existing state replacement cleanup. Invariant/check or deferred.
18. Inspect restored room scene. **Selected.**
19. Check English and Arabic success copy. **Selected.**
20. Keep import optional in existing settings. Invariant/check or deferred.

RED: the older real readSaveFile completion replaced 202 buttons with 101; a pending 303-button import also replaced a later confirmed fresh reset. Root cause: no request ownership across file-text awaits. Native acceptance pending.

## 2026-10-08 source checkpoint — native acceptance pending

Six independently reproduced source defects have RED/GREEN behavior regressions. `npm run verify` exited 0: lint, 419 tests (419 pass, zero failures/cancellations/skips), static build and gzip JavaScript budget 401,253 / 512,000 bytes. Runtime changes are confined to `app-feedback.js`, `cmd-home.js` and `cmd-save.js`. Each candidate cycle has twenty ideas above; no new saved simulation state, currency, artwork, dependency, analytics or remote request was introduced.

**Completion count: six implemented/source-verified candidate cycles, zero native-accepted cycles.** Browser launch in this environment is blocked before page creation, as investigated by the parent. No current-source phone play, 4x CPU measurement, screenshot capture or screenshot inspection is claimed. Independent source review is pending. Preserve open PR #42 (hud.css and quiet-world-play-ui.test.mjs); those files are unchanged here. Parent owns publication, native acceptance and integration.
