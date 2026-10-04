# Improvement ledger

## 2026-10-04 / Iteration 1 — Earned rituals and restoration
Twenty ideas and selected design: specs/2026-10-04-living-house-expansion.md.
Baseline: main efc04ee; npm run verify passes 83 tests and build.
Authorization: autonomous iteration without interventions; feature branch feat/living-house-expansion, PR #10. Commit each iteration, plus concrete verification/fix checkpoints. No merge/production deploy.

Implemented three active rituals, bounded earned mastery, two paid completions/activity/earned day, free practice, 20-second unpaused cooldown, and twelve visible room restoration stages. Existing save key/version retained; English/Shami Arabic authored throughout. New save data whitelisted and capped.

Evidence:
- Sequence/reward/sanitation tests observed RED before implementation, then GREEN.
- Independent review found stale live reward labels, completion keyboard focus, and 320px dock clipping; all corrected with browser regressions.
- Software-WebGL revealed restoration over the existing 400k triangle budget. Source measurement: 45,176 added main/shadow triangles. Miniature geometry and avoiding redundant shadows now satisfy a <10k added-triangle behavior check.
- Commit 7a82f70: dedicated CI run 37205877645 passed art construction (262 checks) and real expansion browser flow, desktop/Arabic mobile, reward persistence and full restoration geometry budget. Screenshots inspected for actual rituals, reward and restored house. Full existing workflow passed UI, art, doll/craft/courtyard/audio phases; a later source update cancelled its final play phase. Retain full-regression requirement on the latest head.
- Local implementation/checkpoints committed separately; remote published through PR #10.

Deferred review minors: restored lamps do not yet alter real illumination; kitchen stage-three copy says fourth cup but mesh is a music box. Reset completion feedback is fixed in iteration 2. No measured gameplay or retention score claimed.

## 2026-10-04 / Iteration 2 — Direct object play
User steering: objects must be selectable; interactions are minimal.
Twenty ideas, alternatives and selected contract: specs/2026-10-04-object-play.md.
Plan: plans/2026-10-04-object-play.md.

Implemented four permanent object interactions, direct owned-keepsake selection, contextual care/ritual actions, free atomic relocation, saved quarter-turn rotation, and full refund. Authored pick volumes survive artwork batching. A selection frame and focused-room keyboard/touch controls expose actionable props without pixel hunting. Moving preserves originRoom so packing removes the original placement comfort instead of creating a reward loop. Embroidery now studies/recalls a pattern with free hints; the moon song requires a reverse echo; tea remains guided. Reset clears transient feedback and placement.

Evidence so far:
- Four new simulation behaviors observed RED, then GREEN. Bilingual object-copy check observed RED, then GREEN.
- npm run verify: 99 passing tests and built static app. Python browser scripts compile; git diff --check passes.
- Independent whole-branch review: no Critical findings, four Important findings. All corrected: modal camera cancellation (immediate selected-object focus), stale canceled relocation (clear placement/move ID), 667px landscape clipping (bounded scrolling), and ritual camera/HUD room mismatch (shared focus dispatch).
- Browser regressions exercise whole-house ray pick, selected-object action sheet, recall/hint/reverse answers, camera drag rejection, actual decoration pick, quarter-turn, free move, reload persistence, Arabic 320px targets and 667px populated-room reachability.
- Remote feature commit a866655 followed by review fixes; verification head e62751d. Dedicated software-WebGL run 37207066426 passed 26/26 browser checks and 265/265 artwork checks; actual selection, rotated/moved keepsake, Arabic phone study and reverse-echo screenshots inspected. Full regression run 37207066484 also passed UI regression, artwork, doll/craft captures, courtyard/Shami/audio and the complete desktop/mobile play loop (48/48 play checks, 28/28 DOM checks), with zero errors or failed checks. Landscape screenshot also inspected. Re-review confirms all four Important fixes; two minor test-strength gaps are strengthened in the queued checkpoint with actual projected zoom and post-stitch room assertions. Runtime is unchanged by that test/documentation checkpoint. The checkpoint adds one locally passing origin-refund test plus two stronger browser assertions; runtime source is identical to the verified e62751d build. Its CI rerun is pending after publication.

## 2026-10-04 / Iteration 3 — Reactive keepsakes
Twenty ideas, alternatives and selected contract: specs/2026-10-04-reactive-keepsakes.md.
Plan: plans/2026-10-04-reactive-keepsakes.md.

