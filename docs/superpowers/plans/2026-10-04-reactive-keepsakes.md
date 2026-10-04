# Reactive Keepsakes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Give four owned keepsakes persistent actions with visible room feedback and make earned restoration lights physically affect the night scene.
**Architecture:** `simulation.js` owns whitelisted interaction state and `useDecor`; `object-ui.js` presents actions; `world.js` adapts saved fields into light/animation; `restoration.js` owns earned room-light visuals.
**Tech Stack:** Native ES modules, Three.js 0.180.0, Node tests, Playwright software WebGL.
**Spec:** docs/superpowers/specs/2026-10-04-reactive-keepsakes.md

## Global Constraints
- Save key `bait-al-dumiah.v1` and version `1`; local assets/dependencies; bilingual visible copy.
- No interaction rewards or progression mutation; 44px actions; reduced-motion-safe responses.
- No production merge or deploy.

## Review Focus
- Repeated watering on the same day must be mutation-free.
- Old and malicious saves must default/clamp interaction fields.
- Moving or rotating an active lamp must move its light and retain state.
- Removing an active/animated object must remove its transient renderer resources.
- Reduced motion must stop continuous mobile/music-box animation.

### Task 1: Serializable keepsake actions
Files: `src/simulation.js`, `tests/reactive-keepsakes.test.mjs`.
- [x] Write RED tests for four action types, no reward mutation, repeat watering, fresh day, invalid objects and save sanitation.
- [x] Implement `useDecor(state,id)` and whitelisted fields.
- [x] Run tests and commit behavior.

### Task 2: Context actions and visible scene response
Files: `src/object-ui.js`, `src/main.js`, `src/i18n.js`, `src/audio.js`, `src/render/world.js`, `src/render/restoration.js`, `src/render/house.js`, `src/activities.css`, tests.
- [x] Write RED copy/art tests for actions, statuses, practical lights and actual kitchen cup.
- [x] Add localized object action/status and dispatch.
- [x] Add owned-light and bounded object animations; add restored practical lights and cup geometry.
- [x] Run `npm run verify`, review diff, commit.

### Task 3: Real browser evidence and checkpoint
Files: `scripts/expansion_check.py`, `docs/superpowers/iteration-ledger.md`, PR body.
- [x] Exercise real scene selections, actions, night light, reduced motion and reload; capture screenshots.
- [x] Run dedicated and full CI; inspect images and metrics.
- [x] Independently review, correct Important findings, commit and publish iteration checkpoint.
