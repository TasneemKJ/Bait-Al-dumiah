# Living Dollhouse Implementation Plan

**Goal:** Ship a playable cute-and-creepy 3D miniature home.
**Architecture:** Pure simulation, separate Three scene, DOM UI and local audio/save adapters.
**Tech Stack:** JavaScript ES modules, Three.js 0.180.0, Node test runner, Chromium Playwright.
**Spec:** docs/superpowers/specs/2026-09-28-living-dollhouse-design.md

## Global constraints
Mobile-first. English and Arabic. No gore or jump scares. No external runtime requests. No offline punishment. All decoration purchases have visible prices and full refunds. Work on the feature branch only after the initial empty-repository bootstrap.

## Review focus
- Malformed/stale saves must recover safely rather than crash.
- Cancellation/insufficient currency cannot spend buttons.
- Hidden tabs and open settings must not punish residents.
- Camera dragging must not trigger selection/placement.
- Narrow screens, keyboard and Arabic must preserve usable controls.

## Task 1: Simulation and persistence
- [x] Write failing Node tests for createState, step, care, place, remove, discover and restore.
- [x] Implement src/simulation.js and src/content.js with deterministic state and bounded commands.
- [x] Verify unit suite: 19 simulation and 2 bilingual content checks pass.

## Task 2: 3D home and UI
- [x] Implement src/render/{primitives,house,dolls,world}.js and main, UI, i18n, styles and audio modules.
- [x] Provide original procedural geometry/textures, picking, camera controls and matching DOM controls.
- [x] Implement responsive panels, validated persistence, progression and accessibility settings.

## Task 3: Verification and delivery
- [x] Build a local, dependency-bundled static dist.
- [x] Exercise desktop and mobile care/decorate/night/save/Arabic workflows with Chromium: 23 play-flow checks passed on the initial integration.
- [x] Review screenshots and reproduce/fix stale pause state and night-hover contrast; retain two real-DOM regression tests.
- [x] Commit through GitHub and open PR #1; preserve concurrent workflow improvements without force-pushing.
- [ ] Confirm the final UI-fix commit's full CI and publish the tested build artifact. Do not merge without a request.

See docs/verification.md for evidence, review limitations and deliberate first-playable boundaries.
