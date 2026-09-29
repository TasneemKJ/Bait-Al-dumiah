# Forty doll refinements implementation plan

**Goal:** Forty concrete doll-focused improvements, preserving the existing game and updating PR #1.
**Architecture:** Presentation-only face, wardrobe, rig and portrait modules, consumed by the existing Three.js doll factory and DOM UI.
**Tech Stack:** Native JavaScript, pinned Three.js 0.180.0, Node test runner, Playwright Chromium.
**Spec:** docs/superpowers/specs/2026-09-29-doll-focus-design.md

## Global constraints
No simulation/save/economy/audio/dependency changes; English and Arabic; 44px targets; no main merge or force push. Keep the original built-game tests and sub-400k triangle/sub-388 call gate.

## Review focus
Eye/hair clipping at oblique views; hands touching cups; paused/reduced-motion pose stability; mobile portrait framing; cache and temporary-target lifetime.

## Files and interfaces
`src/render/doll-face.js` builds a face and owns per-eye/lip pose references. `src/render/doll-hair.js` builds the three identity-specific styles. `src/render/doll-wardrobe.js` builds sewn garments and footwear. `src/render/doll-acting.js` adapts immutable state to bounded rig poses. `src/render/dolls.js` composes them while retaining `createDolls(parent)` and `update(state,dt,selected,viewerYaw)`. `src/render/doll-portraits.js` creates bounded, disposable offscreen portraits from actual models. Camera/UI changes stay in world/main/UI/i18n and focused helpers. Cumulative regressions live in `tests/art-doll-focus-checks.js`; `scripts/doll_capture.py` inspects the actual source models with Three.js in CI.

## Per-pass gate
For each row: append the named assertion to the cumulative fixture, run `CHROMIUM_PATH=/usr/bin/chromium python scripts/art_check.py`, observe the expected assertion fail, implement only that deliverable, rerun art checks and `npm run verify`, record the results and commit. A row completes only after both commands pass. At 10/20/30/40 transfer the tested source to the existing PR, run render verification, inspect captures and record actual findings.

- [x] D01 — **Cheek and jaw sculpt:** Sculpt a narrower chin and fuller lower cheeks instead of an ellipsoid.
- [x] D02 — **Painted porcelain complexion:** Bake soft blush and hand-painted freckles into the face rather than raised beads.
- [x] D03 — **Almond eye sockets:** Replace protruding stacked eyes with shallow almond-shaped whites.
- [x] D04 — **Individual glass irises:** Paint distinct hazel, moss and plum irises with radial fibres and catchlights.
- [x] D05 — **Lid rims and lashes:** Frame each eye with a fine upper lash line and a restrained lower waterline.
- [x] D06 — **Actual closed eyelids:** Hide eye whites during naps and closed blinks behind a curved bisque lid seam.
- [x] D07 — **Sculpted lips:** Replace the torus smile with a tiny shaped upper lip and softly curved lower lip.
- [x] D08 — **Soft nose bridge:** Model a tapered bridge and rounded tip without a pinched bead nose.
- [x] D09 — **Recessed ears:** Add inner-ear shading and a shaped rim within the head silhouette.
- [x] D10 — **Bisque finish and neck joint:** Use restrained porcelain clearcoat and a fine, deliberately made neck joint.
- [x] D11 — **Swept hair cap:** Replace the seven bead fringe with continuous grooved, swept hair forms.
- [x] D12 — **Lina plaits:** Give Lina two interwoven braids with properly anchored ties.
- [x] D13 — **Noor braided bun:** Wrap Noor’s bun in a visible braid with soft temple locks.
- [x] D14 — **Sami side part:** Give Sami an asymmetric side part, shaped fringe and nape.
- [x] D15 — **Fabric ribbon folds:** Replace bow beads with folded fabric loops and split ribbon tails.
- [x] D16 — **Lina embroidered apron:** Fit a cloth apron with rose embroidery, edging and a sewn pocket.
- [x] D17 — **Noor moon pinafore:** Add crescent embroidery, scalloped linen trim and a small moon clasp.
- [x] D18 — **Sami tailored dungarees:** Add twill, stitched pocket seams and real buckled braces.
- [x] D19 — **Character-specific shoes:** Model rose Mary Janes, soft slippers and laced boots with soles.
- [x] D20 — **Knitted socks:** Replace plain shin cylinders with ribbed socks, cuffs and small knee joints.
- [x] D21 — **Elbows and hands:** Articulate forearms and add palms and thumbs rather than mitten beads.
- [x] D22 — **Grounded footfalls:** Give stepping feet a swing lift and knee bend tied to actual movement.
- [x] D23 — **Roommate spacing:** Keep doll bodies from overlapping after room changes and preserve stable arrival positions.
- [x] D24 — **Balanced locomotion:** Counter-swing arms and give the torso a small, velocity-driven lean.
- [x] D25 — **Bounded eye gaze:** Let pupils follow the caretaker without crossing or leaving their sockets.
- [x] D26 — **Need-aware expressions:** Use gentle happy, worried, sleepy and curious eyebrow/mouth poses.
- [x] D27 — **Tea sip sequence:** Ease through lifting, sipping and lowering instead of snapping to a static pose.
- [x] D28 — **Two-handed tea hold:** Let the free hand support the cup and keep the rim and steam upright.
- [x] D29 — **Reassurance self-hug:** Fold hands toward the heart with a small reassuring nod.
- [x] D30 — **Sleeping breath:** Settle the cheek toward a hand and add a slow, low-amplitude sleep breath.
- [x] D31 — **Playful clapping:** Use coordinated clapping hands and a happy expression during play.
- [x] D32 — **Selection greeting:** A newly selected doll gives a short wave rather than looping constantly.
- [x] D33 — **Nighttime curiosity:** A restrained sideways glance makes the dolls subtly curious after dark.
- [x] D34 — **Hair follow-through:** Let braids and ribbons settle softly with head movement.
- [x] D35 — **Cloth follow-through:** Give skirt hems a restrained sway that freezes correctly.
- [x] D36 — **Matching resident portraits:** Show portraits of the actual 3D models in the resident UI.
- [x] D37 — **Doll close-up control:** Add a translated, keyboard-accessible look-closer action for each resident.
- [x] D38 — **Responsive portrait camera:** Frame one doll clearly on portrait phones and restore room/whole-house views.
- [x] D39 — **Rigid detail batching:** Merge rigid detail within each animated part without flattening the rig.
- [x] D40 — **Reusable portrait resources:** Release temporary portrait render targets and reuse portrait/art caches safely.

Supplemental fixes discovered by review are recorded separately and never inflate the count.

## Continuation ruling
D39 executed early after D25 in response to the D20 draw-call gate. The user then requested continued iteration until stopped; the initial forty remain the first set, not the final stopping condition.
