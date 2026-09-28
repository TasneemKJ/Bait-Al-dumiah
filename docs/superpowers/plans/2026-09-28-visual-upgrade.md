# Handcrafted dollhouse visual upgrade

**Goal:** Make a substantial, visible improvement to the existing cute-and-creepy 3D house, keeping its playable care/decorate loop and updating PR #1.
**Base:** 2b2e9b6f8163358c96dc654ac80535442f7f4ac7.
**Execution:** Inline in an isolated copy of the CI source artifact; GitHub connector for shared-branch writes. No merge or production promotion.

## Design
Keep mint, dusty rose, lavender and buttercream, but use deeper walnut/brass framing, bespoke botanical wallpaper, woven rugs and fabric. Layer architectural fretwork, tiles, miniatures, plants and warm emissive fixtures over the furnished rooms. Remodel dolls with softer porcelain faces, shaped clothing and reactions. Ground the house on a garden display base, with atmospheric sky, moon, motes and restrained lamp halos. Provide explicit room closeups with keyboard-equivalent DOM controls, not a new full-screen menu.

## Constraints and review focus
- Preserve save format, economics, room IDs, bilingual copy and all existing tests.
- No remote runtime assets or dependencies; use the pinned Three.js and original procedural art.
- Day/night must differ in illumination, not just the page background. Keep faces readable at night.
- Quality selection must treat landscape phones as phones; reduced motion must stop cosmetic movement.
- Room focus must reset cleanly, preserve picking and never trap camera controls behind panels.
- Shared materials cannot be disposed by removing a single decoration.

## Tasks
- [x] Write failing tests for bounded lighting, camera poses and mobile quality, then implement policy.
- [x] Build the materials, room details, garden and atmospheric lighting; preserve instancing.
- [x] Remodel dolls and connect room closeups; retain care animations and accessible controls.
- [x] Run Node/build and DOM checks, commit through GitHub, obtain real WebGL screenshots from CI.
- [x] Review desktop/day/night/mobile/closeup captures and address the regressions found.
- Final handoff: the PR #1 verification section records the final tested SHA, CI run, downloadable evidence and remaining device-validation boundaries.

## Execution ledger
Baseline: 28 Node tests and build passed locally. Browser HTTP navigation is blocked by the local managed Chromium policy and WebGL2 is unavailable; no policies were changed. Use the existing GitHub Actions Chromium route for full-game rendering evidence, and local real-DOM checks for UI regressions.

## Visual-review record
The first rendered pass (ee801d3, CI 36465422335) exceeded the new geometry gate: 628,992 rendered triangles. A size-aware mesh budget for tiny petals/beads retained smooth faces and all decoration, reducing the tested scene to 358,488 triangles in 388 draw calls (8f89300, passing CI 36466261664). That run passed 34 Node tests, 5 DOM regressions, and 29 built-game checks and captured 12 views.

The 12-view review then found a washed-out night sky caused by linear/sRGB confusion, a room-selector overlap on landscape screens, and room controls covering decoration placement. The final polish explicitly converts the night palette to linear RGB, preserves gentle face illumination, lays out a mirrored 2-by-2 landscape room selector, and hides that selector during placement. Local RED-to-GREEN checks also cover stale selected-room state after a new-house reset. The final test suite has 36 Node tests, 10 DOM checks, and 31 full-game assertions; its exact final CI result belongs to the PR rather than a hard-coded self-referential commit in this file.

No runtime network dependencies, save migration, gameplay economy changes, forced ref updates or production promotion were introduced. Review is author self-review, not an independent audit. Chromium software WebGL evidence does not certify Safari or physical-phone frame rates.
