# Doll-focused rendered checkpoints

Base: 5b02f9a0b31b7aa1324d080fd29e4f240b1c03ac.

D01–D10: remote 13ca828, run 36497364283 passed. Fourteen fixed-studio old/new model views and the existing built-game captures were produced. Review identified lip and closed-lid intersections; two raycast regressions were added and the surfaces moved clear of the face.

D11–D20: remote 4a48c1f, run 36498684522 produced all fourteen model views without browser errors. The full-game gate failed at 446 draw calls (353,885 triangles). The failure is retained, not relabeled as a passing checkpoint. Full-size model-trio inspection showed distinct hair and clothing. Geometry count alone was not the performance problem.

Ruling: bring D39 forward after D25. Batch rigid surfaces within articulated pivots, use linear vertex colors for compatible untextured matte details, and keep painted/glazed/metallic materials distinct. Preserve all original game and budget assertions. Named-component construction tests now inspect range-validated baked source parts when the renderer merges their geometry; geometry assertions are not dropped.

D21–D30 + early D39: remote fbc168e, run 36499976212 passed all 34 built-game checks and the model/DOM/construction suites. Measured whole-house 381 calls and 347,837 triangles: both unchanged strict gates pass. Reviewed Noor sleeping portrait (closed lids, supported head, no new blocking issue) and Lina tea portrait. Tea remained upright but the hand-local offset swung the saucer above the wrist into the chin. D41 was added after the original forty passes to correct world-up grip placement, rather than hide it behind the passing orientation-only test. D41's new positional regression was observed failing and then passing; original two-hand and upright-cup tests still pass.

D31–D40 add clapping, a short selection greeting, subtle nighttime curiosity, cloth/hair follow-through, actual model portraits in the household sheet, direct doll closeups, responsive portrait camera framing and one-shot reusable offscreen portrait resources. D39's performance pass was executed early after D25. These are 40 unique doll refinements, not 40 new full-device playtests. D41 continues the user-directed iteration beyond forty. The next unchanged-budget CI run adds seven portrait/cache/framing checks and two in-game closeup captures plus two additional tea inspection angles; await its exact result.

The latest user instruction removes the forty-pass stopping point. Continue with evidence-driven doll refinements beyond the first D01–D40 set. No merge, force push or production promotion.

## D01–D41 verified portrait checkpoint
Remote `e77ec96`, CI run `36502618740` passed all 41 built-game assertions, 84 artwork/input assertions, 12 DOM checks and the 36-test Node suite/build. Its evidence ZIP digest was verified against GitHub metadata. The first whole-house view measured 385 calls and 347,837 triangles (249 geometry buffers / 59 textures), within the unchanged strict gate. Eighteen in-game views and sixteen fixed-studio model comparisons were captured. Reviewed the actual resident sheet portraits, phone doll closeup, tea portrait and the trio. Portrait framing and matching UI images are readable; the tea cup is no longer floating into the face.

Closeup review also exposed an oversized braid-tie ring, which was hidden while the head was upright: a scale component was assigned 0.75 instead of multiplying the small torus scale by 0.75. D51 adds a pose/bounds regression and corrects that source error. Phone closeups put the transparent time control over busy room geometry; D53 adds a high-contrast backing with day/night DOM contrast assertions.

## D42–D53 local continuation
Twelve further source/test iterations: tea palms aligned around the saucer; grounded idle soles; curved emotion-dependent lips; fitted glasses temples; four shaped fingertips; fine hair-grain relief; lace skirt edging; sewn collar lobes; care-first facial reactions; corrected braid-tie proportions; stitched collars batched into a single material submission; readable closeup time controls. Each has its own local commit and retained RED/GREEN proof. The cumulative local artwork/input suite now has 96 passing assertions; all 36 Node tests/build still pass. UI styles are loaded as test-only text modules for the new real-cascade contrast assertion. No simulation, audio, content IDs or dependency changes.

The collar detail initially cost an extra local draw per resident; D52 uses shared mapped linen plus linear vertex colors for the contrasting seam, merging its real geometry without removing it. Current local idle trio: 152 visible mesh submissions. The next full-house CI run must still prove the unchanged <388-call and <400k-triangle gate. These local counts are not GPU timing measurements.
