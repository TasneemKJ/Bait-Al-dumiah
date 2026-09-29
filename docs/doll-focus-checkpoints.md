# Doll-focused rendered checkpoints

Base: 5b02f9a0b31b7aa1324d080fd29e4f240b1c03ac.

D01–D10: remote 13ca828, run 36497364283 passed. Fourteen fixed-studio old/new model views and the existing built-game captures were produced. Review identified lip and closed-lid intersections; two raycast regressions were added and the surfaces moved clear of the face.

D11–D20: remote 4a48c1f, run 36498684522 produced all fourteen model views without browser errors. The full-game gate failed at 446 draw calls (353,885 triangles). The failure is retained, not relabeled as a passing checkpoint. Full-size model-trio inspection showed distinct hair and clothing. Geometry count alone was not the performance problem.

Ruling: bring D39 forward after D25. Batch rigid surfaces within articulated pivots, use linear vertex colors for compatible untextured matte details, and keep painted/glazed/metallic materials distinct. Preserve all original game and budget assertions. Named-component construction tests now inspect range-validated baked source parts when the renderer merges their geometry; geometry assertions are not dropped.

D21–D30 + early D39: remote fbc168e, run 36499976212 passed all 34 built-game checks and the model/DOM/construction suites. Measured whole-house 381 calls and 347,837 triangles: both unchanged strict gates pass. Reviewed Noor sleeping portrait (closed lids, supported head, no new blocking issue) and Lina tea portrait. Tea remained upright but the hand-local offset swung the saucer above the wrist into the chin. D41 was added after the original forty passes to correct world-up grip placement, rather than hide it behind the passing orientation-only test. D41's new positional regression was observed failing and then passing; original two-hand and upright-cup tests still pass.

D31–D40 add clapping, a short selection greeting, subtle nighttime curiosity, cloth/hair follow-through, actual model portraits in the household sheet, direct doll closeups, responsive portrait camera framing and one-shot reusable offscreen portrait resources. D39's performance pass was executed early after D25. These are 40 unique doll refinements, not 40 new full-device playtests. D41 continues the user-directed iteration beyond forty. The next unchanged-budget CI run adds seven portrait/cache/framing checks and two in-game closeup captures plus two additional tea inspection angles; await its exact result.

The latest user instruction removes the forty-pass stopping point. Continue with evidence-driven doll refinements beyond the first D01–D40 set. No merge, force push or production promotion.
