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


## B1: Care sounds belong to little household objects

Design review expansion after implementation (2026-10-08): the original entry recorded twenty lenses. The concrete alternatives below were expanded during review now; they are not claimed as the pre-code brainstorm.

IDEAL: identify = All successful care actions shared a short reward melody rather than their physical material. Define = keep the existing verb and rule, and make its actual event locally legible. Explore = compare the twenty concrete alternatives below. Act = use the selected bounded material/geometry/input owner. Look back = recorded RED/GREEN counterchecks and source review; native mobile images and listening remain pending.
5Ws: who = phone players in English and Arabic; what = cause-and-consequence feedback; when = giving tea, play, rest or reassurance to a doll; where = the actual current room/prop/work view; why = keep attention in the world without duplicating its controls or rewards.

1. Use ceramic and tin contacts for tea care; selected because the handled cup and pot own that sound.
2. Use two wooden taps for play care; selected to evoke a small household toy without a reward tune.
3. Use cloth friction for rest care; selected because the doll is settling into textiles.
4. Use cloth then a quiet toy tap for reassurance; selected to distinguish comforting contact.
5. Reserve the existing secret melody for bond progression; selected to keep reward and action meaning distinct.
6. Record actual porcelain samples; deferred because the project currently ships original procedural audio only.
7. Add doll dialogue to every care action; deferred because it needs bilingual recording and can become repetitive.
8. Use a louder chime for each fulfilled wish; deferred because wish progression already has its own feedback.
9. Pan each care sound to the doll room; deferred until the room mix can be inspected with physical listening.
10. Add quiet cup liquid swish during tea care; deferred because that needs new synthesis beyond this bounded pass.
11. Play a long lullaby on rest; deferred because continuous music already belongs to the house score.
12. Randomize contact pitch per tap; deferred because unreviewed variation could make porcelain sound brittle.
13. Layer a small cloth transient under all wooden contacts; deferred because it would blur the four materials.
14. Duck the full house score deeply for each action; deferred because current levels should first be listened to.
15. Use the musicbox motif for play; deferred because that motif belongs to its actual story object.
16. Replay the material sound when care is refused; deferred because no contact occurred.
17. Emit a tactile haptic pattern with care sound; deferred because browser-device support needs native testing.
18. Keep mute, pause and disposal authoritative over every contact; selected through the existing audio player.
19. Let a material phrase continue after pause; deferred because it would break the established silence boundary.
20. Add an audio-only success cue with no visual pose; deferred because care must remain readable with sound off.

Selected bounded design: Successful tea answers with a quiet ceramic and tin touch, play with two wooden taps, rest with cloth friction and reassurance with cloth then a soft toy tap. Reward melodies remain reserved for progression. Gesture, mute, pause and cleanup stay authoritative.
Design checked against DESIGN_RULES.md; no design-rule violation found. All unselected ideas remain candidates, not completed improvements.
Validation recorded: focused RED/GREEN behavior countercheck. The full source test/build is a final batch gate. Native mobile screenshots, physical audio listening and phone performance remain pending because the available browser cannot launch. This is an engineering iteration, not visual acceptance.

- [ ] Native mobile visual and listening acceptance before merge.


## B2: Comfort rises once from a real reassurance

Design review expansion after implementation (2026-10-08): the original entry recorded twenty lenses. The concrete alternatives below were expanded during review now; they are not claimed as the pre-code brainstorm.

IDEAL: identify = Comfort hearts looped indefinitely from absolute house time during reassurance. Define = keep the existing verb and rule, and make its actual event locally legible. Explore = compare the twenty concrete alternatives below. Act = use the selected bounded material/geometry/input owner. Look back = recorded RED/GREEN counterchecks and source review; native mobile images and listening remain pending.
5Ws: who = phone players in English and Arabic; what = cause-and-consequence feedback; when = the two seconds after an actual reassurance event; where = the actual current room/prop/work view; why = keep attention in the world without duplicating its controls or rewards.

