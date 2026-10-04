# Hidden House Stories Implementation Plan

> **For agentic workers:** Use Superpowers implementation, tests-first behavioral work and independent review. Root owns integration and commits; independent write surfaces may execute concurrently.

**Goal:** Make the dollhouse an object-driven exploration game through three carried-item stories with permanent visual consequences.

**Architecture:** Simulation and stable content define progress; a new story-prop renderer adapts it; a nonmodal object ribbon and existing objective/journal present it. Keep the existing native modules and local Three.js runtime.

**Tech Stack:** JavaScript ES modules, Three.js 0.180.0, native Node test runner, Python Playwright.

**Spec:** docs/superpowers/specs/2026-10-04-hidden-house-stories.md

## Global Constraints

- Save key bait-al-dumiah.v1 and version 1 remain unchanged.
- Simulation state belongs in src/simulation.js.
- All new visible copy lives in English and Shami Arabic in src/i18n.js.
- All artwork and dependencies stay local; no analytics or new dependencies.
- Controls remain at least 44px; pause, reduced motion and audio gesture boundaries remain respected.
- No merge or production deploy. Commit and push every verified iteration.

## Review Focus

- A player reloads while carrying a story item: valid next action and inventory must survive.
- A selected object disappears or a modal opens: stale selection cannot consume input or advance a story.
- A player repeatedly uses the same/wrong object: items and currency remain bounded.
- Arabic phone and short landscape layouts: selection controls and next objects remain reachable.
- Reduced motion, pause and mute: response poses persist without ongoing animation or unsolicited sound.

### Task 1: Story rules and stable object definitions

Files: src/content.js, src/simulation.js, tests/story-play.test.mjs. Owner: simulation worker.

Interfaces: Produce STORY_CHAPTERS, STORY_ITEMS, the five appended INTERACTIVE_PROPS (plain IDs in spec), storyStatus(state), interactStory(state,key), and safe story restore. Use exact chapter IDs, item IDs, rewards, step chains and return contracts from the spec. Root owns i18n and all other consumers.

- [ ] Write and run behavioral tests for the eleven actions, 48 total once-only buttons, wrong/out-of-order keys, repeat completion, pause, unchanged unrelated progression, and safe old/malformed/mid-story saves. Observe missing-feature failure.
- [ ] Implement content/state/rules and restore sanitation. Derive held items and completed prefix from chapter/step.
- [ ] Run story tests and npm test; report exact results and source edits without committing shared state.

### Task 2: Visible story props and lasting tableaux

Files: src/render/story-props.js; optional tests/art-story-props-checks.js only. Owner: visual worker.

Interfaces: Consume stable storyStatus(state) and content prop positions. Produce createStoryProps(parent) → root/update(state,nightMix)/status(). Root integrates world.js. Do not edit shared content, world, UI or CSS.

- [ ] Build bounded local art for the tin, cabinet, jasmine-window and doorstep; use the existing basin geometry.
- [ ] Adapt open/closed/earned poses to story progress; show mended bear at bedroom, animated music cabinet and guest cup/lamp. Freeze animation on pause/reduced motion.
- [ ] Include a renderer construction/visual-state check where supported; self-review location/pick alignment and geometry/draw-call costs. No screenshot claims without browser evidence.

### Task 3: Playfield interactions and bilingual narrative

Files: src/main.js, src/ui.js, src/object-ui.js, src/story-ui.js, src/story.css, src/i18n.js, src/render/object-controls.js, src/render/object-interactions.js, src/render/world.js, index.html, tests/story-copy.test.mjs. Owner: root.

Interfaces: Consume Task 1 rules and Task 2 renderer. Produce nonmodal select/action/inspect/deselect flow, story objective/hint, held-item indicator, completed journal memories and warm world selection marker. Keep modal activity/legacy object details accessible.

- [ ] Cover authored bilingual keys and meaningful presentation/selection boundaries.
- [ ] Implement persistent nonmodal selection with explicit input/pause/modal boundaries and Escape/focus restoration.
- [ ] Integrate scene art and adapt main objective to room clues and held-item status, without automatic progress.
- [ ] Confirm all legacy actions remain reachable and no unwanted reward mutations or stale object IDs exist.

### Task 4: Playtest, review, and publish checkpoint

Files: scripts/story_check.py, relevant existing browser checks, .github/workflows/expansion.yml, README.md, docs/superpowers/iteration-ledger.md. Owner: root with independent reviewer.

- [ ] Run npm run verify; preserve baseline source checks, update intentional route expectations only.
- [ ] Exercise real ray/touch/keyboard interactions, all stories, carry reload, wrong targets, mute/pause/reduced motion, journal memories and responsive targets. Capture actual rendered evidence.
- [ ] Run full existing browser/expansion regressions and inspect screenshots; distinguish source, environment and harness failures.
- [ ] Obtain independent integrated review, fix significant findings, then commit/push and verify remote ref and CI.
- [ ] Record iteration outcome and next priorities, then begin next twenty-idea brainstorm.
