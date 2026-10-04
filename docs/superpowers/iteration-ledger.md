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

## Next brainstorm
Twenty ideas for reactive keepsakes are recorded in specs/2026-10-04-reactive-keepsakes.md. This is queued design work, not implemented features.

## Continuation
Hourly autonomous continuation is scheduled until the user asks to stop. Avoid overlapping active work. Always read PR #10/head/CI and this ledger first; finish failed verification before new features. Generate exactly twenty distinct ideas before each iteration, select a coherent playable improvement, test, independently review major changes, inspect rendered evidence, commit and publish its checkpoint. Preserve local identity, bilingual accessibility, local assets, save compatibility and no production merge/deploy.
