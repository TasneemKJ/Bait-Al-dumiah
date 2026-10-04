# Object Play Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the miniature house directly selectable and playable, with distinct ritual mechanics.
**Architecture:** Simulation owns relocation, rotation and ritual phases; immutable content describes props. World owns pick targets/selection frame; a focused-room control layer provides accessible equivalent buttons; UI presents localized contextual actions.
**Tech Stack:** Native ES modules, Three.js 0.180.0, Node tests, Playwright software WebGL.
**Spec:** docs/superpowers/specs/2026-10-04-object-play.md

## Global Constraints
- Preserve bait-al-dumiah.v1/version 1; bilingual copy; all assets local.
- 44px targets, reduced motion, no hard timers, no penalty for errors/hints.
- No currency/bond/mastery farming through object movement.
- No production merge/deploy.

## Review Focus
- Moving to an occupied slot must preserve the original object.
- Stale selected IDs after refund/reset must clear safely.
- A camera drag must never select an object.
- A modal’s controls must not become scene pick targets.
- Arabic mobile controls must fit while the room/object remains visible.

### Task 1: Simulation actions and distinct rituals
Files: src/content.js, src/simulation.js, tests/object-play.test.mjs, tests/activities.test.mjs.
Interfaces: moveDecor(s,id,room,slot), rotateDecor(s,id); startRecall(s), toggleActivityHint(s); active phase/hint fields; immutable INTERACTIVE_PROPS.
- [ ] Write and observe failing behavior tests: occupied/no-op/atomic move, invalid rotation, save sanitation, study rejects inputs, free hint, reverse echo, no rewards from manipulation.
- [ ] Implement actions and save defaults; preserve existing earning bounds.
- [ ] Run npm test and commit task.

### Task 2: Scene selection and contextual interface
Files: src/render/object-interactions.js, src/render/object-controls.js, src/render/world.js, src/object-ui.js, src/ui.js, src/main.js, src/i18n.js, src/activities-ui.js, src/activities.css.
Interfaces: world.selectObject(key), clearObjectSelection(), objectPositions(); UI.openObject(key), beginMove(id), moveId, clearObject(); content prop ID routes to existing care/activity.
- [ ] Add failing art/DOM checks for object targets, frame/reset, contextual actions and localized copy.
- [ ] Implement ray picks, thin frame, focused-room accessible object list, contextual actions and relocation preview.
- [ ] Implement study/hint/reverse ritual presentation and clear transient reset state.
- [ ] Run npm run verify; inspect diff; commit task.

### Task 3: Browser evidence and independent review
Files: scripts/expansion_check.py, scripts/ui_check.py, docs/superpowers/iteration-ledger.md, PR description.
- [ ] Add real-object scene clicks and state assertions, relocation/rotation/reload, Arabic 44px checks and screenshots.
- [ ] Run full software-WebGL CI; inspect screenshots; resolve failures.
- [ ] Request whole-branch independent review, resolve important findings and record deferred issues.
- [ ] Commit iteration checkpoint and publish on PR #10; continue future 20-idea iterations from ledger.