1. Anchor the three hearts to lastCare and let them rise once; selected so reassurance has a beginning and an end.
2. Use a still emblem for the same finite period under reduced motion; selected for equal event readability.
3. Keep hearts looping for the entire soothe pose; deferred because the event becomes visual noise.
4. Use one larger heart instead of three; deferred until its phone-scale balance is inspected.
5. Leave a permanent heart above a doll after care; deferred because it would compete with wishes and selection.
6. Give each doll a different heart color; deferred because identity already comes from the authored porcelain wardrobe.
7. Raise hearts from the exact doll hands; deferred because the existing root anchor needs a native camera review.
8. Add glitter particles behind the heart cascade; deferred because it increases draw and triangle cost.
9. Have the doll bow toward the player after reassurance; deferred because care poses already own the hands and head.
10. Let the cascade begin from its middle on load; deferred because that misrepresents the event age.
11. Fade each existing heart independently through one envelope; selected to avoid a synchronized looping badge.
12. Draw a rose petal instead of each heart; deferred because this needs new shape art.
13. Tie heart height to bond reward size; deferred because reassurance is care even when no reward is paid.
14. Add a warm shadow under the doll during the cascade; deferred because practical lighting already owns floor pools.
15. Pause the finite cascade with the existing house clock; selected because pause should hold the actual scene.
16. Reset the cascade after every camera selection; deferred because selection is not another reassurance.
17. Keep the root hidden after the event ends; selected to return attention to the living doll.
18. Emit a new caption when the final heart fades; deferred because the visual should stay quiet.
19. Make an idle doll emit comfort hearts periodically; deferred because that weakens the care-to-effect link.
20. Add more hearts at higher bond levels; deferred because progression already has its own gift and memory feedback.

Selected bounded design: The three existing porcelain-heart accents start with the actual reassurance event and rise in one bounded cascade, then retire. Reduced motion shows one still emblem for the same finite period. Reassurance pose and care rewards are unchanged.
Design checked against DESIGN_RULES.md; no design-rule violation found. All unselected ideas remain candidates, not completed improvements.
Validation recorded: focused RED/GREEN behavior countercheck. The full source test/build is a final batch gate. Native mobile screenshots, physical audio listening and phone performance remain pending because the available browser cannot launch. This is an engineering iteration, not visual acceptance.

- [ ] Native mobile visual and listening acceptance before merge.


## B3: The tea line catches warm light when ready

Design review expansion after implementation (2026-10-08): the original entry recorded twenty lenses. The concrete alternatives below were expanded during review now; they are not claimed as the pre-code brainstorm.

IDEAL: identify = Ready cups changed engraving color but had no local light response. Define = keep the existing verb and rule, and make its actual event locally legible. Explore = compare the twenty concrete alternatives below. Act = use the selected bounded material/geometry/input owner. Look back = recorded RED/GREEN counterchecks and source review; native mobile images and listening remain pending.
5Ws: who = phone players in English and Arabic; what = cause-and-consequence feedback; when = a cup entering or leaving its actual target fill band; where = the actual current room/prop/work view; why = keep attention in the world without duplicating its controls or rewards.

