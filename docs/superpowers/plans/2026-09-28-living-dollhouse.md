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
- [ ] Write failing Node tests for createState, step, care, place, remove, discover and restore.
- [ ] Implement src/simulation.js and src/content.js with deterministic state and bounded commands.
- [ ] Verify unit suite; record results.

## Task 2: 3D home and UI
- [ ] Implement src/render/{primitives,house,dolls,world}.js, src/{main,ui,i18n,styles,audio} modules.
- [ ] Provide original procedural geometry/textures, room and doll picking, camera controls and matching DOM controls.
- [ ] Implement responsive panels, validated persistence, progression and accessibility settings.

## Task 3: Verification and delivery
- [ ] Build a local, dependency-bundled static dist.
- [ ] Exercise desktop and mobile care/decorate/night/save/Arabic workflows with Chromium.
- [ ] Review screenshots and fix blocking issues.
- [ ] Commit through GitHub, open PR, inspect CI; do not merge without a request.
