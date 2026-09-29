# Forty dollhouse refinement passes

**Goal:** Continue the approved visual direction on PR #1, with 40 concrete refinement/test passes.
**Base:** e3ffe29b18b894305baabb7706d1f7fd664caab6.
**Execution:** Inline, isolated CI-source copy. Shared-branch writes use GitHub; no merge or force push.
**Spec:** ../specs/2026-09-28-living-dollhouse-design.md; existing visual-upgrade plan.

## Constraints
Preserve saves, economy, authored room IDs, English/Arabic, 44px controls, reduced motion, local-only artwork, and the cute/creepy Levantine identity. Target fewer than 400,000 triangles while preserving the existing 550,000-triangle CI ceiling. Do not certify physical phones from software WebGL.

## Validation
Each numbered pass has a concrete change, a regression test run, and a local commit. Rendered screenshot review occurs at batch checkpoints through the existing CI browser. These are 40 implementation/test passes, not a claim of 40 full-device playtests. Source snapshots and test outputs are retained; final CI exercises the complete game.

## Passes
- [x] 01. Share radial light masks instead of allocating duplicate GPU textures.
- [x] 02. Batch static opaque artwork by material without changing its silhouette.
- [x] 03. Give walnut wood a subtle grain relief.
- [x] 04. Give woven fabrics a fine thread relief.
- [x] 05. Give cups and glazed ceramics a porcelain surface.
- [x] 06. Replace solid conical lampshades with open pleated fabric.
- [x] 07. Replace capsule curtains with draped fabric folds.
- [x] 08. Add scalloped window valances.
- [x] 09. Add lace tea-table doilies.
- [x] 10. Replace bead-like roof eaves with carved scallop trim.
- [x] 11. Arrange miniature pastries on a tea tray.
- [x] 12. Add a kitchen crock and wooden spoons.
- [x] 13. Hang a striped kitchen towel.
- [x] 14. Add labelled pantry jars.
- [x] 15. Open a miniature storybook in the parlor.
- [x] 16. Embroider and tassel the parlor cushions.
- [x] 17. Add a lavender arrangement.
- [x] 18. Add a stitched embroidery hoop.
- [x] 19. Add sewing tools and a measuring tape.
- [x] 20. Sew a patchwork quilt with piping.
- [x] 21. Refine sleepy resident posture.
- [x] 22. Add restrained foot and leg motion to walking.
- [x] 23. Improve resident gaze and head poise.
- [x] 24. Replace abrupt eye squashing with natural staggered blinks.
- [x] 25. Add gentle steam to the held tea cup.
- [x] 26. Add restrained comfort reaction hearts.
- [x] 27. Add sleeping crescent feedback.
- [x] 28. Give the shy visitor a welcoming reaction.
- [x] 29. Replace white fireplace blobs with layered warm flames.
- [x] 30. Add slow curtain movement with reduced-motion support.
- [x] 31. Add soft window-light projections.
- [x] 32. Refine firefly paths and movement budgets.
- [x] 33. Balance foreground and nighttime face illumination.
- [x] 34. Ease room-camera transitions without losing control.
- [x] 35. Clarify selected-room framing.
- [x] 36. Show a reversible decoration-placement preview.
- [x] 37. Clarify selected resident in the scene.
- [x] 38. Refine mobile and Arabic HUD spacing.
- [x] 39. Show day/night progression without another panel.
- [x] 40. Correct final screenshot findings and lock visual budgets.

## Environment
Local Chromium rejected HTTP navigation with ERR_BLOCKED_BY_ADMINISTRATOR. No browser policies were modified. Real DOM/Three geometry fixtures are allowed locally; rendered checks use the existing GitHub Actions workflow.