1. Warm the existing gold engraving on actual readiness, then settle; selected without adding meshes.
2. Remove the glint immediately on overfill and exit; selected so materials match current state.
3. Add a large readiness check above each cup; deferred because it would become app chrome.
4. Illuminate all cups when only one is ready; deferred because it would falsely imply the tray can be served.
5. Add an extra floating gold ring above the rim; deferred because the existing engraving can carry the cue.
6. Pulse the whole teapot when a cup becomes ready; deferred because that moves attention away from the receiving cup.
7. Use a tiny porcelain contact at band crossing; deferred until physical listening can distinguish it from pour contacts.
8. Change the liquid to bright yellow when ready; deferred because tea should retain its amber material.
9. Widen the engraved target band after near misses; deferred because the visible band must match the unchanged tolerance.
10. Keep a steady readiness glint under reduced motion; selected to avoid a flashing cue.
11. Put a woven tea-leaf mark beside each cup; deferred because new symbols need bilingual affordance review.
12. Have the tray glow only when every cup is ready; deferred because the served glow has a different existing meaning.
13. Leave the readiness glint after emptying an overfilled cup; deferred because the emptied cup needs another pour.
14. Add a numerical fill label inside the cup; deferred because it obscures the physical surface and line.
15. Use a soft one-time burst rather than an endless pulse; selected to reduce persistent visual noise.
16. Tint cup handles by readiness; deferred because handles are not where players judge fill.
17. Give ready cups steam plumes; deferred because temperature is not determined by reaching a fill band.
18. Add a camera nudge toward the ready cup; deferred because direct aiming should own the stable work camera.
19. Restart the glint on every rendered frame; deferred because that would hide the finite event.
20. Keep each cup engraving material independent; selected to avoid making neighboring brass props glow.

Selected bounded design: The existing interior gold engraving gains one bounded warm response when the actual cup enters its target band, then settles to a quiet readiness glint. Overfill and exit remove it immediately. Reduced motion uses the steady signal; fill tolerance and reward stay unchanged.
Design checked against DESIGN_RULES.md; no design-rule violation found. All unselected ideas remain candidates, not completed improvements.
Validation recorded: focused RED/GREEN behavior countercheck. The full source test/build is a final batch gate. Native mobile screenshots, physical audio listening and phone performance remain pending because the available browser cannot launch. This is an engineering iteration, not visual acceptance.

- [ ] Native mobile visual and listening acceptance before merge.


## B4: Pouring has weight and a local landing

Design review expansion after implementation (2026-10-08): the original entry recorded twenty lenses. The concrete alternatives below were expanded during review now; they are not claimed as the pre-code brainstorm.

IDEAL: identify = The pour stream had fixed weight regardless of the real continuous flow. Define = keep the existing verb and rule, and make its actual event locally legible. Explore = compare the twenty concrete alternatives below. Act = use the selected bounded material/geometry/input owner. Look back = recorded RED/GREEN counterchecks and source review; native mobile images and listening remain pending.
5Ws: who = phone players in English and Arabic; what = cause-and-consequence feedback; when = tilting the pot above a cup and releasing the pour; where = the actual current room/prop/work view; why = keep attention in the world without duplicating its controls or rewards.

1. Let stream thickness follow existing flow; selected to give a low tilt and full tilt different weight.
2. Use a bounded impact ripple only on the actual receiving liquid mesh; selected with no new geometry.
3. Rotate the already vertical stream using a quaternion only; deferred because inspection showed it would be a no-op.
4. Curve the stream away from gravity; deferred because it would imply liquid landing at a different place.
5. Add droplets along the falling stream; deferred because they increase draw calls and require new motion review.
6. Add a separate ripple torus for each cup; deferred because the existing surface can respond within the budget.
7. Make every cup ripple while any pour is active; deferred because only the receiving cup has contact.
8. Change tea color with tilt strength; deferred because flow does not change the beverage material.
9. Preserve exact spout and surface endpoints; selected because aim and landing must remain physically coherent.
10. Keep the liquid surface still under reduced motion; selected while retaining essential continuous fill.
11. Leave ripples after release; deferred because the bounded pass uses an immediate contact-owned reset.
12. Vibrate the whole tray during heavy flow; deferred because that would suggest the cups move under the pot.
13. Lower liquid roughness only on the receiving cup; deferred pending an actual phone material comparison.
14. Add a gentle splash sound on cup contact; deferred until the existing audio mix can be listened to.
15. Animate the spill patch shape during misses; deferred because spill history has a separate persistent meaning.
16. Add tilt-dependent highlights on the pot enamel; deferred because the work camera and practical light already generate them.
17. Use the current flow value without changing its threshold; selected to preserve control and scoring.
18. Snap the spout horizontally to the closest cup; deferred because it would change the actual aiming rule.
19. Let the surface ripple slightly within the cup aperture; selected with a strict small transform bound.
20. Keep a flow meter next to the pot; deferred because visible liquid should teach the control directly.

