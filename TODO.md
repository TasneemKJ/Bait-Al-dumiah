# TODO

## Reliability review — 2026-10-08, cycles 35–40

Twenty alternatives, IDEAL and the 5Ws for each bounded cycle are recorded in `docs/superpowers/iteration-ledger.md`.
- [x] 35: Deliver existing first-calm and first-night announcements through the notice queue.
- [x] 36: Cancel the returning camera on canvas/HUD interaction, including its delayed reset.
- [x] 37: Keep save failure observable after rituals and through UI/language changes, preserve ordinary notice timing, and clear it after a successful retry.
- [x] 38: Preserve the current house and work when importing cannot be saved.
- [x] 39: Make placement/refund leave care-earned comfort intact across relocation and clamping.
- [x] 40: Ignore older file-read results after a newer import or reset.
- [x] Reconcile PR #46 with main `72535fd6d4c27877666d520986e4027f907b3a3f`, preserving both newer-main batches and all audit histories; complete the cycle 37 warning-visibility correction after review. The warning/cycle group passes 42 checks, incoming input/save cases pass 33 checks, and the final lint/472-test/build gate passes. This is integration of cycles 35–40, not additional cycles.
- [ ] Inspect exact-source mobile EN/AR originals and record measured performance before merge; source checks do not establish rendered acceptance.
## Six bounded corrections — 2026-10-08

Twenty candidates, IDEAL/5Ws, RED/GREEN outcomes and evidence limits for each pass are recorded under B1–B6 in `docs/superpowers/iteration-ledger.md`.
- [x] B1: Release held tea on focus transfer; 13/13 tea-input behavior tests pass. Native acceptance remains below.
- [x] B2: One physical Space press toggles pause once; preserve modified browser shortcuts; 10/10 focused/main behavior tests pass.
- [x] B3: Returning-player welcome camera yields to canvas input; 18/18 focused/greeting/Home integration tests pass.
- [x] B4: Latest save import/reset intent owns asynchronous completion; 20/20 focused/save-safety/Home identity tests pass.
- [x] B5: Failed replacement persistence preserves the current run and reports failure; 34/34 focused/save-safety/Home checks pass, including later retry.
- [x] B6: Secondary fingers cannot initiate a held-story item drag; 25/25 carry, pointer and story behavior tests pass.
- [x] Fresh `npm run verify`: lint, all 430 behavior tests and static build pass; JavaScript is 392.0 KiB gzip against the 500 KiB budget.
- [ ] Exact-source browser journey and inspected EN/AR phone/landscape screenshots with 4× CPU measurements; source tests alone do not close native acceptance.

## Audit 2026-10-08 — B1: first-session event delivery
IDEAL: identify missing notices, define the event-to-player contract, explore failure paths, restore only proven missing handlers, look back through behavioral regression. 5Ws: a new EN/AR phone player; the first calm interval and first night; in the existing house notice; guidance is needed to make the intended quiet and visitor legible.
Twenty audit candidates: 1 first-night event delivery; 2 calm-line delivery; 3 repeated-frame suppression; 4 returning-save hint suppression; 5 paused clock; 6 manual night switch; 7 Arabic notice text; 8 unchanged English text; 9 queue ordering; 10 reward notice coexistence; 11 muted guidance; 12 reduced-motion guidance; 13 day-one prerequisite care; 14 later-day exclusion; 15 saved one-time flags; 16 empty-queue behavior; 17 hint timing boundaries; 18 no automatic new panel; 19 notice visibility over the house; 20 short-phone target reachability.
Selected: 1–3 and 7–10 as a focused bug regression; existing suites cover timing/persistence. The other candidates are audit questions, not new features or completed iterations.
- [x] Reproduce four missing EN/AR notices through real simulation events and the production notice adapter.
- [x] Restore the two existing handlers and verify affected/full source gates (29 focused; 416 full-suite checks plus lint/build).
- [x] Correct B1 after independent review: cover candidates 9, 10, 16, 17 and 19 during tea/sewing/chimes. Seven new cases reproduced hidden-toast consumption; a central dequeue guard now defers delivery until ritual exit. All 11 notice cases pass in EN/AR with reward ordering, the eight-notice cap, immediate house delivery and the existing 2.4-second interval preserved. Final full verify passes 423 tests plus lint/build. This is a B1 correction, not an additional counted audit round.
- [ ] Inspect exact-source mobile notice screenshots; native rendering availability remains a separate gate.

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

## Audit 2026-10-08 — B2 through B6
Twenty candidates, IDEAL/5Ws and selected boundaries for each source/behavior round are recorded in `docs/audits/2026-10-08-review.md`: persistence/cold entry; tea; sewing; moon chimes; story/economy/mobile contracts. No speculative features are selected.
- [x] Execute B2–B6 focused source/behavior groups (55/42/49/29/76 checks); latest full verify after the B1 review correction passes 423 tests plus lint/build.
- [ ] Complete required native screenshots and performance; source checks do not close these gates.

## Browser readiness correction — 2026-10-08
- [x] Diagnose the story smoke's stale sewing coordinates under software WebGL: its fixed delay sampled an unfinished room-camera flight.
- [x] Reuse read-only scene readiness before aiming; require the same destination to remain fixed and exposed during the real drag. No gameplay or design changes.
- [x] Re-run the core browser journey: 56 checks and story smoke pass; inspect desktop night and phone portrait/landscape originals. Results retained in the workspace readiness evidence; extended ritual/performance suites remain separate.
