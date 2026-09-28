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
- [ ] Write failing tests for bounded lighting, camera poses and mobile quality, then implement policy.
- [ ] Build the materials, room details, garden and atmospheric lighting; preserve instancing.
- [ ] Remodel dolls and connect room closeups; retain care animations and accessible controls.
- [ ] Run Node/build and DOM checks, commit through GitHub, obtain real WebGL screenshots from CI.
- [ ] Review desktop/day/night/mobile/closeup captures, address regressions and re-run the full flow.
- [ ] Update PR description and evidence with exact tested SHA; report remaining validation boundaries.

## Execution ledger
Baseline: 28 Node tests and build passed locally. Browser HTTP navigation is blocked by the local managed Chromium policy and WebGL2 is unavailable; no policies were changed. Use the existing GitHub Actions Chromium route for full-game rendering evidence, and local real-DOM checks for UI regressions.