Selected bounded design: The existing stream becomes thin at low flow and full at high flow, while only its actual receiving cup carries a bounded impact ripple in the existing liquid surface. Release resets it; reduced motion leaves surfaces still. Spout alignment, cup fill and the simulation stay unchanged, with no added geometry or lights.
Design checked against DESIGN_RULES.md; no design-rule violation found. All unselected ideas remain candidates, not completed improvements.
Validation recorded: focused RED/GREEN behavior countercheck. The full source test/build is a final batch gate. Native mobile screenshots, physical audio listening and phone performance remain pending because the available browser cannot launch. This is an engineering iteration, not visual acceptance.

- [ ] Native mobile visual and listening acceptance before merge.


## B5: Thread arrives at a section and points to its repair

Design review expansion after implementation (2026-10-08): the original entry recorded twenty lenses. The concrete alternatives below were expanded during review now; they are not claimed as the pre-code brainstorm.

IDEAL: identify = Sewing section arrival and the actual repair spool had weak local acknowledgement. Define = keep the existing verb and rule, and make its actual event locally legible. Explore = compare the twenty concrete alternatives below. Act = use the selected bounded material/geometry/input owner. Look back = recorded RED/GREEN counterchecks and source review; native mobile images and listening remain pending.
5Ws: who = phone players in English and Arabic; what = cause-and-consequence feedback; when = finishing a contour section or making a loose loop; where = the actual current room/prop/work view; why = keep attention in the world without duplicating its controls or rewards.

1. Warm and briefly enlarge the existing next guide bead at section arrival; selected for a local continuation cue.
2. Light the actual repair spool while a loose loop exists; selected to show where the existing repair action lives.
3. Animate the needle jumping to the next endpoint; deferred because the needle must follow paid movement.
4. Add a new completion banner over the hoop; deferred because section progress should stay in the cloth.
5. Use a separate green thread for completed sections; deferred because the story keeps its authored red thread.
6. Let completed thread sparkle continuously; deferred because it would obscure the remaining contour.
7. Play a short needle contact at every section; deferred until sound and high-cadence sewing can be listened to.
8. Add a large repair arrow above the spool; deferred because the physical spool should own the cue.
9. Color the entire hoop red when loose; deferred because it suggests the completed sections were lost.
10. Retain all completed thread during repair; selected by reading existing simulation coverage only.
11. Pulse the guide forever until the player moves; deferred because the bead already marks the next point.
12. Use a still material cue under reduced motion; selected without moving needle or accepted coverage.
13. Grow the loose loop geometry after repeated errors; deferred because error count should not change the repair affordance.
14. Give the spool a temporary warm seam rather than new geometry; selected through its existing material.
15. Move the sewing camera toward the loose loop; deferred because that would fight continuous needle control.
16. Carry the previous arrival pulse into direct replay; deferred after the reset countercheck showed it is misleading.
17. Retire arrival response when a new seam starts at a lower section; selected to keep events scoped to one activity.
18. Add a bilingual repair sentence at every mistake; deferred because the current strip already explains unpicking.
19. Increase contour assistance after section confirmation; deferred because this pass cannot change coverage or score.
20. Leave an earned ornament on the hoop after completion; deferred because restoration already owns lasting room progress.

