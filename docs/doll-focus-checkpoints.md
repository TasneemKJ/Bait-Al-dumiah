# Doll-focused rendered checkpoints

Base: 5b02f9a0b31b7aa1324d080fd29e4f240b1c03ac.

D01–D10: remote 13ca828, run 36497364283 passed. Fourteen fixed-studio old/new model views and the existing built-game captures were produced. Review identified lip and closed-lid intersections; two raycast regressions were added and the surfaces moved clear of the face.

D11–D20: remote 4a48c1f, run 36498684522 produced all fourteen model views without browser errors. The full-game gate failed at 446 draw calls (353,885 triangles). The failure is retained, not relabeled as a passing checkpoint. Full-size model-trio inspection showed distinct hair and clothing. Geometry count alone was not the performance problem.

Ruling: bring D39 forward after D25. Batch rigid surfaces within articulated pivots, use linear vertex colors for compatible untextured matte details, and keep painted/glazed/metallic materials distinct. Preserve all original game and budget assertions. Named-component construction tests now inspect range-validated baked source parts when the renderer merges their geometry; geometry assertions are not dropped. The local idle trio uses 148 visible mesh submissions rather than 225 before this compaction; CI must still measure the full house.

D21–D30 add articulated elbows, hands, knees, movement-driven footfalls and arm balance, roommate spacing, bounded gaze, need-aware faces, tea lifting/support, self-hug reassurance and sleep breath. The cumulative local gate is 74 artwork/input checks and 36 Node tests/build. Await the corresponding full-scene CI result before claiming that checkpoint passes.

The latest user instruction removes the forty-pass stopping point. Continue with evidence-driven doll refinements beyond the first D01–D40 set. No new scheduler, merge, force push or production promotion.