Implemented persistent actions for four owned keepsakes: water jasmine once per house day, switch lamps on/off, wind music boxes and rock moon mobiles. Actions are selected from the actual room or the keyboard/touch object list, close the sheet to reveal their response, preserve focus, save safely and grant no currency, care, mastery or bond. Watered plants visibly perk up; lamps add bounded shadowless room light; music boxes turn; moon mobiles use a still response pose under reduced motion. Earned tier-two lamps now cast practical light, and kitchen tier three renders the promised fourth cup. English/Shami Arabic status and feedback accompany every action.

Evidence:
- Reactive simulation and bilingual copy tests were observed RED before implementation, then GREEN. `npm run verify` passes 107/107 tests and builds the static app; version-one interaction fields are whitelisted and clamped.
- Independent review found a stale browser label and an Important keyboard-focus regression. Both were corrected. Re-review found no remaining Critical or Important issue; all three minor contract/evidence gaps were also resolved.
- Dedicated software-WebGL run 37212546019 passed 268/268 art checks and 41/41 browser checks. It covers actual plant ray selection, all four actions, settled restored/owned lights, plant scale, music-box motion, reduced-motion stillness, keyboard focus, no reward mutation, reload persistence and zero JavaScript errors.
- Full regression run 37212545967 passed source/build, UI regression, art construction, doll/craft captures, courtyard/Shami/audio checks and the full desktop/mobile game flow on the same head.
- Inspected restored-night, watered-jasmine, active-lamp, moving-music-box and reduced-motion moon-mobile captures. The practical lights read clearly without flattening the existing cute-creepy night palette; focused rooms keep the selected object large and discoverable.
- Published implementation head 32c01df followed by test-harness corrections; verified feature head a8f34ff on draft PR #10. CI failures were isolated to slow-render timing and a Playwright keyword-only call, then corrected without weakening gameplay assertions.

No measured gameplay or retention score claimed. No merge or production deploy.

## 2026-10-04 / Iteration 4 — Hidden house stories

Twenty ideas and selected design: specs/2026-10-04-hidden-house-stories.md. Plan: plans/2026-10-04-hidden-house-stories.md. User explicitly rejects a game that depends on menus, buttons and toasts, so primary interaction now uses actual scene objects, a second touch and carried-item drops. Optional detail sheets and keyboard controls remain available.

Implemented three connected stories, eleven deliberate actions, eight carried items, five new physical prop targets, three permanent earned scenes, three reward-free replayable toys and journal memories. Story rewards total 48 once-only buttons. Wrong drops, cancellation and pause preserve inventory; version-one saves preserve all intermediate steps. Tools and the object list collapse during play. Selection uses a small nonmodal ribbon, visible phone instructions, inline responses and a warm floor marker. Phone rooms fit the full projected room between controls.

Evidence at implementation checkpoint:
- Source rules, gesture and framing tests observed RED before implementation, then GREEN. `npm run verify`: 125 passing tests and static build. All affected Python browser scripts compile.
- Eight constructed-art checks pass, including exact cabinet door clearance, jasmine/lamp separation, earned states, pause/reduced-motion/replay behavior and expired ripple handling. Story artwork adds 7,230 triangles/19 mesh draws with no lights or shadow maps.
- Independent review found five material usability gaps: short landscape layout/clues, hidden focus restoration, missing phone input cues, pressed-token centering, and passive earned cabinet. Corrections are included with replay rules and browser assertions.
- Native Chromium exits before navigation in the execution environment. Previous baseline software-WebGL evidence has identical runtime to the starting head c4d14e0. New complete story and legacy browser runs are required on this implementation commit in GitHub Actions; current rendered behavior is not yet certified.

Iteration acceptance and the next feature pass wait for exact-commit CI and screenshot review. No measured gameplay/retention score is claimed; finite stories establish purposeful exploration, while repeatable physical activities remain the next priority.

## Next iteration after story verification
Begin with a fresh set of exactly twenty ideas after checking PR #10 and the latest CI. Prioritize resident responses, object combinations and choice-driven house consequences that reuse the direct interaction vocabulary without creating reward farms.

## Continuation
Continue until the user asks to stop. The existing continuation task was disabled when this session began; this session is actively implementing the latest request. Avoid overlapping active work. Always read PR #10/head/CI and this ledger first; finish failed verification before new features. Generate exactly twenty distinct ideas before each iteration, select a coherent playable improvement, test, independently review major changes, inspect rendered evidence, commit and publish its checkpoint. Preserve local identity, bilingual accessibility, local assets, save compatibility and no production merge/deploy.