Selected bounded design: A completed section briefly warms the next real guide bead, then settles. A loose thread quietly lights the actual repair spool, retiring immediately when repaired. The same existing meshes and authored contour remain, with no change to accepted coverage, assistance, scoring or inventory.
Design checked against DESIGN_RULES.md; no design-rule violation found. All unselected ideas remain candidates, not completed improvements.
Validation recorded: focused RED/GREEN behavior countercheck. The full source test/build is a final batch gate. Native mobile screenshots, physical audio listening and phone performance remain pending because the available browser cannot launch. This is an engineering iteration, not visual acceptance.

- [ ] Native mobile visual and listening acceptance before merge.


## B6: Moon charms distinguish an echo from recovery

Design review expansion after implementation (2026-10-08): the original entry recorded twenty lenses. The concrete alternatives below were expanded during review now; they are not claimed as the pre-code brainstorm.

IDEAL: identify = Correct echoes and wrong-note recovery used nearly identical sounding charm feedback. Define = keep the existing verb and rule, and make its actual event locally legible. Explore = compare the twenty concrete alternatives below. Act = use the selected bounded material/geometry/input owner. Look back = recorded RED/GREEN counterchecks and source review; native mobile images and listening remain pending.
5Ws: who = phone players in English and Arabic; what = cause-and-consequence feedback; when = releasing a charm during the reverse phrase; where = the actual current room/prop/work view; why = keep attention in the world without duplicating its controls or rewards.

1. Briefly open a warm halo for an accepted echo; selected to acknowledge the real phrase cursor.
2. Contract a quieter cool halo on wrong-note recovery; selected to distinguish the existing free demonstration.
3. Make a wrong charm shake violently; deferred because the gentle dollhouse should not scold mistakes.
4. Flash the instrument red after an error; deferred because recovery is not a danger state.
5. Use both halo size and material tone; selected so response is not conveyed by hue alone.
6. Leave accepted charms lit permanently through the phrase; deferred because that would reveal a new answer-history system.
7. Add a progress row above the instrument; deferred because the actual charms can carry the feedback.
8. Let the wind-up moon jump toward the wrong charm; deferred because it would distract from the demonstration.
9. Play a discordant error chord; deferred because mistakes already trigger a gentle replay.
10. Keep the response still under reduced motion; selected with a finite event window.
11. Add a bright star particle for every correct note; deferred because mastery already owns earned stars.
12. Alter charm pendulum speed by correctness; deferred because physical pull/release should remain consistent.
13. Let the accepted halo decay within less than a second; selected to return attention to the next note.
14. Keep a recovery ring into the next demonstrated phrase; deferred because it would overlap the lesson.
15. Draw a tiny reverse arrow on each charm; deferred because sequence direction is already in localized instructions.
16. Give each wrong note a separate caption; deferred because audio-free light cues already show the demonstration.
17. Raise reward for a perfect echo; deferred because score and mastery economy must remain unchanged.
18. Repeat the phrase automatically after every correct note; deferred because it would interrupt the player response.
19. Keep finished-song lighting as the existing whole-instrument state; selected to preserve its earned result.
20. Change charm picking volumes during acknowledgement; deferred because visuals must not shift the touch targets.

Selected bounded design: A correctly echoed charm briefly opens a warm halo; a wrong-note recovery contracts into a quieter cool ring before the existing free demonstration. Both settle within 0.7 seconds, and reduced motion uses a still response. Phrase order, pull threshold, replay, mastery and rewards remain unchanged.
Design checked against DESIGN_RULES.md; no design-rule violation found. All unselected ideas remain candidates, not completed improvements.
Validation recorded: focused RED/GREEN behavior countercheck. The full source test/build is a final batch gate. Native mobile screenshots, physical audio listening and phone performance remain pending because the available browser cannot launch. This is an engineering iteration, not visual acceptance.

- [ ] Native mobile visual and listening acceptance before merge.

## Final engineering review status (2026-10-08)

Architecture, all six focused feedback files and lint passed at product commit e7583fd; the final full source test/build rerun is pending.

The review fixes retire sewing feedback on replay and separate named presentation helpers for architecture caps; they do not count as additional iterations.
